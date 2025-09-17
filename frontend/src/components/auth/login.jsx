// src/components/login/login.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";

const API_BASE = "http://localhost:5001";

export default function Login() {
  const [formdata, setFormData] = useState({ identifier: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // --- redirect away if already logged in ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/login/check`, {
          method: "GET",
          credentials: "include",
        });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const role = data.role || "user";
          if (role === "admin") navigate("/admin");
          else navigate("/dashboard");
        }
      } catch (err) {
        console.error("auth check error:", err);
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const bodyData = formdata.identifier.includes("@")
        ? { email: formdata.identifier, password: formdata.password }
        : { userid: formdata.identifier, password: formdata.password };

      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bodyData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.success) {
        const role = data.role || (data.user && data.user.role) || "user";
        if (role === "admin") navigate("/admin");
        else navigate("/dashboard");
      } else {
        setMessage(" " + (data.message || data.error || "Login failed"));
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage(" Network error");
    }
  };

  const handleGoogleClick = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  return (
    <div className="reg-wrap">
      <form className="reg-card" onSubmit={handleSubmit}>
        <h2 className="reg-title">Login</h2>

        <label className="reg-label" htmlFor="identifier">
          UserId or Email
          <input
            id="identifier"
            name="identifier"
            className="reg-input"
            type="text"
            value={formdata.identifier}
            onChange={(e) =>
              setFormData({ ...formdata, identifier: e.target.value })
            }
            placeholder="UserId or Email"
          />
        </label>

        <label className="reg-label" htmlFor="password">
          Password
          <input
            id="password"
            name="password"
            className="reg-input"
            type="password"
            value={formdata.password}
            onChange={(e) =>
              setFormData({ ...formdata, password: e.target.value })
            }
            placeholder="Password"
          />
        </label>

        <button className="reg-btn" type="submit">
          Login
        </button>

        <button
          type="button"
          className="reg-google"
          onClick={handleGoogleClick}
          aria-label="Sign in with Google"
        >
          <span className="google-icon">G</span>
          <span>Sign in with Google</span>
        </button>

        <p className="reg-switch-line">
          New user?{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate("/register")}
          >
            Create account
          </button>
        </p>

        {message && (
          <p
            className={`reg-message ${
              message.includes(" ") ? "err" : "ok"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}