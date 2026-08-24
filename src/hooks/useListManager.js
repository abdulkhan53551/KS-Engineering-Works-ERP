import { useState, useCallback, useMemo } from 'react';
import useDebounce from './useDebounce';

/**
 * Custom hook to manage common list state:
 * - Pagination (page, pageSize, handlePageChange)
 * - Search with debouncing (search, debouncedSearch, handleSearch, clearSearch)
 * - Active / Trash tab state (isTrash, handleTabChange)
 * - Row multi-selection (selectedIds, handleSelectAll, handleSelectRow, handleDeselectAll, isAllSelected, isIndeterminate)
 *
 * @param {Object} options
 * @param {Array} options.items - Current items displayed in the list/table
 * @param {string|Function} [options.idKey='id'] - Key name or extractor function to get item ID
 * @param {number} [options.initialPage=1] - Starting page number
 * @param {number} [options.initialPageSize=10] - Default items per page
 * @param {string} [options.initialSearch=''] - Initial search query
 * @param {boolean} [options.initialTrash=false] - Initial trash tab state
 * @param {number} [options.debounceDelay=400] - Debounce delay in ms
 */
export const useListManager = ({
    items = [],
    idKey = 'id',
    initialPage = 1,
    initialPageSize = 10,
    initialSearch = '',
    initialTrash = false,
    debounceDelay = 400
} = {}) => {
    // 1. Pagination State
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // 2. Search State & Debouncing
    const [search, setSearch] = useState(initialSearch);
    const debouncedSearch = useDebounce(search, debounceDelay);

    // 3. Active / Trash Tab State
    const [isTrash, setIsTrash] = useState(initialTrash);

    // 4. Multi-Selection State
    const [selectedIds, setSelectedIds] = useState([]);

    // Helper to extract item ID
    const getItemId = useCallback((item) => {
        if (typeof idKey === 'function') return idKey(item);
        return item?.[idKey];
    }, [idKey]);

    // Handlers
    const handleTabChange = useCallback((trashState) => {
        setIsTrash(trashState);
        setPage(1);
        setSelectedIds([]);
    }, []);

    const handleSearch = useCallback((e) => {
        const val = e && typeof e === 'object' && 'target' in e ? e.target.value : (e || '');
        setSearch(val);
        setPage(1);
        setSelectedIds([]);
    }, []);

    const clearSearch = useCallback(() => {
        setSearch('');
        setPage(1);
        setSelectedIds([]);
    }, []);

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
        setSelectedIds([]);
    }, []);

    const handlePageSizeChange = useCallback((newSize) => {
        setPageSize(Number(newSize));
        setPage(1);
        setSelectedIds([]);
    }, []);

    // Multi-selection handlers
    const currentItemIds = useMemo(() => {
        return (items || []).map(getItemId).filter(Boolean);
    }, [items, getItemId]);

    const handleSelectAll = useCallback((e) => {
        const isChecked = e && typeof e === 'object' && 'target' in e ? e.target.checked : Boolean(e);
        if (isChecked) {
            setSelectedIds(currentItemIds);
        } else {
            setSelectedIds([]);
        }
    }, [currentItemIds]);

    const handleSelectRow = useCallback((id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }, []);

    const handleDeselectAll = useCallback(() => {
        setSelectedIds([]);
    }, []);

    // Selection metrics
    const isAllSelected = useMemo(() => {
        if (!currentItemIds.length) return false;
        return currentItemIds.every((id) => selectedIds.includes(id));
    }, [currentItemIds, selectedIds]);

    const isIndeterminate = useMemo(() => {
        if (!currentItemIds.length) return false;
        const selectedInPage = currentItemIds.filter((id) => selectedIds.includes(id));
        return selectedInPage.length > 0 && selectedInPage.length < currentItemIds.length;
    }, [currentItemIds, selectedIds]);

    return {
        // Pagination
        page,
        setPage,
        pageSize,
        setPageSize,
        handlePageChange,
        handlePageSizeChange,

        // Search
        search,
        setSearch,
        debouncedSearch,
        handleSearch,
        clearSearch,

        // Trash Tab
        isTrash,
        setIsTrash,
        handleTabChange,

        // Multi-selection
        selectedIds,
        setSelectedIds,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount: selectedIds.length
    };
};

export default useListManager;
