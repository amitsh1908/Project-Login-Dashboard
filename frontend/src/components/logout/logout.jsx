// Logout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await fetch("http://localhost:5001/logout", {
        method: "POST",
        credentials: "include", // send cookie
      });
      const data = await res.json();
      if (res.ok) {
       // alert(data.message || "Logged out");
        navigate("/login");
      } else {
        alert(data.message || "Logout failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}