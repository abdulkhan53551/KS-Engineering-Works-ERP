import { wait } from "../utitlity";
import api from "../../lib/axios";

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

            // Retry on network or 5xx server issues (not on client 4xx auth errors)
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
                        : error.response?.data?.message || error.message || "Server error",
                data: error.response?.data,
            };
        }
    }
};

