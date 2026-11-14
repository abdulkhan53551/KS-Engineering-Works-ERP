import { useMemo, useEffect, useCallback } from 'react';

/**
 * Calculates financial totals and taxes for a single proforma line item row.
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
 * Calculates auto round-off and determines if backend round-off was manual or auto.
 * 
 * @param {Object} proformaData 
 * @param {Array} items 
 * @param {boolean} isInterState 
 * @returns {Object} roundOff info
 */
export const calculateProformaRoundOffInfo = (proformaData = {}, items = [], isInterState = false) => {
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

    const docDiscount = parseFloat(proformaData.discountAmount ?? proformaData.discount_amount ?? 0);
    const taxableAmount = Math.max(0, computedItemsTaxable - docDiscount);
    const taxRatio = computedItemsTaxable > 0 ? (taxableAmount / computedItemsTaxable) : 1;
    const finalCgst = computedCgst * taxRatio;
    const finalSgst = computedSgst * taxRatio;
    const finalIgst = computedIgst * taxRatio;

    const otherCharges = parseFloat(proformaData.other ?? 0);
    const totalTaxes = isInterState ? finalIgst : (finalCgst + finalSgst);
    const totalBeforeRound = taxableAmount + totalTaxes + otherCharges;

    const autoRoundedTotal = Math.round(totalBeforeRound);
    const autoRoundOff = parseFloat((autoRoundedTotal - totalBeforeRound).toFixed(2));
    const backendRoundOff = parseFloat(Number(proformaData.roundOff ?? proformaData.round_off ?? 0).toFixed(2));

    const isRoundOffManual = Math.abs(backendRoundOff - autoRoundOff) > 0.009;

    return {
        roundOff: isRoundOffManual ? backendRoundOff : autoRoundOff,
        isRoundOffManual,
        autoRoundOff,
        backendRoundOff
    };
};

/**
 * Comprehensive calculation hook for Proforma Invoice
 */
