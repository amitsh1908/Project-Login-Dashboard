// models/userProfile.js
import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
  userRegister: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserRegister",
    required: true,
    unique: true
  },
  name: {
    type: String,
    trim: true,
    default: null   // not required, can be null
  },
  email: {
    type: String,
    trim: true,
    default: null
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, "Invalid phone"],
    default: null
  },
  age: {
    type: Number,
    min: 1,
    max: 120,
    default: null
  },
  fatherNumber: {
    type: String,
    match: [/^[0-9]{10}$/, "Invalid phone"],
    default: null
  }
}, { timestamps: true });

const UserProfile = mongoose.model("UserProfile", userProfileSchema);
export default UserProfile;