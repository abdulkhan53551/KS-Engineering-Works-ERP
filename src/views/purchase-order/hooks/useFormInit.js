import { useEffect } from "react";

const useFormInit = (props) => {
    const { purchaseOrder, isEditMode, reset = Function(), defaultFormValue } = props;

    // Prefill form
    useEffect(() => {
        if (purchaseOrder && isEditMode && Object.keys(purchaseOrder).length > 0) {
            reset({
                poNo: purchaseOrder.poNo ?? '',
                poDate: purchaseOrder.poDate ? new Date(purchaseOrder.poDate) : new Date(),
                customerName: purchaseOrder.customerName ?? '',
                status: purchaseOrder.status ?? 'OPEN'
            });
        }
    }, [purchaseOrder, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue);
        }
    }, [isEditMode, reset]);
};

export default useFormInit;