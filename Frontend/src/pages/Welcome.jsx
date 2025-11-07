import React from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("bank_user");
  let user = null;

  try {
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {
    user = null;
  }

  // pick a friendly name if available
  const name =
    (user && (user.firstName || user.name || user.username || user.fullName)) ||
    "valued customer";

  function handleContinue() {
    navigate("/dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("bank_token");
    localStorage.removeItem("bank_user");
    navigate("/login");
  }

  return (
    <div style={{
      minHeight: "80vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>
      <div className="card" style={{ maxWidth: 980, width: "100%", borderRadius: 14, padding: 36 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 48, margin: 0, color: "var(--text)", lineHeight: 1.02 }}>
            Welcome, {name} 👋
          </h1>

          <p style={{ marginTop: 12, fontSize: 18, color: "var(--muted-2)", maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
            Thank you for signing in. From here you can review and manage payments, check your recent activity,
            or make a new transfer. If you're ready, continue to your dashboard — or sign out if you are on a shared device.
          </p>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 12 }}>
            <button className="btn-primary" onClick={handleContinue}>Go to Dashboard</button>
            <button className="btn-outline-secondary" onClick={handleLogout}>Sign Out</button>
          </div>

          <div style={{ marginTop: 20, color: "var(--muted)", fontSize: 13 }}>
            This is a static welcome page — you can customise the message, add tips, or show onboarding links here.
          </div>
        </div>
      </div>
    </div>
  );
}
