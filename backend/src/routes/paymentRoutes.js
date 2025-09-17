import express from "express";
import {
  checkout,
  paymentVerification,getPayments
} from "../controllers/paymentController.js";

const router = express.Router();


router.post("/checkout",checkout);
router.post("/paymentverification",paymentVerification)
router.get('/payments', getPayments);

export default router;
