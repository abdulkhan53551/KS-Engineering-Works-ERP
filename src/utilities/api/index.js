import axios from "axios";
// import client from "./client";
import { wait } from "../utitlity";
import api from "../../lib/axios";
import { localStorageKey } from "../constant/constants";

let isRefreshing = false;
let subscribers = [];

const subscribeTokenRefresh = (cb) => subscribers.push(cb);
const onRefreshed = (token) => {
    subscribers.forEach((cb) => cb(token));
    subscribers = [];
};

export const apiRequest = async ({
    url,
    method = "GET",
    data,
    headers = {},
    retries = 1,
    backoff = 500,
}) => {
    let attempt = 0;

    while (attempt <= retries) {
        try {
            const response = await api.request({ url, method, data, headers });
            return { success: true, data: response.data };
        } catch (error) {
            const status = error.response?.status;

            // 🔹 Token refresh on 401
            if (status === 401 && !error.config._retry) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    try {
                        const res = await api.post("/auth/refresh", {}, { withCredentials: true });
                        const newToken = res.data.accessToken;

                        localStorage.setItem(localStorageKey.ACCESS_TOKEN_KEY, newToken);
                        api.defaults.headers.Authorization = `Bearer ${newToken}`;
                        isRefreshing = false;
                        onRefreshed(newToken);
                    } catch {
                        isRefreshing = false;
                        localStorage.clear();
                        window.location.href = "/login";
                        return { success: false, message: "Session expired" };
                    }
                }

                return new Promise((resolve) => {
                    subscribeTokenRefresh((token) => {
                        error.config._retry = true;
                        error.config.headers.Authorization = `Bearer ${token}`;
                        resolve(api(error.config));
                    });
                });
            }

            // 🔹 Retry on network/server issues
            const shouldRetry =
                attempt < retries &&
                (error.code === "ECONNABORTED" ||
                    error.message?.includes("Network Error") ||
                    status >= 500);

            if (shouldRetry) {
                attempt++;
                await wait(backoff * attempt); // exponential backoff
                continue;
            }

            return {
                success: false,
                message:
                    error.code === "ECONNABORTED"
                        ? "Request timeout"
                        : error.message || "Server error",
                data: error.response?.data,
            };
        }
    }
};
