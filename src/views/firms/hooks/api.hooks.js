import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFirm, deleteFirm, getFirmById, getFirms, getFirmsPagination, getFirmType, updateFirm } from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// Get firm type
export const useFirmType = () => {
    return useQuery({
        queryKey: ["firmType"],
        queryFn: getFirmType,
        select: (result) => {
            return result?.data ?? [];
        }
    });
}

// Get firms pagination
export const useGetFirmsPagination = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["firm-pagination", page, pageSize, search],
        queryFn: () => getFirmsPagination({ page, pageSize, search }),
        staleTime: 0,
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
export const useGetFirms = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["getFirms", page, pageSize, search],
        queryFn: () => getFirms({ page, pageSize, search }),
        staleTime: 0,
        keepPreviousData: true,
        select: (result) => {
            return result?.data ?? [];
        }
    });
}

// Get firm by id
export const useGetFirmById = (id = 0) => {
    return useQuery({
        queryKey: ["getFirmById", id],
        queryFn: () => getFirmById(id),
        enabled: !!id,
        select: (result) => {
            return result?.data ?? {};
        }
    });
}

// Create firm
export const useCreatFirm = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createFirm"],
        mutationFn: createFirm,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Firm created successfully.");
                queryClient.invalidateQueries({ queryKey: ['getFirms'] })
                navigate("/firms", { replace: true });
            }
        }
    });
}

// Update firm
export const useUpdateFirm = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updateFirm"],
        mutationFn: (data) => updateFirm(id, data),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Firm updated successfully.");
                queryClient.invalidateQueries({ queryKey: ['getFirms'] });
                queryClient.invalidateQueries({ queryKey: ['getFirmById'] });
            }
        }
    });
}

export const useDeleteFirm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["deketeFirm"],
        mutationFn: deleteFirm,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Firm deleted successfully.");
                // Refresh the list
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
            }
        }
    });
};