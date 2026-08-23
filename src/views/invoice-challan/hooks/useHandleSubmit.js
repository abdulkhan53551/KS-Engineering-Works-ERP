import moment from "moment";
import { useCreatInvoiceChallan, useUpdateInvoiceChallan } from "./useApi";

const useHandleSubmit = (props) => {
    const { challanId, isEditMode } = props;
    const { mutate: createInvoiceChallan, isPending: createInvoiceChallanIsPending } = useCreatInvoiceChallan();
    const { mutate: updateInvoiceChallan, isPending: updateInvoiceChallanIsPending } = useUpdateInvoiceChallan(challanId);

    const onSubmit = (data) => {
        if (createInvoiceChallanIsPending || updateInvoiceChallanIsPending) return false;

        const challanDate = data.challanDate ? moment(data.challanDate).format('YYYY-MM-DD') : null;

        const formPayload = {
            challanNo: data.challanNo?.trim(),
            challanDate,
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