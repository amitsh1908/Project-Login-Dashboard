// routes/regRoutes.js
import express from "express";
import { registerUser } from "../controllers/regController.js";

const router = express.Router();

// POST /user
router.post("/", registerUser);

export default router;
