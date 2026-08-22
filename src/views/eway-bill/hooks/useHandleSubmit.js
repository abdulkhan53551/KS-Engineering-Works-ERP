import { useCreatEwayBill, useUpdateEwaybill } from "./useApi";

const useHandleSubmit = (props) => {
    const { ewayBillId, isEditMode } = props;
    const { mutate: createEwayBill, isPending: createEwayBillIsPending } = useCreatEwayBill();
    const { mutate: updateEwayBill, isPending: updateEwayBillIsPending } = useUpdateEwaybill(ewayBillId);

    const onSubmit = (data) => {
        if (createEwayBillIsPending || updateEwayBillIsPending) return false;

        const ewayBillDateISO = data.ewayBillDate ? new Date(data.ewayBillDate).toISOString() : null;
        const ewaybillValidUptoISO = data.ewaybillValidUpto ? new Date(data.ewaybillValidUpto).toISOString() : null;

        const formPayload = {
            ewayBillNo: data.ewayBillNo?.trim(),
            ewayBillDate: ewayBillDateISO,
            ewaybillValidUpto: ewaybillValidUptoISO,
            customerName: data.customerName?.trim(),
            invoiceId: data.invoiceId ? Number(data.invoiceId) : null
        };

        if (isEditMode) {
            updateEwayBill(formPayload);
        } else {
            createEwayBill(formPayload);
        }
    };

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createEwayBillIsPending, updateEwayBillIsPending };
};

export default useHandleSubmit;