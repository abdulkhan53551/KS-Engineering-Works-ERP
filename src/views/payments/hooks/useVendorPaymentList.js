import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    useVendorPayments,
    useVendorPaymentsMeta,
    useVendorPaymentsSummary,
    useCancelVendorPayment,
    useDeletePayment,
    useRestorePayment,
    useBulkDeletePayments,
    useBulkRestorePayments
} from './usePaymentApi';
import { downloadVendorPaymentPdf } from '../api';

/**
 * useVendorPaymentList Hook
 * Encapsulates filter state, data queries, sorting, pagination,
 * PDF download, trash/recycle bin actions, and cancellation modal logic for VendorPaymentList.
 */
export const useVendorPaymentList = () => {
    // Tenant / Firm Context
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? '' : activeFirm?.id;

    // Active vs Recycle Bin State
    const [isTrash, setIsTrash] = useState(false);

    // Filters state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('payment_date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Reset pagination to page 1 on firm switch or tab switch
    useEffect(() => {
        setPage(1);
    }, [firmId, isTrash]);

    // Cancel modal state
    const [cancelModalItem, setCancelModalItem] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const filters = useMemo(() => {
        const f = { page, pageSize, sortBy, sortOrder, trash: isTrash };
        if (search) f.search = search.trim();
        if (statusFilter) f.status = statusFilter;
        if (firmId) f.firmId = firmId;
        if (startDate) f.startDate = startDate;
        if (endDate) f.endDate = endDate;
        return f;
    }, [page, pageSize, search, statusFilter, firmId, startDate, endDate, sortBy, sortOrder, isTrash]);

    const { data: payments = [], isLoading } = useVendorPayments(filters);
    const { data: meta = {} } = useVendorPaymentsMeta(filters);
    const { data: summary = {} } = useVendorPaymentsSummary(filters);
    const { mutate: cancelPaymentMutate, isPending: isCancelling } = useCancelVendorPayment();

    // Trash & Delete Mutations
    const deletePaymentMutation = useDeletePayment();
    const restorePaymentMutation = useRestorePayment();
    const bulkDeleteMutation = useBulkDeletePayments();
    const bulkRestoreMutation = useBulkRestorePayments();

    // Sorting handler
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // PDF Download handler
    const handleDownloadPdf = async (id, paymentNo) => {
        try {
            await downloadVendorPaymentPdf(id, paymentNo);
            toast.success(`Payment voucher ${paymentNo} downloaded successfully.`);
        } catch (err) {
            toast.error(err?.message || 'Failed to download payment PDF.');
        }
    };

    // Cancel payment confirmation
    const handleConfirmCancel = () => {
        if (!cancelModalItem) return;
        cancelPaymentMutate(
            { id: cancelModalItem.id, reason: cancelReason },
            {
                onSuccess: () => {
                    setCancelModalItem(null);
                    setCancelReason('');
                }
            }
        );
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    return {
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        sortBy,
        sortOrder,
        cancelModalItem,
        setCancelModalItem,
        cancelReason,
        setCancelReason,
        payments,
        isLoading,
        summary,
        isCancelling,
        handleSort,
        handleDownloadPdf,
        handleConfirmCancel,
        handleResetFilters,
        isAllFirms,
        activeFirm,
        firmId,
        isTrash,
        setIsTrash,
        meta,
        deletePaymentMutation,
        restorePaymentMutation,
        bulkDeleteMutation,
        bulkRestoreMutation
    };
};

export default useVendorPaymentList;
