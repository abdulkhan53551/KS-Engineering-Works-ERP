import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInvoice, deleteInvoice, downloadInvoice, getInvoice, getInvoiceById, getInvoicePagination, getLastInvoice, getNextInvoiceNumber, getUnmappedEwayBillByInvoiceId, getUnmappedInvoiceChallanByInvoiceId, getUnmappedPurchaseOrderByInvoiceId, updateInvoice } from "../api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";
import { useState } from "react";

// Get invoice pagination
export const useInvoicePagination = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["invoicePagination", page, pageSize, search],
        queryFn: () => getInvoicePagination({ page, pageSize, search }),
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

// Get invoice
export const useInvoice = ({ page, pageSize, search }) => {
    return useQuery({
        queryKey: ["invoiceList", page, pageSize, search],
        queryFn: () => getInvoice({ page, pageSize, search }),
        keepPreviousData: true,
        select: (result) => {

            const paymentStatusColor = {
                PENDING: 'bg-warning',
                PAID: 'bg-success',
                PARTIAL: 'bg-info',
                FAILED: 'bg-danger',
                CANCELLED: 'bg-secondary',
                REFUNDED: 'bg-primary'
            };

            // const data = json.parse(JSON.stringify(result?.data ?? []));
            const data = result?.data?.map(item => ({
                ...item,
                color: paymentStatusColor[item.paymentStatusCode] ?? 'bg-secondary'
            })) ?? [];

            return data;
        }
    });
}

// Get invoice by id
export const useInvoiceById = (id = 0) => {
    return useQuery({
        queryKey: ["invoiceById", id],
        queryFn: () => getInvoiceById(id),
        enabled: !!id,
        select: (result) => {
            // return result?.data ?? {};
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
            }

            return invoiceData;
        }
    });
}

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
                queryClient.invalidateQueries({ queryKey: ['invoiceList'] })
                queryClient.invalidateQueries({ queryKey: ['invoicePagination'] });
                navigate(`/sales/invoice/${id}/edit`, { replace: true });
            }
        }
    });
}

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
            }
        }
    });
}

// Delete invoice
export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { showModal, closeModal } = useUIManager();


    return useMutation({
        mutationKey: ["deleteInvoice"],
        mutationFn: deleteInvoice,
        onSuccess: (res) => {
            if (res.success) {
                dispatch(clearLoading());
                closeModal();
                toast.success(res.message || "Invoice deleted successfully.");
                // Refresh the list
                queryClient.invalidateQueries({ queryKey: ["invoiceList"] });
                queryClient.invalidateQueries({ queryKey: ["invoicePagination"] });
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

// Get unmapped invoice challan by invoice id
export const useUnmappedInvoiceChallanByInvoiceId = (id) => {
    return useQuery({
        queryKey: ["unmappedInvoiceChallan", id],
        queryFn: () => getUnmappedInvoiceChallanByInvoiceId(id),
        enabled: false,
        select: (result) => {
            // const data = result?.data ?? [];
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
        enabled: false,
        select: (result) => {
            // const data = result?.data ?? [];
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
        enabled: false,
        select: (result) => {
            // const data = result?.data ?? [];
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