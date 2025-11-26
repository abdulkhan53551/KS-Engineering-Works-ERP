import { useEffect, useMemo } from "react";
import { useWatch } from "react-hook-form";

const useInvoiceCalculation = (props) => {
    const { control, setValue, getValues } = props;

    // 🔍 Watch all items dynamically
    const items = useWatch({ control, name: "items" });
    const roundOffManual = useWatch({ control, name: "roundOffManual" });
    const userRoundOff = useWatch({ control, name: "roundOff" });
    const discountAmount = useWatch({ control, name: "discountAmount" });
    const otherCharges = useWatch({ control, name: "other" });

    const invoiceSummary = useMemo(() => {
        if (!items) return {};

        let subTotal = 0;
        let taxableAmount = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        items.forEach(item => {
            subTotal += Number(item.qty || 0) * Number(item.rate || 0);
            taxableAmount += Number(item.taxableAmount || 0);
            cgst += Number(item.cgst || 0);
            sgst += Number(item.sgst || 0);
            igst += Number(item.igst || 0);
        });

        const totalBeforeRound = taxableAmount + cgst + sgst + igst - Number(discountAmount) + Number(otherCharges);
        const autoRoundedTotal = Math.round(totalBeforeRound);
        const autoRoundOff = autoRoundedTotal - totalBeforeRound;

        // If manual roundoff → use user value
        const finalRoundOff = Number(roundOffManual ? userRoundOff : autoRoundOff);
        const finalTotal = totalBeforeRound + finalRoundOff;

        return {
            subTotal,
            taxableAmount,
            cgst,
            sgst,
            igst,
            roundOff: finalRoundOff,
            total: finalTotal
        };
    }, [items, roundOffManual, userRoundOff, discountAmount, otherCharges]);

    useEffect(() => {
        if (!invoiceSummary.total) return;

        const updateIfChanged = (name, newValue) => {
            const current = getValues(name);
            if (current != newValue) {
                setValue(name, newValue, { shouldDirty: true });
            }
        };

        updateIfChanged("subTotal", invoiceSummary.subTotal.toFixed(2));
        updateIfChanged("taxableAmount", invoiceSummary.taxableAmount.toFixed(2));
        updateIfChanged("cgst", invoiceSummary.cgst.toFixed(2));
        updateIfChanged("sgst", invoiceSummary.sgst.toFixed(2));
        updateIfChanged("igst", invoiceSummary.igst.toFixed(2));

        // ❗ ONLY auto-update roundOff if not manually entered
        if (!roundOffManual) {
            updateIfChanged("roundOff", invoiceSummary.roundOff.toFixed(2));
        }

        updateIfChanged("total", invoiceSummary.total.toFixed(2));
    }, [invoiceSummary]);
}

export default useInvoiceCalculation;