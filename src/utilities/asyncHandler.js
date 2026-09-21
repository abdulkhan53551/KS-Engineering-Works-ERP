// apiHandler.js
export const asyncHandler = (fn) => async (...args) => {
    try {
        return await fn(...args);
    } catch (err) {
        // Normalize error before throwing
        const normalizedError = {
            status: err.response?.status || err.status || 500,
            message: err.response?.data?.message || err.message || "Something went wrong",
            response: err.response,
            data: err.response?.data
        };
        throw normalizedError; // so React Query catches it
    }
};