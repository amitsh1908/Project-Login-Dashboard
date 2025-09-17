// controllers/adminController.js
import mongoose from "mongoose";
import UserProfile from "../models/userProfile.js";
import UserRegister from "../models/userRegister.js";
import { randomBytes } from "crypto";

const ALLOWED_FIELDS = ["name", "email", "phone", "age", "fatherNumber"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Allowed sort keys (frontend uses these keys)
const SORT_FIELD_MAP = {
  name: "name",
  email: "email", 
  phone: "phone",
  age: "age",
  createdAt: "createdAt",
};

// controllers/adminController.js  
export const listProfiles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    let limit = Math.max(1, parseInt(req.query.limit || DEFAULT_LIMIT, 10));
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    // requested sort column and order
    const rawSortBy = String(req.query.sortBy || "createdAt").trim();
    const rawOrder = String(req.query.order || "desc").toLowerCase();

    
    // only allow fields we know exist on profile (whitelist)
    const ALLOWED_SORT_FIELDS = ["name", "email", "phone", "age", "createdAt", "updatedAt"];
    // fallback
    const sortBy = ALLOWED_SORT_FIELDS.includes(rawSortBy) ? rawSortBy : "createdAt";

    const order = rawOrder === "asc" ? 1 : -1;

    const q = (req.query.q || "").trim();
    const userFilter = req.query.user;

    const filter = {};

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    if (userFilter) {
      if (!mongoose.isValidObjectId(userFilter)) {
        return res.status(400).json({ success: false, message: "Invalid user filter id" });
      }
      filter.userRegister = userFilter;
    }

    const total = await UserProfile.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));

    // build the sort object
    const sortObj = { [sortBy]: order };

    const stringFields = new Set(["name", "email", "phone"]);
    const query = UserProfile.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userRegister", "userid email role")
      .lean();

    if (stringFields.has(sortBy)) {
      // strength:2 ignores case differences
      query.collation({ locale: "en", strength: 2 });
    }

    const profiles = await query.exec();

    return res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          total,
          page,
          pages,
          limit,
        },
      },
    });
  } catch (err) {
    console.error("listProfiles error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    // Build updates only from allowed whitelist
    const updates = {};
    for (const k of ALLOWED_FIELDS) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided" });
    }

    const profile = await UserProfile.findById(id);
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    // If admin changes email, update auth UserRegister first
    if (updates.email) {
      try {
        await UserRegister.findByIdAndUpdate(profile.userRegister, { email: updates.email }, { runValidators: true });
      } catch (err) {
        console.error("Failed to update auth email by admin:", err);
        if (err && err.code === 11000) {
          return res.status(400).json({ success: false, message: "Email already in use" });
        }
        if (err && err.name === "ValidationError") {
          return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: "Failed to update auth email" });
      }
    }

    const updated = await UserProfile.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("userRegister", "userid email role");

    return res.json({ success: true, message: "Profile updated", profile: updated });
  } catch (err) {
    console.error("updateProfileById error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid profile id" });
    }

    const deleted = await UserProfile.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Profile not found" });

    return res.json({ success: true, message: "Profile deleted", profileId: id });
  } catch (err) {
    console.error("deleteProfileById error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const bulkDeleteProfiles = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "ids array required in body" });
    }

    const validIds = ids.filter((i) => mongoose.isValidObjectId(i));
    if (validIds.length === 0) {
      return res.status(400).json({ success: false, message: "No valid profile ids provided" });
    }

    const result = await UserProfile.deleteMany({ _id: { $in: validIds } });
    return res.json({
      success: true,
      message: "Bulk delete completed",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("bulkDeleteProfiles error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
// controllers/adminController.js

export const createUserFromAdmin = async (req, res) => {
  try {
    const body = req.body || {};

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phoneRaw = String(body.phone || "").trim();
    const age = body.age === undefined || body.age === null ? null : Number(body.age);
    const fatherNumberRaw = String(body.fatherNumber || "").trim();
    const password = body.password || "Password@123"; // or require password field

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    if (!email || !emailRegex.test(email)) return res.status(400).json({ success: false, message: "Valid email required" });

    const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
    const phone = onlyDigits(phoneRaw);
    const fatherNumber = onlyDigits(fatherNumberRaw);

    if (!phone || phone.length !== 10) return res.status(400).json({ success: false, message: "Phone must be 10 digits" });
    if (fatherNumber && fatherNumber.length !== 10) return res.status(400).json({ success: false, message: "Father's number must be 10 digits" });
    if (age !== null && (isNaN(age) || age < 1 || age > 120)) return res.status(400).json({ success: false, message: "Invalid age" });

    // check duplicate email
    const emailExists = await UserRegister.findOne({ email });
    if (emailExists) return res.status(400).json({ success: false, message: "Email already exists" });

    // optional: check duplicate phone in profiles (if you enforce unique phone)
    const phoneExists = await UserProfile.findOne({ phone });
    if (phoneExists) return res.status(400).json({ success: false, message: "Phone already exists" });

    // Build a unique userid from email prefix + short id
    let shortId = null;
    try {
      const { randomUUID, randomBytes } = await import("crypto").catch(() => ({}));
      if (typeof randomUUID === "function") shortId = randomUUID().replace(/-/g, "").slice(0, 6);
      else if (typeof randomBytes === "function") shortId = randomBytes(4).toString("hex").slice(0, 6);
    } catch (e) {
      shortId = Math.random().toString(16).slice(2, 8);
    }
    const userid = `u_${email.split("@")[0]}_${shortId}`;

    // Create UserRegister (auth record)
    const userRegisterData = {
      userid,
      email,
      password, // if you hash in pre-save hook it will be hashed
      role: body.role || "user",
    };

    const createdAuth = await UserRegister.create(userRegisterData);

    // Create profile
    const profileData = {
      userRegister: createdAuth._id,
      name,
      email,
      phone,
      age,
      fatherNumber: fatherNumber || "",
      // add any other fields expected by your schema
    };

    const createdProfile = await UserProfile.create(profileData);

    const populated = await UserProfile.findById(createdProfile._id).populate("userRegister", "userid email role").lean();

    return res.status(201).json({ success: true, message: "User created", profile: populated });
  } catch (err) {
    console.error("createUserFromAdmin error:", err);
    if (err && err.code === 11000) {
      return res.status(400).json({ success: false, message: "Duplicate key error", error: err.message });
    }
    return res.status(500).json({ success: false, message: err.message || String(err) });
  }
};