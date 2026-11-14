import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useDebounce from './useDebounce';

const EMPTY_ARRAY = [];

/**
 * Custom hook to manage list pagination, search, and active/trash tab state.
 * Synchronizes with URL query parameters for seamless back/forward navigation.
 */
export const useListPagination = ({
    initialPage = 1,
    initialPageSize = 10,
    initialSearch = '',
    initialTrash = false,
    debounceDelay = 400,
    syncUrl = true
} = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    // 1. Parse sanitized values from URL if syncUrl is enabled
    const parsedPageFromUrl = useMemo(() => {
        if (!syncUrl) return initialPage;
        const p = parseInt(searchParams.get('page'), 10);
        return !isNaN(p) && p > 0 ? p : initialPage;
    }, [syncUrl, searchParams, initialPage]);

    const parsedPageSizeFromUrl = useMemo(() => {
        if (!syncUrl) return initialPageSize;
        const ps = parseInt(searchParams.get('pageSize'), 10);
        return !isNaN(ps) && ps > 0 ? ps : initialPageSize;
    }, [syncUrl, searchParams, initialPageSize]);

    const parsedSearchFromUrl = useMemo(() => {
        if (!syncUrl) return initialSearch;
        return searchParams.get('search') ?? initialSearch;
    }, [syncUrl, searchParams, initialSearch]);

    const parsedTrashFromUrl = useMemo(() => {
        if (!syncUrl) return initialTrash;
        return searchParams.get('trash') === 'true';
    }, [syncUrl, searchParams, initialTrash]);

    // 2. Local state for responsive typing and instant feedback
    const [page, setPageState] = useState(parsedPageFromUrl);
    const [pageSize, setPageSizeState] = useState(parsedPageSizeFromUrl);
    const [search, setSearch] = useState(parsedSearchFromUrl);
    const debouncedSearch = useDebounce(search, debounceDelay);
    const [isTrash, setIsTrashState] = useState(parsedTrashFromUrl);

    // Keep local states in sync when URL changes externally (e.g. Browser Back/Forward)
    useEffect(() => {
        if (!syncUrl) return;
        setPageState(parsedPageFromUrl);
    }, [syncUrl, parsedPageFromUrl]);

    useEffect(() => {
        if (!syncUrl) return;
        setPageSizeState(parsedPageSizeFromUrl);
    }, [syncUrl, parsedPageSizeFromUrl]);

    useEffect(() => {
        if (!syncUrl) return;
        setIsTrashState(parsedTrashFromUrl);
    }, [syncUrl, parsedTrashFromUrl]);

    useEffect(() => {
        if (!syncUrl) return;
        setSearch(parsedSearchFromUrl);
    }, [syncUrl, parsedSearchFromUrl]);

    // Helper to safely update searchParams without losing other existing query params
    const updateUrlParams = useCallback((updater, replace = true) => {
        if (!syncUrl) return;
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            updater(next);
            return next;
        }, { replace });
    }, [syncUrl, setSearchParams]);

    // Sync debounced search to URL
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (!syncUrl) return;
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const trimmed = debouncedSearch.trim();
        const currentUrlSearch = searchParams.get('search') || '';
        if (trimmed !== currentUrlSearch) {
            updateUrlParams((params) => {
                if (trimmed) {
                    params.set('search', trimmed);
                } else {
                    params.delete('search');
                }
                params.delete('page'); // Reset to page 1 on search change
            }, true);
            setPageState(1);
        }
    }, [syncUrl, debouncedSearch, searchParams, updateUrlParams]);

    const setPage = useCallback((newPage) => {
        const val = typeof newPage === 'function' ? newPage(page) : newPage;
        const normalized = Math.max(1, parseInt(val, 10) || 1);
        setPageState(normalized);
        if (syncUrl) {
            updateUrlParams((params) => {
                if (normalized > 1) {
                    params.set('page', String(normalized));
                } else {
                    params.delete('page');
                }
            }, false);
        }
    }, [page, syncUrl, updateUrlParams]);

    const setPageSize = useCallback((newSize) => {
        const val = Number(newSize);
        setPageSizeState(val);
        setPageState(1);
        if (syncUrl) {
            updateUrlParams((params) => {
                if (val !== initialPageSize) {
                    params.set('pageSize', String(val));
                } else {
                    params.delete('pageSize');
                }
                params.delete('page');
            }, true);
        }
    }, [initialPageSize, syncUrl, updateUrlParams]);

    const setIsTrash = useCallback((trashState) => {
        const val = Boolean(trashState);
        setIsTrashState(val);
        setPageState(1);
        if (syncUrl) {
            updateUrlParams((params) => {
                if (val) {
                    params.set('trash', 'true');
                } else {
                    params.delete('trash');
                }
                params.delete('page');
            }, true);
        }
    }, [syncUrl, updateUrlParams]);

    const handleTabChange = useCallback((trashState) => {
        setIsTrash(trashState);
    }, [setIsTrash]);

    const handleSearch = useCallback((e) => {
        const val = e && typeof e === 'object' && 'target' in e ? e.target.value : (e || '');
        setSearch(val);
    }, []);

    const clearSearch = useCallback(() => {
        setSearch('');
        if (syncUrl) {
            updateUrlParams((params) => {
                params.delete('search');
                params.delete('page');
            }, true);
            setPageState(1);
        }
    }, [syncUrl, updateUrlParams]);

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
    }, [setPage]);

    const handlePageSizeChange = useCallback((newSize) => {
        setPageSize(newSize);
    }, [setPageSize]);

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
        handlePageSizeChange,
        searchParams,
        setSearchParams
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

/**
 * Custom hook to auto-clamp the page number if the total pages count decreases
 * (e.g. after filtering, search, or record deletion).
 */
export const usePageClamping = ({ page, setPage, totalPages = 1, isLoading = false }) => {
    useEffect(() => {
        if (!isLoading && totalPages > 0 && page > totalPages) {
            setPage(totalPages);
        }
    }, [isLoading, totalPages, page, setPage]);
};

export default useListManager;

