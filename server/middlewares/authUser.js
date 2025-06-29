import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authUser = async (req, res, next) => {
    let token;

    // 1. Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log("Token from Authorization header:", token);
    }
    // 2. Fallback to token in cookies
    else if (req.cookies.token) {
        token = req.cookies.token;
        console.log("Token from cookies:", token);
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not Authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password'); // Exclude password for security

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // --- NEW: Check for email verification status ---
        // Allow access to is-auth endpoint and any other necessary verification routes
        // without enforcing verification. Otherwise, enforce it.
        const isVerificationRoute = req.originalUrl.includes('/api/user/is-auth') ||
                                    req.originalUrl.includes('/api/user/verify-email-otp') ||
                                    req.originalUrl.includes('/api/user/resend-email-otp');

        if (!user.isVerified && !isVerificationRoute) {
            // If user is not verified and not trying to access a verification route, forbid access
            return res.status(403).json({ success: false, message: 'Please verify your email address to access this resource.', redirectToVerify: true });
        }
        // --- END NEW ---

        req.user = user; // Attach user object to the request
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        console.error("authUser error:", error.message); // Use console.error for errors
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

export default authUser;
