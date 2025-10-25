import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get purchase order
export const getPurchaseOrderPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/purchase-order/pagination',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get purchase order
export const getPurchaseOrder = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/purchase-order',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get purchase order by id
export const getPurchaseOrderById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/purchase-order/${id}`,
        method: requestMethod.GET
    });

    return res.data;
})

// Create purchase order
export const createPurchaseOrder = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/purchase-order',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
})

// Update purchase order
export const updatePurchaseOrder = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/purchase-order/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
})

// Delete purchase order
export const deletePurchaseOrder = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/purchase-order/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});