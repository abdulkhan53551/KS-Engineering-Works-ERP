import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
    getQuotationPagination,
    getQuotations,
    getNextQuotationNumber,
    getQuotationById,
    createQuotation,
    updateQuotation,
    createQuotationRevision,
    approveQuotation,
    deleteQuotation,
    restoreQuotation,
    bulkDeleteQuotations,
    bulkRestoreQuotations,
    downloadQuotationPdf
} from "../api";

// Fetch pagination metadata
export const useQuotationPagination = ({
    page,
    pageSize,
    search,
    trash = false,
    status = '',
    approvalStatus = '',
    startDate = '',
    endDate = '',
    firmId = '',
    branchId = ''
}) => {
    return useQuery({
        queryKey: ["quotationPagination", page, pageSize, search, trash, status, approvalStatus, startDate, endDate, firmId, branchId],
        queryFn: () => getQuotationPagination({ page, pageSize, search, trash, status, approvalStatus, startDate, endDate }),
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

// Fetch quotation list
export const useQuotations = ({
    page,
    pageSize,
    search,
    trash = false,
    status = '',
    approvalStatus = '',
    startDate = '',
    endDate = '',
    firmId = '',
    branchId = ''
}) => {
    return useQuery({
        queryKey: ["quotationsList", page, pageSize, search, trash, status, approvalStatus, startDate, endDate, firmId, branchId],
        queryFn: () => getQuotations({ page, pageSize, search, trash, status, approvalStatus, startDate, endDate }),
        keepPreviousData: true,
        staleTime: 30 * 1000,
        select: (result) => {
            const list = result?.data?.rows || result?.data || [];
            return list.map(q => ({
                ...q,
                id: q.quotation_id || q.id,
                statusBadgeClass: q.status === 'APPROVED' ? 'bg-success' :
                    q.status === 'PENDING_APPROVAL' ? 'bg-warning text-dark' :
                    q.status === 'DRAFT' ? 'bg-secondary' :
                    q.status === 'REJECTED' ? 'bg-danger' : 'bg-info'
            }));
        }
    });
};

// Fetch single quotation
export const useQuotationById = (id, options = {}) => {
    return useQuery({
        queryKey: ["quotationDetail", id],
        queryFn: () => getQuotationById(id),
        enabled: Boolean(id) && id !== 'create',
        staleTime: 10 * 1000,
        select: (res) => res?.data,
        ...options
    });
};

// Fetch expected next consecutive quotation number
export const useNextQuotationNumber = () => {
    return useQuery({
        queryKey: ["nextQuotationNumber"],
        queryFn: getNextQuotationNumber,
        staleTime: 5 * 1000,
        select: (res) => res?.data?.nextQuotationNumber
    });
};

// Create quotation mutation
export const useCreateQuotation = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: createQuotation,
        onSuccess: (res) => {
            toast.success(res?.message || "Quotation created successfully!");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
            queryClient.invalidateQueries({ queryKey: ["nextQuotationNumber"] });
            navigate("/sales/quotation");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to create quotation.");
        }
    });
};

// Update quotation mutation
export const useUpdateQuotation = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: updateQuotation,
        onSuccess: (res, variables) => {
            toast.success(res?.message || "Quotation updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
            queryClient.invalidateQueries({ queryKey: ["quotationDetail", variables.id] });
            navigate("/sales/quotation");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update quotation.");
        }
    });
};

// Create revision mutation
export const useCreateQuotationRevision = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: createQuotationRevision,
        onSuccess: (res) => {
            toast.success("New revision created successfully!");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
            const newId = res?.data?.id;
            if (newId) {
                navigate(`/sales/quotation/${newId}/edit`);
            } else {
                navigate("/sales/quotation");
            }
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to create revision.");
        }
    });
};

// Approve quotation mutation
export const useApproveQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: approveQuotation,
        onSuccess: (res, variables) => {
            toast.success(res?.message || "Approval status updated!");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
            queryClient.invalidateQueries({ queryKey: ["quotationDetail", variables.id] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update approval.");
        }
    });
};

// Delete quotation mutation
export const useDeleteQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteQuotation,
        onSuccess: (res) => {
            toast.success(res?.message || "Quotation moved to trash.");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete quotation.");
        }
    });
};

// Restore quotation mutation
export const useRestoreQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: restoreQuotation,
        onSuccess: (res) => {
            toast.success(res?.message || "Quotation restored.");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to restore quotation.");
        }
    });
};

// Bulk delete mutation
export const useBulkDeleteQuotations = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bulkDeleteQuotations,
        onSuccess: () => {
            toast.success("Selected quotations moved to trash.");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Bulk delete failed.");
        }
    });
};

// Bulk restore mutation
export const useBulkRestoreQuotations = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: bulkRestoreQuotations,
        onSuccess: () => {
            toast.success("Selected quotations restored.");
            queryClient.invalidateQueries({ queryKey: ["quotationsList"] });
            queryClient.invalidateQueries({ queryKey: ["quotationPagination"] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Bulk restore failed.");
        }
    });
};

// Download / Preview PDF Hook
export const useDownloadQuotationPdf = () => {
    return useMutation({
        mutationFn: downloadQuotationPdf,
        onSuccess: (blob, quotationNo) => {
            const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Quotation_${quotationNo || 'doc'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to download PDF.");
        }
    });
};
