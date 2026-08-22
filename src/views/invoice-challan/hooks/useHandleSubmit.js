import { useCreatInvoiceChallan, useUpdateInvoiceChallan } from "./useApi";

const useHandleSubmit = (props) => {
    const { challanId, isEditMode } = props;
    const { mutate: createInvoiceChallan, isPending: createInvoiceChallanIsPending } = useCreatInvoiceChallan();
    const { mutate: updateInvoiceChallan, isPending: updateInvoiceChallanIsPending } = useUpdateInvoiceChallan(challanId);

    const onSubmit = (data) => {
        if (createInvoiceChallanIsPending || updateInvoiceChallanIsPending) return false;

        const challanDateISO = data.challanDate ? new Date(data.challanDate).toISOString() : null;

        const formPayload = {
            challanNo: data.challanNo?.trim(),
            challanDate: challanDateISO,
            customerName: data.customerName?.trim(),
            invoiceId: data.invoiceId ? Number(data.invoiceId) : null
        };

        if (isEditMode) {
            updateInvoiceChallan(formPayload);
        } else {
            createInvoiceChallan(formPayload);
        }
    };

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createInvoiceChallanIsPending, updateInvoiceChallanIsPending };
};

export default useHandleSubmit;