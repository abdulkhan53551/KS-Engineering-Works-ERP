import { useCreateInvoice, useUpdateInvoice } from "./useApi";

const useHandleSubmit = (props) => {
    const { invoiceId, isEditMode } = props;
    const { mutate: createInvoice, isPending: createInvoiceIsPending } = useCreateInvoice();
    const { mutate: updateInvoice, isPending: updateInvoiceIsPending } = useUpdateInvoice(invoiceId);

    const onSubmit = (data) => {
        delete data.roundOffManual;

        const invoiceDateISO = data.invoiceDate ? new Date(data.invoiceDate).toISOString() : null;
        const dueDateISO = data.dueDate ? new Date(data.dueDate).toISOString() : null;

        if (createInvoiceIsPending || updateInvoiceIsPending) return false;

        const formPayload = {
            ...data,
            challanIds: data.hasChallan ? (data.challanIds || []) : [],
            poIds: data.hasPo ? (data.poIds || []) : [],
            ewayBillIds: data.hasEwayBill ? (data.ewayBillIds || []) : [],
            invoiceDate: invoiceDateISO,
            dueDate: dueDateISO
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