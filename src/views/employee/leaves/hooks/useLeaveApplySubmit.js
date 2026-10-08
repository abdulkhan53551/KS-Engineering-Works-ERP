import { useState } from 'react';
import { toast } from 'react-toastify';
import { useApplyLeave } from '../../common/hooks/useEmployeeApi';
import { leaveApplyValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage leave application form submission & validation
 * @param {Object} props
 * @param {number|string} [props.firmId] - Active firm ID
 * @param {Function} [props.onSuccess] - Callback after successful application
 * @param {Function} [props.onHide] - Modal close callback fallback
 */
export const useLeaveApplySubmit = ({ firmId, onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const applyMutation = useApplyLeave();

    const validate = (formData, { isSameDaySessionInvalid, computedTotalDays } = {}) => {
        const { errors: validationErrors } = validateWithJoi(leaveApplyValidationSchema, formData);
        const errs = { ...validationErrors };

        if (isSameDaySessionInvalid && !errs.session) {
            errs.session = 'End session cannot be earlier than start session on the same day.';
        }
        if (computedTotalDays !== undefined && computedTotalDays <= 0 && !errs.toDate && !errs.session) {
            errs.totalDays = 'Total leave days must be at least 0.5 days.';
        }

        setErrors(errs);
        return errs;
    };

    const handleSubmit = async (eOrData, maybeDataOrOptions, maybeOptions) => {
        let formData = eOrData;
        let options = maybeDataOrOptions;

        if (eOrData && typeof eOrData.preventDefault === 'function') {
            eOrData.preventDefault();
            formData = maybeDataOrOptions;
            options = maybeOptions;
        }

        const computedTotalDays = options?.computedTotalDays;
        const isSameDaySessionInvalid = options?.isSameDaySessionInvalid;

        const errs = validate(formData, { isSameDaySessionInvalid, computedTotalDays });
        if (Object.keys(errs).length > 0) {
            toast.error(errs.session || errs.totalDays || errs.toDate || errs.employeeId || 'Please fix the errors in the leave form.');
            return false;
        }

        // Map halfDayOn for database backwards compatibility
        let halfDayOn = null;
        const totalDaysVal = Number(computedTotalDays) || 0;
        if (totalDaysVal % 1 !== 0) {
            if (formData.fromSession === 'SESSION_2' && formData.toSession === 'SESSION_2') {
                halfDayOn = 'FROM';
            } else if (formData.fromSession === 'SESSION_1' && formData.toSession === 'SESSION_1') {
                halfDayOn = 'TO';
            } else if (formData.fromSession === 'SESSION_2') {
                halfDayOn = 'FROM';
            } else if (formData.toSession === 'SESSION_1') {
                halfDayOn = 'TO';
            }
        }

        try {
            await applyMutation.mutateAsync({
                firmId,
                employeeId: parseInt(formData.employeeId, 10),
                leaveType: formData.leaveType,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                fromSession: formData.fromSession || 'SESSION_1',
                toSession: formData.toSession || 'SESSION_2',
                totalDays: totalDaysVal,
                halfDayOn,
                reason: formData.reason ? formData.reason.trim() : null
            });

            if (onSuccess) {
                onSuccess();
            } else if (onHide) {
                onHide();
            }
            return true;
        } catch (err) {
            // Handled by hook
            return false;
        }
    };

    const isLoading = applyMutation.isPending;

    return {
        handleSubmit,
        onSubmit: handleSubmit,
        validate,
        errors,
        setErrors,
        isLoading,
        isSubmitting: isLoading
    };
};

export default useLeaveApplySubmit;
