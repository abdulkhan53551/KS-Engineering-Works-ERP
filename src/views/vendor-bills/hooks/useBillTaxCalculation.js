import { useState, useCallback, useMemo, useEffect } from "react";
import Decimal from "decimal.js";

const toDec = (val) => {
    try {
        if (val === "" || val === null || val === undefined || isNaN(val)) return new Decimal(0);
        return new Decimal(val);
    } catch {
        return new Decimal(0);
    }
};

/**
 * Hook for calculating Indian GST and financial totals for Vendor Bills
 */
export const useBillTaxCalculation = ({
    initialValues = {},
    isMonetaryLocked = false
} = {}) => {
    const [taxableAmount, setTaxableAmount] = useState(initialValues.taxableAmount || 0);
    const [gstRate, setGstRate] = useState(initialValues.gstRate || 18);
    const [taxType, setTaxType] = useState(initialValues.taxType || "INTRA"); // "INTRA" (CGST+SGST) or "INTER" (IGST)
    const [cgst, setCgst] = useState(initialValues.cgst || 0);
    const [sgst, setSgst] = useState(initialValues.sgst || 0);
    const [igst, setIgst] = useState(initialValues.igst || 0);
    const [otherCharges, setOtherCharges] = useState(initialValues.otherCharges || 0);
    const [roundOff, setRoundOff] = useState(initialValues.roundOff || 0);
    const [manualTotalOverride, setManualTotalOverride] = useState(null);

    // Sync initial values if provided later
    useEffect(() => {
        if (initialValues.taxableAmount !== undefined) setTaxableAmount(initialValues.taxableAmount);
        if (initialValues.cgst !== undefined) setCgst(initialValues.cgst);
        if (initialValues.sgst !== undefined) setSgst(initialValues.sgst);
        if (initialValues.igst !== undefined) setIgst(initialValues.igst);
        if (initialValues.otherCharges !== undefined) setOtherCharges(initialValues.otherCharges);
        if (initialValues.roundOff !== undefined) setRoundOff(initialValues.roundOff);
        if (Number(initialValues.igst || 0) > 0) {
            setTaxType("INTER");
        } else if (Number(initialValues.cgst || 0) > 0 || Number(initialValues.sgst || 0) > 0) {
            setTaxType("INTRA");
        }
    }, [
        initialValues.taxableAmount,
        initialValues.cgst,
        initialValues.sgst,
        initialValues.igst,
        initialValues.otherCharges,
        initialValues.roundOff
    ]);

    // Recompute taxes whenever taxableAmount, gstRate, or taxType changes (unless locked)
    const recomputeTaxes = useCallback((taxable, rate, type) => {
        if (isMonetaryLocked) return;
        const taxDec = toDec(taxable);
        const rateDec = toDec(rate);

        if (taxDec.lte(0) || rateDec.lte(0)) {
            setCgst(0);
            setSgst(0);
            setIgst(0);
            return;
        }

        const totalTax = taxDec.times(rateDec).dividedBy(100).toDecimalPlaces(2);

        if (type === "INTRA") {
            const halfTax = totalTax.dividedBy(2).toDecimalPlaces(2);
            setCgst(halfTax.toNumber());
            setSgst(halfTax.toNumber());
            setIgst(0);
        } else {
            setCgst(0);
            setSgst(0);
            setIgst(totalTax.toNumber());
        }
    }, [isMonetaryLocked]);

    const handleTaxableChange = useCallback((val) => {
        if (isMonetaryLocked) return;
        const num = parseFloat(val) || 0;
        setTaxableAmount(num);
        recomputeTaxes(num, gstRate, taxType);
    }, [isMonetaryLocked, gstRate, taxType, recomputeTaxes]);

    const handleGstRateChange = useCallback((val) => {
        if (isMonetaryLocked) return;
        const num = parseFloat(val) || 0;
        setGstRate(num);
        recomputeTaxes(taxableAmount, num, taxType);
    }, [isMonetaryLocked, taxableAmount, taxType, recomputeTaxes]);

    const handleTaxTypeChange = useCallback((type) => {
        if (isMonetaryLocked) return;
        setTaxType(type);
        recomputeTaxes(taxableAmount, gstRate, type);
    }, [isMonetaryLocked, taxableAmount, gstRate, recomputeTaxes]);

    // Financial totals with Decimal.js
    const totals = useMemo(() => {
        const taxableDec = toDec(taxableAmount);
        const cgstDec = toDec(cgst);
        const sgstDec = toDec(sgst);
        const igstDec = toDec(igst);
        const otherDec = toDec(otherCharges);

        const subtotalWithTax = taxableDec.plus(cgstDec).plus(sgstDec).plus(igstDec).plus(otherDec);
        
        let calculatedRoundOff = toDec(roundOff);
        let finalTotal;

        if (manualTotalOverride !== null && manualTotalOverride !== undefined) {
            finalTotal = toDec(manualTotalOverride);
            calculatedRoundOff = finalTotal.minus(subtotalWithTax).toDecimalPlaces(2);
        } else {
            finalTotal = subtotalWithTax.plus(calculatedRoundOff).toDecimalPlaces(2);
        }

        return {
            taxableAmount: taxableDec.toDecimalPlaces(2).toNumber(),
            totalTax: cgstDec.plus(sgstDec).plus(igstDec).toDecimalPlaces(2).toNumber(),
            cgst: cgstDec.toDecimalPlaces(2).toNumber(),
            sgst: sgstDec.toDecimalPlaces(2).toNumber(),
            igst: igstDec.toDecimalPlaces(2).toNumber(),
            otherCharges: otherDec.toDecimalPlaces(2).toNumber(),
            roundOff: calculatedRoundOff.toDecimalPlaces(2).toNumber(),
            total: finalTotal.toDecimalPlaces(2).toNumber()
        };
    }, [taxableAmount, cgst, sgst, igst, otherCharges, roundOff, manualTotalOverride]);

    return {
        taxableAmount,
        setTaxableAmount: handleTaxableChange,
        gstRate,
        setGstRate: handleGstRateChange,
        taxType,
        setTaxType: handleTaxTypeChange,
        cgst,
        setCgst: (v) => !isMonetaryLocked && setCgst(parseFloat(v) || 0),
        sgst,
        setSgst: (v) => !isMonetaryLocked && setSgst(parseFloat(v) || 0),
        igst,
        setIgst: (v) => !isMonetaryLocked && setIgst(parseFloat(v) || 0),
        otherCharges,
        setOtherCharges: (v) => !isMonetaryLocked && setOtherCharges(parseFloat(v) || 0),
        roundOff,
        setRoundOff: (v) => !isMonetaryLocked && setRoundOff(parseFloat(v) || 0),
        setManualTotalOverride,
        totals
    };
};

export default useBillTaxCalculation;
