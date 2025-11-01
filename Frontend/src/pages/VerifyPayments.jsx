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
  const [error, setError] = useState(null);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("bank_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    let mounted = true;
    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        const resp = await axios.get(`${API_BASE}/api/admin/adminpayments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = Array.isArray(resp.data) ? resp.data : (resp.data?.payments ?? resp.data ?? []);
        
        const mapped = (data || []).map(p => ({
          ...p,
          __verified: false,      
          __submitted: false,     
        }));
        if (mounted) setPayments(mapped);
      } catch (err) {
        console.error("Failed to load payments:", err);
        const status = err?.response?.status;
        if (status === 401) setError("Unauthorized. Please log in again.");
        else if (status === 403) setError("Forbidden. Your account may not have permission to view all payments.");
        else if (status === 404) setError("Endpoint not found (404). Check the API route.");
        else setError(err?.response?.data ?? err?.message ?? "Failed to load payments.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => { mounted = false; };
  }, [token, navigate]);

  function toggleVerify(index) {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, __verified: !p.__verified } : p));
  }

  function handleSubmitToSwift() {
    const count = payments.filter(p => p.__verified && !p.__submitted).length;
    if (count === 0) {
      alert("No verified payments selected. Verify at least one before submitting.");
      return;
    }

    
    setShowThanksModal(true);

    
    setPayments(prev =>
      prev.map(p => (p.__verified && !p.__submitted ? { ...p, __submitted: true } : p))
    );
  }

  const verifiedCount = payments.filter(p => p.__verified && !p.__submitted).length;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">Verify Pending Payments</h3>
          <small className="text-muted">Check SWIFT codes, mark rows Verified, then Submit to SWIFT.</small>
        </div>

        <div className="text-end">
          <button className="btn btn-outline-secondary me-2" onClick={() => window.location.reload()}>Refresh</button>
          <button
            className="btn btn-success"
            disabled={verifiedCount === 0}
            onClick={handleSubmitToSwift}
          >
            {`Submit to SWIFT${verifiedCount > 0 ? ` (${verifiedCount})` : ""}`}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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
                    const status = p.__submitted ? "Submitted to SWIFT" : (p.status || p.Status || "Pending");
                    const verified = Boolean(p.__verified && !p.__submitted);

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
                            <span className="badge bg-success">Submitted ✓</span>
                          ) : verified ? (
                            <span className="badge bg-success">Verified ✓</span>
                          ) : (
                            <span className="badge bg-secondary">{status}</span>
                          )}
                        </td>

                        <td className="text-end">
                          {!p.__submitted ? (
                            <button
                              className={`btn btn-sm ${verified ? "btn-success" : "btn-outline-primary"}`}
                              onClick={() => toggleVerify(i)}
                            >
                              {verified ? "Verified" : "Verify"}
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-outline-secondary" disabled>Submitted</button>
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

      {/* simple modal / popup */}
      {showThanksModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1050,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.45)"
        }}>
          <div style={{ width: 380, borderRadius: 12, background: "#fff", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: 22 }}>
              <h4 className="mb-2">Thanks — Sent to SWIFT</h4>
              <p className="mb-3 text-muted">Your verified payment(s) have been marked as submitted. The UI task is complete.</p>

              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowThanksModal(false)}
                >
                  Close
                </button>

                <button
                  className="btn btn-primary"
                  onClick={() => setShowThanksModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
