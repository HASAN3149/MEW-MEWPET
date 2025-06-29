import User from "../models/User.js"

//upload user CartData: /api/cart/update
export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const userId = req.userId; // 👈 get from token, not frontend

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    await User.findByIdAndUpdate(userId, { cartItems });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};


