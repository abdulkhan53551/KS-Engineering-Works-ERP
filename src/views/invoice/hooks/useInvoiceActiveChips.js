import { useMemo } from 'react';

/**
 * Custom hook to dynamically compute the list of active filter chips for InvoiceList.
 * Centralizes labels, formatted values, styling types, and dismissal handlers.
 */
export const useInvoiceActiveChips = ({
    partyId,
    activePartyName,
    statusFilter,
    isOverdue,
    startDate,
    endDate,
    datePreset,
    minAmount,
    maxAmount,
    ewayBillFilter,
    search,
    getDateLabel,
    handleRemoveFilter,
    clearSearch
} = {}) => {
    return useMemo(() => {
        const chips = [];

        if (partyId) {
            chips.push({
                id: 'partyId',
                type: 'customer',
                label: 'Customer:',
                value: activePartyName,
                title: 'Customer Filter',
                onRemove: () => handleRemoveFilter?.('partyId')
            });
        }

        if (statusFilter) {
            chips.push({
                id: 'status',
                type: 'status',
                label: 'Status:',
                value: statusFilter === 'PAID' ? 'Fully Paid' : statusFilter === 'PARTIAL' ? 'Partially Paid' : 'Unpaid / Pending',
                title: 'Status Filter',
                onRemove: () => handleRemoveFilter?.('status')
            });
        }

        if (isOverdue === 'true') {
            chips.push({
                id: 'isOverdue',
                type: 'overdue',
                label: '',
                value: 'Overdue Only',
                title: 'Overdue Filter',
                onRemove: () => handleRemoveFilter?.('isOverdue')
            });
        }

        if (startDate || endDate || datePreset) {
            chips.push({
                id: 'dates',
                type: 'date',
                label: 'Date:',
                value: typeof getDateLabel === 'function' ? getDateLabel() : (startDate && endDate ? `${startDate} to ${endDate}` : ''),
                title: 'Date Range Filter',
                onRemove: () => handleRemoveFilter?.('dates')
            });
        }

        if (minAmount || maxAmount) {
            chips.push({
                id: 'amount',
                type: 'amount',
                label: 'Amount:',
                value: minAmount && maxAmount
                    ? `₹${Number(minAmount).toLocaleString('en-IN')} - ₹${Number(maxAmount).toLocaleString('en-IN')}`
                    : minAmount
                    ? `>= ₹${Number(minAmount).toLocaleString('en-IN')}`
                    : `<= ₹${Number(maxAmount).toLocaleString('en-IN')}`,
                title: 'Amount Range Filter',
                onRemove: () => handleRemoveFilter?.('amount')
            });
        }

        if (ewayBillFilter) {
            chips.push({
                id: 'ewayBill',
                type: 'eway',
                label: 'E-Way:',
                value: ewayBillFilter === 'true' ? 'With E-Way' : 'No E-Way',
                title: 'E-Way Bill Filter',
                onRemove: () => handleRemoveFilter?.('ewayBill')
            });
        }

        if (search) {
            chips.push({
                id: 'search',
                type: 'search',
                label: 'Query:',
                value: `"${search}"`,
                title: 'Search Query',
                onRemove: clearSearch
            });
        }

        return chips;
    }, [
        partyId,
        activePartyName,
        statusFilter,
        isOverdue,
        startDate,
        endDate,
        datePreset,
        minAmount,
        maxAmount,
        ewayBillFilter,
        search,
        getDateLabel,
        handleRemoveFilter,
        clearSearch
    ]);
};
