import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get proforma invoice pagination metadata
export const getProformaPagination = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    trash = false,
    status = '',
    startDate = '',
    endDate = '',
    firmId = '',
    branchId = ''
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (firmId) params.firmId = firmId;
    if (branchId) params.branchId = branchId;

    const res = await api.request({
        url: '/proforma-invoices/pagination',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get proforma invoice list
export const getProformaInvoices = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    trash = false,
    status = '',
    startDate = '',
    endDate = '',
    firmId = '',
    branchId = ''
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (firmId) params.firmId = firmId;
    if (branchId) params.branchId = branchId;

    const res = await api.request({
        url: '/proforma-invoices',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get next expected proforma invoice number
export const getNextProformaNumber = asyncHandler(async () => {
    const res = await api.request({
        url: '/proforma-invoices/next-number',
        method: requestMethod.GET
    });
    return res.data;
});

// Get proforma invoice by ID
export const getProformaById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/proforma-invoices/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

// Create new proforma invoice
export const createProforma = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/proforma-invoices',
        method: requestMethod.POST,
        data
    });
    return res.data;
});

// Update proforma invoice
export const updateProforma = asyncHandler(async ({ id, data }) => {
    const res = await api.request({
        url: `/proforma-invoices/${id}`,
        method: requestMethod.PATCH,
        data
    });
    return res.data;
});

// Delete proforma invoice (soft delete)
export const deleteProforma = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/proforma-invoices/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});

// Restore proforma invoice from trash
export const restoreProforma = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/proforma-invoices/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

// Bulk delete proforma invoices
export const bulkDeleteProformas = asyncHandler(async (ids) => {
    const res = await api.request({
        url: '/proforma-invoices/bulk-delete',
        method: requestMethod.POST,
        data: { ids }
    });
    return res.data;
});

// Bulk restore proforma invoices
export const bulkRestoreProformas = asyncHandler(async (ids) => {
    const res = await api.request({
        url: '/proforma-invoices/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });
    return res.data;
});

// Convert proforma to tax invoice
export const convertProformaToTaxInvoice = asyncHandler(async ({ id, taxInvoiceId }) => {
    const res = await api.request({
        url: `/proforma-invoices/${id}/convert-to-invoice`,
        method: requestMethod.POST,
        data: { taxInvoiceId }
    });
    return res.data;
});

// Download / View Proforma Invoice PDF as Blob
export const downloadProformaPdf = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/proforma-invoices/${id}/pdf`,
        method: requestMethod.GET,
        responseType: 'blob'
    });
    return res.data;
});

// Live Preview Proforma Invoice PDF from form payload
export const previewProformaPdf = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/proforma-invoices/preview-pdf',
        method: requestMethod.POST,
        data,
        responseType: 'blob'
    });
    return res.data;
});
