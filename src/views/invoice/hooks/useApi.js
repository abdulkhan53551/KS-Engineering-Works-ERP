import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    bulkDeleteInvoices,
    bulkRestoreInvoices,
    createInvoice,
    deleteInvoice,
    downloadInvoice,
    getInvoice,
    getInvoiceById,
    getInvoicePagination,
    getLastInvoice,
    getNextInvoiceNumber,
    getUnmappedEwayBillByInvoiceId,
    getUnmappedInvoiceChallanByInvoiceId,
    getUnmappedPurchaseOrderByInvoiceId,
    restoreInvoice,
    updateInvoice
} from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";
import { useState } from "react";

// Get invoice pagination
export const useInvoicePagination = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["invoicePagination", page, pageSize, search, trash],
        queryFn: () => getInvoicePagination({ page, pageSize, search, trash }),
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

// Get invoice
export const useInvoice = ({ page, pageSize, search, trash = false }) => {
    return useQuery({
        queryKey: ["invoiceList", page, pageSize, search, trash],
        queryFn: () => getInvoice({ page, pageSize, search, trash }),
        keepPreviousData: true,
        select: (result) => {
            const paymentStatusColor = {
                PENDING: 'bg-warning',
                PAID: 'bg-success',
                PARTIAL: 'bg-info',
                FAILED: 'bg-danger',
                CANCELLED: 'bg-secondary',
                REFUNDED: 'bg-primary',
                UNPAID: 'bg-warning',
                OVERDUE: 'bg-danger'
            };

            const data = result?.data?.map(item => {
                const code = (item.paymentStatusCode || item.paymentStatus || '').toUpperCase();
                return {
                    ...item,
                    color: paymentStatusColor[code] ?? 'bg-secondary'
                };
            }) ?? [];

            return data;
        }
    });
};

// Get invoice by id
export const useInvoiceById = (id = 0) => {
    return useQuery({
        queryKey: ["invoiceById", id],
        queryFn: () => getInvoiceById(id),
        enabled: !!id,
        select: (result) => {
            const data = result?.data ?? {};
            const invoiceData = {
                ...result?.data,
                billingAddress: {
                    id: data.billingId,
                    email: data.billingEmail,
                    phoneNumber: data.billingPhoneNumber,
                    website: data.billingWebsite,
                    addressLine1: data.billingAddress,
                    cityId: data.billingCityId,
                    stateId: data.billingStateId,
                    pincode: data.billingPincode
                },
                shippingAddress: {
                    id: data.shippingId,
                    email: data.shippingEmail,
                    phoneNumber: data.shippingPhoneNumber,
                    addressLine1: data.shippingAddress,
                    cityId: data.shippingCityId,
                    stateId: data.shippingStateId,
                    pincode: data.shippingPincode
                }
            };

            return invoiceData;
        }
    });
};

// Create invoice
export const useCreateInvoice = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createInvoice"],
        mutationFn: createInvoice,
        onSuccess: (res) => {
            if (res.success) {
                const id = res.data?.id;
                toast.success(res.message || "Invoice created successfully.");
                queryClient.invalidateQueries({ queryKey: ['invoiceList'] });
                queryClient.invalidateQueries({ queryKey: ['invoicePagination'] });
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanList'] });
                queryClient.invalidateQueries({ queryKey: ['purchaseOrderList'] });
                queryClient.invalidateQueries({ queryKey: ['ewayBillList'] });
                navigate(`/sales/invoice/${id}/edit`, { replace: true });
            }
        }
    });
};

// Update invoice
export const useUpdateInvoice = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updateInvoice"],
        mutationFn: (data) => updateInvoice(id, data),
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Invoice updated successfully.");
                queryClient.invalidateQueries({ queryKey: ['invoiceList'] });
                queryClient.invalidateQueries({ queryKey: ['invoicePagination'] });
                queryClient.invalidateQueries({ queryKey: ['invoiceById'] });
                queryClient.invalidateQueries({ queryKey: ['unmappedInvoiceChallan'] });
                queryClient.invalidateQueries({ queryKey: ['unmappedPurchaseOrder'] });
                queryClient.invalidateQueries({ queryKey: ['unmappedEwayBill'] });
                queryClient.invalidateQueries({ queryKey: ['invoiceChallanList'] });
                queryClient.invalidateQueries({ queryKey: ['purchaseOrderList'] });
                queryClient.invalidateQueries({ queryKey: ['ewayBillList'] });
            }
        }
    });
};

