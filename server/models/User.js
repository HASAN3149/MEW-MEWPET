import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartItems: { type: Object, default: {} }, // Retained from your provided schema
    isSeller: { type: Boolean, default: false }, // Crucial for seller functionality
    isVerified: { type: Boolean, default: false }, // <-- NEW: For email verification status
}, { minimize: false, timestamps: true }); // Retained minimize:false and timestamps for consistency

const User = mongoose.models.user || mongoose.model("user", userSchema);

export default User;
