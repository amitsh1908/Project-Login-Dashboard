import mongoose from "mongoose";

const userRegisterSchema = new mongoose.Schema({
  userid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email required"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email"]
  },
  password: {
    type: String,
    required: function() { return !this.googleId; },
    select: false,
    minlength: 6
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  }
}, { timestamps: true });

const UserRegister = mongoose.model("UserRegister", userRegisterSchema);
export default UserRegister;