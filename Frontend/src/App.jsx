import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar";

// Post pages are kept in repository but their imports/routes are commented out.
// Uncomment the imports and routes below to re-enable them.
// import PostList from "./components/PostList";
// import PostCreate from "./components/PostCreate";
// import PostEdit from "./components/PostEdit";

import Register from "./components/register";
import Login from "./components/login";
import ForgotPassword from "./pages/ForgotPassword";
//import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import PaymentForm from "./pages/PaymentForm";
import ProtectedRoute from "./routes/ProtectedRoute";
import CreateUser from "./pages/CreateUser";
import VerifyPayments from "./pages/VerifyPayments";

export default function App() {
  return (
    <div>
      <Navbar />
      <main className="container my-4">
        <Routes>
          {/* Post routes are commented out to hide them without removing files */}
          {/*
            <Route path="/" element={<PostList />} />
            <Route path="/create" element={<PostCreate />} />
            <Route path="/edit/:id" element={<PostEdit />} />
          */}

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* <Route path="/reset-password/:token" element={<ResetPassword />} /> */} 
          <Route path="/create-user" element={<CreateUser />} />
          <Route path="/verify-payments" element={<VerifyPayments />} />
          <Route
            path="/verify-payments"
            element={
              <ProtectedRoute>
                <VerifyPayments />
              </ProtectedRoute>
            }
          />
           <Route
            path="/create-user"
            element={
              <ProtectedRoute>
                <CreateUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pay"
            element={
              <ProtectedRoute>
                <PaymentForm />
              </ProtectedRoute>
            }
          />

          {/* Set root to Login so users land on the authentication page */}
          <Route path="/" element={<Login />} />

          <Route path="*" element={<h2>404 - Not Found</h2>} />
        </Routes>
      </main>
    </div>
  );
}


