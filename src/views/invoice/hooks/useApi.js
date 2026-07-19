import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInvoice, deleteInvoice, downloadInvoice, getInvoice, getInvoiceById, getInvoicePagination, getUnmappedEwayBillByInvoiceId, getUnmappedInvoiceChallanByInvoiceId, getUnmappedPurchaseOrderByInvoiceId, updateInvoice } from "../api";
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
            // const data = {
            //     "invoiceId": 47,
            //     "invoiceNo": "INV-2025-012",
            //     "invoiceDate": "2025-08-24T18:30:00.000Z",
            //     "dueDays": 15,
            //     "dueDate": "2025-09-10T18:30:00.000Z",
            //     "firmId": 1,
            //     "companyName": "Omega Precision Works Pvt Ltd",
            //     "firmType": "Pvt Ltd",
            //     "companyLogo": "https://example.com/omega/logo-updated.png",
            //     "firmGstin": "27ABCDE5678G1Z2",
            //     "invoicePrefix": "OPW",
            //     "notesFooter": "We appreciate your continued partnership.",
            //     "companyEntityType": "firm",
            //     "companyEmail": "info@kewexample.com",
            //     "companyPhoneNumber": "9876543210",
            //     "companyWebsite": "https://kewexample.com",
            //     "companyAddress": "Plot 42, MIDC Industrial Area",
            //     "companyCityId": 302,
            //     "companyStateId": 21,
            //     "companyPincode": 422101,
            //     "customerName": "ABC Traders Pvt Ltd",
            //     "hasGst": true,
            //     "gstNumber": "27ABCDE1234F1Z5",
            //     "billingEmail": "billing@abctraders.com",
            //     "billingPhoneNumber": "9876543210",
            //     "billingWebsite": "https://abctraders.com",
            //     "billingAddress": "123 Business Park, MG Road",
            //     "billingCityId": 101,
            //     "billingStateId": 27,
            //     "billingPincode": 422010,
            //     "shippingEmail": "warehouse@abctraders.com",
            //     "shippingPhoneNumber": "9876501234",
            //     "shippingAddress": "Plot No 456, Industrial Area",
            //     "shippingCityId": 102,
            //     "shippingStateId": 27,
            //     "shippingPincode": 422011,
            //     "hasChallan": false,
            //     "hasPo": false,
            //     "hasEwayBill": false,
            //     "subTotal": "57500.00",
            //     "discountPercent": "0.00",
            //     "discountAmount": "5750.00",
            //     "taxableAmount": "51750.00",
            //     "cgst": "168.75",
            //     "sgst": "168.75",
            //     "igst": "0.00",
            //     "total": "52087.50",
            //     "roundOff": "0.00",
            //     "other": "0.00",
            //     "paymentStatusId": 1,
            //     "paymentModeId": 2,
            //     "bankName": "HDFC Bank",
            //     "accountNumber": "123456789012",
            //     "ifscCode": "HDFC0001234",
            //     "branchName": "Nashik MIDC Branch",
            //     "items": [
            //         {
            //             "id": 53,
            //             "invoiceId": 47,
            //             "description": "Gold Necklace",
            //             "hsnSacCode": "71131910",
            //             "itemUnitId": 1,
            //             "uqc": "PCS",
            //             "qty": "2.00",
            //             "rate": "25000.00",
            //             "gstSlabId": 1,
            //             "gstRate": "0.00",
            //             "taxableAmount": "45000.00",
            //             "cgst": "0.00",
            //             "sgst": "0.00",
            //             "total": "45000.00"
            //         },
            //         {
            //             "id": 55,
            //             "invoiceId": 47,
            //             "description": "Silver Bracelet",
            //             "hsnSacCode": "71141100",
            //             "itemUnitId": 1,
            //             "uqc": "PCS",
            //             "qty": "5.00",
            //             "rate": "1500.00",
            //             "gstSlabId": 2,
            //             "gstRate": "5.00",
            //             "taxableAmount": "6750.00",
            //             "cgst": "168.75",
            //             "sgst": "168.75",
            //             "total": "7087.50"
            //         }
            //     ]
            // }
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