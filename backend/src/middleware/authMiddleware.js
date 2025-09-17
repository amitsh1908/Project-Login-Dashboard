// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// same secret string as loginController
const JWT_SECRET = "supersecret123";

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    const payload = jwt.verify(token, JWT_SECRET);
    // payload must contain id, userid, role
    req.user = { id: payload.id, userid: payload.userid, role: payload.role };
    return next();
  } catch (err) {
    console.error("authMiddleware error:", err);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};