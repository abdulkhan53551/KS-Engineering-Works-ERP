import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { useStateCity, usePaymentStatus } from "../../dashboard/hooks/api.hooks";
import { useGetNextInvoiceNumber } from "./useApi";
import moment from "moment";

/**
 * Calculates auto round-off and determines if backend round-off is manual or auto
 * @param {Object} invoice 
 * @returns {{ roundOff: number, isRoundOffManual: boolean, autoRoundOff: number, backendRoundOff: number }}
 */
export const calculateInvoiceRoundOffInfo = (invoice = {}) => {
    let computedTaxable = 0;
    let computedTaxes = 0;

    if (Array.isArray(invoice.items) && invoice.items.length > 0) {
        invoice.items.forEach(item => {
            computedTaxable += Number(item.taxableAmount || 0);
            computedTaxes += Number(item.cgst || 0) + Number(item.sgst || 0) + Number(item.igst || 0);
        });
    } else {
        computedTaxable = Number(invoice.taxableAmount || 0);
        computedTaxes = Number(invoice.cgst || 0) + Number(invoice.sgst || 0) + Number(invoice.igst || 0);
    }

    const other = Number(invoice.other || 0);
    const totalBeforeRound = computedTaxable + computedTaxes + other;
    const autoRoundedTotal = Math.round(totalBeforeRound);
    const autoRoundOff = Number((autoRoundedTotal - totalBeforeRound).toFixed(2));
    const backendRoundOff = Number(Number(invoice.roundOff || 0).toFixed(2));

    // If backend roundoff differs from auto-calculated roundoff, treat as manual/custom (strictly !==)
    const isRoundOffManual = backendRoundOff.toFixed(2) !== autoRoundOff.toFixed(2);

    return {
        roundOff: isRoundOffManual ? backendRoundOff : autoRoundOff,
        isRoundOffManual,
        autoRoundOff,
        backendRoundOff
    };
};

