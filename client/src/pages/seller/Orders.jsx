import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets, dummyOrders } from "../../assets/assets"; // dummyOrders might be unused, but keeping import
import toast from "react-hot-toast";


const Orders = () => {
    const { currency, axios, isSeller } = useAppContext(); // Added isSeller from context if available
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Added loading state

    const fetchOrders = async () => {
        setIsLoading(true); // Set loading true when fetching starts
        try {
            // Note: If authSeller relies on a token in localStorage for sellers,
            // ensure it's present. For now, assuming backend handles seller auth.
            const { data } = await axios.get("/api/order/seller");

            // --- NEW LOGS ---
            console.log("Seller Orders Frontend: Raw API Response Data:", data);
            if (data.success) {
                console.log("Seller Orders Frontend: API call successful.");
                if (data.orders && Array.isArray(data.orders)) {
                    console.log("Seller Orders Frontend: Received orders array:", data.orders);
                    if (data.orders.length > 0) {
                        setOrders(data.orders);
                        console.log("Seller Orders Frontend: Orders successfully set to state.");
                    } else {
                        setOrders([]); // Ensure state is empty if no orders
                        console.log("Seller Orders Frontend: API returned success but orders array is empty.");
                    }
                } else {
                    setOrders([]); // Ensure state is empty if orders is not an array or missing
                    console.log("Seller Orders Frontend: API returned success but 'orders' property is missing or not an array.");
                }
            } else {
                setOrders([]); // Clear orders on backend failure
                console.log("Seller Orders Frontend: API call failed. Message:", data.message);
                toast.error(data.message); // Show toast for backend failure
            }
            // --- END NEW LOGS ---

        } catch (error) {
            console.error("Seller Orders Frontend: Fetch Error during API call:", error.message);
            setOrders([]); // Clear orders on fetch error
            toast.error("Failed to fetch seller orders."); // Show toast for network/other errors
        } finally {
            setIsLoading(false); // Always set loading to false when fetch completes
        }
    };

    useEffect(() => {
        // You might want to add a check here, e.g., if(isSeller) { fetchOrders() }
        // to ensure only actual sellers try to fetch these orders.
        fetchOrders();
    }, []); // Empty dependency array means it runs once on mount

    return (
        <div className=" no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
            <div className="md:p-10 p-4 space-y-4">
                <h2 className="text-lg font-medium">Orders List</h2>

                {isLoading ? (
                    <p className="text-center text-gray-600 text-lg mt-10">Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p className="text-center text-gray-600 text-lg mt-10">No seller orders found.</p>
                ) : (
                    orders.map((order, index) => (
                        <div key={order._id || index} className="flex flex-col md:flex-row justify-between md:items-center gap-5 p-5 max-w-4xl rounded-md border border-gray-300 text-gray-800">
                            <div className="flex gap-5 max-w-80">
                                <img className="w-12 h-12 object-cover " src={assets.box_icon} alt="boxIcon" />
                                <div>
                                    {order.items?.map((item, itemIndex) => ( // Added optional chaining here
                                        <div key={item.product?._id || itemIndex} className="flex flex-col ">
                                            <p className="font-medium">
                                                {item.product?.name || 'Unknown Product'} {" "} <span className=" text-primary">x {item.quantity}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="text-sm md:text-base text-black/60 ">
                                <p className='text-black/80'>{order.address?.firstName || ''} {order.address?.lastName || ''}</p> {/* Optional chaining */}
                                <p>{order.address?.street || ''}, {order.address?.city || ''}</p> {/* Optional chaining */}
                                <p>{order.address?.state || ''},{order.address?.zipcode || ''}, {order.address?.country || ''}</p> {/* Optional chaining */}
                                <p>{order.address?.phone || ''}</p> {/* Optional chaining */}
                            </div>

                            <p className="font-medium text-lg my-auto ">{currency}{order.amount?.toFixed(2) || '0.00'}</p> {/* Optional chaining and formatting */}

                            <div className="flex flex-col text-sm md:text-base text-black/60">
                                <p>Method: {order.paymentType || 'N/A'}</p> {/* Optional chaining */}
                                <p>Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p> {/* Optional chaining */}
                                <p>Payment: {order.isPaid ? "Paid" : "Pending"}</p>
                                {/* Add status dropdown here if seller can change order status */}
                                <select
                                    value={order.status}
                                    onChange={(e) => { /* Implement status update logic here */ console.log(`Changing order ${order._id} status to ${e.target.value}`); }}
                                    className="p-2 border rounded-md outline-none mt-2"
                                >
                                    <option value="Order Placed">Order Placed</option>
                                    <option value="Processing">Processing</option>
                                    <option value="Shipped">Shipped</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Orders;
