// src/controllers/paymentController.js
import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "../models/paymentModel.js";

/**
 * Create Razorpay order and store returnUrl in notes
 */
export const checkout = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
      return res.status(500).json({ success: false, message: "Server misconfiguration: Razorpay keys missing" });
    }

    const razor = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    const { amount, returnUrl } = req.body;

    // sanitize returnUrl: accept only path starting with '/'
    let safeReturn = "/dashboard"; // fallback
    if (typeof returnUrl === "string" && returnUrl.startsWith("/")) {
      safeReturn = returnUrl;
    }

    const options = {
      amount: Number(amount * 100),
      currency: "INR",
      notes: { returnUrl: safeReturn },
    };

    const order = await razor.orders.create(options);

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Razorpay create order error:", error);
    return res.status(error?.statusCode || 500).json({
      success: false,
      message: error?.error?.description || error?.message || "Failed to create order",
      details: error?.error || null,
    });
  }
};

/**
 * Verify payment and redirect back to frontend returnUrl stored in order notes
 */
export const paymentVerification = async (req, res) => {
  try {
    // accept both POST (body) and GET (query) flows
    const razorpay_order_id = req.body?.razorpay_order_id ?? req.query?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id ?? req.query?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature ?? req.query?.razorpay_signature;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing verification params" });
    }

    if (!process.env.RAZORPAY_API_SECRET || !process.env.RAZORPAY_API_KEY) {
      console.error("paymentVerification: missing Razorpay env keys");
      return res.status(500).json({ success: false, message: "Server misconfigured" });
    }

    // verify signature
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // store payment record
    await Payment.create({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    // fetch order to get notes.returnUrl
    const razor = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    let returnPath = "/dashboard"; // fallback
    try {
      const orderDetails = await razor.orders.fetch(razorpay_order_id);
      const candidate = orderDetails?.notes?.returnUrl;
      if (candidate && typeof candidate === "string" && candidate.startsWith("/")) {
        returnPath = candidate;
      } else {
        console.warn("Ignoring invalid returnUrl in order notes:", candidate);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
      // fallback to default
    }

    const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    const redirectUrl = `${FRONTEND_ORIGIN}${returnPath}?payment=success&reference=${razorpay_payment_id}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("Payment verification error:", err);
    const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
    return res.redirect(`${FRONTEND_ORIGIN}/dashboard?payment=failed`);
  }


};

// add to src/controllers/paymentController.js (or new file)
export const getPayments = async (req, res) => {
  try {
    // optional pagination
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 50, 1);
    const skip = (page - 1) * limit;

    // filter/sort as needed — newest first
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Payment.countDocuments();

    return res.status(200).json({
      success: true,
      meta: { total, page, limit },
      data: payments,
    });
  } catch (err) {
    console.error('getPayments error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch payments' });
  }
};

// // src/controllers/paymentController.js
// import Razorpay from "razorpay";
// import crypto from "crypto";
// import { Payment } from "../models/paymentModel.js";

// export const checkout = async (req, res) => {
//   try {
//     // DEBUG - remove in production
//     console.log("checkout: RAZORPAY_API_KEY present?", !!process.env.RAZORPAY_API_KEY);
//     console.log("checkout: RAZORPAY_API_SECRET present?", !!process.env.RAZORPAY_API_SECRET);

//     if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
//       return res.status(500).json({
//         success: false,
//         message: "Server misconfiguration: Razorpay keys missing",
//       });
//     }

//     // create Razorpay client here (guaranteed to exist)
//     const razor = new Razorpay({
//       key_id: process.env.RAZORPAY_API_KEY,
//       key_secret: process.env.RAZORPAY_API_SECRET,
//     });

//     const options = {
//       amount: Number(req.body.amount * 100),
//       currency: "INR",
//     };

//     const order = await razor.orders.create(options);

//     return res.status(200).json({
//       success: true,
//       order,
//     });
//   } catch (error) {
//     console.error("Razorpay create order error:", error);

//     return res.status(error?.statusCode || 500).json({
//       success: false,
//       message: error?.error?.description || error?.message || "Failed to create order",
//       details: error?.error || null,
//     });
//   }
// };

// export const paymentVerification = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     if (!process.env.RAZORPAY_API_SECRET) {
//       console.error("paymentVerification: missing RAZORPAY_API_SECRET");
//       return res.status(500).json({ success: false, message: "Server misconfigured" });
//     }

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     const isAuthentic = expectedSignature === razorpay_signature;

//     if (isAuthentic) {
//       await Payment.create({
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature,
//       });

//       return res.redirect(`http://localhost:5001/paymentsuccess?reference=${razorpay_payment_id}`);
//     } else {
//       return res.status(400).json({ success: false, message: "Signature mismatch" });
//     }
//   } catch (error) {
//     console.error("Payment verification error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error?.message || "Payment verification failed",
//     });
//   }
// };