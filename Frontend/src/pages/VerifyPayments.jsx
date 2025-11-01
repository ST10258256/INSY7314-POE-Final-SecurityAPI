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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Verify Pending Payments</h3>
        </div>

        <div className="text-end">
          <button className="btn btn-outline-secondary me-2" onClick={() => window.location.reload()}>Refresh</button>
          <button
            className="btn btn-success"
            disabled={verifiedCount === 0 || submitting}
            onClick={handleProcess}
          >
            {submitting ? "Processing…" : `Process${verifiedCount > 0 ? ` (${verifiedCount})` : ""}`}
          </button>
        </div>
      </div>

      {globalError && <div className="alert alert-danger">{globalError}</div>}

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="p-4 text-center">Loading payments…</div>
          ) : payments.length === 0 ? (
            <div className="p-4 text-center text-muted">No payments found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Payee</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>SWIFT</th>
                    <th>State</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((p, i) => {
                    const id = getPaymentId(p) || i;
                    const payee = p.payeeName || p.name || p.beneficiary || (p.firstName && `${p.firstName} ${p.lastName}`) || "Unknown";
                    const acct = p.accountNumber || p.AccountNumber || p.Account || "-";
                    const swift = (p.swiftCode || p.SWIFTCode || p.swift || p.SWIFT || "").toString() || "-";
                    const amount = p.amount ?? p.Amount ?? p.AmountPaid ?? "-";
                    const currency = p.currency || p.Currency || "ZAR";
                    const status = p.__submitted ? "Processed" : (p.status || p.Status || "Pending");
                    const isVerified = Boolean(p.__verified && !p.__submitted);

                    return (
                      <tr key={id}>
                        <td>{i + 1}</td>

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

                        <td style={{ minWidth: 160 }}>
                          {p.__submitted ? (
                            <span className="badge bg-success">Processed ✓</span>
                          ) : p.__verifying ? (
                            <span className="badge bg-info">Verifying…</span>
                          ) : p.__processing ? (
                            <span className="badge bg-info">Processing…</span>
                          ) : isVerified ? (
                            <span className="badge bg-success">Verified ✓</span>
                          ) : (
                            <span className="badge bg-secondary">{status}</span>
                          )}

                          {p.__verifyError && <div className="small text-danger mt-1">{p.__verifyError}</div>}
                          {p.__processError && <div className="small text-danger mt-1">{p.__processError}</div>}
                        </td>

                        <td className="text-end">
                          {!p.__submitted ? (
                            <button
                              className={`btn btn-sm ${isVerified ? "btn-success" : "btn-outline-primary"}`}
                              onClick={() => handleVerify(i)}
                              disabled={p.__verifying || p.__processing}
                            >
                              {p.__verifying ? "Verifying…" : (isVerified ? "Verified" : "Verify")}
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-outline-secondary" disabled>Processed</button>
                          )}
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

      {/*  */}
      {modal.open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1050,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.45)"
        }}>
          <div style={{ width: 420, borderRadius: 12, background: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: 22 }}>
              <h4 className="mb-2">{modal.title}</h4>
              <p className="mb-3 text-muted">{modal.message}</p>

              {modal.details && modal.details.length > 0 && (
                <div className="mb-3">
                  <strong>Failures:</strong>
                  <ul>
                    {modal.details.map((f, idx) => (
                      <li key={idx}><code>{f.id}</code>: {f.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary" onClick={() => setModal({ open: false, title: "", message: "", details: null })}>Close</button>
                <button className="btn btn-primary" onClick={() => setModal({ open: false, title: "", message: "", details: null })}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
