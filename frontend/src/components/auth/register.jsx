// Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";

export default function Register() {
  const [formdata, setFormData] = useState({
    userid: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const navigate = useNavigate();

  const handleInputChange = (e) =>
    setFormData((d) => ({ ...d, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch("http://localhost:5001/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formdata),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "User created successfully");
        setMessageType("success");
        setFormData({ userid: "", email: "", password: "" });
      } else {
        setMessage(data.message || "Registration failed");
        setMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error, try again.");
      setMessageType("error");
    }
  };

  return (
    <div className="reg-wrap">
      <form className="reg-card" onSubmit={handleSubmit}>
        <h2 className="reg-title">Register</h2>

        <label className="reg-label">
          User Id
          <input
            className="reg-input"
            name="userid"
            value={formdata.userid}
            onChange={handleInputChange}
            type="text"
            
          />
        </label>

        <label className="reg-label">
          Email
          <input
            className="reg-input"
            name="email"
            value={formdata.email}
            onChange={handleInputChange}
            type="email"
            
          />
        </label>

        <label className="reg-label">
          Password
          <input
            className="reg-input"
            name="password"
            value={formdata.password}
            onChange={handleInputChange}
            type="password"
            
          />
        </label>

        <button className="reg-btn" type="submit">Submit</button>

        {/*  new button to go to login page */}
        <p className="reg-switch-line">
          Already have an account?{" "}
          <button
            type="button"
            className="link-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </p>

        {message && (
          <p className={`reg-message ${messageType === "success" ? "ok" : "err"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}