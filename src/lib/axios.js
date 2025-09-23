// src/lib/axios.js
import axios from "axios";
import { store } from "../store";
import { loginSuccess, logout } from "../store/auth.slice";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "",
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
});

// Attach token automatically
api.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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

        if (response?.status === 401) {
            const refreshToken = getState().auth.refreshToken;
            if (!refreshToken) {
                dispatch(logout());
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(
                    `${process.env.APP_API_URL}/auth/refresh`,
                    { refreshToken }
                );

                dispatch(
                    loginSuccess({
                        user: getState().auth.user,
                        accessToken: res.data.accessToken,
                        refreshToken: res.data.refreshToken,
                    })
                );

                // retry original request
                error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
                return api.request(error.config);
            } catch (refreshErr) {
                dispatch(logout());
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error);
    }
);

export default api;