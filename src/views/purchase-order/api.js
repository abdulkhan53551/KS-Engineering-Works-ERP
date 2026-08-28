import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get purchase order
export const getPurchaseOrderPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;

    const res = await api.request({
        url: '/purchase-order/pagination',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get purchase order
export const getPurchaseOrder = asyncHandler(async ({ page = 1, pageSize = 10, search = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;

    const res = await api.request({
        url: '/purchase-order',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get purchase order by id
export const getPurchaseOrderById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/purchase-order/${id}`,
        method: requestMethod.GET
    });

    return res.data;
});

// Create purchase order
export const createPurchaseOrder = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/purchase-order',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
});

// Update purchase order
export const updatePurchaseOrder = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/purchase-order/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
});

// Delete purchase order (Soft delete or Permanent delete)
export const deletePurchaseOrder = asyncHandler(async ({ id, isPermanentDelete = false }) => {
    const res = await api.request({
        url: `/purchase-order/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });
    return res.data;
});

// Restore purchase order from trash
export const restorePurchaseOrder = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/purchase-order/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

// Bulk delete purchase orders (Soft delete or Permanent delete)
export const bulkDeletePurchaseOrders = asyncHandler(async ({ ids = [], isPermanentDelete = false }) => {
    const res = await api.request({
        url: '/purchase-order/bulk-delete',
        method: requestMethod.POST,
        data: { ids, isPermanentDelete }
    });
    return res.data;
});

// Bulk restore purchase orders from trash
export const bulkRestorePurchaseOrders = asyncHandler(async ({ ids = [] }) => {
    const res = await api.request({
        url: '/purchase-order/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });
    return res.data;
});