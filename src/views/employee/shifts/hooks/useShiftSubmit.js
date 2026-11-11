import { useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateShift, useUpdateShift } from '../../common/hooks/useEmployeeApi';
import { shiftValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage shift creation/update form submission & validation
 * @param {Object} props
 * @param {boolean} props.isEditing - Whether in update mode
 * @param {number|string} [props.shiftId] - Shift ID when editing
 * @param {number|string} [props.firmId] - Active firm ID
 * @param {Function} [props.onSuccess] - Callback after successful submission
 * @param {Function} [props.onHide] - Modal close callback fallback
 */
export const useShiftSubmit = ({ isEditing, shiftId, firmId, onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const createMutation = useCreateShift();
    const updateMutation = useUpdateShift();

    const validate = (formData) => {
        const { errors: validationErrors } = validateWithJoi(shiftValidationSchema, formData);
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

        try {
            const payload = {
                ...formData,
                breakMinutes: parseInt(formData.breakMinutes, 10) || 0
            };

            if (isEditing) {
                await updateMutation.mutateAsync({
                    id: shiftId,
                    ...payload
                });
            } else {
                await createMutation.mutateAsync({
                    ...payload,
                    firmId
                });
            }

            if (onSuccess) {
                onSuccess();
            } else if (onHide) {
                onHide();
            }
            return true;
        } catch (err) {
            // Toast handled by hook
            return false;
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

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

export default useShiftSubmit;
