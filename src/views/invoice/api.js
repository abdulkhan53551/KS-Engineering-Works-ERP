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

// Get unmapped invoice challan by invoice id
export const getUnmappedInvoiceChallanByInvoiceId = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/invoice-challan/invoice/${id}?includeUnmappedChallans=true`,
        method: requestMethod.GET
    });

    return res.data;
})

// Get unmapped purchase order by invoice id
export const getUnmappedPurchaseOrderByInvoiceId = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/purchase-order/invoice/${id}?includeUnmappedPurchaseOrders=true`,
        method: requestMethod.GET
    });

    return res.data;
})

// Get unmapped eway bill by invoice id
export const getUnmappedEwayBillByInvoiceId = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/ewaybill/invoice/${id}?includeUnmappedEwayBills=true`,
        method: requestMethod.GET
    });

    return res.data;
})

// Download invoice PDF
export const downloadInvoice = asyncHandler(async (id) => {
    try {
        const res = await api.request({
            url: `/invoice/${id}/pdf`,
            method: requestMethod.GET,
            responseType: "blob",
        });

        return {
            data: res.data,
            headers: res.headers,
        };
    } catch (error) {
        if (error.response?.data instanceof Blob) {
            const text = await error.response.data.text();
            error.response.data = JSON.parse(text);
        }

        throw error;
    }
});

// Get next invoice number
export const getNextInvoiceNumber = asyncHandler(async () => {
    const res = await api.request({
        url: "/invoice/next-invoice-number",
        method: requestMethod.GET,
    });

    return res.data;
});