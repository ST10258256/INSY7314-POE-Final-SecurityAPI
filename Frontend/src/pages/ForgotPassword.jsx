// src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { validateInput, sanitizeInput } from "../utils/validation";

const API_BASE = "https://insy7314-poe-final-securityapi.onrender.com";
// adjust endpoint if your server uses a different path
const ENDPOINT = `${API_BASE}/api/auth/forgot-password`;

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
      // debug
      console.log("ForgotPassword payload:", payload);

      // If your backend has the route, uncomment the axios call. For safety, it's wrapped in try/catch.
      // const resp = await axios.post(ENDPOINT, payload);
      // console.log("ForgotPassword server response:", resp.data);

      // Neutral success message — do not reveal whether account exists
      setInfo("If an account exists for the details you provided, you will receive a password reset email/notification shortly.");
    } catch (err) {
      console.error("Forgot password error:", err);
      const serverMsg = err?.response?.data || err?.message || "Request failed";
      setError(typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fp-root">
      <style>{`
        :root {
          --bg:#08090c;
          --ink:#f2f2f2;
          --muted:#cfcfd6;
          --glass-1: rgba(18,18,22,.55);
          --glass-2: rgba(18,18,22,.35);
          --glass-brd: rgba(255,255,255,.12);
          --gold:#FFD700;
          --shadow:0 24px 60px rgba(0,0,0,.55);
        }

        .fp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg) url('/images/bible4.jpg') center / cover no-repeat fixed;
          color: var(--ink);
          font-family: 'Poppins', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          padding: 40px 16px;
        }

        .fp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 0;
        }

        .auth-card {
          width: min(620px, 94vw);
          padding: 2.2rem 1.6rem;
          border-radius: 16px;
          border: 1px solid var(--glass-brd);
          background: linear-gradient(180deg, var(--glass-1), var(--glass-2));
          box-shadow: var(--shadow);
          backdrop-filter: blur(14px) saturate(130%);
          -webkit-backdrop-filter: blur(14px) saturate(130%);
          position: relative;
          z-index: 1;
        }

        .page-title {
          margin: 0 0 6px 0;
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: #fff;
        }

        .page-sub {
          margin: 0 0 1.4rem 0;
          color: var(--muted);
          font-size: 0.95rem;
        }

        .alert {
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 12px;
          animation: fadeIn .2s ease;
        }
        .alert-success {
          background: rgba(46,204,113,.12);
          border: 1px solid rgba(46,204,113,.22);
          color: #e9ffe9;
        }
        .alert-danger {
          background: rgba(255,77,77,.10);
          border: 1px solid rgba(255,77,77,.22);
          color: #ffcfcf;
        }

        form .label {
          display: block;
          font-weight: 600;
          font-size: .95rem;
          color: #fff;
          margin-bottom: 8px;
        }

        .input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02));
          padding: 10px 12px;
          height: 48px;
          transition: all .18s ease;
          margin-bottom: 12px;
        }
        .input-wrap:focus-within {
          border-color: rgba(255,215,0,.45);
          box-shadow: 0 6px 18px rgba(255,215,0,.08);
        }

        .input-icon {
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: .95;
          color: var(--muted);
          flex: 0 0 28px;
        }

        .auth-card .form-control {
          flex: 1;
          background: transparent;
          border: 0;
          outline: none;
          color: #fff;
          font-size: 1rem;
          padding: 0;
        }

        .btn-primary {
          display: inline-block;
          width: 100%;
          margin-top: 10px;
          background: linear-gradient(135deg, var(--gold), #FFB700);
          color: #111;
          font-weight: 800;
          font-size: 1rem;
          border: 1px solid rgba(255,215,0,.35);
          border-radius: 12px;
          padding: 12px 14px;
          box-shadow: 0 12px 30px rgba(255,215,0,.14);
          cursor: pointer;
        }
        .btn-primary[disabled] { opacity: 0.7; cursor: not-allowed; transform: none; }

        .btn-outline {
          display: inline-block;
          width: 100%;
          margin-top: 10px;
          background: transparent;
          color: var(--muted);
          border: 1px dashed rgba(255,255,255,.06);
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
        }

        .small-link {
          margin-top: 12px;
          display: block;
          text-align: center;
          color: var(--muted);
          font-size: 0.9rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* responsive tweaks */
        @media (max-width: 420px) {
          .auth-card { padding: 1.6rem; border-radius: 12px; }
        }
      `}</style>

      <div className="fp-overlay" aria-hidden="true" />

      <div className="auth-card" role="region" aria-labelledby="forgot-title">
        <h1 id="forgot-title" className="page-title">Forgot password</h1>
        <p className="page-sub">Enter your email or account number to receive reset instructions.</p>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {info && <div className="alert alert-success" role="status">{info}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <label className="label" htmlFor="forgotEmail">Email (preferred)</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden>
              {/* simple envelope icon (SVG) */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v.217l-8 4.8-8-4.8V4z"/>
                <path d="M0 6.383V12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6.383l-7.555 4.533a.5.5 0 0 1-.49 0L0 6.383z"/>
              </svg>
            </span>
            <input
              id="forgotEmail"
              name="email"
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
            />
          </div>

          <label className="label" htmlFor="forgotAccount">Account number (optional)</label>
          <div className="input-wrap">
            <span className="input-icon" aria-hidden>
              {/* simple id/badge icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z"/>
                <path fillRule="evenodd" d="M8 8a3 3 0 100-6 3 3 0 000 6z"/>
              </svg>
            </span>
            <input
              id="forgotAccount"
              name="accountNumber"
              type="text"
              className="form-control"
              placeholder="Enter account number"
              value={form.accountNumber}
              onChange={onChange}
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send reset instructions"}
          </button>

          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate("/login")}
          >
            Back to login
          </button>
        </form>

        <div className="small-link">
          <Link to="/" style={{ color: "inherit", textDecoration: "underline", opacity: 0.9 }}>Back to home</Link>
        </div>
      </div>
    </div>
  );
}
