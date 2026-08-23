import moment from "moment";
import { useCreateInvoice, useUpdateInvoice } from "./useApi";

const useHandleSubmit = (props) => {
    const { invoiceId, isEditMode } = props;
    const { mutate: createInvoice, isPending: createInvoiceIsPending } = useCreateInvoice();
    const { mutate: updateInvoice, isPending: updateInvoiceIsPending } = useUpdateInvoice(invoiceId);

    const onSubmit = (data) => {
        delete data.roundOffManual;

        const invoiceDate = data.invoiceDate ? moment(data.invoiceDate).format('YYYY-MM-DD') : null;
        const dueDate = data.dueDate ? moment(data.dueDate).format('YYYY-MM-DD') : null;

        if (createInvoiceIsPending || updateInvoiceIsPending) return false;

        const formPayload = {
            ...data,
            challanIds: data.hasChallan ? (data.challanIds || []) : [],
            poIds: data.hasPo ? (data.poIds || []) : [],
            ewayBillIds: data.hasEwayBill ? (data.ewayBillIds || []) : [],
            invoiceDate,
            dueDate
        };

        if (isEditMode) {
            updateInvoice(formPayload);
        } else {
            createInvoice(formPayload);
        }
    };

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createInvoiceIsPending, updateInvoiceIsPending };
};

export default useHandleSubmit;