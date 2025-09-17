// controllers/loginController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserRegister from "../models/userRegister.js";


const JWT_SECRET = "supersecret123";

export const loginUser = async (req, res) => {
  try {
    const { userid, email, password } = req.body;
    if ((!userid && !email) || !password) {
      return res.status(400).json({ success: false, message: "Provide userid or email and password" });
    }

    const query = userid ? { userid } : { email };
    // include password select so we can compare
    const user = await UserRegister.findOne(query).select("+password +role +userid +email");
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // sign token including role
    const payload = { id: user._id.toString(), userid: user.userid, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // set cookie (httpOnly)
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      
    });

    // return role in response so frontend can redirect
    return res.json({
      success: true,
      message: "Login successful",
      userid: user.userid,
      role: user.role
    });
  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};