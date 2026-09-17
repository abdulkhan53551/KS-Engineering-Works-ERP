import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFirm, deleteFirm, restoreFirm, deleteFirmLogo, getFirmById, getFirms, getFirmsPagination, getFirmType, updateFirm, uploadFirmLogo, getFirmBranches, createFirmBranch, updateFirmBranch, deleteFirmBranch } from "../api";
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
export const useGetFirmsPagination = ({ page, pageSize, search, isTrash = false }) => {
    return useQuery({
        queryKey: ["firm-pagination", page, pageSize, search, isTrash],
        queryFn: () => getFirmsPagination({ page, pageSize, search, isTrash }),
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
const EMPTY_FIRMS_ARRAY = Object.freeze([]);

export const useGetFirms = ({ page, pageSize, search, isTrash = false }) => {
    return useQuery({
        queryKey: ["getFirms", page, pageSize, search, isTrash],
        queryFn: () => getFirms({ page, pageSize, search, isTrash }),
        // staleTime: 0,
        keepPreviousData: true,
        select: (result) => {
            return Array.isArray(result?.data) ? result.data : EMPTY_FIRMS_ARRAY;
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
        mutationFn: ({ data }) => createFirm(data),
        onSuccess: (res) => {
            if (res.success) {
                const id = res.data?.id || res.data?.firmId;
                toast.success(res.message || "Firm created successfully.");
                queryClient.invalidateQueries({ queryKey: ['getFirms'] });
                queryClient.invalidateQueries({ queryKey: ['firm-pagination'] });
                if (id) {
                    navigate(`/firms/${id}/edit`, { replace: true });
                } else {
                    navigate('/firms', { replace: true });
                }
            }
        }
    });
};

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
                queryClient.invalidateQueries({ queryKey: ['firm-pagination'] });
                queryClient.invalidateQueries({ queryKey: ['getFirmById'] });
            }
        }
    });
}

export const useDeleteFirm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["deleteFirm"],
        mutationFn: deleteFirm,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Firm deleted successfully.");
                // Refresh the list
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
                queryClient.invalidateQueries({ queryKey: ["firm-pagination"] });
            }
        }
    });
};

export const useRestoreFirm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["restoreFirm"],
        mutationFn: restoreFirm,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Firm restored successfully.");
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
                queryClient.invalidateQueries({ queryKey: ["firm-pagination"] });
            }
        }
    });
};

// Upload Firm Logo
export const useUploadFirmLogo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["uploadFirmLogo"],
        mutationFn: ({ id, file }) => uploadFirmLogo(id, file),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: ["getFirmById"] });
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
                queryClient.invalidateQueries({ queryKey: ["firm-pagination"] });
            }
        }
    });
};

// Delete Firm Logo
export const useDeleteFirmLogo = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["deleteFirmLogo"],
        mutationFn: () => deleteFirmLogo(id),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Firm logo deleted successfully.");
                queryClient.invalidateQueries({ queryKey: ["getFirmById"] });
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
                queryClient.invalidateQueries({ queryKey: ["firm-pagination"] });
            }
        },
    });
};

// ================= Firm Branches Hooks =================

export const useGetFirmBranches = (firmId) => {
    return useQuery({
        queryKey: ["firm-branches", firmId],
        queryFn: () => getFirmBranches(firmId),
        enabled: !!firmId,
        select: (result) => result?.data ?? []
    });
};

export const useCreateFirmBranch = (firmId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createFirmBranch", firmId],
        mutationFn: (data) => createFirmBranch({ firmId, data }),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Branch created successfully.");
                queryClient.invalidateQueries({ queryKey: ["firm-branches", firmId] });
                queryClient.invalidateQueries({ queryKey: ["getFirmById", firmId] });
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
            }
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to create branch.");
        }
    });
};

export const useUpdateFirmBranch = (firmId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updateFirmBranch", firmId],
        mutationFn: ({ branchId, data }) => updateFirmBranch({ firmId, branchId, data }),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Branch updated successfully.");
                queryClient.invalidateQueries({ queryKey: ["firm-branches", firmId] });
                queryClient.invalidateQueries({ queryKey: ["getFirmById", firmId] });
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
            }
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to update branch.");
        }
    });
};

export const useDeleteFirmBranch = (firmId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["deleteFirmBranch", firmId],
        mutationFn: (branchId) => deleteFirmBranch({ firmId, branchId }),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Branch deleted successfully.");
                queryClient.invalidateQueries({ queryKey: ["firm-branches", firmId] });
                queryClient.invalidateQueries({ queryKey: ["getFirmById", firmId] });
                queryClient.invalidateQueries({ queryKey: ["getFirms"] });
            }
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to delete branch.");
        }
    });
};