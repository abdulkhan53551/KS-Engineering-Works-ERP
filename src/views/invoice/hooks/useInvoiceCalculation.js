import { useEffect, useMemo, useRef } from "react";
import { useWatch } from "react-hook-form";
import useGst from "../../../hooks/useGst";
import { resolveSupplierGstCode, resolveRecipientGstCode, determineIsInterState } from "../../../utilities/gstStateHelper";

const useInvoiceCalculation = (props) => {
    const { control, setValue, getValues, companyStateId = 27, statesList = [] } = props;
    const lastEditedFieldRef = useRef(null);

    // Watch fields
    const [
        items,
        roundOffManual,
        userRoundOff,
        invoiceDiscount,
        otherCharges,
        billingStateId,
        shippingStateId,
        gstNumber,
        hasGst
    ] = useWatch({
        control,
        name: [
            "items",
            "roundOffManual",
            "roundOff",
            "discountAmount",
            "other",
            "billingAddress.stateId",
            "shippingAddress.stateId",
            "gstNumber",
            "hasGst"
        ],
    });

    const { getGstRate } = useGst();

    // --------------------------------------------------
    // Determine Inter-State (IGST) vs Intra-State (CGST+SGST)
    // --------------------------------------------------
    const { supplierGstCode, recipientGstCode, isInterState } = useMemo(() => {
        const supCode = resolveSupplierGstCode(companyStateId, statesList);
        const recCode = resolveRecipientGstCode(
            { hasGst, gstNumber, billingStateId, shippingStateId },
            statesList
        );

        return {
            supplierGstCode: supCode,
            recipientGstCode: recCode,
            isInterState: determineIsInterState(supCode, recCode)
        };
    }, [shippingStateId, billingStateId, companyStateId, gstNumber, hasGst, statesList]);

    // --------------------------------------------------
    // 1) DISTRIBUTE DISCOUNT TO ITEMS & CALCULATE TAXES
    // --------------------------------------------------
    const itemsWithDiscount = useMemo(() => {
        if (!items || items.length === 0) return [];

        // ⛔ Skip calculation for description / hsn typing
        if (
            lastEditedFieldRef.current === "description" ||
            lastEditedFieldRef.current === "hsn"
        ) {
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

            const taxableAmount = Math.max(0, subTotal - discount);

            // GST rate
            const gstRate = getGstRate(item.gstSlabId);
            let cgstRate = 0;
            let sgstRate = 0;
            let igstRate = 0;

            if (isInterState) {
                igstRate = Number(gstRate || 0);
                cgstRate = 0;
                sgstRate = 0;
            } else {
                cgstRate = Number(gstRate / 2) || 0;
                sgstRate = Number(gstRate / 2) || 0;
                igstRate = 0;
            }

            // TAX calculations per item
            const cgst = taxableAmount * (Number(cgstRate || 0) / 100);
            const sgst = taxableAmount * (Number(sgstRate || 0) / 100);
            const igst = taxableAmount * (Number(igstRate || 0) / 100);

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
    }, [items, invoiceDiscount, isInterState, getGstRate]);

    // --------------------------------------------------
    // 2) INVOICE SUMMARY
    // --------------------------------------------------
    const invoiceSummary = useMemo(() => {
        if (!itemsWithDiscount) return {};

        let subTotal = 0, taxableAmount = 0, cgst = 0, sgst = 0, igst = 0, totalQty = 0;

        itemsWithDiscount.forEach(item => {
            subTotal += Number(item.subTotal || 0);
            taxableAmount += Number(item.taxableAmount || 0);
            cgst += Number(item.cgst || 0);
            sgst += Number(item.sgst || 0);
            igst += Number(item.igst || 0);
            totalQty += Number(item.qty || 0);
        });

        const finalOtherCharges = Number(otherCharges || 0);

        const totalBeforeRound = taxableAmount + cgst + sgst + igst + finalOtherCharges;
        const autoRoundedTotal = Math.round(totalBeforeRound);
        const autoRoundOff = autoRoundedTotal - totalBeforeRound;

        const finalRoundOff = Number(roundOffManual ? userRoundOff : autoRoundOff);
        const finalTotal = totalBeforeRound + finalRoundOff;

        return {
            items: itemsWithDiscount,
            totalItemsCount: itemsWithDiscount.length,
            totalQty,
            subTotal,
            taxableAmount,
            cgst,
            sgst,
            igst,
            isInterState,
            roundOff: finalRoundOff,
            total: finalTotal
        };
    }, [itemsWithDiscount, roundOffManual, userRoundOff, otherCharges, isInterState]);

    useEffect(() => {
        if (!invoiceSummary || invoiceSummary.total === undefined) return;

        const totalSub = Number(invoiceSummary.subTotal || 0);
        const otherCh = Number(otherCharges || 0);

        // Do not stomp over form fields on initial empty render when items are not populated
        if (totalSub === 0 && otherCh === 0 && (!items || items.length <= 1) && !roundOffManual) {
            return;
        }

        // update items with new calculation
        invoiceSummary.items?.forEach((item, index) => {
            const current = getValues(`items.${index}`);
            if (!current) return;

            if (
                current.total !== item.total ||
                current.taxableAmount !== item.taxableAmount ||
                current.cgst !== item.cgst ||
                current.sgst !== item.sgst ||
                current.igst !== item.igst
            ) {
                setValue(
                    `items.${index}`,
                    {
                        ...current,
                        discountAmount: item.discountAmount,
                        subTotal: item.subTotal,
                        taxableAmount: item.taxableAmount,
                        cgst: item.cgst,
                        sgst: item.sgst,
                        igst: item.igst,
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

        if (invoiceSummary.subTotal !== undefined) {
            updateIfChanged("subTotal", Number(invoiceSummary.subTotal || 0).toFixed(2));
            updateIfChanged("taxableAmount", Number(invoiceSummary.taxableAmount || 0).toFixed(2));
            updateIfChanged("cgst", Number(invoiceSummary.cgst || 0).toFixed(2));
            updateIfChanged("sgst", Number(invoiceSummary.sgst || 0).toFixed(2));
            updateIfChanged("igst", Number(invoiceSummary.igst || 0).toFixed(2));

            if (!roundOffManual && totalSub > 0) {
                updateIfChanged("roundOff", Number(invoiceSummary.roundOff || 0).toFixed(2));
            }

            updateIfChanged("total", Number(invoiceSummary.total || 0).toFixed(2));
        }
    }, [invoiceSummary, getValues, setValue, roundOffManual, items, otherCharges]);

    return {
        lastEditedFieldRef,
        isInterState,
        placeOfSupplyCode: recipientGstCode,
        supplierGstCode,
        invoiceSummary
    };
};

export default useInvoiceCalculation;