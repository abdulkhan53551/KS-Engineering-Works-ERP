import { useEffect } from 'react';

/**
 * Custom hook to manage Quotation Number auto-generation and revision calculation.
 * 
 * @param {Object} params
 * @param {boolean} params.isEditMode
 * @param {boolean} params.isDuplicateMode
 * @param {string} params.nextQuotationNumber
 * @param {Function} params.setValue
 * @param {Function} [params.getValues]
 * @param {Object} params.quotationData
 * @param {number} params.watchedRevisionNo
 * @returns {{ baseRevisionNo: number, nextRevisionNo: number }}
 */
export const useQuotationAutoNumber = ({
    isEditMode,
    isDuplicateMode,
    nextQuotationNumber,
    setValue,
    getValues,
    quotationData,
    watchedRevisionNo
}) => {
    // Auto-generate / Fill quotation number in create or duplicate mode
    useEffect(() => {
        if (!isEditMode && nextQuotationNumber) {
            if (isDuplicateMode) {
                setValue("quotationNo", nextQuotationNumber, { shouldValidate: true });
            } else {
                const currentNo = getValues ? getValues("quotationNo") : "";
                if (!currentNo) {
                    setValue("quotationNo", nextQuotationNumber, { shouldValidate: true });
                }
            }
        }
    }, [nextQuotationNumber, isEditMode, isDuplicateMode, setValue, getValues]);

    // Revision number calculations
    const baseRevisionNo = quotationData?.revisionNo !== undefined
        ? quotationData.revisionNo
        : (quotationData?.revision_no !== undefined ? quotationData.revision_no : (watchedRevisionNo || 0));
    const nextRevisionNo = baseRevisionNo + 1;

    return {
        baseRevisionNo,
        nextRevisionNo
    };
};

export default useQuotationAutoNumber;
