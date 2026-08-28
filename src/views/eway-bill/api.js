import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get eway bill pagination
export const getEwayBillPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;

    const res = await api.request({
        url: '/ewaybill/pagination',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get eway bill list
export const getEwayBill = asyncHandler(async ({ page = 1, pageSize = 10, search = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;

    const res = await api.request({
        url: '/ewaybill',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get eway bill by id
export const getEwayBillById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/ewaybill/${id}`,
        method: requestMethod.GET
    });

    return res.data;
});

// Create eway bill
export const createEwayBill = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/ewaybill',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
});

// Update eway bill
export const updateEwayBill = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/ewaybill/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
});

// Delete eway bill (Soft delete or Permanent delete)
export const deleteEwayBill = asyncHandler(async ({ id, isPermanentDelete = false }) => {
    const res = await api.request({
        url: `/ewaybill/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });
    return res.data;
});

// Restore eway bill from trash
export const restoreEwayBill = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/ewaybill/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

// Bulk delete eway bills (Soft delete or Permanent delete)
export const bulkDeleteEwayBills = asyncHandler(async ({ ids = [], isPermanentDelete = false }) => {
    const res = await api.request({
        url: '/ewaybill/bulk-delete',
        method: requestMethod.POST,
        data: { ids, isPermanentDelete }
    });
    return res.data;
});

// Bulk restore eway bills from trash
export const bulkRestoreEwayBills = asyncHandler(async ({ ids = [] }) => {
    const res = await api.request({
        url: '/ewaybill/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });
    return res.data;
});