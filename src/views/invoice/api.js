import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get invoice
export const getInvoicePagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/invoice/pagination',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get invoice
export const getInvoice = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/invoice',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get invoice by id
export const getInvoiceById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/invoice/${id}`,
        method: requestMethod.GET
    });

    return res.data;
})

// Create invoice
export const createInvoice = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/invoice',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
})

// Update invoice
export const updateInvoice = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/invoice/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
})

// Delete invoice
export const deleteInvoice = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/invoice/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});