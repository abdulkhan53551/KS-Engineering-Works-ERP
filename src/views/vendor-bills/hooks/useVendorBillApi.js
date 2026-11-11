import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createVendorBill,
    deleteVendorBill,
    getUnpaidVendorBillsByParty,
    getVendorBillById,
    getVendorBills,
    getVendorBillsPagination,
    getVendorBillsSummary,
    updateVendorBill
} from "../api";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const selectVendorBillsList = (res) => {
    const list = res?.data ?? res?.bills ?? res ?? EMPTY_ARRAY;
    return Array.isArray(list) ? list : EMPTY_ARRAY;
};

const selectVendorBillsSummary = (res) => {
    const data = res?.data ?? res ?? EMPTY_OBJECT;
    return {
        totalBillsAmount: Number(data.totalBillsAmount ?? data.total_bills_amount ?? 0),
        totalPaidAmount: Number(data.totalPaidAmount ?? data.total_paid_amount ?? 0),
        totalBalanceDue: Number(data.totalBalanceDue ?? data.total_balance_due ?? 0),
        totalCount: Number(data.totalCount ?? data.total_count ?? 0),
        unpaidCount: Number(data.unpaidCount ?? data.unpaid_count ?? 0),
        partialCount: Number(data.partialCount ?? data.partial_count ?? 0),
        paidCount: Number(data.paidCount ?? data.paid_count ?? 0)
    };
};

const selectVendorBillsMeta = (res) => {
    const meta = res?.data?.pagination ?? res?.data ?? res?.pagination ?? res ?? EMPTY_OBJECT;
    const total = Number(meta.totalRecords || meta.total || 0);
    const pageSize = Number(meta.pageSize || 10);
    const totalPages = Number(meta.totalPages || (total > 0 && pageSize ? Math.ceil(total / pageSize) : 1));
    return {
        ...meta,
        total,
        page: Number(meta.currentPage || meta.page || 1),
        pageSize,
        totalPages
    };
};

/**
 * Hook to fetch paginated list of vendor bills
 */
export const useVendorBills = (filters = {}) => {
    return useQuery({
        queryKey: ["vendorBills", filters],
        queryFn: () => getVendorBills(filters),
        placeholderData: (prev) => prev,
        select: selectVendorBillsList
    });
};

/**
 * Hook to fetch overall aggregate summary KPIs for vendor bills
 */
export const useVendorBillsSummary = (filters = {}) => {
    const { startDate, endDate, partyId, paymentStatusId, search } = filters;
    return useQuery({
        queryKey: ["vendorBillsSummary", { startDate, endDate, partyId, paymentStatusId, search }],
        queryFn: () => getVendorBillsSummary({ startDate, endDate, partyId, paymentStatusId, search }),
        placeholderData: (prev) => prev,
        staleTime: 60 * 1000,
        select: selectVendorBillsSummary
    });
};

/**
 * Hook to fetch pagination metadata for vendor bills
 */
export const useVendorBillsMeta = (filters = {}) => {
    return useQuery({
        queryKey: ["vendorBillsMeta", filters],
        queryFn: () => getVendorBillsPagination(filters),
        placeholderData: (prev) => prev,
        select: selectVendorBillsMeta
    });
};

/**
 * Hook to fetch single vendor bill details by ID
 */
export const useVendorBillById = (id) => {
    return useQuery({
        queryKey: ["vendorBill", id],
        queryFn: () => getVendorBillById(id),
        enabled: Boolean(id && id !== "create"),
        select: (res) => res?.data ?? res ?? null
    });
};

/**
 * Hook to fetch unpaid/partial bills with remaining balances for a vendor
 */
export const useUnpaidVendorBills = (partyId) => {
    return useQuery({
        queryKey: ["unpaidVendorBills", partyId],
        queryFn: () => getUnpaidVendorBillsByParty(partyId),
        enabled: Boolean(partyId && Number(partyId) > 0),
        staleTime: 30 * 1000,
        select: (res) => {
            const list = res?.data ?? res?.bills ?? res ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

/**
 * Hook to create a new vendor bill
 */
export const useCreateVendorBill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createVendorBill"],
        mutationFn: createVendorBill,
        onSuccess: (res) => {
            toast.success(res?.message || "Vendor bill created successfully.");
            queryClient.invalidateQueries({ queryKey: ["vendorBills"] });
            queryClient.invalidateQueries({ queryKey: ["vendorBillsMeta"] });
            queryClient.invalidateQueries({ queryKey: ["vendorBillsSummary"] });
            queryClient.invalidateQueries({ queryKey: ["unpaidVendorBills"] });
        },
        onError: (err) => {
            const status = err?.response?.status;
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to create vendor bill.";
            if (status === 409) {
                toast.error(`Duplicate Bill: ${errorMsg}`);
            } else {
                toast.error(errorMsg);
            }
        }
    });
};

/**
 * Hook to update an existing vendor bill
 */
export const useUpdateVendorBill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updateVendorBill"],
        mutationFn: ({ id, data }) => updateVendorBill(id, data),
        onSuccess: (res, variables) => {
            toast.success(res?.message || "Vendor bill updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["vendorBills"] });
            queryClient.invalidateQueries({ queryKey: ["vendorBillsMeta"] });
            queryClient.invalidateQueries({ queryKey: ["vendorBillsSummary"] });
            queryClient.invalidateQueries({ queryKey: ["vendorBill", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["unpaidVendorBills"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to update vendor bill.";
            toast.error(errorMsg);
        }
    });
};

/**
 * Hook to delete a vendor bill with 422 guard handling
 */
export const useDeleteVendorBill = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["deleteVendorBill"],
        mutationFn: deleteVendorBill,
        onSuccess: (res) => {
            toast.success(res?.message || "Vendor bill deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["vendorBills"] });
            queryClient.invalidateQueries({ queryKey: ["vendorBillsMeta"] });
            queryClient.invalidateQueries({ queryKey: ["vendorBillsSummary"] });
            queryClient.invalidateQueries({ queryKey: ["unpaidVendorBills"] });
        },
        onError: (err) => {
            const status = err?.response?.status;
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete vendor bill.";
            if (status === 422) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Cannot Delete Bill',
                    text: errorMsg || 'This bill has payments linked to it. Please cancel or unallocate payments first.',
                    confirmButtonColor: '#3085d6'
                });
            } else {
                toast.error(errorMsg);
            }
        }
    });
};
