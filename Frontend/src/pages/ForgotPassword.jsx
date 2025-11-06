// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { validateInput, sanitizeInput } from "../utils/validation";

const API_BASE = "https://insy7314-poe-final-securityapi.onrender.com";

export default function ForgotPassword() {
  const [form, setForm] = useState({ email: "", accountNumber: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    const value = sanitizeInput(e.target.value);
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    // require at least one
    if (!form.email && !form.accountNumber) {
      setError("Enter your email or account number to reset your password.");
      setLoading(false);
      return;
    }

    if (form.email && !validateInput(form.email, "email")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    if (form.accountNumber && !validateInput(form.accountNumber, "accountNumber")) {
      setError("Please enter a valid account number.");
      setLoading(false);
      return;
    }

    try {
      // payload: prefer email if provided
      const payload = form.email ? { email: form.email } : { accountNumber: form.accountNumber };

      // change endpoint if your backend uses a different path
    //  const resp = await axios.post(`${API_BASE}/api/auth/forgot-password`, payload);

      // Show a neutral success message — do not reveal whether account exists
      setInfo("If an account exists for the details you provided, you will receive a password reset email/notification shortly.");
    } catch (err) {
      // server may return helpful info; show minimal friendly text
      console.error("Forgot password error:", err);
      const serverMsg = err?.response?.data || err?.message || "Request failed";
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
      <div className="card shadow-lg" style={{ maxWidth: 540, width: "100%", borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="mb-3 text-center">
            <h3 className="mb-0">Forgot password</h3>
            <small className="text-muted">Enter your email or account number to receive reset instructions.</small>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {info && <div className="alert alert-success">{info}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label small">Email (preferred)</label>
              <input
                name="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={onChange}
              />
            </div>

            <div className="mb-2">
              <label className="form-label small">Account number (optional)</label>
              <input
                name="accountNumber"
                type="text"
                className="form-control"
                placeholder="Enter account number"
                value={form.accountNumber}
                onChange={onChange}
              />
            </div>

            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset instructions"}
              </button>

              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/login")}>
                Back to login
              </button>
            </div>
          </form>

          <div className="mt-3 small text-center">
            <Link to="/">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
