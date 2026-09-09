import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

/* =========================================================================
   CUSTOMER PAYMENTS & INWARD RECEIPTS APIS
   Exact Backend routes under /payments
   ========================================================================= */

/**
 * Preview next sequential receipt number
 * Endpoint: GET /payments/receipts/next-number
 */
export const getNextReceiptNumber = asyncHandler(async () => {
    const res = await api.request({
        url: '/payments/receipts/next-number',
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Fetch unpaid invoices for a specific customer
 * Endpoint: GET /payments/unpaid-invoices/:partyId
 */
export const getUnpaidInvoices = asyncHandler(async (partyId) => {
    if (!partyId) return { success: true, data: [] };
    const res = await api.request({
        url: `/payments/unpaid-invoices/${partyId}`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Record a new customer payment receipt
 * Endpoint: POST /payments/receipts
 * Payload: { paymentDate, partyId, totalAmount, paymentModeId, referenceNo, referenceDate, bankName, notes, allocations }
 */
export const createPayment = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/payments/receipts',
        method: requestMethod.POST,
        data
    });
    return res.data;
});

/**
 * List payment receipts with pagination and filters
 * Endpoint: GET /payments/receipts
 */
export const getPayments = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    partyId = '',
    paymentModeId = '',
    status = '',
    startDate = '',
    endDate = '',
    sortBy = 'payment_date',
    sortOrder = 'desc'
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentModeId) params.paymentModeId = paymentModeId;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const res = await api.request({
        url: '/payments/receipts',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Fetch pagination metadata for payment receipts
 * Endpoint: GET /payments/receipts/pagination
 */
export const getPaymentsMeta = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    partyId = '',
    paymentModeId = '',
    status = '',
    startDate = '',
    endDate = ''
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentModeId) params.paymentModeId = paymentModeId;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.request({
        url: '/payments/receipts/pagination',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Fetch overall summary metrics for payment receipts
 * Endpoint: GET /payments/summary (or /payments/receipts/summary)
 */
export const getPaymentsSummary = asyncHandler(async ({
    startDate = '',
    endDate = '',
    partyId = '',
    paymentModeId = '',
    status = '',
    search = ''
} = {}) => {
    const params = {};
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentModeId) params.paymentModeId = paymentModeId;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.request({
        url: '/payments/summary',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Get receipt details by ID with allocated invoices breakdown
 * Endpoint: GET /payments/receipts/:id
 */
export const getPaymentById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/payments/receipts/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Cancel a payment receipt (rolls back invoice balances atomically)
 * Endpoint: POST /payments/receipts/:id/cancel
 */
export const cancelPayment = asyncHandler(async (id, reason = '') => {
    const res = await api.request({
        url: `/payments/receipts/${id}/cancel`,
        method: requestMethod.POST,
        data: reason ? { reason } : {}
    });
    return res.data;
});

/**
 * Download printable Receipt Voucher PDF
 * Endpoint: GET /payments/receipts/:id/pdf
 */
export const downloadPaymentPdf = asyncHandler(async (id, paymentNo = '') => {
    try {
        const res = await api.request({
            url: `/payments/receipts/${id}/pdf`,
            method: requestMethod.GET,
            responseType: 'blob'
        });

        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Receipt-${paymentNo || id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        if (error.response?.data instanceof Blob) {
            const text = await error.response.data.text();
            try {
                error.response.data = JSON.parse(text);
            } catch (e) {
                // Keep text as message if not JSON
                error.message = text;
            }
        }
        throw error;
    }
});

/**
 * Get payment history for a specific invoice
 * Endpoint: GET /payments/invoice-history/:invoiceId
 */
export const getInvoicePaymentHistory = asyncHandler(async (invoiceId) => {
    if (!invoiceId) return { success: true, data: { history: [] } };
    const res = await api.request({
        url: `/payments/invoice-history/${invoiceId}`,
        method: requestMethod.GET
    });
    return res.data;
});

/* =========================================================================
   OUTWARD VENDOR PAYMENTS APIS
   Backend routes under /payments/vendor-payments & /payments
   ========================================================================= */

/**
 * Preview next sequential outward payment voucher number
 * Endpoint: GET /payments/next-number?type=OUTWARD
 */
export const getNextOutwardPaymentNumber = asyncHandler(async () => {
    const res = await api.request({
        url: '/payments/next-number',
        method: requestMethod.GET,
        params: { type: 'OUTWARD' }
    });
    return res.data;
});

/**
 * Record a new outward vendor payment (supports partial payments & advance)
 * Endpoint: POST /payments/vendor-payments
 */
export const createVendorPayment = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/payments/vendor-payments',
        method: requestMethod.POST,
        data
    });
    return res.data;
});

/**
 * Update an existing outward vendor payment
 * Endpoint: PUT /payments/vendor-payments/:id (fallback: PUT /payments/:id)
 */
export const updateVendorPayment = asyncHandler(async (id, data) => {
    try {
        const res = await api.request({
            url: `/payments/vendor-payments/${id}`,
            method: requestMethod.PUT,
            data
        });
        return res.data;
    } catch (err) {
        if (err.response && err.response.status === 404) {
            const fallbackRes = await api.request({
                url: `/payments/${id}`,
                method: requestMethod.PUT,
                data
            });
            return fallbackRes.data;
        }
        throw err;
    }
});

/**
 * List outward vendor payments with pagination and filters
 * Endpoint: GET /payments/vendor-payments
 */
export const getVendorPayments = asyncHandler(async ({
    page = 1,
    pageSize = 10,
    search = '',
    partyId = '',
    paymentModeId = '',
    status = '',
    startDate = '',
    endDate = '',
    sortBy = 'payment_date',
    sortOrder = 'desc'
} = {}) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentModeId) params.paymentModeId = paymentModeId;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const res = await api.request({
        url: '/payments/vendor-payments',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Fetch overall summary KPIs for outward vendor payments
 * Endpoint: GET /payments/vendor-payments/summary
 */
export const getVendorPaymentsSummary = asyncHandler(async ({
    startDate = '',
    endDate = '',
    partyId = '',
    paymentModeId = '',
    status = '',
    search = ''
} = {}) => {
    const params = {};
    if (search) params.search = search;
    if (partyId) params.partyId = partyId;
    if (paymentModeId) params.paymentModeId = paymentModeId;
    if (status) params.status = status;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const res = await api.request({
        url: '/payments/vendor-payments/summary',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Get single payment voucher details by ID (inward or outward)
 * Endpoint: GET /payments/:id
 */
export const getSinglePaymentDetails = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/payments/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Download printable Payment Voucher PDF
 * Endpoint: GET /payments/:id/pdf
 */
export const downloadVendorPaymentPdf = asyncHandler(async (id, paymentNo = '') => {
    try {
        const res = await api.request({
            url: `/payments/${id}/pdf`,
            method: requestMethod.GET,
            responseType: 'blob'
        });

        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Payment-${paymentNo || id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        if (error.response?.data instanceof Blob) {
            const text = await error.response.data.text();
            try {
                error.response.data = JSON.parse(text);
            } catch (e) {
                error.message = text;
            }
        }
        throw error;
    }
});

/**
 * Cancel an outward vendor payment (automatically restores bill balances & statuses)
 * Endpoint: POST /payments/:id/cancel
 */
export const cancelVendorPayment = asyncHandler(async (id, reason = '') => {
    const res = await api.request({
        url: `/payments/${id}/cancel`,
        method: requestMethod.POST,
        data: reason ? { reason } : {}
    });
    return res.data;
});

/* =========================================================================
   CUSTOMER ADVANCE ADJUSTMENT (KNOCK-OFF) APIS
   ========================================================================= */

/**
 * Get customer's unused advance balances (unallocated_amount > 0)
 * Endpoint: GET /payments/advances/:partyId
 */
export const getCustomerAdvances = asyncHandler(async (partyId) => {
    if (!partyId) return { success: true, data: [] };
    const res = await api.request({
        url: `/payments/advances/${partyId}`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Knock off existing advance receipt balance against new unpaid invoices
 * Endpoint: POST /payments/:id/apply-advance
 * Payload: { allocations: [{ invoiceId, allocatedAmount, tdsAmount, writeOffAmount, writeOffReason }] }
 */
export const applyAdvanceReceipt = asyncHandler(async (receiptId, allocations) => {
    const res = await api.request({
        url: `/payments/${receiptId}/apply-advance`,
        method: requestMethod.POST,
        data: { allocations }
    });
    return res.data;
});

