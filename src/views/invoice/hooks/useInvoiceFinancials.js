import { useMemo, useCallback } from 'react';

/**
 * Pure helper function to compute financial metrics for a single invoice.
 * Can be safely called in array iterations (.map, .filter, etc.) without violating React Hook rules.
 *
 * @param {Object} item - Invoice object
 * @returns {Object} { total, paid, balance, isFullyPaid, hasBalance, formattedTotal, formattedPaid, formattedBalance }
 */
export const getInvoiceFinancials = (item) => {
    if (!item || typeof item !== 'object') {
        return {
            total: 0,
            paid: 0,
            balance: 0,
            isFullyPaid: true,
            hasBalance: false,
            formattedTotal: '₹0.00',
            formattedPaid: '₹0.00',
            formattedBalance: '₹0.00'
        };
    }

    const total = Number(item.total ?? item.grandTotal ?? 0);
    const paid = Number(item.paidAmount ?? item.paid_amount ?? 0);
    const rawBalance = item.balanceAmount !== undefined && item.balanceAmount !== null
        ? Number(item.balanceAmount)
        : (item.balance_amount !== undefined && item.balance_amount !== null
            ? Number(item.balance_amount)
            : Math.max(0, total - paid));

    const balance = Math.max(0, rawBalance);
    const isFullyPaid = balance <= 0.001;
    const hasBalance = balance > 0.001;

    return {
        total,
        paid,
        balance,
        isFullyPaid,
        hasBalance,
        formattedTotal: `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        formattedPaid: `₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        formattedBalance: `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
    };
};

/**
 * Custom Hook: useInvoiceFinancials
 * Provides memoized calculations and helper functions for invoice finances.
 *
 * Usage:
 * 1. Inside a list view / table:
 *    const { getFinancials } = useInvoiceFinancials();
 *    sortedList.map(item => {
 *        const { total, paid, balance, isFullyPaid, hasBalance } = getFinancials(item);
 *    });
 *
 * 2. For a single invoice item:
 *    const { total, paid, balance, isFullyPaid, hasBalance } = useInvoiceFinancials(invoiceData);
 *
 * @param {Object|Array} [target] - Optional invoice object or list of invoices
 */
export const useInvoiceFinancials = (target = null) => {
    const getFinancials = useCallback((item) => {
        return getInvoiceFinancials(item);
    }, []);

    // Single item memoized calculation
    const singleFinancials = useMemo(() => {
        if (!target || Array.isArray(target)) return null;
        return getInvoiceFinancials(target);
    }, [target]);

    // Aggregate metrics if an array of invoices is provided
    const aggregateMetrics = useMemo(() => {
        if (!Array.isArray(target)) return null;
        return target.reduce(
            (acc, curr) => {
                const fin = getInvoiceFinancials(curr);
                acc.totalAmount += fin.total;
                acc.totalPaid += fin.paid;
                acc.totalBalance += fin.balance;
                acc.count += 1;
                return acc;
            },
            { totalAmount: 0, totalPaid: 0, totalBalance: 0, count: 0 }
        );
    }, [target]);

    return {
        getFinancials,
        ...(singleFinancials || {}),
        aggregate: aggregateMetrics
    };
};

export default useInvoiceFinancials;
