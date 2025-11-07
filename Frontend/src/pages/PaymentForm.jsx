import React, { useState } from "react";
import { submitPayment } from "../api";
import { useNavigate } from "react-router-dom";

export default function PaymentForm() {
  const navigate = useNavigate();

  // Read auth token and user from localStorage
  const token = localStorage.getItem("bank_token");

  // eslint-disable-next-line no-unused-vars
  const user = JSON.parse(localStorage.getItem("bank_user") || "{}");

  const [form, setForm] = useState({
    amount: "",
    currency: "ZAR",
    swiftCode: "",
    accountNumber: "", // beneficiary account
    reference: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);

    if (!form.amount || !form.accountNumber || !form.swiftCode) {
      setError("Amount, account number and SWIFT code are required.");
      return;
    }

    if (!window.confirm(`Send ${form.amount} ${form.currency} to ${form.accountNumber}?`)) return;

    setLoading(true);
    try {
      const payload = {
        Amount: Number(form.amount),
        Currency: form.currency,
        SWIFTCode: form.swiftCode,
        AccountNumber: form.accountNumber,
        Reference: form.reference || undefined
      };

      const resp = await submitPayment(payload, token);
      console.log(resp);

      alert(`Payment of ${form.amount} ${form.currency} submitted successfully!`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Payment error:", err);
      const msg = err?.response?.data || err.message || "Payment failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // small inline styles to keep the UI tidy and responsive
  const rowGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    alignItems: "start"
  };

  const twoColGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
    alignItems: "start"
  };

  const labelStyle = { display: "block", marginBottom: 8, fontWeight: 700, color: "var(--text)" };
  const actionsStyle = { marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 };

  // Force the dropdown (select) to match your dark theme (black bg, white text).
  // Inline styles win over any conflicting CSS so this makes the closed select match the page.
  const selectStyle = {
    background: "linear-gradient(180deg, var(--form-bg-navy), #07203a)",
    color: "var(--text)",
    border: "1px solid var(--form-border-navy)",
    padding: "10px 12px",
    borderRadius: 10,
    outline: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
    appearance: "none",
    width: "100%",
    boxSizing: "border-box"
  };

  // Option styling is limited across browsers, but we'll attempt to set matching colors.
  const optionStyle = { color: "var(--text)", background: "var(--card)" };

  return (
    <div className="d-flex justify-content-center" style={{ marginTop: 24 }}>
      <div className="card shadow-sm" style={{ width: 720, borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0" style={{ color: "var(--text)" }}>International Payment</h4>
          </div>

          {/* add "form" class so your theme styles apply to controls */}
          <form onSubmit={submit} className="form" aria-label="International payment form">
            <div style={rowGrid}>
              <div>
                <label style={labelStyle}>Amount</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={form.amount}
                  onChange={onChange}
                  placeholder="0.00"
                  style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--form-border-navy)" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Currency</label>
                <div style={{ position: "relative" }}>
                  <select
                    name="currency"
                    className="form-select"
                    value={form.currency}
                    onChange={onChange}
                    style={selectStyle}
                    aria-label="Currency"
                  >
                    <option style={optionStyle}>ZAR</option>
                    <option style={optionStyle}>USD</option>
                    <option style={optionStyle}>EUR</option>
                    <option style={optionStyle}>GBP</option>
                  </select>
                  {/* decorative chevron (pure CSS) — visible on dark backgrounds */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "var(--muted-2)"
                    }}
                  >
                    ▾
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>SWIFT code</label>
                <input
                  name="swiftCode"
                  className="form-control"
                  value={form.swiftCode}
                  onChange={onChange}
                  placeholder="e.g. ABSAZAJJ"
                  style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--form-border-navy)" }}
                />
              </div>
            </div>

            <div style={{ ...twoColGrid, marginTop: 12 }}>
              <div>
                <label style={labelStyle}>Beneficiary account number</label>
                <input
                  name="accountNumber"
                  className="form-control"
                  value={form.accountNumber}
                  onChange={onChange}
                  placeholder="Account number"
                  style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--form-border-navy)" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Reference (optional)</label>
                <input
                  name="reference"
                  className="form-control"
                  placeholder="Payment reference"
                  value={form.reference}
                  onChange={onChange}
                  style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--form-border-navy)" }}
                />
              </div>
            </div>

            {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}

            <div style={actionsStyle}>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Processing…" : "Pay Now"}
              </button>

              <button
                type="button"
                className="btn-outline-secondary"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
