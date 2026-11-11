import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

/* =========================================================================
   VENDOR BILLS (ACCOUNTS PAYABLE) APIS
   Backend routes under /vendor-bills
   ========================================================================= */

/**
 * Create a new vendor bill
 * Endpoint: POST /vendor-bills
 */
export const createVendorBill = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/vendor-bills',
        method: requestMethod.POST,
        data
    });
    return res.data;
});

/**
 * List vendor bills with pagination and filters
 * Endpoint: GET /vendor-bills
 */
export const getVendorBills = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    partyId = '',
    paymentStatusId = '',
    startDate = '',
    endDate = '',
    sortBy = 'bill_date',
    sortOrder = 'desc'
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentStatusId) params.paymentStatusId = paymentStatusId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const res = await api.request({
        url: '/vendor-bills',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Fetch overall summary metrics for vendor bills
 * Endpoint: GET /vendor-bills/summary
 */
export const getVendorBillsSummary = asyncHandler(async ({
    startDate = '',
    endDate = '',
    partyId = '',
    paymentStatusId = '',
    search = ''
} = {}) => {
    const params = {};
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentStatusId) params.paymentStatusId = paymentStatusId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.request({
        url: '/vendor-bills/summary',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Fetch pagination metadata for vendor bills
 * Endpoint: GET /vendor-bills/pagination
 */
export const getVendorBillsPagination = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    partyId = '',
    paymentStatusId = '',
    startDate = '',
    endDate = ''
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentStatusId) params.paymentStatusId = paymentStatusId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.request({
        url: '/vendor-bills/pagination',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Get vendor bill by ID with payment history and attachments
 * Endpoint: GET /vendor-bills/:id
 */
export const getVendorBillById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/vendor-bills/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Update an existing vendor bill (monetary fields locked if paid)
 * Endpoint: PUT /vendor-bills/:id
 */
export const updateVendorBill = asyncHandler(async (id, data) => {
    const res = await api.request({
        url: `/vendor-bills/${id}`,
        method: requestMethod.PUT,
        data
    });
    return res.data;
});

/**
 * Delete a vendor bill (blocked if payments exist -> 422)
 * Endpoint: DELETE /vendor-bills/:id
 */
export const deleteVendorBill = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/vendor-bills/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});

/**
 * Fetch unpaid/partial bills with remaining balances for a vendor
 * Endpoint: GET /vendor-bills/unpaid/:partyId
 */
export const getUnpaidVendorBillsByParty = asyncHandler(async (partyId) => {
    if (!partyId) return { success: true, data: [] };
    const res = await api.request({
        url: `/vendor-bills/unpaid/${partyId}`,
        method: requestMethod.GET
    });
    return res.data;
});
