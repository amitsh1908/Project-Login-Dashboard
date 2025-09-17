// controllers/profileController.js
import UserProfile from "../models/userProfile.js";
import UserRegister from "../models/userRegister.js";

const ALLOWED_FIELDS = ["name", "email", "phone", "age", "fatherNumber"];

/** GET /profile/me */
export const getProfileForMe = async (req, res) => {
  try {
    const userRegister = req.user?.id;
    if (!userRegister) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const profile = await UserProfile.findOne({ userRegister })
      .populate("userRegister", "userid email");

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return res.json({ success: true, profile });
  } catch (err) {
    console.error("getProfileForMe error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/** PATCH /profile/me */
export const updateProfileForMe = async (req, res) => {
  try {
    const userRegister = req.user?.id;
    if (!userRegister) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // filter allowed fields only
    const updates = {};
    for (const k of ALLOWED_FIELDS) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided" });
    }

    // if email is updated, sync with UserRegister as well
    if (updates.email) {
      try {
        await UserRegister.findByIdAndUpdate(
          userRegister,
          { email: updates.email },
          { runValidators: true }
        );
      } catch (err) {
        console.error("Failed to update UserRegister email:", err);
        if (err?.code === 11000) {
          return res.status(400).json({ success: false, message: "Email already in use" });
        }
        if (err?.name === "ValidationError") {
          return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, error: "Failed to update auth email" });
      }
    }

    const updated = await UserProfile.findOneAndUpdate(
      { userRegister },
      updates,
      { new: true, runValidators: true }
    ).populate("userRegister", "userid email");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return res.json({ success: true, message: "Profile updated", profile: updated });
  } catch (err) {
    console.error("updateProfileForMe error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};