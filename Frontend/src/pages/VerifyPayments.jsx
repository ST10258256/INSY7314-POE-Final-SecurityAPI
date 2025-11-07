import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://insy7314-poe-final-securityapi.onrender.com";

function getPaymentId(p) {
  if (!p) return null;
  if (p.id) return p.id;
  if (typeof p._id === "string") return p._id;
  if (p._id && typeof p._id === "object" && p._id.$oid) return p._id.$oid;
  return null;
}

export default function VerifyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", details: null });

  const navigate = useNavigate();
  const token = localStorage.getItem("bank_token");

  const apiGet = async (path) => {
    return axios.get(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  };

  const apiPatch = async (path, body = {}) => {
    return axios.patch(`${API_BASE}${path}`, body, { headers: { Authorization: `Bearer ${token}` } });
  };

  const friendlyError = (err) => {
    const status = err?.response?.status;
    const serverMsg = err?.response?.data ?? err?.message ?? "Unknown error";
    if (status === 401) return "Unauthorized. Please login again.";
    if (status === 403) return "Forbidden. Your token may not have permission to view all payments.";
    if (status === 404) return "Endpoint not found (404). Check the API route.";
    return typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg);
  };

  const initPayment = (p) => {
    const statusRaw = (p.status || p.Status || "").toString();
    const normalized = statusRaw.trim().toLowerCase();
    const isProcessed = normalized === "processed";
    const isVerifiedServer = normalized === "verified";

    return {
      ...p,
      __verified: isVerifiedServer && !isProcessed,
      __submitted: isProcessed,
      __verifying: false,
      __processing: false,
      __verifyError: null,
      __processError: null,
    };
  };

  const updatePaymentAt = (index, patch) =>
    setPayments(prev => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      setGlobalError(null);
      try {
        const resp = await apiGet("/api/admin/adminpayments");
        const data = Array.isArray(resp.data) ? resp.data : (resp.data?.payments ?? resp.data ?? []);
        const mapped = (data || []).map(initPayment);
        if (mounted) setPayments(mapped);
      } catch (err) {
        console.error("Failed to load payments:", err);
        setGlobalError(friendlyError(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => { mounted = false; };
  }, [token, navigate]);

  async function handleVerify(index) {
    updatePaymentAt(index, { __verifying: true, __verifyError: null });

    const p = payments[index];
    if (!p) {
      updatePaymentAt(index, { __verifying: false, __verifyError: "Payment not found" });
      return;
    }

    if (p.__submitted) {
      updatePaymentAt(index, { __verifying: false, __verifyError: "Already processed" });
      return;
    }

    const id = getPaymentId(p);
    if (!id) {
      updatePaymentAt(index, { __verifying: false, __verifyError: "Missing payment id" });
      return;
    }

    try {
      await apiPatch(`/api/admin/adminpayments/${id}/verify`);
      updatePaymentAt(index, {
        __verifying: false,
        __verified: true,
        __verifyError: null,
        status: "Verified"
      });
    } catch (err) {
      console.error("Verify failed:", err);
      updatePaymentAt(index, {
        __verifying: false,
        __verifyError: friendlyError(err)
      });
    }
  }

  async function handleProcess() {
    const targets = payments.map((p, i) => ({ p, i })).filter(x => x.p.__verified && !x.p.__submitted);

    if (targets.length === 0) {
      alert("No verified payments selected. Verify at least one before processing.");
      return;
    }
    if (!window.confirm(`Process ${targets.length} verified payment(s)?`)) return;

    setSubmitting(true);
    setGlobalError(null);

    setPayments(prev => prev.map(p => (p.__verified && !p.__submitted ? { ...p, __processing: true, __processError: null } : p)));

    const promises = targets.map(({ p, i }) => {
      const id = getPaymentId(p);
      const path = `/api/admin/adminpayments/${id}/process`;
      return apiPatch(path)
        .then(resp => ({ index: i, ok: true, resp }))
        .catch(err => ({ index: i, ok: false, err }));
    });

    const results = await Promise.all(promises);

    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    setPayments(prev => {
      const copy = [...prev];
      results.forEach(r => {
        const idx = r.index;
        if (r.ok) {
          successCount++;
          copy[idx] = {
            ...copy[idx],
            __processing: false,
            __submitted: true,
            __verified: false,
            __processError: null,
            status: "Processed"
          };
        } else {
          failureCount++;
          const serverMsg = r?.err?.response?.data ?? r?.err?.message ?? "Process failed";
          const msg = typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg);
          copy[idx] = {
            ...copy[idx],
            __processing: false,
            __processError: msg
          };
          failures.push({ index: idx, id: getPaymentId(copy[idx]), message: msg });
        }
      });
      return copy;
    });

    if (failureCount === 0) {
      setModal({
        open: true,
        title: "Thanks — Sent to SWIFT",
        message: `Successfully processed ${successCount} payment(s).`,
        details: null
      });
    } else {
      setModal({
        open: true,
        title: "Partial failure",
        message: `Processed ${successCount} payment(s). ${failureCount} failed.`,
        details: failures
      });
    }

    setSubmitting(false);
  }

  const verifiedCount = payments.filter(p => p.__verified && !p.__submitted).length;

  return (
    <div className="container">
      <div className="card" style={{ padding: 18 }}>
        <div className="d-flex align-items-center" style={{ justifyContent: "space-between", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Verify Pending Payments</h3>
            <div className="muted" style={{ marginTop: 6 }}>Review and send verified payments to SWIFT</div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn-outline-secondary"
              onClick={() => window.location.reload()}
              style={{ minWidth: 92 }}
            >
              Refresh
            </button>

            <button
              className="btn-primary"
              disabled={verifiedCount === 0 || submitting}
              onClick={handleProcess}
              style={{ minWidth: 140 }}
            >
              {submitting ? "Processing…" : `Process${verifiedCount > 0 ? ` (${verifiedCount})` : ""}`}
            </button>
          </div>
        </div>

        {globalError && (
          <div style={{ marginTop: 14 }}>
            <div className="error">{globalError}</div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="muted">Loading payments…</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="card" style={{ padding: 18 }}>
              <div className="muted">No payments found.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              {/* Make table text default to white using the theme token */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: 6,
                  color: "var(--text)" // <-- changed: ensure list text is white
                }}
              >
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--text)" /* header white too */ }}>
                    <th style={{ padding: "12px 8px" }}>Amount</th>
                    <th style={{ padding: "12px 8px" }}>Currency</th>
                    <th style={{ padding: "12px 8px" }}>SWIFT code</th>
                    <th style={{ padding: "12px 8px" }}>Beneficiary account number</th>
                    <th style={{ padding: "12px 8px" }}>Reference (optional)</th>
                    <th style={{ padding: "12px 8px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((p, i) => {
                    const id = getPaymentId(p) || i;
                    const amount = p.amount ?? p.Amount ?? p.AmountPaid ?? "-";
                    const currency = p.currency || p.Currency || "ZAR"; // default to ZAR if missing
                    const swift = (p.swiftCode || p.SWIFTCode || p.swift || p.SWIFT || "").toString() || "-";
                    // beneficiary account number - check common variants
                    const acct = p.accountNumber || p.AccountNumber || p.Account || p.beneficiaryAccount || p.beneficiary_acct || "-";
                    // reference - many possible keys
                    const reference =
                      p.reference ||
                      p.referenceNumber ||
                      p.paymentReference ||
                      p.description ||
                      p.narrative ||
                      p.ref ||
                      p.Remarks ||
                      p.remark ||
                      p.payment_note ||
                      "";

                    const status = p.__submitted ? "Processed" : (p.status || p.Status || "Pending");
                    const isVerified = Boolean(p.__verified && !p.__submitted);
                    const rowBg = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)";

                    return (
                      <tr key={id} style={{ background: rowBg }}>
                        <td style={{ padding: "12px 8px", verticalAlign: "top", color: "var(--text)" }}>
                          <strong>{amount}</strong>
                        </td>

                        <td style={{ padding: "12px 8px", verticalAlign: "top", color: "var(--text)" }}>
                          <div>{currency}</div>
                        </td>

                        <td style={{ padding: "12px 8px", verticalAlign: "top", color: "var(--text)" }}>
                          <div style={{ fontFamily: "monospace" }}>{swift}</div>
                        </td>

                        <td style={{ padding: "12px 8px", verticalAlign: "top", color: "var(--text)" }}>
                          {/* beneficiary should be white now */}
                          <div>{acct}</div>
                        </td>

                        <td style={{ padding: "12px 8px", verticalAlign: "top", color: "var(--text)" }}>
                          <div>
                            {reference ? (
                              reference
                            ) : (
                              <span style={{ color: "var(--placeholder-light)" }}>—</span>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: "12px 8px", textAlign: "right", verticalAlign: "top", minWidth: 120 }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
                            {p.__submitted ? (
                              <span className="badge completed">Processed ✓</span>
                            ) : p.__verifying ? (
                              <span className="badge pending">Verifying…</span>
                            ) : p.__processing ? (
                              <span className="badge pending">Processing…</span>
                            ) : isVerified ? (
                              <span className="badge completed">Verified ✓</span>
                            ) : (
                              <span className="badge pending">{status}</span>
                            )}

                            {!p.__submitted ? (
                              <button
                                className={isVerified ? "btn-primary" : "btn-outline-secondary"}
                                onClick={() => handleVerify(i)}
                                disabled={p.__verifying || p.__processing}
                                style={{ padding: "8px 12px", minWidth: 86 }}
                              >
                                {p.__verifying ? "Verifying…" : (isVerified ? "Verified" : "Verify")}
                              </button>
                            ) : (
                              <button className="btn-outline-secondary" disabled style={{ opacity: 0.7 }}>Processed</button>
                            )}
                          </div>

                          {p.__verifyError && <div style={{ color: "var(--accent)", marginTop: 8 }}>{p.__verifyError}</div>}
                          {p.__processError && <div style={{ color: "#ff8a8a", marginTop: 8 }}>{p.__processError}</div>}
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

      {modal.open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1050,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.45)"
        }}>
          <div style={{ width: 420 }}>
            <div className="card" style={{ borderRadius: 12, padding: 20 }}>
              <h4 style={{ marginTop: 0 }}>{modal.title}</h4>
              <p style={{ marginTop: 6, color: "var(--text)" }}>{modal.message}</p>

              {modal.details && modal.details.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <strong>Failures:</strong>
                  <ul style={{ marginTop: 8 }}>
                    {modal.details.map((f, idx) => (
                      <li key={idx}><code style={{ fontFamily: "monospace", color: "var(--text)" }}>{f.id}</code>: <span style={{ marginLeft: 6, color: "var(--text)" }}>{f.message}</span></li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
                <button className="btn-outline-secondary" onClick={() => setModal({ open: false, title: "", message: "", details: null })}>Close</button>
                <button className="btn-primary" onClick={() => setModal({ open: false, title: "", message: "", details: null })}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
