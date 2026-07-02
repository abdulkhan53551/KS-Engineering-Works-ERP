import { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { useStateCity } from "../../dashboard/hooks/api.hooks";

const useFormInit = (props) => {
    const { invoice, isEditMode, reset = Function(), setValue = Function(), control, defaultFormValue } = props;
    const selectedBillingStateId = useWatch({ control, name: "billingAddress.stateId" });
    const selectedShippingStateId = useWatch({ control, name: "shippingAddress.stateId" });
    const { data: billingCities = [] } = useStateCity(selectedBillingStateId);
    const { data: shippingCities = [] } = useStateCity(selectedShippingStateId);

    // Prefill form
    useEffect(() => {
        if (invoice && isEditMode) {
            const { invoiceId, items, ...rest } = invoice;  // invoiceId of invoice
            const cleanedInvoice = {
                // ==== Main Invoice Fields ====
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

                hasChallan: invoice.hasChallan,
                hasPo: invoice.hasPo,
                hasEwayBill: invoice.hasEwayBill,
                challanIds: invoice.challanIds || [],
                poIds: invoice.poIds || [],
                ewayBillIds: invoice.ewbIds || [],

                // ==== Items Array (Required Section) ====
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

                // ==== Invoice Summary Section ====
                subTotal: invoice.subTotal,
                discountPercent: invoice.discountPercent,
                discountAmount: invoice.discountAmount,
                taxableAmount: invoice.taxableAmount,
                cgst: invoice.cgst,
                sgst: invoice.sgst,
                igst: invoice.igst,
                total: invoice.total,
                roundOff: invoice.roundOff,
                other: invoice.other,

                // ==== Payment Section ====
                paymentStatusId: invoice.paymentStatusId,
                paymentModeId: invoice.paymentModeId
            };

            reset({
                ...cleanedInvoice
            });
        }
    }, [invoice, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue)
        }
    }, [isEditMode, reset])

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
}

export default useFormInit;