// Delete invoice (Soft delete or Permanent delete)
export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deleteInvoice"],
        mutationFn: ({ id, isPermanentDelete = false }) => deleteInvoice(id, isPermanentDelete),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Invoice deleted successfully.");
            // Refresh the lists
            queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
            queryClient.invalidateQueries({ queryKey: ["invoicePagination"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceChallanList"] });
            queryClient.invalidateQueries({ queryKey: ["purchaseOrderList"] });
            queryClient.invalidateQueries({ queryKey: ["ewayBillList"] });
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

// Restore invoice from trash
export const useRestoreInvoice = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restoreInvoice"],
        mutationFn: (id) => restoreInvoice(id),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Invoice restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
            queryClient.invalidateQueries({ queryKey: ["invoicePagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore invoice.";
            toast.error(message);
        }
    });
};

// Bulk delete invoices (Soft delete or Permanent delete)
export const useBulkDeleteInvoices = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeleteInvoices"],
        mutationFn: ({ ids, isPermanentDelete = false }) => bulkDeleteInvoices({ ids, isPermanentDelete }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected invoices deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
            queryClient.invalidateQueries({ queryKey: ["invoicePagination"] });
            queryClient.invalidateQueries({ queryKey: ["invoiceChallanList"] });
            queryClient.invalidateQueries({ queryKey: ["purchaseOrderList"] });
            queryClient.invalidateQueries({ queryKey: ["ewayBillList"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete selected invoices.";
            toast.error(message);
        }
    });
};

// Bulk restore invoices from trash
export const useBulkRestoreInvoices = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestoreInvoices"],
        mutationFn: ({ ids }) => bulkRestoreInvoices({ ids }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected invoices restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
            queryClient.invalidateQueries({ queryKey: ["invoicePagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore selected invoices.";
            toast.error(message);
        }
    });
};

// Get unmapped invoice challan by invoice id
export const useUnmappedInvoiceChallanByInvoiceId = (id) => {
    return useQuery({
        queryKey: ["unmappedInvoiceChallan", id],
        queryFn: () => getUnmappedInvoiceChallanByInvoiceId(id),
        staleTime: 5 * 60 * 1000,
        select: (result) => {
            const structuredData = result?.data?.map(item => ({
                documentId: item.challanId,
                documentNo: item.challanNo,
                documentDate: item.challanDate,
                isInvoiced: item.isInvoiced,
                invoiceId: item.invoiceId,
                customerName: item.customerName,
            })) ?? [];

            return structuredData;
        }
    });
}

// Get unmapped purchase order by invoice id
export const useUnmappedPurchaseOrderByInvoiceId = (id) => {
    return useQuery({
        queryKey: ["unmappedPurchaseOrder", id],
        queryFn: () => getUnmappedPurchaseOrderByInvoiceId(id),
        staleTime: 5 * 60 * 1000,
        select: (result) => {
            const structuredData = result?.data?.map(item => ({
                documentId: item.poId,
                documentNo: item.poNo,
                documentDate: item.poDate,
                isInvoiced: item.isInvoiced,
                invoiceId: item.invoiceId,
                customerName: item.customerName,
            })) ?? [];

            return structuredData;
        }
    });
}

// Get unmapped eway bill by invoice id
export const useUnmappedEwayBillByInvoiceId = (id) => {
    return useQuery({
        queryKey: ["unmappedEwayBill", id],
        queryFn: () => getUnmappedEwayBillByInvoiceId(id),
        staleTime: 5 * 60 * 1000,
        select: (result) => {
            const structuredData = result?.data?.map(item => ({
                documentId: item.ewayBillId,
                documentNo: item.ewayBillNo,
                documentDate: item.ewayBillDate,
                validUpto: item.validUpto,
                isInvoiced: item.isInvoiced,
                invoiceId: item.invoiceId,
                customerName: item.customerName,
            })) ?? [];

            return structuredData;
        }
    });
}

// Download invoice
export const useDownloadInvoice = () => {
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

    const mutation = useMutation({
        mutationKey: ["downloadInvoice"],
        mutationFn: downloadInvoice,

        onMutate: (invoiceId) => {
            setDownloadingInvoiceId(invoiceId);
        },

        onSuccess: (response, invoiceId) => {
            const disposition = response.headers["content-disposition"];

            let fileName = `Invoice-${invoiceId}.pdf`;

            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match?.[1]) {
                    fileName = match[1];
                }
            }

            const blobUrl = window.URL.createObjectURL(response.data);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = fileName;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            toast.success("Invoice downloaded successfully.");
        },

        onSettled: () => {
            setDownloadingInvoiceId(null);
        },

        onError: (error) => {
            toast.error(
                error?.message ||
                "Failed to download invoice."
            );
        },
    });

    return {
        ...mutation,
        downloadingInvoiceId,
    };
};

// Get next invoice number
export const useGetNextInvoiceNumber = (enabled) => {
    return useQuery({
        queryKey: ["getNextInvoiceNumber"],
        queryFn: getNextInvoiceNumber,
        enabled: enabled,
        staleTime: 0,
        cacheTime: 0,
        gcTime: 0,
        refetchOnMount: "always",
        refetchOnReconnect: true,
        select: (result) => result?.data ?? {},
    });
};