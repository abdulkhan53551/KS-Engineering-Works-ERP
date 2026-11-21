import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';

/**
 * Custom hook to manage Invoice list filters synchronized with URL search params.
 * Handles payment status, customer/party, overdue aging, date presets, custom date range,
 * amount bounds, and e-way bill status.
 */
export const useInvoiceFilters = ({
    clearSearch,
    onFilterChange
} = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Keep callback ref updated to prevent re-creating handlers unnecessarily
    const onFilterChangeRef = useRef(onFilterChange);
    useEffect(() => {
        onFilterChangeRef.current = onFilterChange;
    }, [onFilterChange]);

    // Derived filter values from URL query parameters (Single Source of Truth)
    const statusFilter = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const ewayBillFilter = searchParams.get('ewayBill') || '';
    const datePreset = searchParams.get('datePreset') || '';
    const partyId = searchParams.get('partyId') || '';
    const isOverdue = searchParams.get('isOverdue') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';

    // Helper to safely update filter params in URL and reset pagination page to 1
    const updateFilterParams = useCallback((updates) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    next.set(key, String(value));
                } else {
                    next.delete(key);
                }
            });
            // Reset page to 1 whenever any filter changes
            next.delete('page');
            return next;
        }, { replace: true });

        onFilterChangeRef.current?.();
    }, [setSearchParams]);

    const handleStatusChange = useCallback((status) => {
        updateFilterParams({ status });
    }, [updateFilterParams]);

    const getDateLabel = useCallback(() => {
        if (datePreset === 'today') return 'Today';
        if (datePreset === 'thisMonth') return 'This Month';
        if (datePreset === 'lastMonth') return 'Last Month';
        if (datePreset === 'thisFY') return 'Current FY';
        if (startDate && endDate) return `${moment(startDate).format('DD MMM')} - ${moment(endDate).format('DD MMM')}`;
        if (startDate) return `From ${moment(startDate).format('DD MMM')}`;
        if (endDate) return `Until ${moment(endDate).format('DD MMM')}`;
        return 'All Dates';
    }, [datePreset, startDate, endDate]);

    // Remove single filter helper
    const handleRemoveFilter = useCallback((key) => {
        if (key === 'dates') {
            updateFilterParams({ datePreset: '', startDate: '', endDate: '' });
        } else if (key === 'amount') {
            updateFilterParams({ minAmount: '', maxAmount: '' });
        } else {
            updateFilterParams({ [key]: '' });
        }
    }, [updateFilterParams]);

    const handleResetFilters = useCallback(() => {
        if (typeof clearSearch === 'function') {
            clearSearch();
        }
        setSearchParams((prev) => {
            const next = new URLSearchParams();
            if (prev.get('trash') === 'true') {
                next.set('trash', 'true');
            }
            const ps = prev.get('pageSize');
            if (ps && ps !== '10') {
                next.set('pageSize', ps);
            }
            return next;
        }, { replace: true });
        onFilterChangeRef.current?.();
    }, [clearSearch, setSearchParams]);

    // Active filter dimension counter (for badge on toolbar button)
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (partyId) count += 1;
        if (statusFilter) count += 1;
        if (isOverdue === 'true') count += 1;
        if (startDate || endDate || datePreset) count += 1;
        if (minAmount || maxAmount) count += 1;
        if (ewayBillFilter !== '') count += 1;
        return count;
    }, [partyId, statusFilter, isOverdue, startDate, endDate, datePreset, minAmount, maxAmount, ewayBillFilter]);

    return {
        // Active filter state values
        statusFilter,
        partyId,
        isOverdue,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        ewayBillFilter,
        datePreset,
        activeFilterCount,

        // Filter Actions
        handleStatusChange,
        handleRemoveFilter,
        handleResetFilters,
        getDateLabel,
        updateFilterParams
    };
};

export default useInvoiceFilters;
