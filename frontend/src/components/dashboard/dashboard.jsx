// src/components/dashboard/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logout from "../logout/logout";
import "./dashboard.css";
import Home from "../payment/home"
import PaymentsList from "../payment/paymentList";

const API_BASE = "http://localhost:5001";
const ALLOWED_FIELDS = ["name", "email", "phone", "age", "fatherNumber"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const redirectToLogin = () => navigate("/login");

  const loadProfile = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/profile/me`, { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ type: "error", text: data?.message || data?.error || "Failed to load profile" });
        setProfile(null);
      } else {
        setProfile(data.profile ?? null);
      }
    } catch (err) {
      console.error("loadProfile error:", err);
      setMsg({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (profile) {
      const initial = {};
      ALLOWED_FIELDS.forEach((k) => {
        initial[k] = profile[k] ?? (k === "age" ? "" : "");
      });
      setForm(initial);
    } else {
      setForm({});
    }
  }, [profile]);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    const payload = {};
    ALLOWED_FIELDS.forEach((k) => {
      if (form[k] !== undefined) payload[k] = form[k];
    });

    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg({ type: "error", text: data?.message || data?.error || "Update failed" });
      } else {
        setMsg({ type: "ok", text: "Profile updated" });
        setEditMode(false);
        await loadProfile();
      }
    } catch (err) {
      console.error("save error:", err);
      setMsg({ type: "error", text: "Network error during update" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dash-wrap">
        <div className="dash-header">
          <h2>Dashboard</h2>
          <Logout />
        </div>
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <h2>Dashboard</h2>
        <Logout />
      </div>

      {msg && (
        <div className={`dash-msg ${msg.type === "error" ? "err" : "ok"}`}>{msg.text}</div>
      )}

      {!profile ? (
        <div className="dash-empty">
          <p>No profile found. You can create your profile here.</p>
          <button onClick={() => setEditMode(true)}>Create Profile</button>
        </div>
      ) : (
        <div className="dash-card">
          {!editMode ? (
            <>
              <div className="dash-row"><strong>Name:</strong> <span>{profile.name || "—"}</span></div>
              <div className="dash-row"><strong>Email:</strong> <span>{(profile.userRegister && profile.userRegister.email) || profile.email || "—"}</span></div>
              <div className="dash-row"><strong>Phone:</strong> <span>{profile.phone || "—"}</span></div>
              <div className="dash-row"><strong>Age:</strong> <span>{profile.age ?? "—"}</span></div>
              <div className="dash-row"><strong>Father's Number:</strong> <span>{profile.fatherNumber || "—"}</span></div>

              <div className="dash-actions">
                <button onClick={() => setEditMode(true)}>Edit</button>
              </div>
            </>
          ) : (
            <>
              <label className="dash-field">
                <div className="dash-label">Name</div>
                <input value={form.name ?? ""} onChange={(e) => handleChange("name", e.target.value)} />
              </label>

              <label className="dash-field">
                <div className="dash-label">Email</div>
                <input value={form.email ?? ""} onChange={(e) => handleChange("email", e.target.value)} />
              </label>

              <label className="dash-field">
                <div className="dash-label">Phone</div>
                <input value={form.phone ?? ""} onChange={(e) => handleChange("phone", e.target.value)} />
              </label>

              <label className="dash-field">
                <div className="dash-label">Age</div>
                <input type="number" min="1" max="120" value={form.age ?? ""} onChange={(e) => handleChange("age", e.target.value)} />
              </label>

              <label className="dash-field">
                <div className="dash-label">Father's Number</div>
                <input value={form.fatherNumber ?? ""} onChange={(e) => handleChange("fatherNumber", e.target.value)} />
              </label>

              <div className="dash-actions">
                <button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                <button onClick={() => { setEditMode(false); setMsg(null); }}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}<br></br>
      <Home/><br />
      <PaymentsList />
    </div>
  
);
}