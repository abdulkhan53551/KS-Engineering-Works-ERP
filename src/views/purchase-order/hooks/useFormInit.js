import { useEffect } from "react";

const useFormInit = (props) => {
    const { purchaseOrder, isEditMode, reset = Function(), defaultFormValue } = props;

    // Prefill form
    useEffect(() => {
        if (purchaseOrder && isEditMode) {
            const { poId, ...rest } = purchaseOrder;

            reset({
                ...rest,
            });
        }
    }, [purchaseOrder, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue)
        }
    }, [isEditMode, reset])
}


export default useFormInit;