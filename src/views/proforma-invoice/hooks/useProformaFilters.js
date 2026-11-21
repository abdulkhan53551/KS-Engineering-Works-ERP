import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook to manage filters, search, tabs, and pagination for Proforma Invoice list.
 */
export const useProformaFilters = ({
    initialPage = 1,
    initialPageSize = 10
} = {}) => {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [searchTerm, setSearchTerm] = useState('');
    const [trash, setTrash] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        setPage(1);
    }, []);

    const handleStatusFilterChange = useCallback((status) => {
        setStatusFilter(status);
        setPage(1);
    }, []);

    const handleDateRangeChange = useCallback((start, end) => {
        setStartDate(start || '');
        setEndDate(end || '');
        setPage(1);
    }, []);

    const handleToggleTrash = useCallback(() => {
        setTrash(prev => !prev);
        setPage(1);
    }, []);

    const handleResetFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('');
        setStartDate('');
        setEndDate('');
        setTrash(false);
        setPage(1);
    }, []);

    const queryParams = useMemo(() => ({
        page,
        pageSize,
        search: searchTerm,
        trash,
        status: statusFilter,
        startDate,
        endDate
    }), [page, pageSize, searchTerm, trash, statusFilter, startDate, endDate]);

    return {
        page,
        setPage,
        pageSize,
        setPageSize,
        searchTerm,
        setSearchTerm,
        trash,
        setTrash,
        statusFilter,
        setStatusFilter,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        handleSearchChange,
        handleStatusFilterChange,
        handleDateRangeChange,
        handleToggleTrash,
        handleResetFilters,
        queryParams
    };
};

export default useProformaFilters;
