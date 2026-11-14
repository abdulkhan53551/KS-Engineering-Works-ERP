import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';

/**
 * Custom hook to manage Invoice list filters synchronized with URL search params.
 * Handles payment status, date presets, custom date range, and e-way bill status.
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
    const search = searchParams.get('search') || '';

    // Local temporary states for custom date range picker inputs
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

    // Keep temporary date inputs synced when URL date filters change (e.g. Back/Forward/Reset)
    useEffect(() => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
    }, [startDate, endDate]);

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

    const handleEwayBillChange = useCallback((val) => {
        updateFilterParams({ ewayBill: val });
    }, [updateFilterParams]);

    const handleDatePresetChange = useCallback((preset) => {
        if (preset === 'today') {
            const today = moment().format('YYYY-MM-DD');
            updateFilterParams({
                datePreset: 'today',
                startDate: today,
                endDate: today
            });
        } else if (preset === 'thisMonth') {
            const start = moment().startOf('month').format('YYYY-MM-DD');
            const end = moment().endOf('month').format('YYYY-MM-DD');
            updateFilterParams({
                datePreset: 'thisMonth',
                startDate: start,
                endDate: end
            });
        } else if (preset === 'lastMonth') {
            const start = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
            const end = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
            updateFilterParams({
                datePreset: 'lastMonth',
                startDate: start,
                endDate: end
            });
        } else if (preset === 'thisFY') {
            const currentMonth = moment().month(); // 0-indexed (April is 3)
            const startYear = currentMonth >= 3 ? moment().year() : moment().year() - 1;
            const start = moment(`${startYear}-04-01`).format('YYYY-MM-DD');
            const end = moment(`${startYear + 1}-03-31`).format('YYYY-MM-DD');
            updateFilterParams({
                datePreset: 'thisFY',
                startDate: start,
                endDate: end
            });
        } else if (preset === 'all') {
            updateFilterParams({
                datePreset: '',
                startDate: '',
                endDate: ''
            });
            setTempStartDate('');
            setTempEndDate('');
        }
    }, [updateFilterParams]);

    const handleApplyCustomDates = useCallback(() => {
        updateFilterParams({
            datePreset: 'custom',
            startDate: tempStartDate,
            endDate: tempEndDate
        });
    }, [updateFilterParams, tempStartDate, tempEndDate]);

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
        setTempStartDate('');
        setTempEndDate('');
        onFilterChangeRef.current?.();
    }, [clearSearch, setSearchParams]);

    const hasActiveFilters = Boolean(search || statusFilter || startDate || endDate || ewayBillFilter);

    return {
        // Active filter state values
        statusFilter,
        startDate,
        endDate,
        ewayBillFilter,
        datePreset,
        hasActiveFilters,

        // Custom Date inputs
        tempStartDate,
        setTempStartDate,
        tempEndDate,
        setTempEndDate,

        // Filter Actions
        handleStatusChange,
        handleEwayBillChange,
        handleDatePresetChange,
        handleApplyCustomDates,
        handleResetFilters,
        getDateLabel,
        updateFilterParams
    };
};

export default useInvoiceFilters;
