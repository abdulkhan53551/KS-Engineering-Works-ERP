import { useMemo, useEffect, useCallback } from 'react';

/**
 * Calculates financial totals and taxes for a single quotation item row.
 * 
 * @param {Object} item 
 * @param {boolean} isInterState 
 * @returns {Object} item with calculated financial fields
 */
export const calculateLineItemTotals = (item = {}, isInterState = false) => {
    const qty = parseFloat(item.qty || 0);
    const rate = parseFloat(item.rate || 0);
    const subTotal = qty * rate;

    const discPercent = parseFloat(item.discountPercent ?? item.discount_percent ?? 0);
    let discAmount = parseFloat(item.discountAmount ?? item.discount_amount ?? 0);
    if (discPercent > 0) {
        discAmount = (subTotal * discPercent) / 100;
    }

    const taxable = Math.max(0, subTotal - discAmount);
    const taxRate = parseFloat(item.taxRate !== undefined ? item.taxRate : (item.tax_rate !== undefined ? item.tax_rate : 18.00));
    const taxAmount = (taxable * taxRate) / 100;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
        igst = taxAmount;
    } else {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
    }

    const total = taxable + taxAmount;

    return {
        ...item,
        subTotal: parseFloat(subTotal.toFixed(2)),
        discountPercent: discPercent,
        discountAmount: parseFloat(discAmount.toFixed(2)),
        taxableAmount: parseFloat(taxable.toFixed(2)),
        taxRate: taxRate,
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: parseFloat(igst.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
};

/**
 * Calculates auto round-off and determines if backend round-off was manual or auto (consistent with Invoice).
 * 
 * @param {Object} quotationData 
 * @param {Array} items 
 * @param {boolean} isInterState 
 * @returns {Object} roundOff info
 */
export const calculateQuotationRoundOffInfo = (quotationData = {}, items = [], isInterState = false) => {
    let computedItemsTaxable = 0;
    let computedCgst = 0;
    let computedSgst = 0;
    let computedIgst = 0;

    if (Array.isArray(items) && items.length > 0) {
        items.forEach(it => {
            const calculated = calculateLineItemTotals(it, isInterState);
            computedItemsTaxable += calculated.taxableAmount;
            computedCgst += calculated.cgst;
            computedSgst += calculated.sgst;
            computedIgst += calculated.igst;
        });
    }

    const docDiscount = parseFloat(quotationData.discountAmount ?? quotationData.discount_amount ?? 0);
    const taxableAmount = Math.max(0, computedItemsTaxable - docDiscount);
    const taxRatio = computedItemsTaxable > 0 ? (taxableAmount / computedItemsTaxable) : 1;
    const finalCgst = computedCgst * taxRatio;
    const finalSgst = computedSgst * taxRatio;
    const finalIgst = computedIgst * taxRatio;

    const otherCharges = parseFloat(quotationData.other ?? 0);
    const totalTaxes = isInterState ? finalIgst : (finalCgst + finalSgst);
    const totalBeforeRound = taxableAmount + totalTaxes + otherCharges;

    const autoRoundedTotal = Math.round(totalBeforeRound);
    const autoRoundOff = parseFloat((autoRoundedTotal - totalBeforeRound).toFixed(2));
    const backendRoundOff = parseFloat(Number(quotationData.roundOff ?? quotationData.round_off ?? 0).toFixed(2));

    // If backend roundoff differs from auto-calculated roundoff, treat as manual/custom (strictly !==)
    const isRoundOffManual = Math.abs(backendRoundOff - autoRoundOff) > 0.009;

    return {
        roundOff: isRoundOffManual ? backendRoundOff : autoRoundOff,
        isRoundOffManual,
        autoRoundOff,
        backendRoundOff
    };
};

/**
 * Custom hook to manage financial totals, GST taxation, interstate detection, and round-off synchronization.
 * 
 * @param {Object} params
 * @param {Array} params.items
 * @param {string} params.watchedPlaceOfSupply
 * @param {number|string} params.watchedDiscountAmount
 * @param {number|string} [params.watchedDiscountPercent]
 * @param {number|string} params.watchedOther
 * @param {number|string} params.watchedRoundOff
 * @param {boolean} params.watchedRoundOffManual
 * @param {Function} params.setValue
 * @param {Function} params.getValues
 * @returns {{ isInterState: boolean, totals: Object, calculateLineTotals: Function, handleDiscountPercentChange: Function, handleDiscountAmountChange: Function, handleOtherChange: Function, handleRoundOffChange: Function, handleResetRoundOffAuto: Function }}
 */
export const useQuotationCalculation = ({
    items = [],
    watchedPlaceOfSupply,
    watchedDiscountAmount,
    watchedOther,
    watchedRoundOff,
    watchedRoundOffManual,
    setValue,
    getValues
}) => {
    // Interstate detection (firm Maharashtra is 27)
    const isInterState = useMemo(() => {
        if (!watchedPlaceOfSupply) return false;
        return !watchedPlaceOfSupply.toLowerCase().includes('maharashtra') && !watchedPlaceOfSupply.includes('27');
    }, [watchedPlaceOfSupply]);

    // Financial Totals Calculation
    const totals = useMemo(() => {
        let subTotal = 0;
        let itemDiscountAmount = 0;
        let itemsTaxable = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        items.forEach(it => {
            const calculated = calculateLineItemTotals(it, isInterState);
            subTotal += calculated.subTotal;
            itemDiscountAmount += calculated.discountAmount;
            itemsTaxable += calculated.taxableAmount;
            cgst += calculated.cgst;
            sgst += calculated.sgst;
            igst += calculated.igst;
        });

        // Document-level discount
        const docDiscount = parseFloat(watchedDiscountAmount || 0);
        const totalDiscount = itemDiscountAmount + docDiscount;
        const taxableAmount = Math.max(0, itemsTaxable - docDiscount);

        // Adjust tax amounts proportionally if document-level discount was applied
        const taxRatio = itemsTaxable > 0 ? (taxableAmount / itemsTaxable) : 1;
        const finalCgst = cgst * taxRatio;
        const finalSgst = sgst * taxRatio;
        const finalIgst = igst * taxRatio;

        const otherCharges = parseFloat(watchedOther || 0);
        const totalTaxes = isInterState ? finalIgst : (finalCgst + finalSgst);
        const totalBeforeRound = taxableAmount + totalTaxes + otherCharges;

        const autoRounded = Math.round(totalBeforeRound);
        const autoRoundOff = parseFloat((autoRounded - totalBeforeRound).toFixed(2));
        const finalRoundOff = watchedRoundOffManual ? (parseFloat(watchedRoundOff) || 0) : autoRoundOff;
        const grandTotal = parseFloat((totalBeforeRound + finalRoundOff).toFixed(2));

        return {
            subTotal: parseFloat(subTotal.toFixed(2)),
            itemDiscountAmount: parseFloat(itemDiscountAmount.toFixed(2)),
            docDiscount: parseFloat(docDiscount.toFixed(2)),
            discountAmount: parseFloat(totalDiscount.toFixed(2)),
            taxableAmount: parseFloat(taxableAmount.toFixed(2)),
            cgst: parseFloat(finalCgst.toFixed(2)),
            sgst: parseFloat(finalSgst.toFixed(2)),
            igst: parseFloat(finalIgst.toFixed(2)),
            other: otherCharges,
            total: grandTotal,
            roundOff: finalRoundOff
        };
    }, [items, isInterState, watchedDiscountAmount, watchedOther, watchedRoundOff, watchedRoundOffManual]);

    // Keep roundOff in sync in react-hook-form when auto-calculating on item or charge changes
    useEffect(() => {
        if (!watchedRoundOffManual && totals && totals.roundOff !== undefined && setValue && getValues) {
            const currentVal = getValues("roundOff");
            const newRoundOff = parseFloat(totals.roundOff.toFixed(2));
            if (Number(currentVal || 0).toFixed(2) !== newRoundOff.toFixed(2)) {
                setValue("roundOff", newRoundOff, { shouldValidate: false, shouldDirty: false });
            }
        }
    }, [totals.roundOff, watchedRoundOffManual, setValue, getValues]);

    // Convenient calculation helper for single line item
    const calculateLineTotals = useCallback((item) => {
        return calculateLineItemTotals(item, isInterState);
    }, [isInterState]);

    // Discount percentage change handler (calculates amount)
    const handleDiscountPercentChange = useCallback((percentVal) => {
        if (!setValue) return;
        const pct = parseFloat(percentVal) || 0;
        setValue("discountPercent", pct, { shouldDirty: true });
        const discAmt = parseFloat(((totals.subTotal * pct) / 100).toFixed(2));
        setValue("discountAmount", discAmt, { shouldDirty: true });
    }, [setValue, totals.subTotal]);

    // Discount amount change handler (calculates percent)
    const handleDiscountAmountChange = useCallback((amountVal) => {
        if (!setValue) return;
        const amt = parseFloat(amountVal) || 0;
        setValue("discountAmount", amt, { shouldDirty: true });
        const pct = totals.subTotal > 0 ? parseFloat(((amt / totals.subTotal) * 100).toFixed(2)) : 0;
        setValue("discountPercent", pct, { shouldDirty: true });
    }, [setValue, totals.subTotal]);

    // Other / freight charges change handler
    const handleOtherChange = useCallback((otherVal) => {
        if (!setValue) return;
        const val = parseFloat(otherVal) || 0;
        setValue("other", val, { shouldDirty: true });
    }, [setValue]);

    // Manual round-off change handler
    const handleRoundOffChange = useCallback((roundOffVal) => {
        if (!setValue) return;
        setValue("roundOffManual", true, { shouldDirty: true });
        setValue("roundOff", roundOffVal, { shouldDirty: true });
    }, [setValue]);

    // Reset round-off to auto calculation
    const handleResetRoundOffAuto = useCallback(() => {
        if (!setValue) return;
        setValue("roundOffManual", false, { shouldDirty: true });
    }, [setValue]);

    return {
        isInterState,
        totals,
        calculateLineTotals,
        handleDiscountPercentChange,
        handleDiscountAmountChange,
        handleOtherChange,
        handleRoundOffChange,
        handleResetRoundOffAuto
    };
};

export default useQuotationCalculation;
