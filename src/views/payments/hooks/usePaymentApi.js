import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    cancelPayment,
    createPayment,
    getInvoicePaymentHistory,
    getNextReceiptNumber,
    getPaymentById,
    getPayments,
    getPaymentsMeta,
    getPaymentsSummary,
    getUnpaidInvoices
} from "../api";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { clearLoading } from "../../../store/uiModal.slice";
import { useUIManager } from "../../../contexts/UIManagerContext";

/**
 * Hook to preview the next sequential receipt number
 */
export const useNextReceiptNumber = () => {
    return useQuery({
        queryKey: ["nextReceiptNumber"],
        queryFn: getNextReceiptNumber,
        staleTime: 60 * 1000,
        select: (res) => res?.data?.nextReceiptNo || res?.nextReceiptNo || (typeof res?.data === 'string' ? res.data : "") || ""
    });
};

/**
 * Hook to fetch all unpaid invoices for a given customer
 */
export const useUnpaidInvoices = (partyId) => {
    return useQuery({
        queryKey: ["unpaidInvoices", partyId],
        queryFn: () => getUnpaidInvoices(partyId),
        enabled: Boolean(partyId && Number(partyId) > 0),
        staleTime: 30 * 1000,
        select: (res) => {
            const list = res?.data ?? res ?? [];
            return Array.isArray(list) ? list : (Array.isArray(list?.invoices) ? list.invoices : []);
        }
    });
};

/**
 * Hook to list payment receipts with pagination and filters
 */
export const usePayments = (filters = {}) => {
    return useQuery({
        queryKey: ["payments", filters],
        queryFn: () => getPayments(filters),
        placeholderData: (prev) => prev,
        select: (res) => {
            const list = res?.data ?? res?.receipts ?? res ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

/**
 * Hook to fetch receipts pagination metadata
 */
export const usePaymentsMeta = (filters = {}) => {
    return useQuery({
        queryKey: ["paymentsMeta", filters],
        queryFn: () => getPaymentsMeta(filters),
        placeholderData: (prev) => prev,
        select: (res) => {
            const meta = res?.data?.pagination ?? res?.data ?? res?.pagination ?? res ?? {};
            const total = Number(meta.total || 0);
            const pageSize = Number(meta.pageSize || 10);
            const totalPages = Number(meta.totalPages || (total > 0 && pageSize ? Math.ceil(total / pageSize) : 1));
            return {
                ...meta,
                total,
                page: Number(meta.page || 1),
                pageSize,
                totalPages,
                totalReceived: Number(meta.totalReceived ?? res?.data?.totalReceived ?? 0),
                totalAdvance: Number(meta.totalAdvance ?? res?.data?.totalAdvance ?? 0),
                completedCount: Number(meta.completedCount ?? res?.data?.completedCount ?? 0),
                cancelledCount: Number(meta.cancelledCount ?? res?.data?.cancelledCount ?? 0)
            };
        }
    });
};

/**
 * Hook to fetch overall aggregate summary metrics for payment receipts
 * Cached for 1 minute; ONLY re-fetches when filters change, NEVER when turning pages!
 */
export const usePaymentsSummary = (filters = {}) => {
    const { startDate, endDate, partyId, paymentModeId, status, search } = filters;
    return useQuery({
        queryKey: ["paymentsSummary", { startDate, endDate, partyId, paymentModeId, status, search }],
        queryFn: () => getPaymentsSummary({ startDate, endDate, partyId, paymentModeId, status, search }),
        placeholderData: (prev) => prev,
        staleTime: 60 * 1000,
        select: (res) => {
            const data = res?.data ?? res ?? {};
            return {
                totalCollections: Number(data.totalCollections ?? data.total_collections ?? 0),
                totalAllocated: Number(data.totalAllocated ?? data.total_allocated ?? 0),
                totalUnallocated: Number(data.totalUnallocated ?? data.total_unallocated ?? 0),
                completedCount: Number(data.completedCount ?? data.completed_count ?? 0),
                cancelledAmount: Number(data.cancelledAmount ?? data.cancelled_amount ?? 0),
                cancelledCount: Number(data.cancelledCount ?? data.cancelled_count ?? 0),
                totalCount: Number(data.totalCount ?? data.total_count ?? 0)
            };
        }
    });
};

/**
 * Hook to fetch a single payment receipt by ID
 */
export const usePaymentById = (id) => {
    return useQuery({
        queryKey: ["payment", id],
        queryFn: () => getPaymentById(id),
        enabled: Boolean(id && id !== "create"),
        select: (res) => res?.data ?? res ?? null
    });
};

/**
 * Hook to create a new customer payment receipt
 */
export const useCreatePayment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createPayment"],
        mutationFn: createPayment,
        onSuccess: (res) => {
            toast.success(res?.message || "Payment receipt created successfully.");
            // Invalidate queries so that payments list, unpaid invoices, and invoices list sync immediately
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["paymentsMeta"] });
            queryClient.invalidateQueries({ queryKey: ["paymentsSummary"] });
            queryClient.invalidateQueries({ queryKey: ["unpaidInvoices"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
            queryClient.invalidateQueries({ queryKey: ["invoicePagination"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceById"] });
            queryClient.invalidateQueries({ queryKey: ["nextReceiptNumber"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to create payment receipt.";
            toast.error(errorMsg);
        }
    });
};

/**
 * Hook to cancel a payment receipt (atomic rollback)
 */
export const useCancelPayment = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["cancelPayment"],
        mutationFn: (param) => {
            if (typeof param === 'object' && param !== null) {
                return cancelPayment(param.id, param.reason);
            }
            return cancelPayment(param);
        },
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Receipt cancelled successfully and invoice balances rolled back.");
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["paymentsMeta"] });
            queryClient.invalidateQueries({ queryKey: ["paymentsSummary"] });
            queryClient.invalidateQueries({ queryKey: ["payment"] });
            queryClient.invalidateQueries({ queryKey: ["unpaidInvoices"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
            queryClient.invalidateQueries({ queryKey: ["invoicePagination"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceById"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to cancel receipt.";
            toast.error(errorMsg);
        }
    });
};

/**
 * Hook to fetch payment history for a specific invoice
 */
export const useInvoicePaymentHistory = (invoiceId) => {
    return useQuery({
        queryKey: ["invoicePaymentHistory", invoiceId],
        queryFn: () => getInvoicePaymentHistory(invoiceId),
        enabled: Boolean(invoiceId),
        select: (res) => res?.data ?? res ?? { history: [] }
    });
};
