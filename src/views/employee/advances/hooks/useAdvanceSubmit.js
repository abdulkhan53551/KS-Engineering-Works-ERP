import { useState } from 'react';
import { toast } from 'react-toastify';
import {
    useCreateAdvance,
    useRecordAdvanceRepayment,
    useUpdateSlipAdvanceDeduction
} from '../../common/hooks/useEmployeeApi';
import {
    disburseAdvanceValidationSchema,
    createRepaymentValidationSchema,
    createEditAdvanceDeductionValidationSchema,
    validateWithJoi
} from '../../../../validation/employeeAdvance.validation';

/**
 * Hook to decouple and manage advance disbursement submission & validation
 */
export const useAdvanceDisburseSubmit = ({ firmId, onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const { mutateAsync: disburseAdvance, isPending } = useCreateAdvance();

    const validate = (formData) => {
        const { errors: validationErrors } = validateWithJoi(
            disburseAdvanceValidationSchema,
            formData
        );
        setErrors(validationErrors);
        return validationErrors;
    };

    const handleSubmit = async (eOrData, maybeData) => {
        let formData = eOrData;
        if (eOrData && typeof eOrData.preventDefault === 'function') {
            eOrData.preventDefault();
            formData = maybeData;
        }

        const errs = validate(formData);
        if (Object.keys(errs).length > 0) {
            toast.error('Please fix the errors in the form.');
            return false;
        }

        const amountNum = parseFloat(formData.totalAmount);
        let emiNum = amountNum;
        if (formData.recoveryType === 'EMI') {
            emiNum = parseFloat(formData.monthlyDeduction);
        }

        try {
            await disburseAdvance({
                firmId: firmId && firmId !== 'all' ? parseInt(firmId, 10) : undefined,
                employeeId: parseInt(formData.employeeId, 10),
                advanceDate: formData.advanceDate,
                totalAmount: amountNum,
                recoveryType: formData.recoveryType,
                monthlyDeduction: emiNum,
                paymentMode: formData.paymentMode,
                paymentReference: formData.paymentReference?.trim() || undefined,
                remarks: formData.remarks?.trim() || undefined
            });

            if (onSuccess) onSuccess();
            else if (onHide) onHide();
            return true;
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to disburse advance.');
            return false;
        }
    };

    return {
        handleSubmit,
        onSubmit: handleSubmit,
        validate,
        errors,
        setErrors,
        isLoading: isPending,
        isSubmitting: isPending
    };
};

/**
 * Hook to decouple and manage advance direct repayment submission & validation
 */
export const useAdvanceRepaymentSubmit = ({ advanceId, remainingBalance = Infinity, onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const { mutateAsync: recordRepayment, isPending } = useRecordAdvanceRepayment();

    const validate = (formData) => {
        const schema = createRepaymentValidationSchema(remainingBalance);
        const { errors: validationErrors } = validateWithJoi(schema, formData);
        setErrors(validationErrors);
        return validationErrors;
    };

    const handleSubmit = async (eOrData, maybeData) => {
        let formData = eOrData;
        if (eOrData && typeof eOrData.preventDefault === 'function') {
            eOrData.preventDefault();
            formData = maybeData;
        }

        const errs = validate(formData);
        if (Object.keys(errs).length > 0) {
            toast.error('Please resolve the errors before submitting.');
            return false;
        }

        const amountNum = parseFloat(formData.amount);

        try {
            await recordRepayment({
                id: advanceId,
                amount: amountNum,
                repaymentDate: formData.repaymentDate,
                repaymentType: formData.repaymentType,
                remarks: formData.remarks?.trim() || undefined
            });

            if (onSuccess) onSuccess();
            else if (onHide) onHide();
            return true;
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to record repayment.');
            return false;
        }
    };

    return {
        handleSubmit,
        onSubmit: handleSubmit,
        validate,
        errors,
        setErrors,
        isLoading: isPending,
        isSubmitting: isPending
    };
};

/**
 * Hook to decouple and manage salary slip advance deduction adjustment & validation
 */
export const useEditAdvanceDeductionSubmit = ({ slipId, maxAllowable = Infinity, onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const { mutateAsync: updateDeduction, isPending } = useUpdateSlipAdvanceDeduction();

    const validate = (advanceDeduction) => {
        const schema = createEditAdvanceDeductionValidationSchema(maxAllowable);
        const { errors: validationErrors } = validateWithJoi(schema, { advanceDeduction });
        setErrors(validationErrors);
        return validationErrors;
    };

    const handleSubmit = async (eOrData, maybeData) => {
        let advanceDeduction = eOrData;
        if (eOrData && typeof eOrData.preventDefault === 'function') {
            eOrData.preventDefault();
            advanceDeduction = maybeData;
        }

        const errs = validate(advanceDeduction);
        if (Object.keys(errs).length > 0) {
            toast.error('Please fix the errors in the form.');
            return false;
        }

        try {
            await updateDeduction({
                id: slipId,
                advanceDeduction: parseFloat(advanceDeduction || 0)
            });

            if (onSuccess) onSuccess();
            else if (onHide) onHide();
            return true;
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to update advance deduction.');
            return false;
        }
    };

    return {
        handleSubmit,
        onSubmit: handleSubmit,
        validate,
        errors,
        setErrors,
        isLoading: isPending,
        isSubmitting: isPending
    };
};
