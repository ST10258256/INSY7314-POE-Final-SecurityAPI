import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCustomer } from "../api";
import * as validation from "../utils/validation";

export default function CreateUser() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    idNumber: "",
    accountNumber: "",
    password: "",
    role: "Employee", 
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    const sanitizedValue = validation.sanitizeInput(value);
    setForm(prev => ({ ...prev, [name]: sanitizedValue }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

   
    if (!validation.validateInput(form.firstName, "fullName")) {
      setError("Invalid first name — 2-20 letters, no numbers/special characters.");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.lastName, "fullName")) {
      setError("Invalid last name — 2-20 letters, no numbers/special characters.");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.username, "username")) {
      setError("Invalid username — 3-20 characters, no special characters.");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.email, "email")) {
      setError("Invalid email address.");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.idNumber, "idNumber")) {
      setError("Invalid ID number — 6-13 digits.");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.accountNumber, "accountNumber")) {
      setError("Invalid account number — 5-15 digits.");
      setLoading(false);
      return;
    }
    if (!validation.validateInput(form.password, "password")) {
      setError("Invalid password — 8-20 characters, safe symbols allowed.");
      setLoading(false);
      return;
    }

   
    const allowedRoles = ["Admin", "User", "Employee"];
    if (!allowedRoles.includes(form.role)) {
      setError("Invalid role selected.");
      setLoading(false);
      return;
    }

    try {
     
      const payload = { ...form };
      const res = await registerCustomer(payload);

      setSuccess("User created successfully.");
      setError("");

      if (res?.user) {
      
      }

   
      setForm(prev => ({ ...prev, password: "", username: "", email: "", idNumber: "", accountNumber: "", firstName: "", lastName: "" }));

    } catch (err) {
      const msg = err?.response?.data || err?.message || "Failed to create user";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
      <div className="card shadow-lg" style={{ maxWidth: 700, width: "100%", borderRadius: 12 }}>
        <div className="card-body p-4">
          <div className="mb-3 text-center">
            <h3 className="mb-0">Create user</h3>
            <small className="text-muted">Create new Admin / Employee or User</small>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label small">First Name</label>
                <input name="firstName" className="form-control" placeholder="John" value={form.firstName} onChange={onChange} />
              </div>

              <div className="col-md-6">
                <label className="form-label small">Last Name</label>
                <input name="lastName" className="form-control" placeholder="Doe" value={form.lastName} onChange={onChange} />
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col-md-6">
                <label className="form-label small">Username</label>
                <input name="username" className="form-control" placeholder="username" value={form.username} onChange={onChange} />
              </div>

              <div className="col-md-6">
                <label className="form-label small">Email</label>
                <input name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={onChange} />
              </div>
            </div>

            <div className="row g-2 mt-2">
              <div className="col-md-6">
                <label className="form-label small">ID Number</label>
                <input name="idNumber" className="form-control" placeholder="ID Number" value={form.idNumber} onChange={onChange} />
              </div>

              <div className="col-md-6">
                <label className="form-label small">Account Number</label>
                <input name="accountNumber" className="form-control" placeholder="Account number" value={form.accountNumber} onChange={onChange} />
              </div>
            </div>

            <div className="row g-2 mt-2 align-items-end">
              <div className="col-md-6">
                <label className="form-label small">Password</label>
                <input type="password" name="password" className="form-control" placeholder="Choose a password" value={form.password} onChange={onChange} />
              </div>

              <div className="col-md-6">
                <label className="form-label small">Role</label>
                <select name="role" className="form-select" value={form.role} onChange={onChange}>
                  <option>Admin</option>
                  <option>User</option>
                  <option>Employee</option>
                </select>
              </div>
            </div>

            <div className="mt-3 d-flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create User"}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/dashboard")}>
                Back to dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

