// routes/logoutRoutes.js
import express from "express";
import { logoutUser } from "../controllers/logoutController.js";

const router = express.Router();

// POST /logout
router.post("/", logoutUser);

export default router;