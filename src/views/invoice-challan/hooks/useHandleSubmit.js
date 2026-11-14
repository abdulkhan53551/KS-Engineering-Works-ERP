import moment from "moment";
import { useCreatInvoiceChallan, useUpdateInvoiceChallan } from "./useApi";

const useHandleSubmit = (props) => {
    const { challanId, isEditMode } = props;
    const { mutate: createInvoiceChallan, isPending: createInvoiceChallanIsPending } = useCreatInvoiceChallan();
    const { mutate: updateInvoiceChallan, isPending: updateInvoiceChallanIsPending } = useUpdateInvoiceChallan(challanId);

    const onSubmit = (data) => {
        if (createInvoiceChallanIsPending || updateInvoiceChallanIsPending) return false;

        const challanDate = data.challanDate ? moment(data.challanDate).format('YYYY-MM-DD') : null;

        // Process line items: filter out completely empty rows if user didn't enter anything
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
                    unit: it.unit || 'Nos',
                    rate: Number(it.rate) || 0,
                    total: Number(it.total) || ((Number(it.qty) || 1) * (Number(it.rate) || 0)),
                    sortOrder: idx
                }))
            : [];

        const formPayload = {
            challanNo: data.challanNo?.trim(),
            challanDate,
            customerName: data.customerName?.trim(),
            partyId: data.partyId ? Number(data.partyId) : null,
            partyBranchId: data.partyBranchId ? Number(data.partyBranchId) : null,
            deliveryAddress: data.deliveryAddress?.trim() || null,
            transportMode: data.transportMode || 'Road',
            vehicleNo: data.vehicleNo?.trim()?.toUpperCase() || null,
            transporterName: data.transporterName?.trim() || null,
            lrNo: data.lrNo?.trim() || null,
            dispatchReason: data.dispatchReason || 'Supply on Delivery',
            status: data.status || 'DISPATCHED',
            notes: data.notes?.trim() || null,
            invoiceId: data.invoiceId ? Number(data.invoiceId) : null,
            items
        };

        if (isEditMode) {
            // Challan number is immutable on edit
            delete formPayload.challanNo;
            updateInvoiceChallan(formPayload);
        } else {
            // Backend solely assigns atomic consecutive challan_no under firm pessimistic lock
            delete formPayload.challanNo;
            createInvoiceChallan(formPayload);
        }
    };

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createInvoiceChallanIsPending, updateInvoiceChallanIsPending };
};

export default useHandleSubmit;
