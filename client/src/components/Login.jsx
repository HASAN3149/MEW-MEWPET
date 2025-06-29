import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Login = () => {
    const { setShowUserLogin, setUser, axios, navigate } = useAppContext();

    const [state, setState] = React.useState("login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();

            const { data } = await axios.post(`/api/user/${state}`, {
                name,
                email,
                password
            });

            if (data.success) {
                toast.success(data.message);

                if (state === "register") {
                    // After successful registration, redirect to verification page
                    setShowUserLogin(false); // Close login modal
                    navigate(`/verify-email?email=${encodeURIComponent(email)}`);
                } else { // Login state
                    // Check if the backend response indicates redirection to verify email
                    if (data.redirectToVerify) {
                        setShowUserLogin(false); // Close login modal
                        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
                    } else {
                        // If login is successful and email is verified, store token and user data
                        localStorage.setItem("token", data.token);
                        console.log("Frontend Login: Token saved to localStorage:", data.token);
                        setUser(data.user); // Set full user object with isVerified status
                        setShowUserLogin(false); // Close login modal
                        navigate("/"); // Navigate to home after successful login
                    }
                }
            } else {
                toast.error(data.message);
                console.error("Frontend Login: Backend error during login/registration:", data.message);
                // If backend indicates redirection to verify email on failed login
                if (data.redirectToVerify) {
                    setShowUserLogin(false); // Close login modal
                    navigate(`/verify-email?email=${encodeURIComponent(email)}`);
                }
            }
        } catch (error) {
            console.error("Frontend Login: Error during authentication:", error);
            toast.error(error.response?.data?.message || "An error occurred during authentication."); // Use optional chaining for response
        }
    }

    return (
        <div onClick={() => setShowUserLogin(false)} className=" fixed top-0 bottom-0 left-0 right-0 z-30 flex items-center text-sm text-gray-600 bg-black/50">
            <form onSubmit={onSubmitHandler} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white">
                <p className="text-2xl font-medium m-auto">
                    <span className="text-primary">User</span> {state === "login" ? "Login" : "Sign Up"}
                </p>
                {state === "register" && (
                    <div className="w-full">
                        <p>Name</p>
                        <input onChange={(e) => setName(e.target.value)} value={name} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="text" required />
                    </div>
                )}
                <div className="w-full ">
                    <p>Email</p>
                    <input onChange={(e) => setEmail(e.target.value)} value={email} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="email" required />
                </div>
                <div className="w-full ">
                    <p>Password</p>
                    <input onChange={(e) => setPassword(e.target.value)} value={password} placeholder="type here" className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" type="password" required />
                </div>
                {state === "register" ? (
                    <p>
                        Already have account? <span onClick={() => setState("login")} className="text-primary cursor-pointer">click here</span>
                    </p>
                ) : (
                    <p>
                        Create an account? <span onClick={() => setState("register")} className="text-primary cursor-pointer">click here</span>
                    </p>
                )}
                <button className="bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer">
                    {state === "register" ? "Create Account" : "Login"}
                </button>
            </form>
        </div>
    );
};

export default Login;
