import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get invoice challan pagination
export const getInvoiceChallanPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;

    const res = await api.request({
        url: '/invoice-challan/pagination',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get invoice challan list
export const getInvoiceChallan = asyncHandler(async ({ page = 1, pageSize = 10, search = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;

    const res = await api.request({
        url: '/invoice-challan',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get invoice challan by id
export const getInvoiceChallanById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/invoice-challan/${id}`,
        method: requestMethod.GET
    });

    return res.data;
});

// Create invoice challan
export const createInvoiceChallan = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/invoice-challan',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
});

// Update invoice challan
export const updateInvoiceChallan = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/invoice-challan/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
});

// Delete invoice challan (Soft delete or Permanent delete)
export const deleteInvoiceChallan = asyncHandler(async ({ id, isPermanentDelete = false }) => {
    const res = await api.request({
        url: `/invoice-challan/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });
    return res.data;
});

// Restore invoice challan from trash
export const restoreInvoiceChallan = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/invoice-challan/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

// Bulk delete invoice challans (Soft delete or Permanent delete)
export const bulkDeleteInvoiceChallans = asyncHandler(async ({ ids = [], isPermanentDelete = false }) => {
    const res = await api.request({
        url: '/invoice-challan/bulk-delete',
        method: requestMethod.POST,
        data: { ids, isPermanentDelete }
    });
    return res.data;
});

// Bulk restore invoice challans from trash
export const bulkRestoreInvoiceChallans = asyncHandler(async ({ ids = [] }) => {
    const res = await api.request({
        url: '/invoice-challan/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });
    return res.data;
});