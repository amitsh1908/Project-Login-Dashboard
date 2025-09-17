// src/routes/loginRoutes.js
import express from "express";
import { loginUser } from "../controllers/loginController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /login  (existing)
router.post("/", loginUser);

// GET /login/check  -> light auth-check endpoint
// returns 200 + { success:true, userid, role } if token ok
// returns 401 if not authenticated
router.get("/check", authMiddleware, (req, res) => {
  return res.json({
    success: true,
    userid: req.user?.userid,
    role: req.user?.role || "user"
  });
});

export default router;