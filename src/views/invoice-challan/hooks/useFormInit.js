import { useEffect } from "react";

const useFormInit = (props) => {
    const { invoiceChallan, isEditMode, reset = Function(), defaultFormValue } = props;

    // Prefill form
    useEffect(() => {
        if (invoiceChallan && isEditMode && Object.keys(invoiceChallan).length > 0) {
            reset({
                invoiceId: invoiceChallan.invoiceId ?? null,
                challanNo: invoiceChallan.challanNo ?? '',
                challanDate: invoiceChallan.challanDate ? new Date(invoiceChallan.challanDate) : new Date(),
                customerName: invoiceChallan.customerName ?? '',
            });
        }
    }, [invoiceChallan, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue);
        }
    }, [isEditMode, reset]);
};

export default useFormInit;