import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets"; // Assuming this path is correct now
import toast from "react-hot-toast"; // <-- FIX: Import toast

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [currency, setCurrency] = useState("₹"); // Assuming default currency
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [user, setUser] = useState(null); // Will store user data
    const [isSeller, setIsSeller] = useState(false);
    const [searchQuery, setSearchQuery] = useState(""); // Initialize as empty string for consistency

    const navigate = useNavigate();

    // Axios instance for API calls
    const apiClient = axios.create({
        baseURL: "http://localhost:4000", // Ensure this matches your backend URL
        withCredentials: true, // Important for sending cookies like sellerToken
    });

    const fetchProducts = async () => {
        try {
            const response = await apiClient.get("/api/product/list");
            if (response.data.success) {
                setProducts(response.data.products);
            } else {
                console.error("Failed to fetch products:", response.data.message);
                toast.error(response.data.message || "Failed to load products."); // Use toast here
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error(error.message || "Network error fetching products."); // Use toast here
        }
    };

    // User authentication status check
    const checkUserAuth = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const response = await apiClient.get("/api/user/is-auth", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setUser(response.data.user); // Set full user object, including isVerified
                    // Update cartItems from user data if available
                    setCartItems(response.data.user.cartItems || {});
                } else {
                    setUser(null); // Clear user if token is invalid/expired
                    localStorage.removeItem("token");
                    console.log("User token invalid or expired. Cleared.");
                }
            } catch (error) {
                console.error("Error checking user auth:", error);
                setUser(null);
                localStorage.removeItem("token");
                if (error.response && error.response.status === 403 && error.response.data.redirectToVerify) {
                    toast.error("Please verify your email address.");
                    navigate(`/verify-email?email=${encodeURIComponent(user?.email || "")}`);
                } else {
                    toast.error(error.response?.data?.message || "Authentication check failed."); // Use toast here
                }
            }
        } else {
            setUser(null); // No token, no user
        }
    };

    // Seller authentication status check
    const checkSellerAuth = async () => {
        try {
            const response = await apiClient.get("/api/seller/is-auth"); // authSeller middleware handles cookie
            if (response.data.success) {
                setIsSeller(true);
            } else {
                setIsSeller(false);
                console.log("Seller not authenticated.");
            }
        } catch (error) {
            console.error("Error checking seller auth:", error);
            setIsSeller(false);
            // This is expected if not logged in as seller, no toast needed unless it's a critical failure
            // toast.error(error.response?.data?.message || "Seller authentication check failed.");
        }
    };

    // Initialize products and auth status on initial load
    useEffect(() => {
        // Load cart items from localStorage first (existing logic)
        const savedCart = localStorage.getItem("cartItems");
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }

        fetchProducts(); // Fetch products
        checkUserAuth(); // Check user auth and populate user state
        checkSellerAuth(); // Check seller auth
    }, []); // Runs once on mount

    // Update cart to backend with a debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only attempt to update cart if user is logged in AND cartItems is not empty
            // Ensure cartItems is an object with keys
            if (user && user._id && Object.keys(cartItems).length > 0) { // <-- FIX: Check if cartItems has keys
                apiClient.post("/api/cart/update", { cartItems })
                    .then(({ data }) => {
                        if (!data.success) {
                            toast.error(data.message);
                        }
                    })
                    .catch((error) => {
                        console.error("Cart update failed:", error);
                        // Only show toast if it's not an expected unauthorized (e.g., user just logged out)
                        if (error.response?.status !== 401) {
                             toast.error(error.response?.data?.message || "Cart update failed");
                        }
                    });
            }
        }, 300); // Debounce for 300ms

        return () => clearTimeout(timer);
    }, [cartItems, user, apiClient]); // Add apiClient to dependencies

    const AddToCart = (itemId) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: prev[itemId] ? prev[itemId] + 1 : 1,
        }));
        toast.success("Added to Cart");
    };

    const RemoveFromCart = (itemId) => {
        setCartItems((prev) => {
            const newCount = prev[itemId] - 1;
            if (newCount <= 0) {
                const newCart = { ...prev };
                delete newCart[itemId];
                return newCart;
            } else {
                return { ...prev, [itemId]: newCount };
            }
        });
        toast.error("Removed from Cart");
    };

    const updateCartItem = (itemId, quantity) => {
        setCartItems((prev) => ({ ...prev, [itemId]: quantity }));
    };

    const getCartCount = () => {
        let count = 0;
        // Ensure cartItems is an object before iterating
        if (typeof cartItems === 'object' && cartItems !== null) {
            for (const item in cartItems) {
                count += cartItems[item];
            }
        }
        return count;
    };

    const getCartAmount = () => {
        let total = 0;
        // Ensure products is an array and cartItems is an object before iterating
        if (Array.isArray(products) && typeof cartItems === 'object' && cartItems !== null) {
            for (const items in cartItems) {
                const product = products.find((product) => product._id === items);
                if (product) {
                    total += product.offerPrice * cartItems[items];
                }
            }
        }
        return Math.floor(total *100)/100;
    };

    const contextValue = {
        products,
        cartItems,
        setCartItems,
        AddToCart,
        RemoveFromCart,
        updateCartItem,
        getCartCount,
        getCartAmount,
        currency,
        navigate,
        axios: apiClient, // Use the configured axios instance
        showUserLogin,
        setShowUserLogin,
        user,
        setUser,
        isSeller,
        setIsSeller,
        assets // Make assets available via context
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
