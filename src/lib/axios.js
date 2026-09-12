// src/lib/axios.js
import axios from "axios";
import { store } from "../store";
import { setAccessToken, logout } from "../store/auth.slice";
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

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response: handle 401 and refresh with queue mutex
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { response } = error;
        const originalRequest = error.config;
        const { dispatch, getState } = store;

        // Skip refresh attempts for auth endpoints
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh-token') ||
            originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register');

        if (response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Refresh token cookie is sent automatically with withCredentials: true
                const res = await axios.post(
                    `${process.env.REACT_APP_API_BASE_URL}/auth/refresh-token`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data?.data?.accessToken;
                if (!newAccessToken) {
                    throw new Error('No access token received from refresh');
                }

                // Update Redux with new access token without resetting user profile
                dispatch(setAccessToken(newAccessToken));

                // Update localStorage
                localStorage.setItem(localStorageKey.ACCESS_TOKEN_KEY, newAccessToken);

                // Flush queue with new token
                processQueue(null, newAccessToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                dispatch(logout());
                localStorage.removeItem(localStorageKey.ACCESS_TOKEN_KEY);
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;