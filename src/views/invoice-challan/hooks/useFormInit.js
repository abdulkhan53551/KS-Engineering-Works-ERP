import { useEffect } from "react";

const useFormInit = (props) => {
    const { invoiceChallan, isEditMode, reset = Function(), defaultFormValue } = props;

    // Prefill form
    useEffect(() => {
        if (invoiceChallan && isEditMode) {
            const { poId, ...rest } = invoiceChallan;

            reset({
                ...rest,
            });
        }
    }, [invoiceChallan, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue)
        }
    }, [isEditMode, reset])
}


export default useFormInit;