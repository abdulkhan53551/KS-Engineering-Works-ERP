// src/lib/axios.js
import axios from "axios";
import { store } from "../store";
import { loginSuccess, logout } from "../store/auth.slice";
import { localStorageKey } from "../utilities/constant/constants";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL || "",
    timeout: 10000,
    headers: {
        "Cache-Control": "no-cache"
    },
    withCredentials: true, // 🔑 allow cookies
});

// Attach token automatically
api.interceptors.request.use(
    (config) => {
        // Set Content-Type to application/json for non-FormData requests
        if (!(config.data instanceof FormData)) {
            // Let Axios/browser set multipart/form-data with boundary
            config.headers["Content-Type"] = "application/json";
        }

        const { accessToken } = store.getState().authReducer;
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response: handle 401 and refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response } = error;
        const { dispatch, getState } = store;

        if (response?.status === 401 && !error.config._retry) {
            error.config._retry = true; // avoid infinite loop

            try {
                // 👇 no refresh token in body, cookie gets sent automatically
                const res = await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true } // VERY important
                );

                const newAccessToken = res.data.data.accessToken;

                // Update Redux with new token
                dispatch(
                    loginSuccess({
                        user: getState().authReducer.user,
                        accessToken: newAccessToken,
                    })
                );

                // Update localStorage
                localStorage.setItem(localStorageKey.ACCESS_TOKEN_KEY, newAccessToken);

                // retry original request with new token
                error.config.headers.Authorization = `Bearer ${newAccessToken}`;
                return api.request(error.config);
            } catch (refreshErr) {
                dispatch(logout());
                localStorage.removeItem(localStorageKey.ACCESS_TOKEN_KEY);
                return Promise.reject(refreshErr);
            }
        }

        return Promise.reject(error);
    }
);

export default api;