// index.js
import 'dotenv/config'
import express from "express";
import main from "./config/connection.js";
import regRoutes from "./routes/regRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import cookieParser from "cookie-parser";
import logoutRoutes from "./routes/logoutRoutes.js";
import cors from "cors";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { requireAdmin } from "./middleware/reqireAdmin.js";
import adminRoutes from "./routes/adminRoutes.js";
import Razorpay from "razorpay";
import paymentRoute from "./routes/paymentRoutes.js"


export function instance() {
  if (!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
    console.error('Razorpay env missing:', {
      keySet: !!process.env.RAZORPAY_API_KEY,
      secretSet: !!process.env.RAZORPAY_API_SECRET
    });
    throw new Error('Razorpay keys not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
  });
}



const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true,               
}));

//payment 

app.use("/api", paymentRoute);

app.get('/api/getkey', (req, res) => {
  return res.status(200).json({ key: process.env.RAZORPAY_API_KEY || null });
});

app.get('/api/test-razor', async (req, res) => {
  try {
    console.log('TEST-RAZOR: key present?', !!process.env.RAZORPAY_API_KEY);
    console.log('TEST-RAZOR: secret present?', !!process.env.RAZORPAY_API_SECRET);

    const razor = instance();            // <-- different name, no collision
    if (!razor) {
      return res.status(500).json({ ok: false, message: 'Razorpay keys not configured' });
    }

    const order = await razor.orders.create({ amount: 100, currency: 'INR' });
    return res.json({ ok: true, orderId: order.id });
  } catch (err) {
    console.error('test-razor error:', err);
    return res.status(err.statusCode || 500).json({ ok: false, error: err.error || err.message });
  }
});



// register/login routes
app.use("/user", regRoutes);

//logout routes
app.use("/logout", logoutRoutes);

// profile routes
app.use("/profile", authMiddleware, profileRoutes);

//login routes
app.use("/login",loginRoutes);

//admin routes

app.use("/admin", authMiddleware, requireAdmin, adminRoutes);

const PORT = process.env.PORT

main()
  .then(() => {
    console.log("Database connected Successfully ");
    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });
