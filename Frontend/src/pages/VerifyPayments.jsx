import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://insy7314-poe-final-securityapi.onrender.com";

export default function VerifyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("bank_token");
  const rawUser = localStorage.getItem("bank_user");

  let parsedUser = null;
  try { parsedUser = rawUser ? JSON.parse(rawUser) : null; } catch { parsedUser = null; }

  const role = parsedUser?.role || parsedUser?.["https://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  // const isAdmin = role === "Admin";
  const isAdmin = true;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchPayments() {
      setLoading(true);
      setGlobalError(null);

      // Determine correct endpoint
      let url = "";
      if (isAdmin) {
        // Admin endpoint
        url = `${API_BASE}/api/admin/adminpayments`;
      } else if (role === "User") {
        // User endpoint
        url = `${API_BASE}/api/payments`;
      } else {
        setGlobalError("Your account role is invalid or missing. Cannot fetch payments.");
        setLoading(false);
        return;
      }

      try {
        const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = Array.isArray(resp.data) ? resp.data : (resp.data?.payments ?? resp.data ?? []);
        const mapped = data.map(p => ({ ...p, verifyState: "idle", verifyError: "" }));
        setPayments(mapped);
      } catch (err) {
        console.error("Failed to load payments:", err);

        const status = err?.response?.status;
        if (status === 401) setGlobalError("Unauthorized (401). Please login again.");
        else if (status === 403) setGlobalError("Forbidden (403). You do not have permission to view these payments.");
        else if (status === 404) setGlobalError("Endpoint not found (404). Check the API route.");
        else setGlobalError(`Error ${status ?? ""}: ${err?.message ?? "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [token, navigate, role, isAdmin]);

  return (
    <div className="container py-4">
      {globalError && <div className="alert alert-danger">{globalError}</div>}
      {loading && <div>Loading payments…</div>}
      {!loading && !globalError && <div>{payments.length} payments loaded.</div>}
    </div>
  );
}
