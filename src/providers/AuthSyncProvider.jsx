import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess, logout, setInitialized } from "../store/auth.slice";
import { setUserFirms, clearFirmState } from "../store/firm.slice";
import api from "../lib/axios";
import { localStorageKey } from "../utilities/constant/constants";

export const AuthSyncProvider = ({ children }) => {
    const dispatch = useDispatch();

    useEffect(() => {
        let isMounted = true;

        const hydrateSession = async () => {
            const storedToken = localStorage.getItem(localStorageKey.ACCESS_TOKEN_KEY);

            try {
                // Fetch current user from /auth/me
                // If token expired, axios interceptor will silently refresh using HTTP-only cookie
                const config = storedToken ? { headers: { Authorization: `Bearer ${storedToken}` } } : undefined;
                const res = await api.get("/auth/me", config);
                const user = res.data?.data?.user;
                const firms = res.data?.data?.firms;

                if (isMounted && user) {
                    const activeToken = localStorage.getItem(localStorageKey.ACCESS_TOKEN_KEY) || storedToken;
                    dispatch(loginSuccess({ user, accessToken: activeToken }));
                    if (firms && firms.length > 0) {
                        dispatch(setUserFirms(firms));
                    }
                } else if (isMounted) {
                    dispatch(setInitialized());
                }
            } catch (error) {
                if (isMounted) {
                    dispatch(logout());
                    dispatch(clearFirmState());
                    localStorage.removeItem(localStorageKey.ACCESS_TOKEN_KEY);
                    dispatch(setInitialized());
                }
            }
        };

        hydrateSession();

        const handleStorageChange = async (event) => {
            if (event.key === localStorageKey.ACCESS_TOKEN_KEY) {
                const newAccessToken = event.newValue;

                if (newAccessToken) {
                    try {
                        const res = await api.get("/auth/me", {
                            headers: { Authorization: `Bearer ${newAccessToken}` }
                        });
                        const user = res.data?.data?.user;
                        if (user) {
                            dispatch(loginSuccess({ user, accessToken: newAccessToken }));
                        }
                    } catch (err) {
                        dispatch(logout());
                    }
                } else {
                    dispatch(logout());
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            isMounted = false;
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [dispatch]);

    return <>{children}</>;
};