import moment from "moment";
import { useCreatPurchaseOrder, useUpdatePurchaseOrder } from "./useApi";

const useHandleSubmit = (props) => {
    const { poId, isEditMode } = props;
    const { mutate: createPurchaseOrder, isPending: createPurchaseOrderIsPending } = useCreatPurchaseOrder();
    const { mutate: updatePurchaseOrder, isPending: updatePurchaseOrderIsPending } = useUpdatePurchaseOrder(poId);

    const onSubmit = (data) => {
        if (createPurchaseOrderIsPending || updatePurchaseOrderIsPending) return false;

        const poDate = data.poDate ? moment(data.poDate).format('YYYY-MM-DD') : null;
        const deliveryDueDate = data.deliveryDueDate ? moment(data.deliveryDueDate).format('YYYY-MM-DD') : null;
        const validUntil = data.validUntil ? moment(data.validUntil).format('YYYY-MM-DD') : null;

        // Process line items: filter out completely empty rows
        const items = Array.isArray(data.items)
            ? data.items
                .filter(it => it.itemName && it.itemName.trim() !== '')
                .map((it, idx) => ({
                    id: it.id ? Number(it.id) : undefined,
                    productId: it.productId ? Number(it.productId) : null,
                    itemName: it.itemName.trim(),
                    description: it.description?.trim() || '',
                    hsnSacCode: it.hsnSacCode?.trim() || '',
                    qty: Number(it.qty) || 1,
                    invoicedQty: Number(it.invoicedQty) || 0,
                    unit: it.unit || 'Nos',
                    rate: Number(it.rate) || 0,
                    gstRate: Number(it.gstRate) || 0,
                    taxableAmount: Number(it.taxableAmount) || ((Number(it.qty) || 1) * (Number(it.rate) || 0)),
                    cgst: Number(it.cgst) || 0,
                    sgst: Number(it.sgst) || 0,
                    igst: Number(it.igst) || 0,
                    total: Number(it.total) || 0,
                    sortOrder: idx
                }))
            : [];

        const formPayload = {
            poNo: data.poNo?.trim(),
            poDate,
            customerName: data.customerName?.trim(),
            partyId: data.partyId ? Number(data.partyId) : null,
            partyBranchId: data.partyBranchId ? Number(data.partyBranchId) : null,
            billingAddress: data.billingAddress?.trim() || null,
            deliveryAddress: data.deliveryAddress?.trim() || null,
            deliveryDueDate,
            validUntil,
            paymentTerms: data.paymentTerms?.trim() || null,
            advancePercentage: data.advancePercentage !== undefined ? Number(data.advancePercentage) : 0,
            status: data.status || 'OPEN',
            notes: data.notes?.trim() || null,
            items
        };

        if (isEditMode) {
            updatePurchaseOrder(formPayload);
        } else {
            createPurchaseOrder(formPayload);
        }
    };

    const onError = (errors, e) => console.log('Purchase Order Form Error: ', errors);

    return { onSubmit, onError, createPurchaseOrderIsPending, updatePurchaseOrderIsPending };
};

export default useHandleSubmit;
