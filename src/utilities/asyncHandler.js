// apiHandler.js
export const asyncHandler = (fn) => async (...args) => {
    try {
        return await fn(...args);
    } catch (err) {
        // Normalize error before throwing
        const normalizedError = {
            status: err.response?.status || 500,
            message: err.response?.data?.message || err.message || "Something went wrong",
        };
        throw normalizedError; // so React Query catches it
    }
};