// src/lib/axios.js
import axios from "axios";

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "",
    timeout: 10000,
    headers: { "Content-Type": "application/json" },
});

// Attach token automatically
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optionally: redirect on 401, log errors, etc.
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default apiClient;