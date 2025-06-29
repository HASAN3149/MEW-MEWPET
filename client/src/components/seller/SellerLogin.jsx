import React, { useEffect, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
// import axios from 'axios'; // This axios import is unused if using useAppContext().axios, can remove
import toast from 'react-hot-toast';

const SellerLogin = () => {
    // Destructure axios from useAppContext for consistency
    const { isSeller, setIsSeller, navigate, axios: apiClient } = useAppContext() // Renamed axios to apiClient to avoid conflict
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")


    const onSubmitHandler = async (event) => {
        event.preventDefault(); // Prevent default form submission behavior
        try {
            console.log("SellerLogin Frontend: Attempting to log in seller with email:", email); // New log
            // Use apiClient from context
            const { data } = await apiClient.post("/api/seller/login", { email, password })
            if (data.success) {
                console.log("SellerLogin Frontend: Login successful. Message:", data.message); // New log
                setIsSeller(true)
                navigate('/seller') // Navigate to seller dashboard
                toast.success(data.message)
            } else {
                console.warn("SellerLogin Frontend: Login failed. Message:", data.message); // New log
                toast.error(data.message);
            }
        } catch (error) {
            console.error("SellerLogin Frontend: Login error:", error.message); // New log
            toast.error(error.response?.data?.message || "An error occurred during seller login.");
        }
    }

    useEffect(() => {
        // If already logged in as seller, navigate to dashboard
        if (isSeller) {
            console.log("SellerLogin Frontend: Already logged in as seller, redirecting to /seller."); // New log
            navigate("/seller")
        }
    }, [isSeller, navigate]) // Add navigate to dependency array

    return !isSeller && ( // Only render if not already a seller
        <form onSubmit={onSubmitHandler} className=' min-h-screen flex items-center text-sm text-gray-600' >
            <div className=' flex flex-col gap-5 m-auto items-start p-8 py-12 min-w-80 sm:min-w-88
            rounded-lg shadow-xl border border-gray-200'>
                <p className=' text-2xl font-medium m-auto'><span className=' text-primary'>Seller</span>Login</p>

                <div className=' w-full'>
                    <p>Email</p>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        type="email"
                        placeholder='Enter your email' // Changed placeholder for clarity
                        className=' border border-gray-200 rounded w-full p-2 mt-1 outline-primary'
                        required
                    />
                </div>

                <div className=' w-full '>
                    <p>Password</p>
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        type="password"
                        placeholder='Enter your password' // Changed placeholder for clarity
                        className=' border border-gray-200 rounded w-full p-2 mt-1 outline-primary' // <-- FIX: Changed 'assName' to 'className'
                        required
                    />
                </div>

                <button type="submit" className=' bg-primary text-white w-full py-2 rounded-md cursor-pointer'>Login</button>

            </div>

        </form>
    )
}

export default SellerLogin;
