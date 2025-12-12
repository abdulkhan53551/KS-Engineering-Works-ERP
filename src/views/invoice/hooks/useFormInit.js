import { useEffect } from "react";

const useFormInit = (props) => {
    const { invoice, isEditMode, reset = Function(), defaultFormValue } = props;

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

            // const cleanedItems = items.map(({ id, invoiceId, gstRate, uqc, ...itemRest }) => itemRest);


            // const tempData = {
            //     "invoiceNo": "INV-2025-012",
            //     "invoiceDate": "2025-08-24T18:30:00.000Z",
            //     "customerName": "ABC Traders Pvt Ltd",
            //     "items": [
            //         {
            //             // "id": 53,
            //             // "invoiceId": 47,
            //             "description": "Gold Necklace",
            //             "hsnSacCode": "71131910",
            //             "itemUnitId": 1,
            //             "qty": "2.00",
            //             "rate": "25000.00",
            //             "gstSlabId": 1,
            //             "taxableAmount": "45000.00",
            //             "cgst": "0.00",
            //             "sgst": "0.00",
            //             "total": "45000.00"
            //         },
            //         {
            //             // "id": 55,
            //             // "invoiceId": 47,
            //             "description": "Silver Bracelet",
            //             "hsnSacCode": "71141100",
            //             "itemUnitId": 1,
            //             "qty": "5.00",
            //             "rate": "1500.00",
            //             "gstSlabId": 2,
            //             "taxableAmount": "6750.00",
            //             "cgst": "168.75",
            //             "sgst": "168.75",
            //             "total": "7087.50"
            //         }
            //     ]
            // }


            // reset({
            //     ...tempData,
            // });

            reset({
                ...cleanedInvoice,
                // items: cleanedItems
            });
        }
    }, [invoice, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue)
        }
    }, [isEditMode, reset])
}


export default useFormInit;