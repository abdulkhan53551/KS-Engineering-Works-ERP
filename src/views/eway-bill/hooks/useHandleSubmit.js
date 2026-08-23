import moment from "moment";
import { useCreatEwayBill, useUpdateEwaybill } from "./useApi";

const useHandleSubmit = (props) => {
    const { ewayBillId, isEditMode } = props;
    const { mutate: createEwayBill, isPending: createEwayBillIsPending } = useCreatEwayBill();
    const { mutate: updateEwayBill, isPending: updateEwayBillIsPending } = useUpdateEwaybill(ewayBillId);

    const onSubmit = (data) => {
        if (createEwayBillIsPending || updateEwayBillIsPending) return false;

        const ewayBillDate = data.ewayBillDate ? moment(data.ewayBillDate).format('YYYY-MM-DD') : null;
        const ewaybillValidUpto = data.ewaybillValidUpto ? moment(data.ewaybillValidUpto).format('YYYY-MM-DD') : null;

        const formPayload = {
            ewayBillNo: data.ewayBillNo?.trim(),
            ewayBillDate,
            ewaybillValidUpto,
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