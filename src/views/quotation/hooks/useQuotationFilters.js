import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import moment from 'moment';

/**
 * Custom hook to manage Quotation list filters synchronized with URL search params.
 * Handles approval status, lifecycle status/stage, date presets, and custom date ranges.
 */
export const useQuotationFilters = ({
    clearSearch,
    onFilterChange
} = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // Callback ref to prevent stale closures and unnecessary re-renders
    const onFilterChangeRef = useRef(onFilterChange);
    useEffect(() => {
        onFilterChangeRef.current = onFilterChange;
    }, [onFilterChange]);

    // Single source of truth: filter values parsed directly from URL query parameters
    const statusFilter = searchParams.get('status') || '';
    const approvalStatusFilter = searchParams.get('approvalStatus') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const datePreset = searchParams.get('datePreset') || '';
    const search = searchParams.get('search') || '';

    // Local temporary states for the custom date range picker inputs
    const [tempStartDate, setTempStartDate] = useState(startDate);
    const [tempEndDate, setTempEndDate] = useState(endDate);

    // Sync temporary date inputs when URL params change (e.g. Browser Back/Forward, Reset)
    useEffect(() => {
        setTempStartDate(startDate);
        setTempEndDate(endDate);
    }, [startDate, endDate]);

    // Helper to safely update URL search params and automatically reset pagination to page 1
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

    const handleApprovalStatusChange = useCallback((approvalStatus) => {
        updateFilterParams({ approvalStatus });
    }, [updateFilterParams]);

    const handleStatusChange = useCallback((status) => {
        updateFilterParams({ status });
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

    const hasActiveFilters = Boolean(search || statusFilter || approvalStatusFilter || startDate || endDate || datePreset);

    return {
        // Filter values from URL
        statusFilter,
        approvalStatusFilter,
        startDate,
        endDate,
        datePreset,
        hasActiveFilters,

        // Custom Date inputs
        tempStartDate,
        setTempStartDate,
        tempEndDate,
        setTempEndDate,

        // Actions
        handleStatusChange,
        handleApprovalStatusChange,
        handleDatePresetChange,
        handleApplyCustomDates,
        handleResetFilters,
        getDateLabel,
        updateFilterParams
    };
};

export default useQuotationFilters;
