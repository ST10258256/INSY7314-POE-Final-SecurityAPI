// src/pages/VerifyPayments.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * VerifyPayments (Admin-aware) — updated to use the provided API host
 *
 * - Admins: fetch from /api/admin/GetAllPayments, PATCH /api/admin/payments/{id}/verify and PATCH /api/admin/payments/{id}/process
 * - Non-admins: fetch from /api/payments (their own), local-only verification (server-side verify/process reserved for Admins)
 *
 * NOTE: all requests use the base host defined below.
 */

const API_BASE = "https://insy7314-poe-final-securityapi.onrender.com";

function localSwiftLooksValid(swift) {
  if (!swift || typeof swift !== "string") return false;
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swift.trim());
}

function localAccountLooksValid(accountNumber) {
  if (!accountNumber) return false;
  return /^[0-9]{5,20}$/.test(accountNumber.trim());
}

function getPaymentId(p) {
  if (!p) return null;
  if (p.id) return p.id;
  if (typeof p._id === "string") return p._id;
  if (p._id && typeof p._id === "object" && p._id.$oid) return p._id.$oid;
  return null;
}

export default function VerifyPayments() {
  const [payments, setPayments] = useState([]); // each item has verifyState + verifyError meta
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("bank_token");
  const rawUser = localStorage.getItem("bank_user");
  let parsedUser = null;
  try { parsedUser = rawUser ? JSON.parse(rawUser) : null; } catch { parsedUser = null; }
  const isAdmin = parsedUser?.role === "Admin";

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchPayments() {
      setLoading(true);
      setGlobalError(null);

      const url = isAdmin
        ? `${API_BASE}/api/admin/GetAllPayments`
        : `${API_BASE}/api/payments`;

      try {
        const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

        const data = Array.isArray(resp.data) ? resp.data : (resp.data?.payments ?? resp.data ?? []);
        const mapped = (data || []).map(p => ({
          ...p,
          verifyState: "idle",
          verifyError: "",
        }));
        setPayments(mapped);
      } catch (err) {
        console.error("Failed to load payments:", err);
        const status = err?.response?.status;
        const serverMsg = err?.response?.data ?? err?.message ?? "Unknown error";
        let friendly = "Failed to load payments. Please refresh or try again later.";

        if (status === 401) friendly = "Unauthorized (401). Please login again.";
        else if (status === 403) friendly = "Forbidden (403). Your account may not have permission to view all payments.";
        else if (status === 404) friendly = "Endpoint not found (404). Check the API route.";
        else {
          friendly = `Error ${status ?? ""}: ${typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)}`;
        }

        setGlobalError(friendly);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [token, navigate, isAdmin]);

  async function handleVerify(index) {
    setPayments(prev => prev.map((p, i) => (i === index ? { ...p, verifyState: "verifying", verifyError: "" } : p)));
    const p = payments[index];
    if (!p) return;

    const acct = (p.accountNumber || p.AccountNumber || p.Account || "").toString();
    if (!localAccountLooksValid(acct)) {
      setPayments(prev => prev.map((it, i) => (i === index ? { ...it, verifyState: "failed", verifyError: "Invalid account format" } : it)));
      return;
    }

    const swift = (p.swiftCode || p.SWIFTCode || p.swift || p.SWIFT || "").toString().trim();

    if (isAdmin) {
      const id = getPaymentId(p);
      if (!id) {
        setPayments(prev => prev.map((it, i) => (i === index ? { ...it, verifyState: "failed", verifyError: "Missing payment id" } : it)));
        return;
      }

      try {
        const url = `${API_BASE}/api/admin/payments/${id}/verify`;
        await axios.patch(url, {}, { headers: { Authorization: `Bearer ${token}` } });

        setPayments(prev => prev.map((it, i) => (i === index ? { ...it, verifyState: "verified", verifyError: "", status: "Verified" } : it)));
        return;
      } catch (err) {
        console.error("Server verify failed:", err);
        if (!localSwiftLooksValid(swift)) {
          setPayments(prev => prev.map((it, i) => (i === index ? { ...it, verifyState: "failed", verifyError: "SWIFT invalid (server failed and local check failed)" } : it)));
          return;
        }
        setPayments(prev => prev.map((it, i) => (i === index ? { ...it, verifyState: "verified", verifyError: "Locally verified (server verify failed)." } : it)));
        return;
      }
    }

    // Non-admin local check
    if (!localSwiftLooksValid(swift)) {
      setPayments(prev => prev.map((it, i) => (i === index ? { ...it, verifyState: "failed", verifyError: "SWIFT looks invalid (local check)" } : it)));
      return;
    }

    setPayments(prev => prev.map((it, i) => (i === index ? { ...it, verifyState: "verified", verifyError: "Locally verified (Admin required for server verify/submit)" } : it)));
  }

  function handleReset(index) {
    setPayments(prev => prev.map((p, i) => (i === index ? { ...p, verifyState: "idle", verifyError: "" } : p)));
  }

  async function handleSubmitToSwift() {
    if (!isAdmin) {
      alert("Only Admins can submit verified payments to SWIFT. Please ask an Admin to submit.");
      return;
    }

    const verifiedItems = payments.filter(p => p.verifyState === "verified");
    if (verifiedItems.length === 0) {
      alert("No verified payments to submit. Verify at least one entry first.");
      return;
    }

    if (!window.confirm(`Submit ${verifiedItems.length} verified payment(s) to processing now?`)) return;

    setSubmitting(true);
    setGlobalError(null);

    try {
      const promises = verifiedItems.map(async p => {
        const id = getPaymentId(p);
        if (!id) throw new Error("Missing payment id for one of the items");
        const url = `${API_BASE}/api/admin/payments/${id}/process`;
        await axios.patch(url, {}, { headers: { Authorization: `Bearer ${token}` } });
        return id;
      });

      const results = await Promise.all(promises);
      setPayments(prev => prev.filter(p => !results.includes(getPaymentId(p))));
      alert(`Submitted ${results.length} payment(s) to processing successfully.`);
    } catch (err) {
      console.error("Submission failed:", err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data ?? err?.message;
      setGlobalError(`Submit error ${status ?? ""}: ${typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg)}`);
    } finally {
      setSubmitting(false);
    }
  }

  const verifiedCount = payments.filter(p => p.verifyState === "verified").length;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Verify Pending Payments</h3>
          <small className="text-muted">
            Check payee account + SWIFT code. {isAdmin ? "As an Admin you can verify and submit payments server-side." : "Server-side verify/submit reserved for Admins."}
          </small>
        </div>

        <div className="text-end">
          <button className="btn btn-outline-secondary me-2" onClick={() => window.location.reload()}>Refresh</button>

          <button
            className="btn btn-success"
            disabled={verifiedCount === 0 || submitting || !isAdmin}
            onClick={handleSubmitToSwift}
            title={isAdmin ? "" : "Only Admins can submit to SWIFT"}
          >
            {submitting ? "Submitting…" : `Submit to SWIFT (${verifiedCount})`}
          </button>
        </div>
      </div>

      {globalError && <div className="alert alert-danger">{globalError}</div>}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">Loading payments…</div>
          ) : payments.length === 0 ? (
            <div className="p-4 text-center text-muted">No pending payments.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Payee</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>SWIFT</th>
                    <th>Verification</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((p, i) => {
                    const id = getPaymentId(p);
                    const payee = p.payeeName || p.name || p.beneficiary || "Unknown";
                    const acct = p.accountNumber || p.AccountNumber || p.Account || "";
                    const swift = (p.swiftCode || p.SWIFTCode || p.swift || p.SWIFT || "").toString();
                    const amount = p.amount ?? p.Amount ?? "0.00";
                    const currency = p.currency || p.Currency || "ZAR";
                    const status = p.status || p.Status || "Pending";

                    return (
                      <tr key={id || i}>
                        <td style={{ width: 48 }}>{i + 1}</td>

                        <td>
                          <div style={{ fontWeight: 600 }}>{payee}</div>
                          <div className="small text-muted">{p.email || p.payeeEmail || ""}</div>
                        </td>

                        <td>
                          <div className="small">{acct}</div>
                          <div className="small text-muted">{p.bankName || p.bank || ""}</div>
                        </td>

                        <td><strong>{amount}</strong></td>
                        <td>{currency}</td>
                        <td><div style={{ fontFamily: "monospace" }}>{swift}</div></td>

                        <td style={{ minWidth: 170 }}>
                          <div className="mb-1">
                            {p.verifyState === "idle" && <span className="badge bg-secondary">Not verified</span>}
                            {p.verifyState === "verifying" && <span className="badge bg-info">Verifying…</span>}
                            {p.verifyState === "verified" && <span className="badge bg-success">Verified ✓</span>}
                            {p.verifyState === "failed" && <span className="badge bg-danger">Failed</span>}
                            <span className="ms-2 badge bg-light text-dark">{status}</span>
                          </div>

                          {p.verifyError && <div className="small text-danger mt-1">{p.verifyError}</div>}
                        </td>

                        <td className="text-end">
                          {p.verifyState === "idle" && (
                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleVerify(i)}>
                              Verify
                            </button>
                          )}

                          {p.verifyState === "verifying" && (
                            <button className="btn btn-sm btn-outline-secondary" disabled>Verifying…</button>
                          )}

                          {p.verifyState === "verified" && (
                            <>
                              <button className="btn btn-sm btn-success me-2" disabled>Verified</button>
                              <button className="btn btn-sm btn-outline-warning" onClick={() => handleReset(i)}>Reset</button>
                            </>
                          )}

                          {p.verifyState === "failed" && (
                            <>
                              <button className="btn btn-sm btn-outline-danger me-2" onClick={() => handleVerify(i)}>Retry</button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => handleReset(i)}>Reset</button>
                            </>
                          )}

                          {!isAdmin && <div className="small text-muted mt-2">Server verify/process requires Admin.</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

     
    </div>
  );
}
