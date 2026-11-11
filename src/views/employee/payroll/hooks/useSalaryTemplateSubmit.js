import { useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateSalaryTemplate, useUpdateSalaryTemplate } from '../../common/hooks/useEmployeeApi';
import { salaryTemplateValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage salary template form submission & validation
 * @param {Object} props
 * @param {boolean} props.isEditing - Whether in update mode
 * @param {number|string} [props.templateId] - Template ID when editing
 * @param {number|string} [props.firmId] - Active firm ID
 * @param {Function} [props.onSuccess] - Callback after successful submission
 * @param {Function} [props.onHide] - Modal close callback fallback
 */
export const useSalaryTemplateSubmit = ({ isEditing, templateId, firmId, onSuccess, onHide } = {}) => {
    const [errors, setErrors] = useState({});
    const createMutation = useCreateSalaryTemplate();
    const updateMutation = useUpdateSalaryTemplate();

    const validate = (formData) => {
        const { errors: validationErrors } = validateWithJoi(salaryTemplateValidationSchema, formData);
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
            toast.error(errs.templateName || errs.components || 'Please fix the errors in the form.');
            return false;
        }

        try {
            const payload = {
                firmId,
                templateName: formData.templateName?.trim(),
                templateType: formData.templateType || 'CUSTOM',
                description: formData.description?.trim() || null,
                isDefault: Boolean(formData.isDefault),
                components: (formData.components || []).map((c, idx) => ({
                    ...c,
                    value: parseFloat(c.value) || 0,
                    sortOrder: idx + 1
                }))
            };

            if (isEditing) {
                await updateMutation.mutateAsync({ id: templateId, ...payload });
            } else {
                await createMutation.mutateAsync(payload);
            }

            if (onSuccess) {
                onSuccess();
            } else if (onHide) {
                onHide();
            }
            return true;
        } catch (err) {
            // Error toasts are handled in useEmployeeApi mutation hooks
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

export default useSalaryTemplateSubmit;
