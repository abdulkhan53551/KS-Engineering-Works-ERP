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
