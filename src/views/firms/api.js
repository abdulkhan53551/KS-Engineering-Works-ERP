import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Login
export const getFirmType = asyncHandler(async () => {
    const res = await api.request({
        url: '/firm/firm-type',
        method: requestMethod.GET
    });

    return res.data;
})

// Get firms
export const getFirmsPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/firm/firm-pagination',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get firms
export const getFirms = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/firm',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get firm by id
export const getFirmById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/firm/${id}`,
        method: requestMethod.GET
    });

    return res.data;
})

// Create firm
export const createFirm = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/firm',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
})

// Update firm
export const updateFirm = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/firm/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
})


export const deleteFirm = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/firm/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});