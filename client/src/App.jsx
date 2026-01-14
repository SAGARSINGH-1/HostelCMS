import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import { useDispatch, useSelector } from "react-redux";
import { loadUser, logout } from "./store/authSlice";
import Queries from "./pages/Queries";
import QueryDetail from "./pages/QueryDetail";
import FacultyStats from "./pages/FacultyStats";
import FacultyDashboard from "./pages/FacultyDashboard";
import Creator from "./pages/Creator";
import About from "./pages/About";
import { ProtectedRoute, RoleRoute } from "./components/RouteGuards";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={() => dispatch(logout())} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
        <Route path="/creator" element={<Creator />} />
        <Route path="/about" element={<About />} />
        <Route path="/settings" element={<Settings />} />

        {/* Auth users (both roles) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queries"
          element={
            <ProtectedRoute>
              <Queries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queries/:id"
          element={
            <ProtectedRoute>
              <QueryDetail />
            </ProtectedRoute>
          }
        />

        {/* Faculty-only */}
        <Route
          path="/faculty/stats"
          element={
            <RoleRoute roles={["faculty"]}>
              <FacultyStats />
            </RoleRoute>
          }
        />
        <Route
          path="/faculty/dashboard"
          element={
            <RoleRoute roles={["faculty"]}>
              <FacultyDashboard />
            </RoleRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
