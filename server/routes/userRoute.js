import express from 'express';
// Ensure all these functions are imported from userController.js
import { login, register, isAuth, logout, verifyEmailOTP, resendEmailOTP } from '../controllers/userController.js'; // NEW IMPORTS
import authUser from '../middlewares/authUser.js'; // Ensure this is correctly imported

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.get('/logout', logout);

// This route must be protected to read token from cookie
userRouter.get('/is-auth', authUser, isAuth);

// --- NEW OTP ROUTES ---
// These routes do NOT need authUser initially because the user is not fully logged in/verified yet
userRouter.post('/verify-email-otp', verifyEmailOTP);
userRouter.post('/resend-email-otp', resendEmailOTP);
// --- END NEW OTP ROUTES ---

export default userRouter;
