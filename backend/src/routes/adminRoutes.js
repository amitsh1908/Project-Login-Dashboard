import express from "express";
import { listProfiles, updateProfileById, deleteProfileById, bulkDeleteProfiles, createUserFromAdmin } from "../controllers/adminController.js";

const router = express.Router();

router.get("/profiles", listProfiles);
router.patch("/profiles/:id", updateProfileById);
router.delete("/profiles/:id", deleteProfileById);
router.delete("/profiles", bulkDeleteProfiles);
router.post("/create-user", /* isAdmin, */ createUserFromAdmin);

export default router;