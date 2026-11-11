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

// Get firms pagination
export const getFirmsPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '', isTrash = false }) => {
    const res = await api.request({
        url: '/firm/firm-pagination',
        method: requestMethod.GET,
        params: { page, pageSize, search, isTrash }
    });

    return res.data;
})

// Get firms
export const getFirms = asyncHandler(async ({ page = 1, pageSize = 10, search = '', isTrash = false }) => {
    const res = await api.request({
        url: '/firm',
        method: requestMethod.GET,
        params: { page, pageSize, search, isTrash }
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

export const deleteFirm = asyncHandler(async (arg) => {
    const id = typeof arg === 'object' ? arg.id : arg;
    const isPermanentDelete = typeof arg === 'object' ? Boolean(arg.isPermanentDelete) : false;

    const res = await api.request({
        url: `/firm/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });
    return res.data;
});

export const restoreFirm = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/firm/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

// Upload firm logo
export const uploadFirmLogo = asyncHandler(async (id, file) => {
    const formData = new FormData();
    formData.append("logo", file);

    const res = await api.request({
        url: `/firm/${id}/logo`,
        method: requestMethod.POST,
        data: formData,
    });

    return res.data;
});

// Delete firm logo
export const deleteFirmLogo = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/firm/${id}/logo`,
        method: requestMethod.DELETE,
    });

    return res.data;
});

// Firm Branches API
export const getFirmBranches = asyncHandler(async (firmId) => {
    const res = await api.request({
        url: `/firm/${firmId}/branches`,
        method: requestMethod.GET
    });
    return res.data;
});

export const createFirmBranch = asyncHandler(async ({ firmId, data }) => {
    const res = await api.request({
        url: `/firm/${firmId}/branches`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const updateFirmBranch = asyncHandler(async ({ firmId, branchId, data }) => {
    const res = await api.request({
        url: `/firm/${firmId}/branches/${branchId}`,
        method: requestMethod.PUT,
        data
    });
    return res.data;
});

export const deleteFirmBranch = asyncHandler(async ({ firmId, branchId }) => {
    const res = await api.request({
        url: `/firm/${firmId}/branches/${branchId}`,
        method: requestMethod.DELETE
    });
    return res.data;
});