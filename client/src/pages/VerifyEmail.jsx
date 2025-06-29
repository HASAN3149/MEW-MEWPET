import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

const VerifyEmail = () => {
    const { axios, user, navigate, setUser } = useAppContext();
    const location = useLocation();
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [timer, setTimer] = useState(60); // 60 seconds for resend cooldown
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        // Extract email from query parameter if redirected from registration
        const params = new URLSearchParams(location.search);
        const emailParam = params.get('email');
        if (emailParam) {
            setEmail(emailParam);
        } else if (user?.email && !user.isVerified) {
            // If user is in context but not verified, use their email
            setEmail(user.email);
        } else if (user?.isVerified) {
            // If user is already verified, redirect them away from this page
            toast.success("Your email is already verified!");
            navigate('/');
        } else {
            // If no email and no unverified user in context, redirect to login/register
            toast.error("No email found for verification. Please register or log in.");
            navigate('/login'); // Or '/register'
        }
    }, [location.search, user, navigate]);

    useEffect(() => {
        let interval;
        if (timer > 0 && !canResend) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer, canResend]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!email || !otp) {
            toast.error("Please enter email and OTP.");
            return;
        }

        try {
            const { data } = await axios.post("/api/user/verify-email-otp", { email, otp });
            if (data.success) {
                toast.success(data.message);
                // Update user context to reflect verification and login status
                if (data.user) {
                    setUser(data.user); // Backend sends updated user (isVerified: true) and token
                    localStorage.setItem("token", data.token); // Store the new token received on verification
                }
                navigate("/"); // Redirect to home or dashboard after successful verification
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Verify OTP Error:", error);
            toast.error(error.response?.data?.message || "Failed to verify OTP.");
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast.error("Email not available to resend OTP.");
            return;
        }
        setCanResend(false);
        setTimer(60); // Reset timer

        try {
            const { data } = await axios.post("/api/user/resend-email-otp", { email });
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
                setCanResend(true); // Allow resend if backend failed immediately
            }
        } catch (error) {
            console.error("Resend OTP Error:", error);
            toast.error(error.response?.data?.message || "Failed to resend OTP.");
            setCanResend(true); // Allow resend if network error
        }
    };

    if (!email && (!user || !user.email)) {
        return <div className="mt-20 text-center text-gray-700">Loading or redirecting...</div>;
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <form onSubmit={handleVerify} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800">Verify Your Email</h2>
                <p className="text-center text-gray-600">
                    An OTP has been sent to <strong>{email}</strong>. Please check your inbox (and spam folder).
                </p>

                <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                        Enter OTP
                    </label>
                    <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="e.g., 123456"
                        maxLength="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-primary text-white py-2 rounded-md hover:bg-indigo-600 transition-colors duration-200"
                >
                    Verify Email
                </button>

                <div className="text-center text-sm">
                    {canResend ? (
                        <button
                            type="button"
                            onClick={handleResend}
                            className="text-primary hover:underline"
                        >
                            Resend OTP
                        </button>
                    ) : (
                        <p className="text-gray-500">Resend OTP in {timer} seconds</p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default VerifyEmail;
