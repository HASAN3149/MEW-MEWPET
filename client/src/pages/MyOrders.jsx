import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { dummyOrders } from "../assets/assets"; // Assuming this is for fallback/testing

const MyOrders = () => {
  const [myOrders, setMyOrders] = useState([]);
  const { currency, axios, user } = useAppContext();

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Frontend MyOrders: Token from localStorage for API call:", token);

      if (!token) {
        console.log("Frontend MyOrders: No token found in localStorage. Cannot fetch orders.");
        setMyOrders([]); // Clear orders if no token
        return;
      }

      // Add a loading state if you wish
      // setIsLoading(true);

      const { data } = await axios.get("/api/order/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // --- NEW LOGS ---
      console.log("Frontend MyOrders: Raw API Response Data:", data);
      if (data.success) {
        console.log("Frontend MyOrders: API call successful.");
        if (data.orders && Array.isArray(data.orders)) {
          console.log("Frontend MyOrders: Received orders array:", data.orders);
          if (data.orders.length > 0) {
            setMyOrders(data.orders);
            console.log("Frontend MyOrders: Orders successfully set to state.");
          } else {
            setMyOrders([]); // Ensure state is empty if no orders
            console.log("Frontend MyOrders: API returned success but orders array is empty.");
          }
        } else {
          setMyOrders([]); // Ensure state is empty if orders is not an array or missing
          console.log("Frontend MyOrders: API returned success but 'orders' property is missing or not an array.");
        }
      } else {
        setMyOrders([]); // Clear orders on backend failure
        console.log("Frontend MyOrders: API call failed. Message:", data.message);
      }
      // --- END NEW LOGS ---

    } catch (error) {
      console.error("Frontend MyOrders: Fetch Error during API call:", error.message);
      setMyOrders([]); // Clear orders on fetch error
      // toast.error("Failed to fetch orders."); // Uncomment if you want user feedback
    } finally {
      // setIsLoading(false); // If you have a loading state
    }
  };

  useEffect(() => {
    // Only fetch if user object exists and has an _id, indicating a logged-in user
    if (user && user._id) {
      console.log("Frontend MyOrders: User available, fetching orders for user ID:", user._id);
      fetchMyOrders();
    } else {
      console.log("Frontend MyOrders: User object not yet available or missing _id. Not fetching orders.");
      setMyOrders([]); // Ensure orders are cleared if user logs out or isn't authenticated
    }
  }, [user]); // Re-run when 'user' context changes

  return (
    <div className="mt-16 pb-16">
      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {myOrders.length === 0 ? (
        <p className="text-center text-gray-600 text-lg mt-10">No orders found.</p>
      ) : (
        myOrders.map((order, index) => (
          <div
            key={order._id || index} // Use order._id if available for better keying
            className="border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl"
          >
            <p className="flex justify-between text-gray-400 font-medium flex-wrap gap-2">
              <span>OrderId: {order._id}</span>
              <span>Payment: {order.paymentType}</span>
              <span>
                Total Amount: {currency}
                {order.amount}
              </span>
            </p>

            {order.items.map((item, itemIndex) => (
              <div
                key={item.product?._id || itemIndex} // Use item.product._id if available, fallback to itemIndex
                className={`relative bg-white text-gray-500/70 ${
                  order.items.length !== itemIndex + 1 && "border-b"
                } border-gray-300 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full max-w-4xl`}
              >
                <div className="flex items-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    {/* Add fallback for image if item.product.image[0] is undefined */}
                    <img
                      src={item.product?.image?.[0] || 'https://placehold.co/64x64/E2E8F0/A0AEC0?text=No+Img'}
                      alt={item.product?.name || 'Product Image'}
                      className="w-16 h-16"
                    />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-medium text-gray-800">
                      {item.product?.name || 'Unknown Product'}
                    </h2>
                    <p>Category: {item.product?.category || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-center md:ml-8 mb-4 md:mb-0">
                  <p>Quantity: {item.quantity || "1"}</p>
                  <p>Status: {order.status}</p>
                  <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p>
                    Amount: {currency}
                    {(item.product?.offerPrice * item.quantity).toFixed(2)} {/* Ensure price formatting */}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
