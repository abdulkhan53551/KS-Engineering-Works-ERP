import { useState } from 'react';
import { toast } from 'react-toastify';
import { useBulkPaySlips } from '../../common/hooks/useEmployeeApi';
import { bulkPayValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage bulk salary payout submission & validation
 */
export const useBulkPaySubmit = ({ onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const bulkPayMutation = useBulkPaySlips();

    const validate = (formData) => {
        const { errors: validationErrors } = validateWithJoi(bulkPayValidationSchema, formData);
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
            toast.error(errs.slipIds || errs.paymentDate || errs.paymentMode || 'Please fix the errors before recording payout.');
            return false;
        }

        try {
            await bulkPayMutation.mutateAsync({
                slipIds: formData.slipIds,
                paymentDate: formData.paymentDate,
                paymentMode: formData.paymentMode,
                paymentReference: formData.paymentReference?.trim() || null,
                remarks: formData.remarks?.trim() || null
            });

            if (onSuccess) onSuccess();
            else if (onHide) onHide();
            return true;
        } catch (err) {
            // Handled by hook
            return false;
        }
    };

    const isLoading = bulkPayMutation.isPending;

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

export default useBulkPaySubmit;
