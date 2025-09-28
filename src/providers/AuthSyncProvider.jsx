// In your App.jsx or index.js (where Redux Provider is wrapped)
import { useEffect } from "react";
import { useDispatch } from "react-redux";
// import { setAuthState } from "./store    /auth.slice";
import { loginSuccess, logout } from "../store/auth.slice";
import { router } from "..";
import { asyncHandler } from "../utilities/asyncHandler";
import { requestMethod } from "../utilities/api/constants";
import api from "../lib/axios";
import { localStorageKey } from "../utilities/constant/constants";

export const AuthSyncProvider = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        const handleStorageChange = async (event) => {
            if (event.key === localStorageKey.ACCESS_TOKEN_KEY) {
                // Verify token
                const accessToken = event.newValue ? event.newValue : null;
                const isTokenVerify = await verifyAccessToken(accessToken);

                try {
                    if (isTokenVerify) {
                        const newAuth = {
                            user: {
                                role: 'admin'
                            },
                            accessToken: accessToken
                        }

                        dispatch(loginSuccess(newAuth));
                        router.navigate("/dashboard", { replace: true });
                    } else {
                        dispatch(logout());
                        localStorage.removeItem("accessToken");
                    }
                } catch (error) {
                    console.log("Error parsing authState from localStorage:", error);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [dispatch]);

    // Verify Access Token with backend
    const verifyAccessToken = asyncHandler(async (token) => {
        try {
            if (token) {
                // validate with backend
                const res = await api.request({
                    url: '/auth/verify-access-token',
                    method: requestMethod.POST,
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.data.success) {
                    return res.data.success || false;
                }
            }

            return false;
        } catch (error) {
            return false;
        }
    })

    return (
        <>{children}</>
    );
}