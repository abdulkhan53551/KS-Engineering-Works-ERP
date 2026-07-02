import { useEffect, useMemo, useRef } from "react";
import { useWatch } from "react-hook-form";
import useGst from "../../../hooks/useGst";

const useInvoiceCalculation = (props) => {
    const { control, setValue, getValues } = props;
    const lastEditedFieldRef = useRef(null);

    // Watch fields
    const [items, roundOffManual, userRoundOff, invoiceDiscount, otherCharges] = useWatch({
        control,
        name: ["items", "roundOffManual", "roundOff", "discountAmount", "other"],
    });

    const { getGstRate } = useGst();

    // --------------------------------------------------
    // 1) DISTRIBUTE DISCOUNT TO ITEMS
    // --------------------------------------------------
    const itemsWithDiscount = useMemo(() => {
        if (!items || items.length === 0) return [];

        // ⛔ Skip calculation for description / hsn typing
        if (
            lastEditedFieldRef.current === "description" ||
            lastEditedFieldRef.current === "hsn"
        ) {

            // RESET ONLY AFTER CALCULATION
            lastEditedFieldRef.current = null;
            return items;
        }

        const totalSubTotal = items.reduce(
            (sum, it) => sum + (Number(it.qty || 0) * Number(it.rate || 0)),
            0
        );

        if (totalSubTotal === 0) return items;

        let distributedSum = 0;

        const updatedItems = items.map((item, index) => {
            const subTotal = Number(item.qty || 0) * Number(item.rate || 0);

            // proportionate discount
            let discount = (subTotal / totalSubTotal) * Number(invoiceDiscount || 0);
            discount = Number(discount.toFixed(2));
            distributedSum += discount;

            // last item tolerance fix
            if (index === items.length - 1) {
                const tolerance = Number(invoiceDiscount || 0) - distributedSum;
                discount += Number(tolerance.toFixed(2));
            }

            const taxableAmount = subTotal - discount;

            // GST rate
            const gstRate = getGstRate(item.gstSlabId);
            const cgstRate = Number(gstRate / 2) || 0;
            const sgstRate = Number(gstRate / 2) || 0;
            const igstRate = 0;

            // TAX calculations per item
            const cgst = taxableAmount * ((Number(cgstRate || 0)) / 100);
            const sgst = taxableAmount * ((Number(sgstRate || 0)) / 100);
            const igst = taxableAmount * ((Number(igstRate || 0)) / 100);

            const total = taxableAmount + cgst + sgst + igst;

            return {
                ...item,
                subTotal: Number(subTotal.toFixed(2)),
                discountAmount: Number(discount.toFixed(2)),
                taxableAmount: Number(taxableAmount.toFixed(2)),
                cgst: Number(cgst.toFixed(2)),
                sgst: Number(sgst.toFixed(2)),
                igst: Number(igst.toFixed(2)),
                total: Number(total.toFixed(2))
            };
        });

        return updatedItems;
    }, [items, invoiceDiscount]);

    // --------------------------------------------------
    // 2) INVOICE SUMMARY
    // --------------------------------------------------
    const invoiceSummary = useMemo(() => {
        if (!itemsWithDiscount) return {};

        let subTotal = 0, taxableAmount = 0, cgst = 0, sgst = 0, igst = 0;

        itemsWithDiscount.forEach(item => {
            subTotal += Number(item.subTotal || 0);
            taxableAmount += Number(item.taxableAmount || 0);
            cgst += Number(item.cgst || 0);
            sgst += Number(item.sgst || 0);
            igst += Number(item.igst || 0);
        });

        taxableAmount = taxableAmount + Number(otherCharges || 0);

        const totalBeforeRound = taxableAmount + cgst + sgst + igst;
        const autoRoundedTotal = Math.round(totalBeforeRound);
        const autoRoundOff = autoRoundedTotal - totalBeforeRound;

        const finalRoundOff = Number(roundOffManual ? userRoundOff : autoRoundOff);
        const finalTotal = totalBeforeRound + finalRoundOff;

        return {
            items: itemsWithDiscount,
            subTotal,
            taxableAmount,
            cgst,
            sgst,
            igst,
            roundOff: finalRoundOff,
            total: finalTotal
        };
    }, [itemsWithDiscount, roundOffManual, userRoundOff, otherCharges]);

    useEffect(() => {
        if (!invoiceSummary.total) return;

        // update items with new calculation
        invoiceSummary.items.forEach((item, index) => {
            const current = getValues(`items.${index}`);
            if (!current) return;

            if (current.total !== item.total || current.taxableAmount !== item.taxableAmount) {
                setValue(
                    `items.${index}`,
                    {
                        ...current,
                        discountAmount: item.discountAmount,
                        subTotal: item.subTotal,
                        taxableAmount: item.taxableAmount,
                        cgst: item.cgst,
                        sgst: item.sgst,
                        total: item.total
                    },
                    {
                        shouldDirty: false,
                        shouldValidate: false,
                        shouldTouch: false
                    }
                );
            }
        });

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

        if (!roundOffManual) {
            updateIfChanged("roundOff", invoiceSummary.roundOff.toFixed(2));
        }

        updateIfChanged("total", invoiceSummary.total.toFixed(2));
    }, [invoiceSummary]);

    return {
        lastEditedFieldRef
    }
};

export default useInvoiceCalculation;