// src/components/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logout from "../logout/logout";
import "./AdminDashboard.css";
import Home from "../payment/home"
import PaymentsList from "../payment/paymentList";


const API_BASE = "http://localhost:5001";

// small helpers
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");
const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPhone = (s) => {
  const d = onlyDigits(s);
  return d.length === 10;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  // data + UI state
  const [profiles, setProfiles] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("asc");
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [topMessage, setTopMessage] = useState(null);

  // edit / delete workflow
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  // add new user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    fatherNumber: "",
    password: "",
  });
  const [addErrors, setAddErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  const redirectToLogin = () => navigate("/login");

  // validate add form
  const validateAddForm = () => {
    const errs = {};
    if (!addForm.name || !addForm.name.trim()) errs.name = "Name required";
    if (!addForm.email || !isValidEmail(addForm.email)) errs.email = "Valid email required";
    if (!isValidPhone(addForm.phone)) errs.phone = "Phone must be 10 digits";
    if (addForm.fatherNumber && !isValidPhone(addForm.fatherNumber)) errs.fatherNumber = "Father's number must be 10 digits";
    if (
      addForm.age !== "" &&
      (isNaN(addForm.age) || addForm.age < 1 || addForm.age > 120)
    )
      errs.age = "Age 1-120";
    return errs;
  };

  // submit add form
  const submitAddForm = async (e) => {
    e.preventDefault();
    const errs = validateAddForm();
    if (Object.keys(errs).length > 0) {
      setAddErrors(errs);
      return;
    }
    setAddLoading(true);
    setAddErrors({});
    try {
      const payload = {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: onlyDigits(addForm.phone),
        age: addForm.age === "" ? null : Number(addForm.age),
        fatherNumber: addForm.fatherNumber ? onlyDigits(addForm.fatherNumber) : "",
        password: addForm.password || undefined,
      };

      const res = await fetch(`${API_BASE}/admin/create-user`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTopMessage({
          type: "err",
          text: data.message || data.error || "Create failed",
        });
        setAddLoading(false);
        return;
      }

      const profile = data.profile;
      if (profile) {
        setProfiles((prev) => {
          const exists = prev.some((p) => String(p._id) === String(profile._id));
          if (exists) return prev;
          return [profile, ...prev].slice(0, limit);
        });
      } else {
        fetchProfiles();
      }

      setTopMessage({ type: "ok", text: "User created" });
      setShowAddForm(false);
      setAddForm({
        name: "",
        email: "",
        phone: "",
        age: "",
        fatherNumber: "",
        password: "",
      });
    } catch (err) {
      console.error("submitAddForm error:", err);
      setTopMessage({
        type: "err",
        text: "Network error while creating user",
      });
    } finally {
      setAddLoading(false);
    }
  };

  // Download CSV (selected rows only)
  const downloadSelectedCsv = () => {
    const selectedRows = profiles.filter((p) => selected.has(p._id));
    if (!selectedRows || selectedRows.length === 0) {
      setTopMessage({ type: "err", text: "Select one or more rows to export" });
      return;
    }
    const header = ["Name", "Email", "Phone", "Age", "Father's Number"];
    const rows = selectedRows.map((p) => {
      const email = (p.userRegister && p.userRegister.email) || p.email || "";
      return [p.name ?? "", email, p.phone ?? "", p.age ?? "", p.fatherNumber ?? ""];
    });
    const escapeCell = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csvBody = [
      header.map(escapeCell).join(","),
      ...rows.map((r) => r.map(escapeCell).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF", csvBody], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profiles_selected_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setTopMessage({ type: "ok", text: `Exported ${rows.length} rows` });
  };

  // admin check
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/login/check`, {
          method: "GET",
          credentials: "include",
        });
        if (!mounted) return;
        if (!res.ok) {
          redirectToLogin();
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (data.role !== "admin") redirectToLogin();
      } catch (err) {
        console.error("Admin auth check error:", err);
        redirectToLogin();
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // fetch profiles
  const fetchProfiles = async () => {
    setLoading(true);
    setTopMessage(null);
    try {
      const url = new URL(`${API_BASE}/admin/profiles`);
      url.searchParams.set("page", page);
      url.searchParams.set("limit", limit);
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("order", order);

      const res = await fetch(url.toString(), { credentials: "include" });
      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTopMessage({
          type: "err",
          text: data.message || data.error || "Failed to load",
        });
        setProfiles([]);
      } else {
        const profilesArr =
          (data.data && data.data.profiles) || data.profiles || [];
        const pages =
          (data.data &&
            data.data.pagination &&
            data.data.pagination.pages) ||
          (data.pagination && data.pagination.pages) ||
          1;
        setProfiles(profilesArr);
        setTotalPages(pages);
        setSelected(new Set());
      }
    } catch (err) {
      console.error("fetchProfiles error:", err);
      setTopMessage({ type: "err", text: "Network error" });
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, order]);

  // selection
  const toggleSelect = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelected(s);
  };
  const toggleSelectAll = () => {
    if (selected.size === profiles.length) setSelected(new Set());
    else setSelected(new Set(profiles.map((p) => p._id)));
  };

  // sorting
  const handleSort = (col) => {
    if (sortBy === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setOrder("asc");
    }
  };

  // edit
  const startEdit = (profile) => {
    setEditingId(profile._id);
    setEditForm({
      name: profile.name ?? "",
      email:
        (profile.userRegister && profile.userRegister.email) ||
        profile.email ||
        "",
      phone: profile.phone ?? "",
      age: profile.age ?? "",
      fatherNumber: profile.fatherNumber ?? "",
    });
    setEditErrors({});
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditErrors({});
  };
  const saveEdit = async (id) => {
    const errs = {};
    if (editForm.email && !isValidEmail(editForm.email))
      errs.email = "Invalid email";
    if (editForm.phone && editForm.phone !== "" && !isValidPhone(editForm.phone))
      errs.phone = "10 digits required";
    if (
      editForm.fatherNumber &&
      editForm.fatherNumber !== "" &&
      !isValidPhone(editForm.fatherNumber)
    )
      errs.fatherNumber = "10 digits required";
    if (
      editForm.age !== "" &&
      (isNaN(editForm.age) || editForm.age < 1 || editForm.age > 120)
    )
      errs.age = "Age 1-120";
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    const payload = {
      name: editForm.name,
      email: editForm.email,
      phone: editForm.phone ? onlyDigits(editForm.phone) : "",
      age: editForm.age === "" ? null : Number(editForm.age),
      fatherNumber: editForm.fatherNumber
        ? onlyDigits(editForm.fatherNumber)
        : "",
    };
    try {
      const res = await fetch(`${API_BASE}/admin/profiles/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        setTopMessage({
          type: "err",
          text: data.message || "Update failed",
        });
      else {
        setTopMessage({ type: "ok", text: "Updated successfully" });
        setEditingId(null);
        fetchProfiles();
      }
    } catch (err) {
      console.error("saveEdit error:", err);
      setTopMessage({
        type: "err",
        text: "Network error during update",
      });
    }
  };

  // delete
  const requestDelete = (id) => setPendingDeleteId(id);
  const cancelDelete = () => setPendingDeleteId(null);
  const confirmDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/profiles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        setTopMessage({
          type: "err",
          text: data.message || "Delete failed",
        });
      else {
        setTopMessage({ type: "ok", text: "Deleted" });
        setPendingDeleteId(null);
        fetchProfiles();
      }
    } catch (err) {
      console.error("confirmDelete error:", err);
      setTopMessage({
        type: "err",
        text: "Network error during delete",
      });
    }
  };

  // bulk delete
  const requestBulkDelete = () => {
    if (selected.size === 0)
      setTopMessage({ type: "err", text: "No rows selected" });
    else setPendingBulkDelete(true);
  };
  const cancelBulkDelete = () => setPendingBulkDelete(false);
  const confirmBulkDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/profiles`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.status === 401 || res.status === 403) {
        redirectToLogin();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        setTopMessage({
          type: "err",
          text: data.message || "Bulk delete failed",
        });
      else {
        setTopMessage({
          type: "ok",
          text: `Deleted ${data.deletedCount ?? "items"}`,
        });
        setPendingBulkDelete(false);
        fetchProfiles();
      }
    } catch (err) {
      console.error("confirmBulkDelete error:", err);
      setTopMessage({
        type: "err",
        text: "Network error during bulk delete",
      });
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Admin — User Profiles</h2>
        <Logout />
      </div>

      {topMessage && (
        <div className={`msg ${topMessage.type}`}>{topMessage.text}</div>
      )}

      <div className="controls">
        <button onClick={requestBulkDelete}>Delete Selected</button>
        <button onClick={downloadSelectedCsv} style={{ marginLeft: 8 }}>
          Download CSV (selected)
        </button>
        <button
          style={{ marginLeft: 12 }}
          onClick={() => setShowAddForm((s) => !s)}
        >
          {showAddForm ? "Close" : "Add New User"}
        </button>

        {showAddForm && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 6,
              background: "#f9f9f9",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Add New User</h3>
            <form onSubmit={submitAddForm}>
              <div style={{ marginBottom: 8 }}>
                <label>Name</label>
                <br />
                <input
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                />
                {addErrors.name && <div className="err">{addErrors.name}</div>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Email</label>
                <br />
                <input
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                />
                {addErrors.email && <div className="err">{addErrors.email}</div>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Phone</label>
                <br />
                <input
                  value={addForm.phone}
                  onChange={(e) =>
                    setAddForm({ ...addForm, phone: e.target.value })
                  }
                />
                {addErrors.phone && <div className="err">{addErrors.phone}</div>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Age</label>
                <br />
                <input
                  value={addForm.age}
                  onChange={(e) =>
                    setAddForm({ ...addForm, age: e.target.value })
                  }
                  style={{ width: 80 }}
                />
                {addErrors.age && <div className="err">{addErrors.age}</div>}
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Father's Number</label>
                <br />
                <input
                  value={addForm.fatherNumber}
                  onChange={(e) =>
                    setAddForm({ ...addForm, fatherNumber: e.target.value })
                  }
                />
                {addErrors.fatherNumber && (
                  <div className="err">{addErrors.fatherNumber}</div>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <button type="submit" disabled={addLoading}>
                  {addLoading ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setAddErrors({});
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {pendingBulkDelete && (
          <span className="confirm">
            Confirm delete {selected.size}?
            <button onClick={confirmBulkDelete}>Yes</button>
            <button onClick={cancelBulkDelete}>No</button>
          </span>
        )}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selected.size === profiles.length && profiles.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort("name")} className="sortable">
                  Name {sortBy === "name" ? (order === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("email")} className="sortable">
                  Email {sortBy === "email" ? (order === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("phone")} className="sortable">
                  Phone {sortBy === "phone" ? (order === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("age")} className="sortable">
                  Age {sortBy === "age" ? (order === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Father's Number</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan="7">No profiles</td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)} />
                    </td>

                    {editingId === p._id ? (
                      <>
                        <td>
                          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </td>
                        <td>
                          <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                          {editErrors.email && <div className="err">{editErrors.email}</div>}
                        </td>
                        <td>
                          <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                          {editErrors.phone && <div className="err">{editErrors.phone}</div>}
                        </td>
                        <td>
                          <input value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} style={{ width: 60 }} />
                          {editErrors.age && <div className="err">{editErrors.age}</div>}
                        </td>
                        <td>
                          <input value={editForm.fatherNumber} onChange={(e) => setEditForm({ ...editForm, fatherNumber: e.target.value })} />
                          {editErrors.fatherNumber && <div className="err">{editErrors.fatherNumber}</div>}
                        </td>
                        <td>
                          <button onClick={() => saveEdit(p._id)}>Save</button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{p.name || "—"}</td>
                        <td>{(p.userRegister && p.userRegister.email) || p.email || "—"}</td>
                        <td>{p.phone || "—"}</td>
                        <td>{p.age ?? "—"}</td>
                        <td>{p.fatherNumber || "—"}</td>
                        <td>
                          <button onClick={() => startEdit(p)}>Edit</button>
                          {pendingDeleteId === p._id ? (
                            <>
                              <button onClick={() => confirmDelete(p._id)}>Confirm</button>
                              <button onClick={cancelDelete}>Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => requestDelete(p._id)}>Delete</button>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination" style={{ marginTop: 12 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
        <span style={{ margin: "0 12px" }}>Page {page} / {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
      </div><br></br>
    <Home/>
    <br></br>
     <PaymentsList />
    </div>
  );
}