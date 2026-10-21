import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
    getProformaPagination,
    getProformaInvoices,
    getNextProformaNumber,
    getProformaById,
    createProforma,
    updateProforma,
    deleteProforma,
    restoreProforma,
    bulkDeleteProformas,
    bulkRestoreProformas,
    convertProformaToTaxInvoice,
    downloadProformaPdf
} from "../api";

// Fetch pagination metadata
export const useProformaPagination = ({
    page,
    pageSize,
    search,
    trash = false,
    status = '',
    startDate = '',
    endDate = '',
    firmId = '',
    branchId = ''
}) => {
    return useQuery({
        queryKey: ["proformaPagination", page, pageSize, search, trash, status, startDate, endDate, firmId, branchId],
        queryFn: () => getProformaPagination({ page, pageSize, search, trash, status, startDate, endDate, firmId, branchId }),
        keepPreviousData: true,
        staleTime: 30 * 1000,
        select: (result) => {
            const pagination = result?.data?.pagination ?? {};
            const total = pagination.total ?? 0;
            const totalPages = pagination.totalPages ?? (total > 0 && pageSize ? Math.ceil(total / pageSize) : 1);
            const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
            const pageEnd = Math.min(page * pageSize, total);

            return {
                ...pagination,
                totalPages,
                pageStart,
                pageEnd
            };
        }
    });
};

// Fetch proforma invoice list
export const useProformaInvoices = ({
    page,
    pageSize,
    search,
    trash = false,
    status = '',
    startDate = '',
    endDate = '',
    firmId = '',
    branchId = ''
}) => {
    return useQuery({
        queryKey: ["proformaList", page, pageSize, search, trash, status, startDate, endDate, firmId, branchId],
        queryFn: () => getProformaInvoices({ page, pageSize, search, trash, status, startDate, endDate, firmId, branchId }),
        keepPreviousData: true,
        staleTime: 30 * 1000,
        select: (result) => {
            const list = result?.data?.rows || result?.data || [];
            return list.map(p => {
                const proformaNo = p.proformaNo || p.proforma_no || '';
                const proformaDate = p.proformaDate || p.proforma_date || null;
                const customerName = p.customerName || p.customer_name || '';
                const gstNumber = p.gstNumber || p.gst_number || '';
                const orderRefNo = p.orderRefNo || p.order_ref_no || '';
                const orderRefDate = p.orderRefDate || p.order_ref_date || null;
                const itemsCount = p.itemsCount !== undefined ? p.itemsCount : (p.items_count !== undefined ? p.items_count : 1);
                const taxableAmount = p.taxableAmount !== undefined ? p.taxableAmount : (p.taxable_amount || 0);
                const advanceAmountRequested = p.advanceAmountRequested !== undefined ? p.advanceAmountRequested : (p.advance_amount_requested || 0);
                const isConverted = Boolean(p.status === 'CONVERTED' || p.isConverted || p.is_converted);
                const createdByName = p.createdByName || p.created_by_name || '';
                const updatedByName = p.updatedByName || p.updated_by_name || createdByName || '';
                const deletedByName = p.deletedByName || p.deleted_by_name || '';
                const createdAt = p.createdAt || p.created_at || null;
                const updatedAt = p.updatedAt || p.updated_at || createdAt;
                const deletedAt = p.deletedAt || p.deleted_at || null;

                return {
                    ...p,
                    id: p.proformaId || p.proforma_id || p.id,
                    proformaNo,
                    proforma_no: proformaNo,
                    proformaDate,
                    proforma_date: proformaDate,
                    customerName,
                    customer_name: customerName,
                    gstNumber,
                    gst_number: gstNumber,
                    orderRefNo,
                    order_ref_no: orderRefNo,
                    orderRefDate,
                    order_ref_date: orderRefDate,
                    itemsCount,
                    items_count: itemsCount,
                    taxableAmount,
                    taxable_amount: taxableAmount,
                    advanceAmountRequested,
                    advance_amount_requested: advanceAmountRequested,
                    isConverted,
                    is_converted: isConverted,
                    createdByName,
                    created_by_name: createdByName,
                    updatedByName,
                    updated_by_name: updatedByName,
                    deletedByName,
                    deleted_by_name: deletedByName,
                    createdAt,
                    created_at: createdAt,
                    updatedAt,
                    updated_at: updatedAt,
                    deletedAt,
                    deleted_at: deletedAt,
                    statusBadgeClass: p.status === 'PAID' ? 'bg-success' :
                        p.status === 'PARTIALLY_PAID' ? 'bg-info text-white' :
                        p.status === 'SENT' ? 'bg-primary' :
                        p.status === 'CONVERTED' ? 'bg-purple text-white' :
                        p.status === 'CANCELLED' ? 'bg-danger' : 'bg-secondary'
                };
            });
        }
    });
};

