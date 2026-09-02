import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    bulkDeleteEwayBills,
    bulkRestoreEwayBills,
    createEwayBill,
    deleteEwayBill,
    getEwayBill,
    getEwayBillById,
    getEwayBillPagination,
    restoreEwayBill,
    updateEwayBill
} from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";

// Get eway bill pagination
export const useEwayBillPagination = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["ewayBillPagination", page, pageSize, search, trash],
        queryFn: () => getEwayBillPagination({ page, pageSize, search, trash }),
        keepPreviousData: true,
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

// Get eway bill
export const useEwayBill = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["ewayBillList", page, pageSize, search, trash],
        queryFn: () => getEwayBill({ page, pageSize, search, trash }),
        keepPreviousData: true,
        select: (result) => {
            const data = result?.data?.map(item => ({
                ...item,
                ewaybillValidUpto: item.validUpto,
                color: item.isInvoiced ? 'bg-success' : 'bg-danger',
                invoiceStatus: item.isInvoiced ? 'Invoiced' : 'Pending'
            })) ?? [];

            return data;
        }
    });
};

// Get eway bill by id
export const useEwayBillById = (id = 0) => {
    return useQuery({
        queryKey: ["ewayBillById", id],
        queryFn: () => getEwayBillById(id),
        enabled: !!id,
        select: (result) => {
            return result?.data ?? {};
        }
    });
};

// Create eway bill
export const useCreatEwayBill = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createEwayBill"],
        mutationFn: createEwayBill,
        onSuccess: (res) => {
            if (res.success) {
                const id = res.data?.id;
                toast.success(res.message || "Eway bill created successfully.");
                queryClient.invalidateQueries({ queryKey: ['ewayBillList'] });
                queryClient.invalidateQueries({ queryKey: ['ewayBillPagination'] });
                navigate(`/sales/eway-bill/${id}/edit`, { replace: true });
            }
        }
    });
};

// Update eway bill
export const useUpdateEwaybill = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updateEwayBill"],
        mutationFn: (data) => updateEwayBill(id, data),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Eway bill updated successfully.");
                queryClient.invalidateQueries({ queryKey: ['ewayBillList'] });
                queryClient.invalidateQueries({ queryKey: ['ewayBillPagination'] });
                queryClient.invalidateQueries({ queryKey: ['ewayBillById'] });
            }
        }
    });
};

// Delete eway bill (Soft delete or Permanent delete)
export const useDeleteEwayBill = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deleteEwayBill"],
        mutationFn: ({ id, isPermanentDelete = false }) => deleteEwayBill({ id, isPermanentDelete }),
        onSuccess: (res, { id, invoiceId }) => {
            if (res.success) {
                dispatch(clearLoading());
                closeModal();
                toast.success(res.message || "Eway Bill deleted successfully.");

                if (invoiceId) {
                    queryClient.setQueryData(['unmappedEwayBill', invoiceId], (old) => {
                        const newData = {
                            ...old,
                            data: old?.data?.filter(item => item.ewayBillId !== id) ?? []
                        };

                        return newData;
                    });
                }

                // Refresh the list
                queryClient.invalidateQueries({ queryKey: ["ewayBillList"] });
                queryClient.invalidateQueries({ queryKey: ["ewayBillPagination"] });
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

// Restore eway bill from trash
export const useRestoreEwayBill = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restoreEwayBill"],
        mutationFn: (id) => restoreEwayBill(id),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Eway bill restored successfully.");

            queryClient.invalidateQueries({ queryKey: ["ewayBillList"] });
            queryClient.invalidateQueries({ queryKey: ["ewayBillPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore eway bill.";
            toast.error(message);
        }
    });
};

// Bulk delete eway bills (Soft delete or Permanent delete)
export const useBulkDeleteEwayBills = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeleteEwayBills"],
        mutationFn: ({ ids, isPermanentDelete = false }) => bulkDeleteEwayBills({ ids, isPermanentDelete }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected eway bills deleted successfully.");

            queryClient.invalidateQueries({ queryKey: ["ewayBillList"] });
            queryClient.invalidateQueries({ queryKey: ["ewayBillPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete selected eway bills.";
            toast.error(message);
        }
    });
};

// Bulk restore eway bills from trash
export const useBulkRestoreEwayBills = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestoreEwayBills"],
        mutationFn: ({ ids }) => bulkRestoreEwayBills({ ids }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected eway bills restored successfully.");

            queryClient.invalidateQueries({ queryKey: ["ewayBillList"] });
            queryClient.invalidateQueries({ queryKey: ["ewayBillPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore selected eway bills.";
            toast.error(message);
        }
    });
};