// routes/profileRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getProfileForMe, updateProfileForMe } from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", authMiddleware, getProfileForMe);
router.patch("/me", authMiddleware, updateProfileForMe);

export default router;