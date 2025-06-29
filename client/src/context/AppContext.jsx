import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [cartItems, setCartItems] = useState({});
    const [currency, setCurrency] = useState(import.meta.env.VITE_CURRENCY || "৳");
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const navigate = useNavigate();

    // ✅ Fixed backend URL logic
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    console.log("Frontend AppContext: API Base URL:", BACKEND_URL);

    const apiClient = axios.create({
        baseURL: BACKEND_URL,
        withCredentials: true,
    });

    const fetchProducts = async () => {
        try {
            const response = await apiClient.get("/api/product/list");
            if (response.data.success) {
                setProducts(response.data.products);
            } else {
                console.error("Failed to fetch products:", response.data.message);
                toast.error(response.data.message || "Failed to load products.");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error(error.message || "Network error fetching products.");
        }
    };

    const checkUserAuth = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const response = await apiClient.get("/api/user/is-auth", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setUser(response.data.user);
                    setCartItems(response.data.user.cartItems || {});
                } else {
                    setUser(null);
                    localStorage.removeItem("token");
                    console.log("User token invalid or expired. Cleared.");
                }
            } catch (error) {
                console.error("Error checking user auth:", error);
                setUser(null);
                localStorage.removeItem("token");

                if (
                    error.response &&
                    error.response.status === 403 &&
                    error.response.data.redirectToVerify
                ) {
                    toast.error("Please verify your email address.");
                    navigate(`/verify-email?email=${encodeURIComponent(user?.email || "")}`);
                } else {
                    toast.error(error.response?.data?.message || "Authentication check failed.");
                }
            }
        } else {
            setUser(null);
        }
    };

    const checkSellerAuth = async () => {
        try {
            const response = await apiClient.get("/api/seller/is-auth");
            setIsSeller(response.data.success);
        } catch (error) {
            console.error("Error checking seller auth:", error);
            setIsSeller(false);
        }
    };

    useEffect(() => {
        const savedCart = localStorage.getItem("cartItems");
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        }

        fetchProducts();
        checkUserAuth();
        checkSellerAuth();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user && user._id && Object.keys(cartItems).length > 0) {
                apiClient
                    .post("/api/cart/update", { cartItems })
                    .then(({ data }) => {
                        if (!data.success) {
                            toast.error(data.message);
                        }
                    })
                    .catch((error) => {
                        console.error("Cart update failed:", error);
                        if (error.response?.status !== 401) {
                            toast.error(error.response?.data?.message || "Cart update failed");
                        }
                    });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [cartItems, user]);

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
        if (typeof cartItems === "object" && cartItems !== null) {
            for (const item in cartItems) {
                count += cartItems[item];
            }
        }
        return count;
    };

    const getCartAmount = () => {
        let total = 0;
        if (Array.isArray(products) && typeof cartItems === "object" && cartItems !== null) {
            for (const item in cartItems) {
                const product = products.find((product) => product._id === item);
                if (product) {
                    total += product.offerPrice * cartItems[item];
                }
            }
        }
        return parseFloat(total.toFixed(2));
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
        axios: apiClient,
        showUserLogin,
        setShowUserLogin,
        user,
        setUser,
        isSeller,
        setIsSeller,
        assets,
        searchQuery,
        setSearchQuery,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
