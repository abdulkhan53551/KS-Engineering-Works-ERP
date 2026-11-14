import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Get quotation pagination metadata
export const getQuotationPagination = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    trash = false,
    status = '',
    approvalStatus = '',
    startDate = '',
    endDate = ''
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;
    if (status) params.status = status;
    if (approvalStatus) params.approvalStatus = approvalStatus;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.request({
        url: '/quotations/pagination',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get quotation list
export const getQuotations = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    trash = false,
    status = '',
    approvalStatus = '',
    startDate = '',
    endDate = ''
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (trash) params.trash = trash;
    if (status) params.status = status;
    if (approvalStatus) params.approvalStatus = approvalStatus;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.request({
        url: '/quotations',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

// Get next quotation number preview
export const getNextQuotationNumber = asyncHandler(async () => {
    const res = await api.request({
        url: '/quotations/next-quotation-number',
        method: requestMethod.GET
    });
    return res.data;
});

// Get quotation by ID
export const getQuotationById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/quotations/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

// Create new quotation
export const createQuotation = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/quotations',
        method: requestMethod.POST,
        data
    });
    return res.data;
});

// Update quotation
export const updateQuotation = asyncHandler(async ({ id, data }) => {
    const res = await api.request({
        url: `/quotations/${id}`,
        method: requestMethod.PATCH,
        data
    });
    return res.data;
});

// Create new revision from existing quotation
export const createQuotationRevision = asyncHandler(async ({ id, data }) => {
    const res = await api.request({
        url: `/quotations/${id}/revisions`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

// Approve or reject quotation
export const approveQuotation = asyncHandler(async ({ id, approvalStatus, rejectionReason, approval_status, rejection_reason }) => {
    const res = await api.request({
        url: `/quotations/${id}/approve`,
        method: requestMethod.PATCH,
        data: { 
            approvalStatus: approvalStatus || approval_status, 
            rejectionReason: rejectionReason || rejection_reason 
        }
    });
    return res.data;
});

// Delete quotation (soft delete)
export const deleteQuotation = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/quotations/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});

// Restore quotation from trash
export const restoreQuotation = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/quotations/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

// Bulk delete quotations
export const bulkDeleteQuotations = asyncHandler(async (ids) => {
    const res = await api.request({
        url: '/quotations/bulk-delete',
        method: requestMethod.POST,
        data: { ids }
    });
    return res.data;
});

// Bulk restore quotations
export const bulkRestoreQuotations = asyncHandler(async (ids) => {
    const res = await api.request({
        url: '/quotations/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });
    return res.data;
});

// Download / View Quotation PDF as Blob
export const downloadQuotationPdf = asyncHandler(async (id, includeAnnexure = null) => {
    const params = {};
    if (includeAnnexure !== null && includeAnnexure !== undefined) {
        params.include_annexure = includeAnnexure;
    }
    const res = await api.request({
        url: `/quotations/${id}/pdf`,
        method: requestMethod.GET,
        params,
        responseType: 'blob'
    });
    return res.data;
});
