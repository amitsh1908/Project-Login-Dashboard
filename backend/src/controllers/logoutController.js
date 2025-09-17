export const logoutUser = (req, res) => {
  try {
    // Clear cookie "token"
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // true if using HTTPS in production
      sameSite: "lax",
    });

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};