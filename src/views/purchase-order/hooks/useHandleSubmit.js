import { useCreatPurchaseOrder, useUpdatePurchaseOrder } from "./useApi";

const useHandleSubmit = (props) => {
    const { poId, isEditMode } = props;
    const { mutate: createPurchaseOrder, isPending: createPurchaseOrderIsPending } = useCreatPurchaseOrder();
    const { mutate: updatePurchaseOrder, isPending: updatePurchaseOrderIsPending } = useUpdatePurchaseOrder(poId);

    const onSubmit = (data) => {
        const poDateISO = data.poDate ? new Date(data.poDate).toISOString() : null;

        if (createPurchaseOrderIsPending || updatePurchaseOrderIsPending) return false;

        const formPayload = {
            ...data,
            poDate: poDateISO
        }

        if (isEditMode) {
            updatePurchaseOrder(formPayload);
        } else {
            createPurchaseOrder(formPayload);
        }
    }

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createPurchaseOrderIsPending, updatePurchaseOrderIsPending };
}

export default useHandleSubmit;