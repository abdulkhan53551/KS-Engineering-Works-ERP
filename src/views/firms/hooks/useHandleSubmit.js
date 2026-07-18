import { useEffect } from "react";
import { useCreatFirm, useUpdateFirm, useUploadFirmLogo } from "./api.hooks";

const useHandleSubmit = (props) => {
    const { firmId, isEditMode, metaIds } = props;
    const { mutate: createFirmApi, isPending: createFirmIsPending } = useCreatFirm();
    const { mutate: updateFirmApi, isPending: updateFirmIsPending } = useUpdateFirm(firmId);
    const { mutate: uploadLogo } = useUploadFirmLogo();

    const onSubmit = (data) => {
        if (createFirmIsPending || updateFirmIsPending) return false;
        const { logoUrl, ...rest } = data;

        const formPayload = {
            ...rest,
            addressId: metaIds.firmAddressId,
            bankAccountId: metaIds.firmBankId,
        }

        if (isEditMode) {
            updateFirmApi(formPayload);
            uploadLogo({ id: firmId, file: logoUrl[0] })
        } else {
            createFirmApi({ logo: logoUrl, data: formPayload });
        }
    }

    const onError = (errors, e) => console.log(errors);

    return { onSubmit, onError, createFirmIsPending, updateFirmIsPending };
}

export default useHandleSubmit;