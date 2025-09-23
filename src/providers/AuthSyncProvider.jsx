// In your App.jsx or index.js (where Redux Provider is wrapped)
import { useEffect } from "react";
import { useDispatch } from "react-redux";
// import { setAuthState } from "./store    /auth.slice";
import { loginSuccess, logout } from "../store/auth.slice";
import { router } from "..";

export const AuthSyncProvider = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === "authState") {
                const newAuthState = event.newValue ? JSON.parse(event.newValue) : null;

                try {
                    if (newAuthState?.isAuthenticated) {
                        dispatch(loginSuccess(newAuthState));
                        // window.location.replace("/dashboard"); // works outside RouterProvider
                        // navigate("/dashboard", { replace: true });
                        router.navigate("/dashboard", { replace: true });
                    } else {
                        dispatch(logout());
                    }
                } catch (error) {
                    console.log("Error parsing authState from localStorage:", error);

                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [dispatch]);

    return (
        <>{children}</>
    );
}