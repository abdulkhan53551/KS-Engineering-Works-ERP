import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ allowedRoles }) {
    const { isAuthenticated, user } = useSelector((state) => state.authReducer);

    if (!isAuthenticated) {
        return <Navigate to="/sign-in" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
}