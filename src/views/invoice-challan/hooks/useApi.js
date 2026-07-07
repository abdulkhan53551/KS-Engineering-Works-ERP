import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFirm, createInvoiceChallan, deleteFirm, deleteInvoiceChallan, getFirmById, getFirms, getFirmsPagination, getFirmType, getInvoiceChallan, getInvoiceChallanById, getInvoiceChallanPagination, updateFirm, updateInvoiceChallan } from "../api";
import { toast } from "react-toastify";
import { json, useNavigate } from "react-router-dom";

// Get firms pagination
export const useGetInvoiceChallanPagination = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["invoiceChallanPagination", page, pageSize, search],
        queryFn: () => getInvoiceChallanPagination({ page, pageSize, search }),
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
// Get firms
export const useGetInvoiceChallan = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["invoiceChallanList", page, pageSize, search],
        queryFn: () => getInvoiceChallan({ page, pageSize, search }),
        keepPreviousData: true,
        select: (result) => {
            // const data = json.parse(JSON.stringify(result?.data ?? []));
            const data = result?.data?.map(item => ({
                ...item,
                color: item.isInvoiced ? 'bg-success' : 'bg-danger',
                invoiceStatus: item.isInvoiced ? 'Invoiced' : 'Pending'
            })) ?? [];

            return data;
        }
    });
}

// Get firm by id
export const useGetInvoiceChallanById = (id = 0) => {
    return useQuery({
        queryKey: ["invoiceChallanById", id],
        queryFn: () => getInvoiceChallanById(id),
        enabled: !!id,
        select: (result) => {
            return result?.data ?? {};
        }
    });
}

// Create firm
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
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanList'] })
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanPagination'] })
                navigate(`/sales/challans/${challanId}/edit`, { replace: true });
            }
        }
    });
}

// Update firm
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
}

export const useDeleteInvoiceChallan = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["deleteInvoiceChallan"],
        mutationFn: deleteInvoiceChallan,
        onSuccess: (res, { id, invoiceId, type }) => {
            if (res.success) {
                toast.success(res.message || "Challan deleted successfully.");

                if (type === 'invoiceChallanPopup') {
                }
                // Refresh the list
                queryClient.setQueryData(['unmappedInvoiceChallan', invoiceId], (old) => {
                    const newData = {
                        ...old,
                        data: old?.data?.filter(item => item.challanId !== id) ?? []
                    }
                    
                    return newData;
                });

                // also sync fresh data
                queryClient.invalidateQueries({ queryKey: ["invoiceChallanList"] });
                queryClient.invalidateQueries({ queryKey: ["invoiceChallanPagination"] });
            }
        }
    });
};