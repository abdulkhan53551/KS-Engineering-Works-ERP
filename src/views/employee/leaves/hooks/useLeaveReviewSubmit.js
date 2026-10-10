import { useState } from 'react';
import { toast } from 'react-toastify';
import { useReviewLeave } from '../../common/hooks/useEmployeeApi';
import { leaveReviewValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage leave review modal submission & validation
 */
export const useLeaveReviewSubmit = ({ onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const reviewMutation = useReviewLeave();

    const validate = (formData) => {
        const { errors: validationErrors } = validateWithJoi(leaveReviewValidationSchema, formData);
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
            toast.error(errs.rejectionReason || 'Please fix the errors in the review form.');
            return false;
        }

        try {
            await reviewMutation.mutateAsync({
                id: formData.id,
                status: formData.status,
                rejectionReason: formData.status === 'REJECTED' ? formData.rejectionReason?.trim() : null
            });

            if (onSuccess) onSuccess();
            else if (onHide) onHide();
            return true;
        } catch (err) {
            // Handled by hook
            return false;
        }
    };

    const isLoading = reviewMutation.isPending;

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

export default useLeaveReviewSubmit;
