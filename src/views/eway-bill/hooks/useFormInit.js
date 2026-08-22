import { useEffect } from "react";

const useFormInit = (props) => {
    const { ewayBill, isEditMode, reset = Function(), defaultFormValue } = props;

    // Prefill form
    useEffect(() => {
        if (ewayBill && isEditMode && Object.keys(ewayBill).length > 0) {
            reset({
                invoiceId: ewayBill.invoiceId ?? null,
                ewayBillNo: ewayBill.ewayBillNo ?? '',
                ewayBillDate: ewayBill.ewayBillDate ? new Date(ewayBill.ewayBillDate) : new Date(),
                ewaybillValidUpto: ewayBill.validUpto || ewayBill.ewaybillValidUpto ? new Date(ewayBill.validUpto || ewayBill.ewaybillValidUpto) : new Date(),
                customerName: ewayBill.customerName ?? '',
            });
        }
    }, [ewayBill, isEditMode, reset]);

    // Reset the form
    useEffect(() => {
        if (!isEditMode) {
            reset(defaultFormValue);
        }
    }, [isEditMode, reset]);
};

export default useFormInit;