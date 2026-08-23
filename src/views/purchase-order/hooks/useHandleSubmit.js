import moment from "moment";
import { useCreatPurchaseOrder, useUpdatePurchaseOrder } from "./useApi";

const useHandleSubmit = (props) => {
    const { poId, isEditMode } = props;
    const { mutate: createPurchaseOrder, isPending: createPurchaseOrderIsPending } = useCreatPurchaseOrder();
    const { mutate: updatePurchaseOrder, isPending: updatePurchaseOrderIsPending } = useUpdatePurchaseOrder(poId);

    const onSubmit = (data) => {
        if (createPurchaseOrderIsPending || updatePurchaseOrderIsPending) return false;

        const poDate = data.poDate ? moment(data.poDate).format('YYYY-MM-DD') : null;

        const formPayload = {
            poNo: data.poNo?.trim(),
            poDate,
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