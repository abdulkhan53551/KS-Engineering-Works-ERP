import { useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
    useVendorPayments,
    useVendorPaymentsSummary,
    useCancelVendorPayment
} from './usePaymentApi';
import { downloadVendorPaymentPdf } from '../api';

/**
 * useVendorPaymentList Hook
 * Encapsulates filter state, data queries, sorting, pagination,
 * PDF download, and cancellation modal logic for VendorPaymentList.
 */
export const useVendorPaymentList = () => {
    // Filters state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('payment_date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Cancel modal state
    const [cancelModalItem, setCancelModalItem] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

    const filters = useMemo(() => {
        const f = { page, pageSize, sortBy, sortOrder };
        if (search) f.search = search;
        if (statusFilter) f.status = statusFilter;
        if (startDate) f.startDate = startDate;
        if (endDate) f.endDate = endDate;
        return f;
    }, [page, pageSize, search, statusFilter, startDate, endDate, sortBy, sortOrder]);

    const { data: payments = [], isLoading } = useVendorPayments(filters);
    const { data: summary = {} } = useVendorPaymentsSummary(filters);
    const { mutate: cancelPaymentMutate, isPending: isCancelling } = useCancelVendorPayment();

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
        handleResetFilters
    };
};

export default useVendorPaymentList;
