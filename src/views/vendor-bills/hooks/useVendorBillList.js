import { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
    useVendorBills,
    useVendorBillsMeta,
    useVendorBillsSummary,
    useDeleteVendorBill
} from './useVendorBillApi';

/**
 * useVendorBillList Hook
 * Encapsulates filter state, pagination, sorting, data queries,
 * and delete confirmation logic for VendorBillList.
 */
export const useVendorBillList = () => {
    // Query state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('bill_date');
    const [sortOrder, setSortOrder] = useState('desc');

    const filters = useMemo(() => {
        const f = { page, pageSize, sortBy, sortOrder };
        if (search) f.search = search;
        if (statusFilter) f.paymentStatusId = statusFilter;
        if (startDate) f.startDate = startDate;
        if (endDate) f.endDate = endDate;
        return f;
    }, [page, pageSize, search, statusFilter, startDate, endDate, sortBy, sortOrder]);

    // TanStack Queries
    const { data: bills = [], isLoading } = useVendorBills(filters);
    const { data: meta = {} } = useVendorBillsMeta(filters);
    const { data: summary = {} } = useVendorBillsSummary(filters);
    const { mutate: deleteBillMutate, isPending: isDeleting } = useDeleteVendorBill();

    // Sorting handler
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    // Delete confirmation
    const handleDelete = (bill) => {
        const paidAmount = Number(bill.paidAmount || bill.paid_amount || 0);
        if (paidAmount > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Cannot Delete Bill',
                text: `This bill has ₹${paidAmount.toLocaleString('en-IN')} in payments linked to it. Delete or cancel the payments first.`,
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        Swal.fire({
            title: 'Delete Vendor Bill?',
            text: `Are you sure you want to delete bill "${bill.billNo || bill.bill_no}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Delete'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteBillMutate(bill.id);
            }
        });
    };

    const totalPages = meta.totalPages || 1;
    const totalRecords = meta.total || 0;

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
        bills,
        isLoading,
        meta,
        summary,
        totalPages,
        totalRecords,
        isDeleting,
        handleSort,
        handleResetFilters,
        handleDelete
    };
};

export default useVendorBillList;
