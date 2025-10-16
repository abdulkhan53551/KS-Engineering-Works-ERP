import { useEffect } from "react";
import { useCreatFirm, useUpdateFirm } from "./api.hooks";

const useHandleSubmit = (props) => {
    const { firmId, isEditMode, metaIds } = props;
    const { mutate: createFirmApi, isPending: createFirmIsPending } = useCreatFirm();
    const { mutate: updateFirmApi, isPending: updateFirmIsPending } = useUpdateFirm(firmId);

    const onSubmit = (data) => {
        if (createFirmIsPending || updateFirmIsPending) return false;

        const formPayload = {
            ...data,
            logoUrl: '',
            addressId: metaIds.firmAddressId,
            bankAccountId: metaIds.firmBankId,
        }

        if (isEditMode) {
            updateFirmApi(formPayload);
        } else {
            createFirmApi(formPayload);
        }
    }

    const onError = (errors, e) => console.log(errors);

    return { onSubmit, onError, createFirmIsPending, updateFirmIsPending };
}

export default useHandleSubmit;