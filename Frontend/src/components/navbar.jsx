import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { getUserRole } from "../utils/auth"; 
import "bootstrap/dist/js/bootstrap.bundle.min.js";

function hasValidToken() {
  const t = localStorage.getItem("bank_token");
  return Boolean(t && t !== "null" && t !== "undefined");
}

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(hasValidToken());
  const [role, setRole] = useState(getUserRole());

  useEffect(() => {
    setIsLoggedIn(hasValidToken());
    setRole(getUserRole());

    function handleStorage() {
      setIsLoggedIn(hasValidToken());
      setRole(getUserRole());
    }

    window.addEventListener("storage", handleStorage);

    const interval = setInterval(() => {
      const nowLogged = hasValidToken();
      const nowRole = getUserRole();
      setIsLoggedIn(prev => (prev === nowLogged ? prev : nowLogged));
      setRole(prev => (prev === nowRole ? prev : nowRole));
    }, 400);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <NavLink className="navbar-brand" to="/">
          The Group 14 Bank
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {!isLoggedIn ? (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">Register</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
              </>
            ) : (
              <>
              {role === "User" && (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
                </li>
                )}

                {/* All logged-in users */}
                {role === "User" && (
                <li className="nav-item">
                  <NavLink className="nav-link" to="/pay">Make Payment</NavLink>
                </li>
                )}

                {/* Admin only */}
                {role === "Admin" && (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/create-user">Create User</NavLink>
                  </li>
                )}

                {/* Admin & Employee */}
                {( role === "Employee") && (
                  <li className="nav-item">
                    <NavLink className="nav-link" to="/verify-payments">Verify Payments</NavLink>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
