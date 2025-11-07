import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCustomer } from "../api";
import * as validation from "../utils/validation";
import PropTypes from "prop-types";

function Field({ label, name, type = "text", placeholder = "", value, onChange }) {
  return (
    <div className="col-md-6">
      <label htmlFor={name} className="form-label small">{label}</label>
      <input
        name={name}
        type={type}
        className="form-control"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
//
Field.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
};

export default function CreateUser() {
  const initial = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    idNumber: "",
    accountNumber: "",
    password: "",
  };

  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value } = e.target;
    const sanitizedValue = validation.sanitizeInput(value);
    setForm(prev => ({ ...prev, [name]: sanitizedValue }));
  }

  const validationRules = [
    { field: "firstName", kind: "fullName", message: "Invalid first name — 2-20 letters." },
    { field: "lastName", kind: "fullName", message: "Invalid last name — 2-20 letters." },
    { field: "username", kind: "username", message: "Invalid username — 3-20 characters." },
    { field: "email", kind: "email", message: "Invalid email address." },
    { field: "idNumber", kind: "idNumber", message: "Invalid ID number — 6-13 digits." },
    { field: "accountNumber", kind: "accountNumber", message: "Invalid account number — 5-15 digits." },
    { field: "password", kind: "password", message: "Invalid password — 8+ characters." },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    for (const rule of validationRules) {
      const value = form[rule.field];
      if (!validation.validateInput(value, rule.kind)) {
        setError(rule.message);
        setLoading(false);
        return;
      }
    }

    try {
      // force role to Title-case "Employee"
      const payload = { ...form, role: "Employee" };
      console.log("CreateUser payload ->", payload);

      // await the API call but don't assign to an unused variable
      await registerCustomer(payload);

      setSuccess(`User created successfully `);
      setError("");
      setForm(initial);
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
            <small className="text-muted">This page creates users with the <strong>Employee</strong> role</small>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="row g-2">
              <Field label="First Name" name="firstName" placeholder="John" value={form.firstName} onChange={onChange} />
              <Field label="Last Name" name="lastName" placeholder="Doe" value={form.lastName} onChange={onChange} />
            </div>

            <div className="row g-2 mt-2">
              <Field label="Username" name="username" placeholder="username" value={form.username} onChange={onChange} />
              <Field label="Email" name="email" type="email" placeholder="you@example.com" value={form.email} onChange={onChange} />
            </div>

            <div className="row g-2 mt-2">
              <Field label="ID Number" name="idNumber" placeholder="ID Number" value={form.idNumber} onChange={onChange} />
              <Field label="Account Number" name="accountNumber" placeholder="Account number" value={form.accountNumber} onChange={onChange} />
            </div>

            <div className="row g-2 mt-2 align-items-end">
              <Field label="Password" name="password" type="password" placeholder="Choose a password" value={form.password} onChange={onChange} />
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
