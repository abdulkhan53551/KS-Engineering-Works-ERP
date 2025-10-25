import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEwayBill, deleteEwayBill, getEwayBill, getEwayBillById, getEwayBillPagination, updateEwayBill } from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";

// Get eway bill pagination
export const useEwayBillPagination = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["ewayBillPagination", page, pageSize, search],
        queryFn: () => getEwayBillPagination({ page, pageSize, search }),
        // staleTime: 0,
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
}

// Get eway bill
export const useEwayBill = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["ewayBillList", page, pageSize, search],
        queryFn: () => getEwayBill({ page, pageSize, search }),
        keepPreviousData: true,
        select: (result) => {
            // const data = json.parse(JSON.stringify(result?.data ?? []));
            const data = result?.data?.map(item => ({
                ...item,
                ewaybillValidUpto: item.validUpto,
                color: item.isInvoiced ? 'bg-success' : 'bg-danger',
                invoiceStatus: item.isInvoiced ? 'Invoiced' : 'Pending'
            })) ?? [];

            return data;
        }
    });
}

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
}

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
                queryClient.invalidateQueries({ queryKey: ['ewayBillList'] })
                queryClient.invalidateQueries({ queryKey: ['ewayBillPagination'] });
                navigate(`/sales/eway-bill/${id}/edit`, { replace: true });
            }
        }
    });
}

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
}

// Delete eway bill
export const useDeleteEwayBill = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { showModal, closeModal } = useUIManager();


    return useMutation({
        mutationKey: ["deleteEwayBill"],
        mutationFn: deleteEwayBill,
        onSuccess: (res) => {
            if (res.success) {
                dispatch(clearLoading());
                closeModal();
                toast.success(res.message || "Eway Bill deleted successfully.");
                // Refresh the list
                queryClient.invalidateQueries({ queryKey: ["ewayBillList"] });
                queryClient.invalidateQueries({ queryKey: ["ewayBillPagination"] });
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