// Fetch single proforma invoice
export const useProformaById = (id, options = {}) => {
    return useQuery({
        queryKey: ["proformaDetail", id],
        queryFn: () => getProformaById(id),
        enabled: Boolean(id) && id !== 'create',
        staleTime: 10 * 1000,
        select: (res) => res?.data,
        ...options
    });
};

// Fetch expected next consecutive proforma number
export const useNextProformaNumber = () => {
    return useQuery({
        queryKey: ["nextProformaNumber"],
        queryFn: getNextProformaNumber,
        staleTime: 5 * 1000,
        select: (res) => res?.data || ''
    });
};

// Create proforma mutation
export const useCreateProforma = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: createProforma,
        onSuccess: (data) => {
            queryClient.invalidateQueries(["proformaList"]);
            queryClient.invalidateQueries(["proformaPagination"]);
            queryClient.invalidateQueries(["nextProformaNumber"]);
            toast.success("Proforma Invoice created successfully!");
            navigate("/sales/proforma-invoice");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to create Proforma Invoice");
        }
    });
};

// Update proforma mutation
export const useUpdateProforma = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: updateProforma,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(["proformaList"]);
            queryClient.invalidateQueries(["proformaPagination"]);
            queryClient.invalidateQueries(["proformaDetail", variables.id]);
            toast.success("Proforma Invoice updated successfully!");
            navigate("/sales/proforma-invoice");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update Proforma Invoice");
        }
    });
};

// Soft delete proforma
export const useDeleteProforma = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProforma,
        onSuccess: () => {
            queryClient.invalidateQueries(["proformaList"]);
            queryClient.invalidateQueries(["proformaPagination"]);
            toast.success("Proforma Invoice moved to trash.");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete Proforma Invoice");
        }
    });
};

// Restore proforma from trash
export const useRestoreProforma = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: restoreProforma,
        onSuccess: () => {
            queryClient.invalidateQueries(["proformaList"]);
            queryClient.invalidateQueries(["proformaPagination"]);
            toast.success("Proforma Invoice restored successfully!");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to restore Proforma Invoice");
        }
    });
};

// Bulk delete proformas
export const useBulkDeleteProformas = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bulkDeleteProformas,
        onSuccess: () => {
            queryClient.invalidateQueries(["proformaList"]);
            queryClient.invalidateQueries(["proformaPagination"]);
            toast.success("Selected Proforma Invoices moved to trash.");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to bulk delete Proforma Invoices");
        }
    });
};

// Bulk restore proformas
export const useBulkRestoreProformas = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bulkRestoreProformas,
        onSuccess: () => {
            queryClient.invalidateQueries(["proformaList"]);
            queryClient.invalidateQueries(["proformaPagination"]);
            toast.success("Selected Proforma Invoices restored successfully!");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to bulk restore Proforma Invoices");
        }
    });
};

// Convert Proforma to Tax Invoice
export const useConvertProformaToInvoice = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: convertProformaToTaxInvoice,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(["proformaList"]);
            queryClient.invalidateQueries(["proformaPagination"]);
            queryClient.invalidateQueries(["proformaDetail", variables.id]);
            toast.success("Proforma Invoice marked as converted!");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to convert Proforma Invoice");
        }
    });
};
