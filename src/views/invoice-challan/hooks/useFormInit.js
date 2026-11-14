import { useEffect } from "react";

/**
 * Custom hook to hydrate Delivery Challan form in Edit mode.
 * In Create mode, React Hook Form's defaultValues handles 0-lag initial state
 * with zero redundant re-renders or infinite loops.
 */
const useFormInit = (props) => {
    const { invoiceChallan, isEditMode, reset = Function() } = props;

    // Prefill form in edit mode when existing record is fetched
    useEffect(() => {
        if (invoiceChallan && isEditMode && Object.keys(invoiceChallan).length > 0) {
            reset({
                invoiceId: invoiceChallan.invoiceId ?? null,
                firmBranchId: invoiceChallan.firmBranchId ?? null,
                partyId: invoiceChallan.partyId ?? null,
                partyBranchId: invoiceChallan.partyBranchId ?? null,
                challanNo: invoiceChallan.challanNo ?? '',
                challanDate: invoiceChallan.challanDate ? new Date(invoiceChallan.challanDate) : new Date(),
                customerName: invoiceChallan.customerName ?? '',
                deliveryAddress: invoiceChallan.deliveryAddress ?? '',
                transportMode: invoiceChallan.transportMode ?? 'Road',
                vehicleNo: invoiceChallan.vehicleNo ?? '',
                transporterName: invoiceChallan.transporterName ?? '',
                lrNo: invoiceChallan.lrNo ?? '',
                dispatchReason: invoiceChallan.dispatchReason ?? 'Supply on Delivery',
                status: invoiceChallan.status ?? 'DISPATCHED',
                notes: invoiceChallan.notes ?? '',
                items: Array.isArray(invoiceChallan.items) && invoiceChallan.items.length > 0
                    ? invoiceChallan.items.map(it => ({
                        id: it.id,
                        productId: it.productId ?? null,
                        itemName: it.itemName ?? '',
                        description: it.description ?? '',
                        hsnSacCode: it.hsnSacCode ?? '',
                        qty: Number(it.qty) || 1,
                        unit: it.unit ?? 'Nos',
                        rate: Number(it.rate) || 0,
                        total: Number(it.total) || 0,
                        sortOrder: it.sortOrder ?? 0
                    }))
                    : [{ itemName: '', description: '', hsnSacCode: '', qty: 1, unit: 'Nos', rate: 0, total: 0 }]
            });
        }
    }, [invoiceChallan, isEditMode, reset]);
};

export default useFormInit;
