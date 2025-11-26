import { useCreateInvoice, useCreatEwayBill, useupdateInvoice, useUpdateInvoice } from "./useApi";

const useHandleSubmit = (props) => {
    const { invoiceId, isEditMode } = props;
    const { mutate: createInvoice, isPending: createInvoiceIsPending } = useCreateInvoice();
    const { mutate: updateInvoice, isPending: updateInvoiceIsPending } = useUpdateInvoice(invoiceId);

    const onSubmit = (data) => {
        console.log("Invoice Data:", data);

        const invoiceDateISO = data.invoiceDate ? new Date(data.invoiceDate).toISOString() : null;
        const dueDateISO = data.dueDate ? new Date(data.dueDate).toISOString() : null;

        if (createInvoiceIsPending || updateInvoiceIsPending) return false;

        const formPayload = {
            ...data,
            invoiceDate: invoiceDateISO,
            dueDate: dueDateISO
        }

        // if (isEditMode) {
        //     updateInvoice(formPayload);
        // } else {
        //     createInvoice(formPayload);
        // }
    }

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createInvoiceIsPending, updateInvoiceIsPending };
}

export default useHandleSubmit;