const useFormInit = (props) => {
    const { invoice, mode = "create", reset = Function(), setValue = Function(), control, defaultFormValue } = props;
    const isEditMode = mode === "edit";
    const isDuplicateMode = mode === "duplicate";

    const selectedBillingStateId = useWatch({ control, name: "billingAddress.stateId" });
    const selectedShippingStateId = useWatch({ control, name: "shippingAddress.stateId" });
    const { data: billingCities = [] } = useStateCity(selectedBillingStateId);
    const { data: shippingCities = [] } = useStateCity(selectedShippingStateId);
    const { data: nextInvoiceNumber } = useGetNextInvoiceNumber(!isEditMode);
    const { data: paymentStatuses = [] } = usePaymentStatus();

    // Dynamically find the 'PENDING' status ID from master table
    const pendingStatusObj = paymentStatuses.find(s =>
        (s.statusCode || s.code || s.statusName || s.name || '').toUpperCase() === 'PENDING'
    );
    const pendingStatusId = pendingStatusObj?.id || 1;

    // Prefill form for Edit mode OR Duplicate mode
    useEffect(() => {
        if (invoice && (invoice.invoiceId || invoice.id || invoice.invoiceNo)) {
            if (isEditMode) {
                // ==== EDIT MODE ====
                const challanIds = invoice.challanIds || [];
                const poIds = invoice.poIds || invoice.purchaseOrderIds || [];
                const ewayBillIds = invoice.ewayBillIds || invoice.ewbIds || [];

                const hasChallan = Boolean(invoice.hasChallan || challanIds.length > 0);
                const hasPo = Boolean(invoice.hasPo || poIds.length > 0);
                const hasEwayBill = Boolean(invoice.hasEwayBill || ewayBillIds.length > 0);

                // Calculate round-off info
                const { roundOff: resolvedRoundOff, isRoundOffManual } = calculateInvoiceRoundOffInfo(invoice);

                const cleanedInvoice = {
                    invoiceNo: invoice.invoiceNo,
                    invoiceDate: invoice.invoiceDate,
                    customerName: invoice.customerName,

                    dueDays: invoice.dueDays,
                    dueDate: invoice.dueDate,

                    hasGst: invoice.hasGst,
                    gstNumber: invoice.gstNumber,

                    billingAddress: {
                        id: invoice.billingAddress?.id,
                        email: invoice.billingAddress?.email,
                        phoneNumber: invoice.billingAddress?.phoneNumber,
                        website: invoice.billingAddress?.website,
                        addressLine1: invoice.billingAddress?.addressLine1,
                        cityId: invoice.billingAddress?.cityId,
                        stateId: invoice.billingAddress?.stateId,
                        pincode: invoice.billingAddress?.pincode
                    },

                    shippingAddress: {
                        id: invoice.shippingAddress?.id,
                        email: invoice.shippingAddress?.email,
                        phoneNumber: invoice.shippingAddress?.phoneNumber,
                        addressLine1: invoice.shippingAddress?.addressLine1,
                        cityId: invoice.shippingAddress?.cityId,
                        stateId: invoice.shippingAddress?.stateId,
                        pincode: invoice.shippingAddress?.pincode
                    },

                    hasChallan,
                    hasPo,
                    hasEwayBill,
                    challanIds,
                    poIds,
                    ewayBillIds,

                    // Items Array
                    items: invoice.items?.map(item => ({
                        description: item.description,
                        hsnSacCode: item.hsnSacCode,
                        qty: item.qty,
                        itemUnitId: item.itemUnitId,
                        rate: item.rate,
                        discountPercent: item.discountPercent,
                        discountAmount: item.discountAmount,
                        taxableAmount: item.taxableAmount,
                        gstSlabId: item.gstSlabId,
                        cgst: item.cgst,
                        sgst: item.sgst,
                        igst: item.igst,
                        total: item.total
                    })),

                    // Invoice Summary Section
                    subTotal: invoice.subTotal,
                    discountPercent: invoice.discountPercent,
                    discountAmount: invoice.discountAmount,
                    taxableAmount: invoice.taxableAmount,
                    cgst: invoice.cgst,
                    sgst: invoice.sgst,
                    igst: invoice.igst,
                    total: invoice.total,
                    roundOff: resolvedRoundOff,
                    roundOffManual: isRoundOffManual,
                    other: invoice.other ?? 0,

                    // Payment Section
                    paymentStatusId: invoice.paymentStatusId,
                    paymentModeId: invoice.paymentModeId
                };

                reset({ ...cleanedInvoice });
            } else if (isDuplicateMode) {
                // ==== DUPLICATE MODE ====
                const today = new Date();
                const dueDaysCount = Number(invoice.dueDays || 0);
                const calculatedDueDate = moment(today).add(dueDaysCount, 'days').toDate();

                const duplicatedInvoice = {
                    // Auto-generated Next Invoice Number
                    invoiceNo: nextInvoiceNumber?.invoiceNo || "",
                    invoiceDate: today,
                    customerName: invoice.customerName || "",

                    dueDays: dueDaysCount,
                    dueDate: calculatedDueDate,

                    hasGst: Boolean(invoice.hasGst),
                    gstNumber: invoice.gstNumber || "",

                    billingAddress: {
                        email: invoice.billingAddress?.email || "",
                        phoneNumber: invoice.billingAddress?.phoneNumber || "",
                        website: invoice.billingAddress?.website || "",
                        addressLine1: invoice.billingAddress?.addressLine1 || "",
                        cityId: invoice.billingAddress?.cityId || null,
                        stateId: invoice.billingAddress?.stateId || null,
                        pincode: invoice.billingAddress?.pincode || ""
                    },

                    shippingAddress: {
                        email: invoice.shippingAddress?.email || "",
                        phoneNumber: invoice.shippingAddress?.phoneNumber || "",
                        addressLine1: invoice.shippingAddress?.addressLine1 || "",
                        cityId: invoice.shippingAddress?.cityId || null,
                        stateId: invoice.shippingAddress?.stateId || null,
                        pincode: invoice.shippingAddress?.pincode || ""
                    },

                    // Reset one-time dispatch records
                    hasChallan: false,
                    hasPo: false,
                    hasEwayBill: false,
                    challanIds: [],
                    poIds: [],
                    ewayBillIds: [],

                    // Items Array
                    items: invoice.items?.map(item => ({
                        description: item.description || "",
                        hsnSacCode: item.hsnSacCode || "",
                        qty: item.qty || 1,
                        itemUnitId: item.itemUnitId || null,
                        rate: item.rate || 0,
                        discountPercent: item.discountPercent || 0,
                        discountAmount: item.discountAmount || 0,
                        taxableAmount: item.taxableAmount || 0,
                        gstSlabId: item.gstSlabId || null,
                        cgst: item.cgst || 0,
                        sgst: item.sgst || 0,
                        igst: item.igst || 0,
                        total: item.total || 0
                    })) || [],

                    // Invoice Summary Section
                    subTotal: invoice.subTotal || 0,
                    discountPercent: invoice.discountPercent || 0,
                    discountAmount: invoice.discountAmount || 0,
                    taxableAmount: invoice.taxableAmount || 0,
                    cgst: invoice.cgst || 0,
                    sgst: invoice.sgst || 0,
                    igst: invoice.igst || 0,
                    total: invoice.total || 0,
                    roundOff: invoice.roundOff ?? 0,
                    roundOffManual: false,
                    other: invoice.other ?? 0,

                    // Payment Section (Default to PENDING)
                    paymentStatusId: pendingStatusId,
                    paymentModeId: invoice.paymentModeId || 1
                };

                reset({ ...duplicatedInvoice });
            }
        }
    }, [invoice, isEditMode, isDuplicateMode, nextInvoiceNumber, pendingStatusId, reset]);

    // Reset the form for fresh Create mode
    useEffect(() => {
        if (!isEditMode && !isDuplicateMode) {
            reset(defaultFormValue);
        }
    }, [isEditMode, isDuplicateMode, reset, defaultFormValue]);

    // Set invoice no that is autogenerated (for Create and Duplicate modes)
    useEffect(() => {
        if (!isEditMode && nextInvoiceNumber?.invoiceNo) {
            setValue("invoiceNo", nextInvoiceNumber.invoiceNo);
        }
    }, [nextInvoiceNumber, setValue, isEditMode]);

    // Set billing address city
    useEffect(() => {
        if (!invoice?.billingAddress?.cityId) return;
        if (!billingCities?.length) return;

        setValue(
            "billingAddress.cityId",
            invoice.billingAddress.cityId,
            { shouldDirty: false }
        );
    }, [billingCities, selectedBillingStateId, invoice?.billingAddress?.cityId, setValue]);

    // Set shipping address city
    useEffect(() => {
        if (!invoice?.shippingAddress?.cityId) return;
        if (!shippingCities?.length) return;

        setValue(
            "shippingAddress.cityId",
            invoice.shippingAddress.cityId,
            { shouldDirty: false }
        );
    }, [shippingCities, selectedShippingStateId, invoice?.shippingAddress?.cityId, setValue]);
};

export default useFormInit;