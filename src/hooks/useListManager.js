import { useState, useCallback, useMemo } from 'react';
import useDebounce from './useDebounce';

const EMPTY_ARRAY = [];

/**
 * Custom hook to manage list pagination, search, and active/trash tab state.
 * Completely independent of the items array to prevent unneeded re-render cascades.
 */
export const useListPagination = ({
    initialPage = 1,
    initialPageSize = 10,
    initialSearch = '',
    initialTrash = false,
    debounceDelay = 400
} = {}) => {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [search, setSearch] = useState(initialSearch);
    const debouncedSearch = useDebounce(search, debounceDelay);
    const [isTrash, setIsTrash] = useState(initialTrash);

    const handleTabChange = useCallback((trashState) => {
        setIsTrash(trashState);
        setPage(1);
    }, []);

    const handleSearch = useCallback((e) => {
        const val = e && typeof e === 'object' && 'target' in e ? e.target.value : (e || '');
        setSearch(val);
        setPage(1);
    }, []);

    const clearSearch = useCallback(() => {
        setSearch('');
        setPage(1);
    }, []);

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
    }, []);

    const handlePageSizeChange = useCallback((newSize) => {
        setPageSize(Number(newSize));
        setPage(1);
    }, []);

    return {
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        setSearch,
        debouncedSearch,
        handleSearch,
        clearSearch,
        isTrash,
        setIsTrash,
        handleTabChange,
        handlePageChange,
        handlePageSizeChange
    };
};

/**
 * Custom hook to manage row selection state.
 * Directly operates on the loaded items array.
 */
export const useRowSelection = ({
    items = EMPTY_ARRAY,
    idKey = 'id'
} = {}) => {
    const [selectedIds, setSelectedIds] = useState(EMPTY_ARRAY);

    const getItemId = useCallback((item) => {
        if (typeof idKey === 'function') return idKey(item);
        return item?.[idKey];
    }, [idKey]);

    const currentItemIds = useMemo(() => {
        return (items || []).map(getItemId).filter(Boolean);
    }, [items, getItemId]);

    const handleSelectAll = useCallback((e) => {
        const isChecked = e && typeof e === 'object' && 'target' in e ? e.target.checked : Boolean(e);
        if (isChecked) {
            setSelectedIds(currentItemIds);
        } else {
            setSelectedIds(EMPTY_ARRAY);
        }
    }, [currentItemIds]);

    const handleSelectRow = useCallback((id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }, []);

    const handleDeselectAll = useCallback(() => {
        setSelectedIds(EMPTY_ARRAY);
    }, []);

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

/**
 * Combined list manager hook (backward-compatible).
 */
export const useListManager = ({
    items = EMPTY_ARRAY,
    idKey = 'id',
    initialPage = 1,
    initialPageSize = 10,
    initialSearch = '',
    initialTrash = false,
    debounceDelay = 400
} = {}) => {
    const pagination = useListPagination({
        initialPage,
        initialPageSize,
        initialSearch,
        initialTrash,
        debounceDelay
    });

    const selection = useRowSelection({
        items,
        idKey
    });

    const { handleDeselectAll } = selection;
    const {
        handleTabChange: pagHandleTabChange,
        handleSearch: pagHandleSearch,
        clearSearch: pagClearSearch,
        handlePageChange: pagHandlePageChange,
        handlePageSizeChange: pagHandlePageSizeChange
    } = pagination;

    const handleTabChange = useCallback((trashState) => {
        pagHandleTabChange(trashState);
        handleDeselectAll();
    }, [pagHandleTabChange, handleDeselectAll]);

    const handleSearch = useCallback((e) => {
        pagHandleSearch(e);
        handleDeselectAll();
    }, [pagHandleSearch, handleDeselectAll]);

    const clearSearch = useCallback(() => {
        pagClearSearch();
        handleDeselectAll();
    }, [pagClearSearch, handleDeselectAll]);

    const handlePageChange = useCallback((newPage) => {
        pagHandlePageChange(newPage);
        handleDeselectAll();
    }, [pagHandlePageChange, handleDeselectAll]);

    const handlePageSizeChange = useCallback((newSize) => {
        pagHandlePageSizeChange(newSize);
        handleDeselectAll();
    }, [pagHandlePageSizeChange, handleDeselectAll]);

    return {
        ...pagination,
        ...selection,
        handleTabChange,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePageSizeChange
    };
};

export default useListManager;
