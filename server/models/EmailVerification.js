import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        unique: true, // Only one active OTP per user at a time
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600, // OTP expires in 1 hour (3600 seconds = 60 minutes * 60 seconds)
    },
});

const EmailVerification = mongoose.models.emailVerification || mongoose.model("emailVerification", emailVerificationSchema);

export default EmailVerification;
