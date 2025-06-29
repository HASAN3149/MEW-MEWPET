import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Still imported, but we'll primarily use environment variables for seller validation

const authSeller = async (req, res, next) => {
  let token;

  // 1. Check for 'sellerToken' in Authorization header (if frontend sends it this way)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log("authSeller Backend: Token from Authorization header:", token);
  }
  // 2. Check for 'sellerToken' in cookies (as set by sellerLogin)
  else if (req.cookies.sellerToken) { // <-- Changed to sellerToken
    token = req.cookies.sellerToken;
    console.log("authSeller Backend: Token from sellerToken cookie:", token);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not Authorized: No seller token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("authSeller Backend: Decoded seller token:", decoded); // Log decoded token

    // --- CRUCIAL FIX: Validate seller by email from token and environment variable ---
    // Ensure decoded.email exists and matches the seller email from your .env
    if (!decoded.email || decoded.email !== process.env.SELLER_EMAIL) {
      console.warn("authSeller Backend: Seller email mismatch or missing in token.");
      return res.status(403).json({ success: false, message: 'Forbidden: Invalid seller credentials or not recognized as seller' });
    }
    // --- END CRUCIAL FIX ---

    // You might want to attach something to req.user for seller-specific routes if needed
    // For now, attaching the seller email
    req.sellerEmail = decoded.email;
    next(); // Authenticated as seller, proceed
  } catch (error) {
    console.error("authSeller Backend: Error verifying seller token:", error.message);
    res.status(401).json({ success: false, message: 'Invalid or expired seller token' });
  }
};

export default authSeller;
