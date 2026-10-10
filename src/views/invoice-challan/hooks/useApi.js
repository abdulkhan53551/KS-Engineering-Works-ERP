import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    bulkDeleteInvoiceChallans,
    bulkRestoreInvoiceChallans,
    createInvoiceChallan,
    deleteInvoiceChallan,
    getInvoiceChallan,
    getInvoiceChallanById,
    getInvoiceChallanPagination,
    restoreInvoiceChallan,
    updateInvoiceChallan
} from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export const selectInvoiceChallanPagination = (result) => {
    return result?.data?.pagination ?? EMPTY_OBJECT;
};

export const selectInvoiceChallanList = (result) => {
    const list = result?.data;
    if (!Array.isArray(list) || list.length === 0) return EMPTY_ARRAY;
    return list.map(item => ({
        ...item,
        color: item.isInvoiced ? 'bg-success' : 'bg-danger',
        invoiceStatus: item.isInvoiced ? 'Invoiced' : 'Pending'
    }));
};

export const selectInvoiceChallanById = (result) => {
    return result?.data ?? EMPTY_OBJECT;
};

// Get invoice challan pagination
export const useGetInvoiceChallanPagination = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["invoiceChallanPagination", page, pageSize, search, trash],
        queryFn: () => getInvoiceChallanPagination({ page, pageSize, search, trash }),
        placeholderData: (prev) => prev,
        select: selectInvoiceChallanPagination
    });
};

// Get invoice challan list
export const useGetInvoiceChallan = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["invoiceChallanList", page, pageSize, search, trash],
        queryFn: () => getInvoiceChallan({ page, pageSize, search, trash }),
        placeholderData: (prev) => prev,
        select: selectInvoiceChallanList
    });
};

// Get invoice challan by id
export const useGetInvoiceChallanById = (id = 0) => {
    return useQuery({
        queryKey: ["invoiceChallanById", id],
        queryFn: () => getInvoiceChallanById(id),
        enabled: !!id,
        select: selectInvoiceChallanById
    });
};

// Create invoice challan
export const useCreatInvoiceChallan = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createInvoiceChallan"],
        mutationFn: createInvoiceChallan,
        onSuccess: (res) => {
            if (res.success) {
                const challanId = res.data?.id;
                toast.success(res.message || "Challan created successfully.");
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanList'] });
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanPagination'] });
                navigate(`/sales/challans/${challanId}/edit`, { replace: true });
            }
        }
    });
};

// Update invoice challan
export const useUpdateInvoiceChallan = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updateInvoiceChallan"],
        mutationFn: (data) => updateInvoiceChallan(id, data),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Challan updated successfully.");
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanList'] });
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanPagination'] });
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanById'] });
            }
        }
    });
};

// Delete invoice challan (Soft delete or Permanent delete)
export const useDeleteInvoiceChallan = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deleteInvoiceChallan"],
        mutationFn: ({ id, isPermanentDelete = false }) => deleteInvoiceChallan({ id, isPermanentDelete }),
        onSuccess: (res, { id, invoiceId }) => {
            if (res.success) {
                dispatch(clearLoading());
                closeModal();
                toast.success(res.message || "Challan deleted successfully.");

                if (invoiceId) {
                    queryClient.setQueryData(['unmappedInvoiceChallan', invoiceId], (old) => {
                        const newData = {
                            ...old,
                            data: old?.data?.filter(item => item.challanId !== id) ?? []
                        };
                        return newData;
                    });
                }

                // also sync fresh data
                queryClient.invalidateQueries({ queryKey: ["invoiceChallanList"] });
                queryClient.invalidateQueries({ queryKey: ["invoiceChallanPagination"] });
                queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
            }
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong while deleting";

            toast.error(message);
        }
    });
};

// Restore invoice challan from trash
export const useRestoreInvoiceChallan = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restoreInvoiceChallan"],
        mutationFn: (id) => restoreInvoiceChallan(id),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Challan restored successfully.");

            queryClient.invalidateQueries({ queryKey: ["invoiceChallanList"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceChallanPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore invoice challan.";
            toast.error(message);
        }
    });
};

// Bulk delete invoice challans (Soft delete or Permanent delete)
export const useBulkDeleteInvoiceChallans = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeleteInvoiceChallans"],
        mutationFn: ({ ids, isPermanentDelete = false }) => bulkDeleteInvoiceChallans({ ids, isPermanentDelete }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected challans deleted successfully.");

            queryClient.invalidateQueries({ queryKey: ["invoiceChallanList"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceChallanPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete selected challans.";
            toast.error(message);
        }
    });
};

// Bulk restore invoice challans from trash
export const useBulkRestoreInvoiceChallans = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestoreInvoiceChallans"],
        mutationFn: ({ ids }) => bulkRestoreInvoiceChallans({ ids }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected challans restored successfully.");

            queryClient.invalidateQueries({ queryKey: ["invoiceChallanList"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceChallanPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore selected challans.";
            toast.error(message);
        }
    });
};