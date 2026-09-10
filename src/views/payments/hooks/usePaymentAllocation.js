import { useState, useCallback, useMemo } from "react";
import Decimal from "decimal.js";

/**
 * Helper to parse and round a number to 2 decimal places using Decimal.js
 */
const toDec = (val) => {
    try {
        if (val === "" || val === null || val === undefined || isNaN(val)) return new Decimal(0);
        return new Decimal(val).toDecimalPlaces(2);
    } catch {
        return new Decimal(0);
    }
};

/**
 * Custom hook to manage real-time multi-invoice allocation calculations and business invariants
 *
 * @param {Array} unpaidInvoices - List of unpaid invoices for the selected customer
 * @param {number|string} totalAmountReceived - Total physical cash/bank funds received
 */
export const usePaymentAllocation = (unpaidInvoices = [], totalAmountReceived = 0) => {
    // Allocation map: { [invoiceId]: { allocatedAmount: 0, tdsAmount: 0, writeOffAmount: 0, writeOffReason: '' } }
    const [allocations, setAllocations] = useState({});

    // Authoritative total received cash
    const totalReceivedDec = useMemo(() => toDec(totalAmountReceived), [totalAmountReceived]);

    // Update an individual field for a specific invoice row
    const updateAllocationRow = useCallback((invoiceId, field, value) => {
        setAllocations((prev) => {
            const current = prev[invoiceId] || {
                allocatedAmount: 0,
                tdsAmount: 0,
                writeOffAmount: 0,
                writeOffReason: ""
            };

            let updatedVal = value;
            if (field !== "writeOffReason") {
                const num = parseFloat(value);
                updatedVal = isNaN(num) || num < 0 ? 0 : num;
            }

            return {
                ...prev,
                [invoiceId]: {
                    ...current,
                    [field]: updatedVal
                }
            };
        });
    }, []);

    // Set entire row data
    const setAllocationRow = useCallback((invoiceId, rowData) => {
        setAllocations((prev) => ({
            ...prev,
            [invoiceId]: {
                ...(prev[invoiceId] || {}),
                ...rowData
            }
        }));
    }, []);

    // Clear all allocations
    const clearAllocations = useCallback(() => {
        setAllocations({});
    }, []);

    // Calculate aggregated totals
    const calculations = useMemo(() => {
        let totalCashAllocated = new Decimal(0);
        let totalTdsDeducted = new Decimal(0);
        let totalWriteOff = new Decimal(0);

        const rowDetails = {};
        const errors = [];

        unpaidInvoices.forEach((inv) => {
            const invId = inv.id || inv.invoiceId;
            const alloc = allocations[invId] || {};

            const allocCash = toDec(alloc.allocatedAmount);
            const tds = toDec(alloc.tdsAmount);
            const writeOff = toDec(alloc.writeOffAmount);
            const reason = (alloc.writeOffReason || "").trim();

            const balanceDue = toDec(inv.balanceAmount ?? inv.balance_amount ?? inv.total ?? 0);
            const totalSettled = allocCash.plus(tds).plus(writeOff);
            const remainingBalance = balanceDue.minus(totalSettled);

            totalCashAllocated = totalCashAllocated.plus(allocCash);
            totalTdsDeducted = totalTdsDeducted.plus(tds);
            totalWriteOff = totalWriteOff.plus(writeOff);

            const isOverSettled = remainingBalance.lt(-0.01);
            if (isOverSettled) {
                errors.push(`Invoice ${inv.invoiceNo || inv.invoice_no}: Settled amount ₹${totalSettled.toFixed(2)} exceeds balance due ₹${balanceDue.toFixed(2)}.`);
            }

            if (writeOff.gt(0) && !reason) {
                errors.push(`Invoice ${inv.invoiceNo || inv.invoice_no}: Reason is required when write-off discount is applied.`);
            }

            rowDetails[invId] = {
                allocatedAmount: allocCash.toNumber(),
                tdsAmount: tds.toNumber(),
                writeOffAmount: writeOff.toNumber(),
                writeOffReason: reason,
                balanceDue: balanceDue.toNumber(),
                totalSettled: totalSettled.toNumber(),
                remainingBalance: Math.max(0, remainingBalance.toNumber()),
                isOverSettled,
                isWriteOffMissingReason: writeOff.gt(0) && !reason
            };
        });

        const unallocatedAdvance = totalReceivedDec.minus(totalCashAllocated);
        const isCashOverAllocated = totalCashAllocated.gt(totalReceivedDec.plus(0.01));

        if (isCashOverAllocated) {
            const excess = totalCashAllocated.minus(totalReceivedDec);
            errors.push(`Total cash allocated (₹${totalCashAllocated.toFixed(2)}) exceeds received cash by ₹${excess.toFixed(2)}.`);
        }

        const isValid = errors.length === 0 && totalReceivedDec.gt(0);

        return {
            totalReceived: totalReceivedDec.toNumber(),
            totalCashAllocated: totalCashAllocated.toNumber(),
            totalTdsDeducted: totalTdsDeducted.toNumber(),
            totalWriteOff: totalWriteOff.toNumber(),
            totalSettlement: totalCashAllocated.plus(totalTdsDeducted).plus(totalWriteOff).toNumber(),
            unallocatedAdvance: Math.max(0, unallocatedAdvance.toNumber()),
            isCashOverAllocated,
            rowDetails,
            errors,
            isValid
        };
    }, [allocations, unpaidInvoices, totalReceivedDec]);

    // Handler to auto-settle an invoice ("Pay Full")
    const handlePayFull = useCallback((invoice) => {
        const invId = invoice.id || invoice.invoiceId;
        const balanceDue = toDec(invoice.balanceAmount ?? invoice.balance_amount ?? invoice.total ?? 0);

        const currentAlloc = allocations[invId] || {};
        const currentTds = toDec(currentAlloc.tdsAmount);
        const currentWriteOff = toDec(currentAlloc.writeOffAmount);

        // Maximum cash needed to zero this invoice
        const cashNeeded = Decimal.max(0, balanceDue.minus(currentTds).minus(currentWriteOff));

        // Available cash from total received
        const currentAllocatedCash = toDec(currentAlloc.allocatedAmount);
        const otherRowsAllocatedCash = toDec(calculations.totalCashAllocated).minus(currentAllocatedCash);
        const remainingUnallocatedCash = Decimal.max(0, totalReceivedDec.minus(otherRowsAllocatedCash));

        // Fill with whatever cash is available up to cashNeeded
        const amountToAllocate = Decimal.min(cashNeeded, remainingUnallocatedCash);

        updateAllocationRow(invId, "allocatedAmount", amountToAllocate.toNumber());
    }, [allocations, calculations.totalCashAllocated, totalReceivedDec, updateAllocationRow]);

    // Build clean API allocations payload
    const getAllocationsPayload = useCallback(() => {
        const payload = [];
        unpaidInvoices.forEach((inv) => {
            const invId = inv.id || inv.invoiceId;
            const row = calculations.rowDetails[invId];
            if (row && (row.allocatedAmount > 0 || row.tdsAmount > 0 || row.writeOffAmount > 0)) {
                payload.push({
                    invoiceId: Number(invId),
                    allocatedAmount: row.allocatedAmount,
                    tdsAmount: row.tdsAmount,
                    writeOffAmount: row.writeOffAmount,
                    writeOffReason: row.writeOffAmount > 0 ? row.writeOffReason : undefined
                });
            }
        });
        return payload;
    }, [unpaidInvoices, calculations.rowDetails]);

    return {
        allocations,
        calculations,
        updateAllocationRow,
        setAllocationRow,
        clearAllocations,
        handlePayFull,
        getAllocationsPayload
    };
};

export default usePaymentAllocation;
