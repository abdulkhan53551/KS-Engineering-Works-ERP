import React, { useState, useMemo, useCallback } from 'react';
import { FaSort, FaSortAlphaUpAlt, FaSortAlphaDownAlt } from 'react-icons/fa';

/**
 * Known Numeric and Date Column Keys for Invoices
 */
const NUMERIC_KEYS = new Set([
    'invoiceId',
    'id',
    'taxableAmount',
    'totalTaxableAmount',
    'subTotal',
    'total',
    'grandTotal',
    'paidAmount',
    'paid_amount',
    'balanceAmount',
    'balance_amount',
    'dueDays'
]);

const DATE_KEYS = new Set([
    'invoiceDate',
    'dueDate',
    'updatedAt',
    'deletedAt',
    'createdAt'
]);

const DEFAULT_COMPARATORS = {};

/**
 * Custom Hook: useInvoiceSort
 * Manages column sorting state, sorting logic with numeric/date/string comparisons,
 * and rendering of sort indicators for invoice tables.
 *
 * @param {Object} options
 * @param {Array} options.items - The list of invoices to be sorted
 * @param {string} [options.initialKey=''] - Initial sorting column key
 * @param {'asc'|'desc'} [options.initialDirection='asc'] - Initial sorting direction
 * @param {Object} [options.customComparators={}] - Optional custom comparator functions: { [key]: (a, b, direction) => number }
 *
 * @returns {Object} {
 *   sortConfig: { key: string, direction: 'asc'|'desc' },
 *   setSortConfig: Function,
 *   handleSort: (key: string) => void,
 *   renderSortIcon: (key: string) => JSX.Element,
 *   sortedList: Array,
 *   sortedItems: Array,
 *   resetSort: () => void
 * }
 */
export const useInvoiceSort = ({
    items = [],
    initialKey = '',
    initialDirection = 'asc',
    customComparators = DEFAULT_COMPARATORS
} = {}) => {
    // 1. Sort state
    const [sortConfig, setSortConfig] = useState({
        key: initialKey,
        direction: initialDirection
    });

    // 2. Toggle or set sort column
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

    // 3. Reset sort state
    const resetSort = useCallback(() => {
        setSortConfig({ key: '', direction: 'asc' });
    }, []);

    // 4. Render sort icon helper
    const renderSortIcon = useCallback((key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? (
                <FaSortAlphaUpAlt className="text-primary ms-1" size={10} />
            ) : (
                <FaSortAlphaDownAlt className="text-primary ms-1" size={10} />
            );
        }
        return <FaSort className="text-muted ms-1 opacity-25" size={10} />;
    }, [sortConfig.key, sortConfig.direction]);

    // 5. Helper to extract comparable values (with fallback aliasing)
    const extractValue = useCallback((item, key) => {
        if (!item) return '';

        // Aliased numeric amounts fallback
        if (key === 'taxableAmount') {
            return item.taxableAmount ?? item.totalTaxableAmount ?? item.subTotal ?? 0;
        }
        if (key === 'total') {
            return item.total ?? item.grandTotal ?? 0;
        }
        if (key === 'paidAmount') {
            return item.paidAmount ?? item.paid_amount ?? 0;
        }
        if (key === 'balanceAmount') {
            return item.balanceAmount ?? item.balance_amount ?? 0;
        }

        return item[key] ?? '';
    }, []);

    // 6. Memoized sorted list
    const sortedList = useMemo(() => {
        if (!Array.isArray(items) || items.length === 0) return [];
        const { key, direction } = sortConfig;

        if (!key) return items;

        const list = [...items];
        return list.sort((a, b) => {
            // Check for custom comparator override
            if (typeof customComparators[key] === 'function') {
                return customComparators[key](a, b, direction);
            }

            const aVal = extractValue(a, key);
            const bVal = extractValue(b, key);

            // Numeric comparison
            if (NUMERIC_KEYS.has(key)) {
                const numA = Number(aVal) || 0;
                const numB = Number(bVal) || 0;
                return direction === 'asc' ? numA - numB : numB - numA;
            }

            // Date comparison
            if (DATE_KEYS.has(key)) {
                const dateA = aVal ? new Date(aVal).getTime() || 0 : 0;
                const dateB = bVal ? new Date(bVal).getTime() || 0 : 0;
                return direction === 'asc' ? dateA - dateB : dateB - dateA;
            }

            // String comparison (case-insensitive)
            let strA = typeof aVal === 'string' ? aVal.toLowerCase() : String(aVal || '');
            let strB = typeof bVal === 'string' ? bVal.toLowerCase() : String(bVal || '');

            if (strA < strB) return direction === 'asc' ? -1 : 1;
            if (strA > strB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [items, sortConfig.key, sortConfig.direction, customComparators, extractValue]);

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

export default useInvoiceSort;