export const useProformaCalculation = ({
    items = [],
    watchedPlaceOfSupply = '',
    isInterState: propIsInterState,
    watchedDiscountPercent = 0,
    watchedOther = 0,
    watchedRoundOff = 0,
    isRoundOffManual = false,
    setIsRoundOffManual,
    advanceAmountRequested = 0,
    setValue
}) => {
    // Interstate detection (firm Maharashtra is 27)
    const isInterState = useMemo(() => {
        if (propIsInterState !== undefined) return propIsInterState;
        if (!watchedPlaceOfSupply) return false;
        return !watchedPlaceOfSupply.toLowerCase().includes('maharashtra') && !watchedPlaceOfSupply.includes('27');
    }, [propIsInterState, watchedPlaceOfSupply]);

    // 1. Recalculate line item breakdown
    const calculatedItems = useMemo(() => {
        return (items || []).map(it => calculateLineItemTotals(it, isInterState));
    }, [items, isInterState]);

    // 2. Aggregate gross and taxable sums from line items
    const rawSubTotal = useMemo(() => {
        return calculatedItems.reduce((acc, it) => acc + (it.subTotal || 0), 0);
    }, [calculatedItems]);

    const itemsTaxableSum = useMemo(() => {
        return calculatedItems.reduce((acc, it) => acc + (it.taxableAmount || 0), 0);
    }, [calculatedItems]);

    // 3. Document-level overall discount
    const docDiscountPercent = parseFloat(watchedDiscountPercent || 0);
    const docDiscountAmount = useMemo(() => {
        if (docDiscountPercent <= 0) return 0;
        return parseFloat(((itemsTaxableSum * docDiscountPercent) / 100).toFixed(2));
    }, [itemsTaxableSum, docDiscountPercent]);

    // Net taxable amount after overall discount
    const netTaxableAmount = useMemo(() => {
        return Math.max(0, parseFloat((itemsTaxableSum - docDiscountAmount).toFixed(2)));
    }, [itemsTaxableSum, docDiscountAmount]);

    // 4. Taxes proportional to net taxable
    const taxRatio = itemsTaxableSum > 0 ? (netTaxableAmount / itemsTaxableSum) : 1;

    const rawCgstSum = useMemo(() => calculatedItems.reduce((acc, it) => acc + (it.cgst || 0), 0), [calculatedItems]);
    const rawSgstSum = useMemo(() => calculatedItems.reduce((acc, it) => acc + (it.sgst || 0), 0), [calculatedItems]);
    const rawIgstSum = useMemo(() => calculatedItems.reduce((acc, it) => acc + (it.igst || 0), 0), [calculatedItems]);

    const cgst = useMemo(() => isInterState ? 0 : parseFloat((rawCgstSum * taxRatio).toFixed(2)), [isInterState, rawCgstSum, taxRatio]);
    const sgst = useMemo(() => isInterState ? 0 : parseFloat((rawSgstSum * taxRatio).toFixed(2)), [isInterState, rawSgstSum, taxRatio]);
    const igst = useMemo(() => isInterState ? parseFloat((rawIgstSum * taxRatio).toFixed(2)) : 0, [isInterState, rawIgstSum, taxRatio]);
    const totalTaxes = useMemo(() => isInterState ? igst : (cgst + sgst), [isInterState, cgst, sgst, igst]);

    // 5. Other charges & Round-off
    const otherCharges = parseFloat(watchedOther || 0);
    const totalBeforeRound = netTaxableAmount + totalTaxes + otherCharges;

    const autoRoundedTotal = Math.round(totalBeforeRound);
    const autoRoundOff = parseFloat((autoRoundedTotal - totalBeforeRound).toFixed(2));

    const roundOff = isRoundOffManual ? parseFloat(watchedRoundOff || 0) : autoRoundOff;
    const grandTotal = Math.max(0, parseFloat((totalBeforeRound + roundOff).toFixed(2)));

    // Advance payment ratio
    const reqAdvance = parseFloat(advanceAmountRequested || 0);
    const advancePercent = grandTotal > 0 ? parseFloat(((reqAdvance / grandTotal) * 100).toFixed(1)) : 0;

    // Handlers
    const handleDiscountPercentChange = useCallback((val) => {
        if (!setValue) return;
        const num = parseFloat(val) || 0;
        setValue('discountPercent', num, { shouldDirty: true });
    }, [setValue]);

    const handleOtherChange = useCallback((val) => {
        if (!setValue) return;
        const num = parseFloat(val) || 0;
        setValue('other', num, { shouldDirty: true });
    }, [setValue]);

    const handleRoundOffChange = useCallback((val) => {
        if (!setValue) return;
        const num = parseFloat(val) || 0;
        if (setIsRoundOffManual) setIsRoundOffManual(true);
        setValue('roundOffManual', true, { shouldDirty: true });
        setValue('roundOff', num, { shouldDirty: true });
    }, [setValue, setIsRoundOffManual]);

    const handleResetRoundOffAuto = useCallback(() => {
        if (!setValue) return;
        if (setIsRoundOffManual) setIsRoundOffManual(false);
        setValue('roundOffManual', false, { shouldDirty: true });
        setValue('roundOff', autoRoundOff, { shouldDirty: true });
    }, [setValue, setIsRoundOffManual, autoRoundOff]);

    // Sync financial values to react-hook-form
    useEffect(() => {
        if (!setValue) return;
        setValue('subTotal', parseFloat(rawSubTotal.toFixed(2)), { shouldValidate: false });
        setValue('discountAmount', docDiscountAmount, { shouldValidate: false });
        setValue('taxableAmount', netTaxableAmount, { shouldValidate: false });
        setValue('cgst', cgst, { shouldValidate: false });
        setValue('sgst', sgst, { shouldValidate: false });
        setValue('igst', igst, { shouldValidate: false });
        setValue('roundOff', roundOff, { shouldValidate: false });
        setValue('total', grandTotal, { shouldValidate: false });
    }, [
        setValue,
        rawSubTotal,
        docDiscountAmount,
        netTaxableAmount,
        cgst,
        sgst,
        igst,
        roundOff,
        grandTotal
    ]);

    return {
        isInterState,
        calculatedItems,
        rawSubTotal: parseFloat(rawSubTotal.toFixed(2)),
        itemsTaxableSum: parseFloat(itemsTaxableSum.toFixed(2)),
        docDiscountAmount,
        netTaxableAmount,
        cgst,
        sgst,
        igst,
        totalTaxes,
        otherCharges,
        totalBeforeRound: parseFloat(totalBeforeRound.toFixed(2)),
        autoRoundOff,
        roundOff,
        grandTotal,
        reqAdvance,
        advancePercent,
        handleDiscountPercentChange,
        handleOtherChange,
        handleRoundOffChange,
        handleResetRoundOffAuto
    };
};

export default useProformaCalculation;

