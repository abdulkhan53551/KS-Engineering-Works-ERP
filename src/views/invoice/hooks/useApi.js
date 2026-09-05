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

            // Inspect invoice contacts array if returned by backend
            const contactsList = Array.isArray(data.invoice_contacts)
                ? data.invoice_contacts
                : (Array.isArray(data.invoiceContacts) ? data.invoiceContacts : (Array.isArray(data.contacts) ? data.contacts : []));

            const billingContact = contactsList.find(c =>
                String(c.type || c.contactType || '').toUpperCase() === 'BILLING' || c.isBilling === true
            ) || {};

            const shippingContact = contactsList.find(c =>
                String(c.type || c.contactType || '').toUpperCase() === 'SHIPPING' || c.isShipping === true
            ) || {};

            const rawBilling = (typeof data.billingAddress === 'object' && data.billingAddress !== null) ? data.billingAddress : {};
            const rawShipping = (typeof data.shippingAddress === 'object' && data.shippingAddress !== null) ? data.shippingAddress : {};

            const billingBranchName = data.billing_branch_name || data.billingBranchName || rawBilling.branchName || rawBilling.branch_name || billingContact.branch_name || billingContact.branchName || "";
            const billingGstin = data.billing_gstin || data.billingGstin || rawBilling.gstin || billingContact.gstin || "";

            const shippingBranchName = data.shipping_branch_name || data.shippingBranchName || rawShipping.branchName || rawShipping.branch_name || shippingContact.branch_name || shippingContact.branchName || "";
            const shippingGstin = data.shipping_gstin || data.shippingGstin || rawShipping.gstin || shippingContact.gstin || "";

            const invoiceData = {
                ...result?.data,
                // Normalized root-level branch snapshot names for easy access
                billing_branch_name: billingBranchName,
                shipping_branch_name: shippingBranchName,
                billing_gstin: billingGstin,
                shipping_gstin: shippingGstin,

                billingAddress: {
                    ...rawBilling,
                    id: data.billingId ?? rawBilling.id ?? billingContact.id,
                    branchName: billingBranchName,
                    gstin: billingGstin,
                    email: data.billingEmail ?? rawBilling.email ?? billingContact.email,
                    phoneNumber: data.billingPhoneNumber ?? rawBilling.phoneNumber ?? rawBilling.mobile ?? billingContact.phoneNumber ?? billingContact.mobile,
                    website: data.billingWebsite ?? rawBilling.website ?? billingContact.website,
                    addressLine1: typeof data.billingAddress === 'string'
                        ? data.billingAddress
                        : (rawBilling.addressLine1 || rawBilling.address || billingContact.address || billingContact.addressLine1 || ""),
                    cityId: data.billingCityId ?? rawBilling.cityId ?? rawBilling.city_id ?? billingContact.cityId ?? billingContact.city_id,
                    stateId: data.billingStateId ?? rawBilling.stateId ?? rawBilling.state_id ?? billingContact.stateId ?? billingContact.state_id,
                    pincode: data.billingPincode ?? rawBilling.pincode ?? billingContact.pincode
                },
                shippingAddress: {
                    ...rawShipping,
                    id: data.shippingId ?? rawShipping.id ?? shippingContact.id,
                    branchName: shippingBranchName,
                    gstin: shippingGstin,
                    email: data.shippingEmail ?? rawShipping.email ?? shippingContact.email,
                    phoneNumber: data.shippingPhoneNumber ?? rawShipping.phoneNumber ?? rawShipping.mobile ?? shippingContact.phoneNumber ?? shippingContact.mobile,
                    addressLine1: typeof data.shippingAddress === 'string'
                        ? data.shippingAddress
                        : (rawShipping.addressLine1 || rawShipping.address || shippingContact.address || shippingContact.addressLine1 || ""),
                    cityId: data.shippingCityId ?? rawShipping.cityId ?? rawShipping.city_id ?? shippingContact.cityId ?? shippingContact.city_id,
                    stateId: data.shippingStateId ?? rawShipping.stateId ?? rawShipping.state_id ?? shippingContact.stateId ?? shippingContact.state_id,
                    pincode: data.shippingPincode ?? rawShipping.pincode ?? shippingContact.pincode
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
export const useUnmappedInvoiceChallanByInvoiceId = (id = 0) => {
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
export const useUnmappedPurchaseOrderByInvoiceId = (id = 0) => {
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
export const useUnmappedEwayBillByInvoiceId = (id = 0) => {
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

        onMutate: (payload) => {
            const invoiceId = (typeof payload === 'object' && payload !== null) ? (payload.invoiceId || payload.id) : payload;
            setDownloadingInvoiceId(invoiceId);
        },

        onSuccess: (response, payload) => {
            const invoiceId = (typeof payload === 'object' && payload !== null) ? (payload.invoiceId || payload.id) : payload;
            const fallbackNo = (typeof payload === 'object' && payload !== null) ? payload.invoiceNo : null;
            const disposition = response.headers["content-disposition"];

            let fileName = fallbackNo ? `Invoice-${fallbackNo}.pdf` : `Invoice-${invoiceId}.pdf`;

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