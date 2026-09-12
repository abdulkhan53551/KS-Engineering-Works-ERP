import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ allowedRoles }) {
    const location = useLocation();
    const { isAuthenticated, user, isInitializing } = useSelector((state) => state.authReducer);

    // While session is hydrating or user profile is being fetched, show loading spinner
    if (isInitializing || (isAuthenticated && !user)) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
                <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                    <span className="visually-hidden">Loading session...</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/sign-in" state={{ from: location }} replace />;
    }

    // Role check: super-admin has universal access, normalize administrator <=> admin
    if (allowedRoles && user) {
        const userRole = user.role?.toLowerCase();
        const isSuperAdmin = userRole === "super-admin";
        const hasAllowedRole = allowedRoles.some((role) => {
            const normalizedRole = role.toLowerCase();
            if (normalizedRole === "admin" && (userRole === "admin" || userRole === "administrator")) {
                return true;
            }
            return normalizedRole === userRole;
        });

        if (!isSuperAdmin && !hasAllowedRole) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
}