import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get firms
export const getInvoiceChallanPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/invoice-challan/pagination',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get firms
export const getInvoiceChallan = asyncHandler(async ({ page = 1, pageSize = 10, search = '' }) => {
    const res = await api.request({
        url: '/invoice-challan',
        method: requestMethod.GET,
        params: { page, pageSize, search }
    });

    return res.data;
})

// Get firm by id
export const getInvoiceChallanById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/invoice-challan/${id}`,
        method: requestMethod.GET
    });

    return res.data;
})

// Create firm
export const createInvoiceChallan = asyncHandler(async (request) => {
    const res = await api.request({
        url: '/invoice-challan',
        method: requestMethod.POST,
        data: request
    });

    return res.data;
})

// Update firm
export const updateInvoiceChallan = asyncHandler(async (id, request) => {
    const res = await api.request({
        url: `/invoice-challan/${id}`,
        method: requestMethod.PATCH,
        data: request
    });

    return res.data;
})


export const deleteInvoiceChallan = asyncHandler(async ({id}) => {
    const res = await api.request({
        url: `/invoice-challan/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});