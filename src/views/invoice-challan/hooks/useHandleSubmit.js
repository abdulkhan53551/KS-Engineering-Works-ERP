import { useCreatInvoiceChallan, useUpdateInvoiceChallan } from "./useApi";

const useHandleSubmit = (props) => {
    const { challanId, isEditMode } = props;
    const { mutate: createInvoiceChallan, isPending: createInvoiceChallanIsPending } = useCreatInvoiceChallan();
    const { mutate: updateInvoiceChallan, isPending: updateInvoiceChallanIsPending } = useUpdateInvoiceChallan(challanId);

    const onSubmit = (data) => {
        const challanDateISO = data.challanDate ? new Date(data.challanDate).toISOString() : null;
        
        if (createInvoiceChallanIsPending || updateInvoiceChallanIsPending) return false;
        
        const formPayload = {
            ...data,
            challanDate: challanDateISO
        }

        if (isEditMode) {
            updateInvoiceChallan(formPayload);
        } else {
            createInvoiceChallan(formPayload);
        }
    }

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createInvoiceChallanIsPending, updateInvoiceChallanIsPending };
}

export default useHandleSubmit;