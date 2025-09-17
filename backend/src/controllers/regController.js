// controllers/regController.js
import bcrypt from "bcryptjs";
import UserRegister from "../models/userRegister.js";
import UserProfile from "../models/userProfile.js";

export const registerUser = async (req, res) => {
  try {
    const { userid, email, password } = req.body;

    if (!userid || !email || !password) {
      return res.status(400).json({ success: false, message: "userid, email and password are required" });
    }

    const exists = await UserRegister.findOne({ $or: [{ email }, { userid }] });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email or userid already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await UserRegister.create({
      userid,
      email,
      password: hashed
    });

    // Create  profile 
    const profile = await UserProfile.create({
      userRegister: user._id,
      name: "",          
      email: email,       
      phone: "",
      age: null,
      fatherNumber: ""
    });

    return res.status(201).json({
      success: true,
      message: "User registered Succuessfully",
      user: { id: user._id, userid: user.userid, email: user.email },
      profile: { id: profile._id }
    });
  } catch (err) {
    console.error("registerUser error:", err);
    if (err && err.code === 11000) {
      return res.status(400).json({ success: false, message: "Duplicate key error" });
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};