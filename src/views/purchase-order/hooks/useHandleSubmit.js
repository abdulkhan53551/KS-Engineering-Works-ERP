import { useCreatPurchaseOrder, useUpdatePurchaseOrder } from "./useApi";

const useHandleSubmit = (props) => {
    const { poId, isEditMode } = props;
    const { mutate: createPurchaseOrder, isPending: createPurchaseOrderIsPending } = useCreatPurchaseOrder();
    const { mutate: updatePurchaseOrder, isPending: updatePurchaseOrderIsPending } = useUpdatePurchaseOrder(poId);

    const onSubmit = (data) => {
        if (createPurchaseOrderIsPending || updatePurchaseOrderIsPending) return false;

        const poDateISO = data.poDate ? new Date(data.poDate).toISOString() : null;

        const formPayload = {
            poNo: data.poNo?.trim(),
            poDate: poDateISO,
            customerName: data.customerName?.trim(),
            status: data.status || 'OPEN'
        };

        if (isEditMode) {
            updatePurchaseOrder(formPayload);
        } else {
            createPurchaseOrder(formPayload);
        }
    };

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createPurchaseOrderIsPending, updatePurchaseOrderIsPending };
};

export default useHandleSubmit;