import { toast } from "react-toastify";
import { useCreatFirm, useUpdateFirm } from "./api.hooks";

const useHandleSubmit = (props) => {
    const { firmId, isEditMode, metaIds } = props;
    const { mutate: createFirmApi, isPending: createFirmIsPending } = useCreatFirm();
    const { mutate: updateFirmApi, isPending: updateFirmIsPending } = useUpdateFirm(firmId);

    const onSubmit = (data) => {
        if (createFirmIsPending || updateFirmIsPending) return false;

        const formPayload = {
            ...data,
            logoUrl: data.logoUrl || null,
            logoPublicId: data.logoPublicId || null,
            addressId: metaIds?.firmAddressId || null,
            bankAccountId: metaIds?.firmBankId || null,
        };

        if (isEditMode) {
            updateFirmApi(formPayload);
        } else {
            createFirmApi({ data: formPayload });
        }
    };

    const onError = (errors, e) => {
        console.error("Firm form validation errors:", errors);
        const firstErrorKey = Object.keys(errors)[0];
        if (firstErrorKey && errors[firstErrorKey]?.message) {
            toast.error(errors[firstErrorKey].message);
        }
    };

    return { onSubmit, onError, createFirmIsPending, updateFirmIsPending };
};

export default useHandleSubmit;