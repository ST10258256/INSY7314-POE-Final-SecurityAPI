import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCustomer } from "../api";
import * as validation from "../utils/validation"; 

export default function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    idNumber: "",
    accountNumber: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    const sanitizedValue = validation.sanitizeInput(e.target.value);
    setForm(prev => ({ ...prev, [e.target.name]: sanitizedValue }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Frontend validation using your patterns
    if (!validation.validateInput(form.firstName, "fullName")) {
      setError("Invalid first name, must be between 2-20 characters with no numbers or special characters");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.lastName, "fullName")) {
      setError("Invalid last name, must be between 2-20 characters with no numbers or special characters");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.username, "username")) {
      setError("Invalid username, must be between 3-20 characters with no special characters");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.email, "email")) {
      setError("Invalid email address, Please enter a valid one");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.idNumber, "idNumber")) {
      setError("Invalid ID number Must be between 6-13 characters, only numbers are allowed");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.accountNumber, "accountNumber")) {
      setError("Invalid account number, must be between 5-15 characters, only numbers are allowed");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.password, "password")) {
      setError("Invalid password, Password must be 8-20 characters and may contain safe symbols");
      setLoading(false);
      return;
    }

    try {
      const res = await registerCustomer({ ...form });
      setSuccess("Registered successfully! Redirecting...");

      if (res?.user) localStorage.setItem("bank_user", JSON.stringify(res.user));
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
      <div className="card shadow-lg" style={{ maxWidth: 600, width: "100%", borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="mb-3 text-center">
            <h3 className="mb-0">Create an account</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">
                  First Name
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  placeholder="John"
                  value={form.firstName}
                  onChange={onChange}
                />
                </label>
                
              </div>

              <div className="col-md-6">
                <label className="form-label small">
                  Last Name
                  <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={onChange}
                  />
                </label>
                
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col-md-6">
                <label className="form-label small">
                  Username
                  <input
                  type = "text"
                  name="username"
                  className="form-control"
                  placeholder="username"
                  value={form.username}
                  onChange={onChange}
                />
                </label>
                
              </div>

              <div className="col-md-6">
                <label className="form-label small">
                  Email
                  <input
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                />
                </label>
                
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col-md-6">
                <label className="form-label small">
                  ID Number
                  <input
                  type = "text"
                  name="idNumber"
                  className="form-control"
                  placeholder="ID Number"
                  value={form.idNumber}
                  onChange={onChange}
                />
                </label>
                
              </div>

              <div className="col-md-6">
                <label className="form-label small">
                  Account Number
                  <input
                  type = "text"
                  name="accountNumber"
                  className="form-control"
                  placeholder="Account number"
                  value={form.accountNumber}
                  onChange={onChange}
                />
                </label>
                
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col-md-6">
                <label className="form-label small">
                  Password
                  <input
                  type="password"
                  name="password"
                  className="form-control"
                  placeholder="Choose a password"
                  value={form.password}
                  onChange={onChange}
                />
                  </label>
                
              </div>
            </div>

            {error && <div className="alert alert-danger mt-3 py-2">{error}</div>}
            {success && <div className="alert alert-success mt-3 py-2">{success}</div>}

            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Creating account…" : "Register"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/login")}
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
