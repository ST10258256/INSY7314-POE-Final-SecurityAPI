// src/pages/VerifyPayments.jsx
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
        // main admin endpoint that returns all payments
        const resp = await axios.get(`${API_BASE}/api/admin/adminpayments`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = Array.isArray(resp.data) ? resp.data : (resp.data?.payments ?? resp.data ?? []);
        if (mounted) setPayments(data);
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

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-0">All Payments</h3>
          <small className="text-muted">Fetched from the backend (admin endpoint).</small>
        </div>

        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => window.location.reload()}>
            Refresh
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
                    <th>Status</th>
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
                    const status = p.status || p.Status || p.paymentStatus || "Pending";

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
                        <td><span className={`badge ${status === "Completed" || status === "Processed" ? "bg-success" : "bg-secondary"}`}>{status}</span></td>
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
