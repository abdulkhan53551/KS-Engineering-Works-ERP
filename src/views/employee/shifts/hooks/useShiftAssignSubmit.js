import { useState } from 'react';
import { toast } from 'react-toastify';
import { useAssignShift } from '../../common/hooks/useEmployeeApi';
import { shiftAssignValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage shift assignment submission & validation
 */
export const useShiftAssignSubmit = ({ onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const assignMutation = useAssignShift();

    const validate = (formData) => {
        const { errors: validationErrors } = validateWithJoi(shiftAssignValidationSchema, formData);
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
            toast.error(errs.shiftId || errs.employeeIds || errs.effectiveFrom || errs.effectiveTo || 'Please fix the errors before submitting.');
            return false;
        }

        try {
            await assignMutation.mutateAsync({
                shiftId: parseInt(formData.shiftId, 10),
                employeeIds: (formData.employeeIds || []).map(id => parseInt(id, 10)),
                effectiveFrom: formData.effectiveFrom,
                effectiveTo: formData.effectiveTo || null
            });

            if (onSuccess) onSuccess();
            else if (onHide) onHide();
            return true;
        } catch (err) {
            // Handled by hook
            return false;
        }
    };

    const isLoading = assignMutation.isPending;

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

export default useShiftAssignSubmit;
