import { useState, useCallback, useMemo } from "react";
import Decimal from "decimal.js";

const toDec = (val) => {
    try {
        if (val === "" || val === null || val === undefined || isNaN(val)) return new Decimal(0);
        return new Decimal(val).toDecimalPlaces(2);
    } catch {
        return new Decimal(0);
    }
};

/**
 * Custom hook to manage multi-vendor-bill payment allocations with Decimal.js precision
 *
 * @param {Array} unpaidBills - List of unpaid/partial vendor bills
 * @param {number|string} totalAmountDisbursed - Physical cash/bank funds disbursed
 */
export const useVendorPaymentAllocation = (unpaidBills = [], totalAmountDisbursed = 0) => {
    // Allocation map: { [billId]: { allocatedAmount: 0, tdsAmount: 0, writeOffAmount: 0, writeOffReason: '' } }
    const [allocations, setAllocations] = useState({});

    const totalDisbursedDec = useMemo(() => toDec(totalAmountDisbursed), [totalAmountDisbursed]);

    // Update single field for a bill row
    const updateAllocationRow = useCallback((billId, field, value) => {
        setAllocations((prev) => {
            const current = prev[billId] || {
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
                [billId]: {
                    ...current,
                    [field]: updatedVal
                }
            };
        });
    }, []);

    // Set entire row data
    const setAllocationRow = useCallback((billId, rowData) => {
        setAllocations((prev) => ({
            ...prev,
            [billId]: {
                ...(prev[billId] || {}),
                ...rowData
            }
        }));
    }, []);

    // Clear all allocations
    const clearAllocations = useCallback(() => {
        setAllocations({});
    }, []);

    // Calculate aggregated totals & invariant validations
    const calculations = useMemo(() => {
        let totalCashAllocated = new Decimal(0);
        let totalTdsDeducted = new Decimal(0);
        let totalWriteOff = new Decimal(0);

        const rowDetails = {};
        const errors = [];

        unpaidBills.forEach((bill) => {
            const billId = bill.id || bill.vendorBillId;
            const alloc = allocations[billId] || {};

            const allocCash = toDec(alloc.allocatedAmount);
            const tds = toDec(alloc.tdsAmount);
            const writeOff = toDec(alloc.writeOffAmount);
            const reason = (alloc.writeOffReason || "").trim();

            const balanceDue = toDec(bill.balanceAmount ?? bill.balance_amount ?? bill.total ?? 0);
            const totalSettled = allocCash.plus(tds).plus(writeOff);
            const remainingBalance = balanceDue.minus(totalSettled);

            totalCashAllocated = totalCashAllocated.plus(allocCash);
            totalTdsDeducted = totalTdsDeducted.plus(tds);
            totalWriteOff = totalWriteOff.plus(writeOff);

            const isOverSettled = remainingBalance.lt(-0.01);
            if (isOverSettled) {
                errors.push(`Bill ${bill.billNo || bill.bill_no}: Settled amount ₹${totalSettled.toFixed(2)} exceeds balance due ₹${balanceDue.toFixed(2)}.`);
            }

            if (writeOff.gt(0) && !reason) {
                errors.push(`Bill ${bill.billNo || bill.bill_no}: Reason is required when write-off discount is applied.`);
            }

            rowDetails[billId] = {
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

        const unallocatedAdvance = totalDisbursedDec.minus(totalCashAllocated);
        const isCashOverAllocated = totalCashAllocated.gt(totalDisbursedDec.plus(0.01));

        if (isCashOverAllocated) {
            const excess = totalCashAllocated.minus(totalDisbursedDec);
            errors.push(`Total cash allocated (₹${totalCashAllocated.toFixed(2)}) exceeds disbursed amount by ₹${excess.toFixed(2)}.`);
        }

        const isValid = errors.length === 0 && totalDisbursedDec.gt(0);

        return {
            totalDisbursed: totalDisbursedDec.toNumber(),
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
    }, [allocations, unpaidBills, totalDisbursedDec]);

    // 1-Click Pay Full handler
    const handlePayFull = useCallback((bill) => {
        const billId = bill.id || bill.vendorBillId;
        const balanceDue = toDec(bill.balanceAmount ?? bill.balance_amount ?? bill.total ?? 0);

        const currentAlloc = allocations[billId] || {};
        const currentTds = toDec(currentAlloc.tdsAmount);
        const currentWriteOff = toDec(currentAlloc.writeOffAmount);

        // Maximum cash needed to zero this bill
        const cashNeeded = Decimal.max(0, balanceDue.minus(currentTds).minus(currentWriteOff));

        // Available cash from total disbursed
        const currentAllocatedCash = toDec(currentAlloc.allocatedAmount);
        const otherRowsAllocatedCash = toDec(calculations.totalCashAllocated).minus(currentAllocatedCash);
        const remainingUnallocatedCash = Decimal.max(0, totalDisbursedDec.minus(otherRowsAllocatedCash));

        // Fill with whatever cash is available up to cashNeeded
        const amountToAllocate = Decimal.min(cashNeeded, remainingUnallocatedCash);

        updateAllocationRow(billId, "allocatedAmount", amountToAllocate.toNumber());
    }, [allocations, calculations.totalCashAllocated, totalDisbursedDec, updateAllocationRow]);

    // Build clean API allocations payload
    const getAllocationsPayload = useCallback(() => {
        const payload = [];
        unpaidBills.forEach((bill) => {
            const billId = bill.id || bill.vendorBillId;
            const row = calculations.rowDetails[billId];
            if (row && (row.allocatedAmount > 0 || row.tdsAmount > 0 || row.writeOffAmount > 0)) {
                payload.push({
                    vendorBillId: Number(billId),
                    allocatedAmount: row.allocatedAmount,
                    tdsAmount: row.tdsAmount,
                    writeOffAmount: row.writeOffAmount,
                    writeOffReason: row.writeOffAmount > 0 ? row.writeOffReason : null
                });
            }
        });
        return payload;
    }, [unpaidBills, calculations.rowDetails]);

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

export default useVendorPaymentAllocation;
