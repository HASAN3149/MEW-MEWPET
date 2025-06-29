import nodemailer from 'nodemailer';

const sendEmail = async (email, subject, htmlContent) => { // Changed 'text' to 'htmlContent' for clarity
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE, // e.g., 'gmail', 'SendGrid', 'outlook'
            auth: {
                user: process.env.EMAIL_USER,    // Your email address (e.g., your_email@gmail.com)
                pass: process.env.EMAIL_PASS,    // Your email password or app-specific password
            },
            // For troubleshooting: enable debug mode
            // debug: true,
            // logger: true,
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: subject,
            html: htmlContent, // Using html for richer email content
        });

        console.log("Email sent successfully to:", email);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        // Log more details about the error if possible
        if (error.response) {
            console.error("Nodemailer response error:", error.response);
        } else if (error.code === 'EENVELOPE') {
            console.error("Nodemailer envelope error:", error.message);
        }
        return false;
    }
};

export default sendEmail;
