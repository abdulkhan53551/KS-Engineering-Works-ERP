import { useCreatEwayBill, useUpdateEwaybill } from "./useApi";

const useHandleSubmit = (props) => {
    const { ewayBillId, isEditMode } = props;
    const { mutate: createEwayBill, isPending: createEwayBillIsPending } = useCreatEwayBill();
    const { mutate: updateEwayBill, isPending: updateEwayBillIsPending } = useUpdateEwaybill(ewayBillId);

    const onSubmit = (data) => {
        const ewaybillDateISO = data.ewaybillDate ? new Date(data.ewaybillDate).toISOString() : null;
        const ewaybillValidUptoISO = data.ewaybillValidUpto ? new Date(data.ewaybillValidUpto).toISOString() : null;

        if (createEwayBillIsPending || updateEwayBillIsPending) return false;

        const formPayload = {
            ...data,
            ewaybillDate: ewaybillDateISO,
            ewaybillValidUpto: ewaybillValidUptoISO
        }

        if (isEditMode) {
            updateEwayBill(formPayload);
        } else {
            createEwayBill(formPayload);
        }
    }

    const onError = (errors, e) => console.log('Form Error: ', errors);

    return { onSubmit, onError, createEwayBillIsPending, updateEwayBillIsPending };
}

export default useHandleSubmit;