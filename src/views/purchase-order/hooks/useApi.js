import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    bulkDeletePurchaseOrders,
    bulkRestorePurchaseOrders,
    createPurchaseOrder,
    deletePurchaseOrder,
    getPurchaseOrder,
    getPurchaseOrderById,
    getPurchaseOrderPagination,
    restorePurchaseOrder,
    updatePurchaseOrder
} from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";

// Get purchase order pagination
export const usePurchaseOrderPagination = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["purchaseOrderPagination", page, pageSize, search, trash],
        queryFn: () => getPurchaseOrderPagination({ page, pageSize, search, trash }),
        keepPreviousData: true,
        select: (result) => {
            const pagination = result?.data?.pagination ?? {};
            const total = pagination.total ?? 0;

            const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
            const pageEnd = Math.min(page * pageSize, total);

            return {
                ...pagination,
                pageStart,
                pageEnd
            };
        }
    });
};

// Get purchase order
export const usePurchaseOrder = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["purchaseOrderList", page, pageSize, search, trash],
        queryFn: () => getPurchaseOrder({ page, pageSize, search, trash }),
        keepPreviousData: true,
        select: (result) => {
            const data = result?.data?.map(item => ({
                ...item,
                color: item.isInvoiced ? 'bg-success' : 'bg-danger',
                invoiceStatus: item.isInvoiced ? 'Invoiced' : 'Pending'
            })) ?? [];

            return data;
        }
    });
};

// Get purchase order by id
export const usePurchaseOrderById = (id = 0) => {
    return useQuery({
        queryKey: ["purchaseOrderById", id],
        queryFn: () => getPurchaseOrderById(id),
        enabled: !!id,
        select: (result) => {
            return result?.data ?? {};
        }
    });
};

// Create purchase order
export const useCreatPurchaseOrder = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createPurchaseOrder"],
        mutationFn: createPurchaseOrder,
        onSuccess: (res) => {
            if (res.success) {
                const id = res.data?.id;
                toast.success(res.message || "Purchase order created successfully.");
                queryClient.invalidateQueries({ queryKey: ['purchaseOrderList'] });
                queryClient.invalidateQueries({ queryKey: ['purchaseOrderPagination'] });
                navigate(`/purchase/purchase-order/${id}/edit`, { replace: true });
            }
        }
    });
};

// Update purchase order
export const useUpdatePurchaseOrder = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updatePurchaseOrder"],
        mutationFn: (data) => updatePurchaseOrder(id, data),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Purchase order updated successfully.");
                queryClient.invalidateQueries({ queryKey: ['purchaseOrderList'] });
                queryClient.invalidateQueries({ queryKey: ['purchaseOrderPagination'] });
                queryClient.invalidateQueries({ queryKey: ['purchaseOrderById'] });
            }
        }
    });
};

// Delete purchase order (Soft delete or Permanent delete)
export const useDeletePurchaseOrder = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deletePurchaseOrder"],
        mutationFn: ({ id, isPermanentDelete = false }) => deletePurchaseOrder({ id, isPermanentDelete }),
        onSuccess: (res, { id, invoiceId }) => {
            if (res.success) {
                dispatch(clearLoading());
                closeModal();
                toast.success(res.message || "Purchase order deleted successfully.");

                if (invoiceId) {
                    queryClient.setQueryData(['unmappedPurchaseOrder', invoiceId], (old) => {
                        const newData = {
                            ...old,
                            data: old?.data?.filter(item => item.poId !== id) ?? []
                        };
                        return newData;
                    });
                }

                // Refresh the list
                queryClient.invalidateQueries({ queryKey: ["purchaseOrderList"] });
                queryClient.invalidateQueries({ queryKey: ["purchaseOrderPagination"] });
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

// Restore purchase order from trash
export const useRestorePurchaseOrder = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restorePurchaseOrder"],
        mutationFn: (id) => restorePurchaseOrder(id),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Purchase order restored successfully.");

            queryClient.invalidateQueries({ queryKey: ["purchaseOrderList"] });
            queryClient.invalidateQueries({ queryKey: ["purchaseOrderPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore purchase order.";
            toast.error(message);
        }
    });
};

// Bulk delete purchase orders (Soft delete or Permanent delete)
export const useBulkDeletePurchaseOrders = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeletePurchaseOrders"],
        mutationFn: ({ ids, isPermanentDelete = false }) => bulkDeletePurchaseOrders({ ids, isPermanentDelete }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected purchase orders deleted successfully.");

            queryClient.invalidateQueries({ queryKey: ["purchaseOrderList"] });
            queryClient.invalidateQueries({ queryKey: ["purchaseOrderPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete selected purchase orders.";
            toast.error(message);
        }
    });
};

// Bulk restore purchase orders from trash
export const useBulkRestorePurchaseOrders = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestorePurchaseOrders"],
        mutationFn: ({ ids }) => bulkRestorePurchaseOrders({ ids }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected purchase orders restored successfully.");

            queryClient.invalidateQueries({ queryKey: ["purchaseOrderList"] });
            queryClient.invalidateQueries({ queryKey: ["purchaseOrderPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore selected purchase orders.";
            toast.error(message);
        }
    });
};