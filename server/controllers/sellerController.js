import jwt from "jsonwebtoken"

export const sellerLogin=async(req,res)=>{
   try{
  const {email,password}=req.body;

   console.log("Seller Login Backend: Attempting login for email:", email);
   console.log("Seller Login Backend: Provided password:", password);
   console.log("Seller Login Backend: Expected SELLER_EMAIL from .env:", process.env.SELLER_EMAIL);
   console.log("Seller Login Backend: Expected SELLER_PASSWORD from .env:", process.env.SELLER_PASSWORD);

    if(password===process.env.SELLER_PASSWORD && email===process.env.SELLER_EMAIL){
        const token=jwt.sign({email},process.env.JWT_SECRET,{expiresIn:'7d'});

          res.cookie('sellerToken',token,{
            httpOnly:true,
            // secure:process.env.NODE_ENV==='production'; if true, this would prevent cookie on http
            // In development (http://localhost), secure should be false. In production (https), it should be true.
            secure: process.env.NODE_ENV === 'production' ? true : false, 
            
            // --- CRUCIAL FIX: Set sameSite to 'Lax' for development to allow cross-port localhost requests ---
            // In production, 'None' is often used with 'secure: true' for cross-site.
            // 'Strict' is too restrictive for frontend on different port.
            sameSite:process.env.NODE_ENV==='production'?'none':'Lax', // Changed 'strict' to 'Lax' for development
            maxAge:7*24*60*60*1000, // 7 days
        });

        console.log("Seller Login Backend: Successfully set sellerToken cookie."); // Confirmation log
        return res.json({success:true,message:"Logged In"});
    }
    else{
        console.warn("Seller Login Backend: Invalid Credentials - Email or password mismatch."); // Warning log
        return res.json({success:false,message:"Invalid Credentials"});
    }
   }
   catch(error){
             console.error("Seller Login Backend Error:", error.message); // Error log
             res.json({success:false,message:error.message}) // Respond with error message
             
   }
}

//seller isAuth : /api/seller/is-auth
export const isSellerAuth = async (req, res) => {
  try {
    // req.sellerEmail would be available here if authSeller middleware successfully verified the token
    console.log("isSellerAuth Backend: Seller authenticated. Email:", req.sellerEmail); // Log the authenticated seller's email
    res.status(200).json({ success: true, email: req.sellerEmail }); // Respond with success and email
  } catch (error) {
    console.error("isSellerAuth Backend Error:", error.message); // Error log
    res.status(500).json({ success: false, message: error.message }); // Respond with internal server error
  }
};

//logout seller : /api/seller/logout
export const sellerLogout = async (req, res) => {
  try {
    // Clear the sellerToken cookie
    res.clearCookie('sellerToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // 'strict' here is fine for logout
    });

    console.log("Seller Logout Backend: Cleared sellerToken cookie."); // Confirmation log
    return res.status(200).json({ success: true, message: "Logged out" }); // Respond with success message
  } catch (error) {
    console.error("Seller Logout Backend Error:", error.message); // Error log
    return res.status(500).json({ success: false, message: error.message }); // Respond with internal server error
  }
};
