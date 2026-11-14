import React, { useState, useMemo, useCallback } from 'react';
import { FaSort, FaSortAlphaUpAlt, FaSortAlphaDownAlt } from 'react-icons/fa';

/**
 * Known Numeric and Date Column Keys for Customer Purchase Orders
 */
const NUMERIC_KEYS = new Set([
    'poId',
    'id',
    'totalQuantity',
    'subTotal',
    'taxableAmount',
    'taxAmount',
    'totalAmount',
    'invoicedQuantity',
    'billedAmount',
    'advancePercentage'
]);

const DATE_KEYS = new Set([
    'poDate',
    'deliveryDueDate',
    'validUntil',
    'updatedAt',
    'deletedAt',
    'createdAt'
]);

/**
 * Custom Hook: usePurchaseOrderSort
 * Manages column sorting state, sorting logic with numeric/date/string comparisons,
 * and rendering of sort indicators for purchase order tables.
 */
export const usePurchaseOrderSort = ({
    items = [],
    initialKey = '',
    initialDirection = 'asc',
    customComparators = {}
} = {}) => {
    const [sortConfig, setSortConfig] = useState({
        key: initialKey,
        direction: initialDirection
    });

    const handleSort = useCallback((key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return {
                    key,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return {
                key,
                direction: 'asc'
            };
        });
    }, []);

    const resetSort = useCallback(() => {
        setSortConfig({ key: '', direction: 'asc' });
    }, []);

    const renderSortIcon = useCallback((key) => {
        if (sortConfig.key !== key) {
            return <FaSort className="text-muted ms-1 opacity-50" size={10} />;
        }
        if (sortConfig.direction === 'asc') {
            return <FaSortAlphaDownAlt className="text-primary ms-1" size={11} />;
        }
        return <FaSortAlphaUpAlt className="text-primary ms-1" size={11} />;
    }, [sortConfig]);

    const sortedList = useMemo(() => {
        if (!Array.isArray(items) || items.length === 0) return [];
        if (!sortConfig.key) return items;

        const { key, direction } = sortConfig;
        const isAsc = direction === 'asc';

        return [...items].sort((a, b) => {
            if (typeof customComparators[key] === 'function') {
                return customComparators[key](a, b, direction);
            }

            const valA = a?.[key];
            const valB = b?.[key];

            if (valA === null || valA === undefined || valA === '') {
                if (valB === null || valB === undefined || valB === '') return 0;
                return 1;
            }
            if (valB === null || valB === undefined || valB === '') return -1;

            if (NUMERIC_KEYS.has(key)) {
                const numA = Number(valA) || 0;
                const numB = Number(valB) || 0;
                return isAsc ? numA - numB : numB - numA;
            }

            if (DATE_KEYS.has(key)) {
                const dateA = new Date(valA).getTime() || 0;
                const dateB = new Date(valB).getTime() || 0;
                return isAsc ? dateA - dateB : dateB - dateA;
            }

            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();
            return isAsc
                ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
                : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [items, sortConfig, customComparators]);

    return {
        sortConfig,
        setSortConfig,
        handleSort,
        renderSortIcon,
        sortedList,
        sortedItems: sortedList,
        resetSort
    };
};

export default usePurchaseOrderSort;

