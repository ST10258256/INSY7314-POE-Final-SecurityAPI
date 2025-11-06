import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCustomer } from "../api";
import * as validation from "../utils/validation";

function Field({ label, name, type = "text", placeholder = "", value, onChange, options }) {
  return (
    <div className="col-md-6">
      <label className="form-label small">{label}</label>
      {options ? (
        <select name={name} className="form-select" value={value} onChange={onChange}>
          {/* added a disabled prompt option so the select never yields an empty/undefined value by accident */}
          <option value="" disabled>
            Select role
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          type={type}
          className="form-control"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

export default function CreateUser() {
  const initial = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    idNumber: "",
    accountNumber: "",
    password: "",
    role: "Employee",
  };

  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function onChange(e) {
    const { name, value, type } = e.target;
    const isSelect = e.target.tagName === "SELECT" || type === "select-one";
    const newValue = isSelect ? String(value) : validation.sanitizeInput(value);
    setForm((prev) => ({ ...prev, [name]: newValue }));
  }

  const validationRules = [
    { field: "firstName", kind: "fullName", message: "Invalid first name — 2-20 letters, no numbers/special characters." },
    { field: "lastName", kind: "fullName", message: "Invalid last name — 2-20 letters, no numbers/special characters." },
    { field: "username", kind: "username", message: "Invalid username — 3-20 characters, no special characters." },
    { field: "email", kind: "email", message: "Invalid email address." },
    { field: "idNumber", kind: "idNumber", message: "Invalid ID number — 6-13 digits." },
    { field: "accountNumber", kind: "accountNumber", message: "Invalid account number — 5-15 digits." },
    { field: "password", kind: "password", message: "Invalid password — 8-20 characters, safe symbols allowed." },
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

    const allowedRoles = ["Admin", "User", "Employee"];
    // force role to be a trimmed string, fallback to initial.role
    const finalRole = String(form.role ?? "").trim() || initial.role;

    if (!allowedRoles.includes(finalRole)) {
      setError("Invalid role selected.");
      setLoading(false);
      return;
    }

    try {
      const payload = { ...form, role: finalRole };

      // debug: inspect the payload in console and then check Network tab to confirm
      // remove this console.log when you're done debugging
      // (this will help confirm whether the client is sending role=null or the server is changing it)
      // eslint-disable-next-line no-console
      console.log("CreateUser payload ->", payload);

      await registerCustomer(payload);
      setSuccess("User created successfully.");
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
            <small className="text-muted">Create new Admin / Employee or User</small>
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
              <Field
                label="Role"
                name="role"
                options={["Admin", "User", "Employee"]}
                value={form.role}
                onChange={onChange}
              />
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
