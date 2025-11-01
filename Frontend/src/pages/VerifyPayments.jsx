import { jwtDecode } from "jwt-decode";
import axios from "axios";
import React, { useEffect, useState } from "react";

export default function VerifyPayments() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  const API_URL = "https://securityapi-x4rg.onrender.com/api/admin/adminpayments";


  useEffect(() => {
    const token = localStorage.getItem("bank_token");

    if (!token) {
      setError("No authentication token found.");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log("Decoded token:", decoded);

      const role =
        decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

      if (!role || role !== "Admin") {
        setError("Your account role is invalid or missing. Cannot fetch payments.");
        return;
      }

      axios
        .get(`${API_URL}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => setPayments(response.data))
        .catch((err) => {
          console.error("Failed to load payments:", err);
          setError("Failed to load payments. Check console for details.");
        });
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      setError("Invalid token format.");
    }
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!payments.length) return <div>Loading payments...</div>;

  return (
    <div>
      <h2>Verified Payments</h2>
      <ul>
        {payments.map((p) => (
          <li key={p.id}>
            {p.amount} — {p.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
