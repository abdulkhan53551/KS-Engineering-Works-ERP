import { useEffect } from "react";

const useFormInit = (props) => {
    const { ewayBill, isEditMode, reset = Function(), defaultFormValue } = props;

    // Prefill form
    useEffect(() => {
        if (ewayBill && isEditMode) {
            const { ewayBillId, validUpto, ...rest } = ewayBill;

            console.log('rest => ', rest);
            

            reset({
                ...rest,
                ewaybillValidUpto: validUpto
            });
        }
    }, [ewayBill, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue)
        }
    }, [isEditMode, reset])
}


export default useFormInit;