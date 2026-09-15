import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import usePermission from "../hooks/usePermission";

export default function ProtectedRoute({ allowedRoles, module: moduleName, action = "read", children }) {
    const location = useLocation();
    const { isAuthenticated, user, isInitializing } = useSelector((state) => state.authReducer);
    const { can, isSuperAdmin } = usePermission();

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

    // Universal bypass for Super Admin
    if (!isSuperAdmin) {
        // 1. Role-based check if specified
        if (allowedRoles && user) {
            const userRole = user.role?.toLowerCase();
            const hasAllowedRole = allowedRoles.some((role) => {
                const normalizedRole = role.toLowerCase();
                if (normalizedRole === "admin" && (userRole === "admin" || userRole === "administrator")) {
                    return true;
                }
                return normalizedRole === userRole;
            });

            if (!hasAllowedRole) {
                return <Navigate to="/unauthorized" replace />;
            }
        }

        // 2. Granular Module + Action permission check if specified
        if (moduleName) {
            if (!can(moduleName, action)) {
                return <Navigate to="/unauthorized" replace />;
            }
        }
    }

    return children ? children : <Outlet />;
}