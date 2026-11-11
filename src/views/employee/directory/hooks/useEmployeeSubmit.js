import { useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateEmployee, useUpdateEmployee } from '../../common/hooks/useEmployeeApi';
import { employeeValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage employee form submission & validation
 * @param {Object} props
 * @param {number|string} [props.id] - Employee ID for update
 * @param {boolean} [props.isEdit] - Is in update mode
 * @param {number|string} [props.effectiveFirmId] - Active firm ID
 * @param {Function} [props.setActiveTab] - Callback to switch active form tab on validation failure
 * @param {Function} [props.onSuccess] - Callback after successful creation or update
 */
export const useEmployeeSubmit = ({
    id,
    isEdit = false,
    effectiveFirmId,
    setActiveTab,
    onSuccess
} = {}) => {
    const [errors, setErrors] = useState({});
    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();

    const validateForm = (formData) => {
        const { errors: validationErrors } = validateWithJoi(employeeValidationSchema, formData);
        setErrors(validationErrors);
        return validationErrors;
    };

    const handleSubmit = async (eOrData, maybeData) => {
        let formData = eOrData;
        if (eOrData && typeof eOrData.preventDefault === 'function') {
            eOrData.preventDefault();
            formData = maybeData;
        }

        const errs = validateForm(formData);
        if (Object.keys(errs).length > 0) {
            // Find which tab contains the first error and switch to it
            if (
                errs.empCode ||
                errs.firstName ||
                errs.lastName ||
                errs.phone ||
                errs.email ||
                errs.emergencyContactName ||
                errs.emergencyContactPhone ||
                errs.pincode ||
                errs.dateOfBirth
            ) {
                setActiveTab?.('personal');
            } else if (errs.dateOfJoining || errs.employmentType || errs.department || errs.designation) {
                setActiveTab?.('employment');
            } else if (errs.baseSalary || errs.salaryType || errs.salaryTemplateId) {
                setActiveTab?.('salary');
            } else if (errs.panNumber || errs.aadharNumber || errs.ifscCode || errs.bankName || errs.accountNumber) {
                setActiveTab?.('bank');
            }

            toast.error('Please resolve the errors highlighted in the form.');
            return false;
        }

        try {
            const payload = {
                ...formData,
                firmId: effectiveFirmId,
                dateOfBirth: formData.dateOfBirth || null,
                dateOfExit: formData.dateOfExit || null,
                dateOfJoining: formData.dateOfJoining || null,
                baseSalary: parseFloat(formData.baseSalary) || 0,
                shiftId: formData.shiftId ? parseInt(formData.shiftId, 10) : null,
                salaryTemplateId: formData.salaryTemplateId ? parseInt(formData.salaryTemplateId, 10) : null
            };

            if (isEdit) {
                await updateMutation.mutateAsync({ id, ...payload });
            } else {
                await createMutation.mutateAsync(payload);
            }

            if (onSuccess) {
                onSuccess();
            }
            return true;
        } catch (err) {
            // Handled by react-query mutation hook toast
            return false;
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    return {
        handleSubmit,
        onSubmit: handleSubmit,
        validateForm,
        errors,
        setErrors,
        isSubmitting,
        createMutation,
        updateMutation
    };
};

export default useEmployeeSubmit;
