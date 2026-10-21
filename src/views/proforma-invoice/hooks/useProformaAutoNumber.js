import { useEffect } from 'react';

/**
 * Custom hook to manage Proforma Invoice Number auto-generation in create or duplicate mode.
 * 
 * @param {Object} params
 * @param {boolean} params.isEditMode
 * @param {boolean} params.isDuplicateMode
 * @param {string} params.nextProformaNumber
 * @param {Function} params.setValue
 * @param {Function} [params.getValues]
 */
export const useProformaAutoNumber = ({
    isEditMode,
    isDuplicateMode,
    nextProformaNumber,
    setValue,
    getValues
}) => {
    useEffect(() => {
        if (!isEditMode && nextProformaNumber) {
            if (isDuplicateMode) {
                setValue("proformaNo", nextProformaNumber, { shouldValidate: true });
            } else {
                const currentNo = getValues ? getValues("proformaNo") : "";
                if (!currentNo) {
                    setValue("proformaNo", nextProformaNumber, { shouldValidate: true });
                }
            }
        }
    }, [nextProformaNumber, isEditMode, isDuplicateMode, setValue, getValues]);
};

export default useProformaAutoNumber;
