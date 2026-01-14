// src/components/RouteGuards.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useSelector((s) => s.auth);
    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
}

export function RoleRoute({ roles = [], children }) {
    const { isAuthenticated, user, loading } = useSelector((s) => s.auth);
    if (loading) return <div>Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (roles.length && !roles.includes(user?.role)) {
        // If unauthorized, send to home or a 403 page
        return <Navigate to="/" replace />;
    }
    return children;
}
