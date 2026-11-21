import { useEffect } from "react";

/**
 * Custom hook to hydrate Customer Purchase Order form in Edit mode.
 * In Create mode, React Hook Form's defaultValues handles 0-lag initial state
 * with zero redundant re-renders or infinite loops.
 */
const useFormInit = (props) => {
    const { purchaseOrder, isEditMode, reset = Function() } = props;

    // Prefill form in edit mode when existing record is fetched
    useEffect(() => {
        if (purchaseOrder && isEditMode && Object.keys(purchaseOrder).length > 0) {
            reset({
                firmBranchId: purchaseOrder.firmBranchId ?? null,
                partyId: purchaseOrder.partyId ?? null,
                partyBranchId: purchaseOrder.partyBranchId ?? null,
                poNo: purchaseOrder.poNo ?? '',
                poDate: purchaseOrder.poDate ? new Date(purchaseOrder.poDate) : new Date(),
                customerName: purchaseOrder.customerName ?? '',
                billingAddress: purchaseOrder.billingAddress ?? '',
                deliveryAddress: purchaseOrder.deliveryAddress ?? '',
                deliveryDueDate: purchaseOrder.deliveryDueDate ? new Date(purchaseOrder.deliveryDueDate) : null,
                validUntil: purchaseOrder.validUntil ? new Date(purchaseOrder.validUntil) : null,
                paymentTerms: purchaseOrder.paymentTerms ?? '',
                advancePercentage: Number(purchaseOrder.advancePercentage) || 0,
                status: purchaseOrder.status ?? 'OPEN',
                notes: purchaseOrder.notes ?? '',
                items: Array.isArray(purchaseOrder.items) && purchaseOrder.items.length > 0
                    ? purchaseOrder.items.map(it => ({
                        id: it.id,
                        productId: it.productId ?? null,
                        itemName: it.itemName ?? '',
                        description: it.description ?? '',
                        hsnSacCode: it.hsnSacCode ?? '',
                        qty: Number(it.qty) || 1,
                        invoicedQty: Number(it.invoicedQty) || 0,
                        unit: it.unit ?? 'Nos',
                        rate: Number(it.rate) || 0,
                        gstRate: Number(it.gstRate) || 0,
                        taxableAmount: Number(it.taxableAmount) || 0,
                        cgst: Number(it.cgst) || 0,
                        sgst: Number(it.sgst) || 0,
                        igst: Number(it.igst) || 0,
                        total: Number(it.total) || 0,
                        sortOrder: it.sortOrder ?? 0
                    }))
                    : [{ itemName: '', description: '', hsnSacCode: '', qty: 1, invoicedQty: 0, unit: 'Nos', rate: 0, gstRate: 18, taxableAmount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }]
            });
        }
    }, [purchaseOrder, isEditMode, reset]);
};

export default useFormInit;
