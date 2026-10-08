import { useState } from 'react';
import { toast } from 'react-toastify';
import { useUpdatePayrollSettings } from '../../common/hooks/useEmployeeApi';
import { payrollSettingsValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage payroll settings form submission & validation
 */
export const usePayrollSettingsSubmit = ({ firmId, onSuccess } = {}) => {
    const [errors, setErrors] = useState({});
    const updateMutation = useUpdatePayrollSettings();

    const validate = (formData) => {
        const { errors: validationErrors } = validateWithJoi(payrollSettingsValidationSchema, {
            ...formData,
            firmId
        });
        setErrors(validationErrors);
        return validationErrors;
    };

    const handleSubmit = async (eOrData, maybeData) => {
        let formData = eOrData;
        if (eOrData && typeof eOrData.preventDefault === 'function') {
            eOrData.preventDefault();
            formData = maybeData;
        }

        if (!firmId) {
            toast.warning('Please select a specific firm from the header to save payroll settings.');
            return false;
        }

        const errs = validate(formData);
        if (Object.keys(errs).length > 0) {
            toast.error('Please fix the errors in the payroll settings.');
            return false;
        }

        try {
            await updateMutation.mutateAsync({
                ...formData,
                firmId,
                workingDaysPerMonth: parseInt(formData.workingDaysPerMonth, 10) || 26,
                otHourlyRate: parseFloat(formData.otHourlyRate) || 0,
                otMultiplierNormal: parseFloat(formData.otMultiplierNormal) || 1.5,
                otMultiplierHoliday: parseFloat(formData.otMultiplierHoliday) || 2.0,
                otMultiplierWeekend: parseFloat(formData.otMultiplierWeekend) || 2.0,
                pfEmployerPercent: parseFloat(formData.pfEmployerPercent) || 12,
                pfEmployeePercent: parseFloat(formData.pfEmployeePercent) || 12,
                pfWageCeiling: parseFloat(formData.pfWageCeiling) || 25000,
                esiEmployerPercent: parseFloat(formData.esiEmployerPercent) || 3.25,
                esiEmployeePercent: parseFloat(formData.esiEmployeePercent) || 0.75,
                esiWageCeiling: parseFloat(formData.esiWageCeiling) || 21000,
                ptMonthlyAmount: parseFloat(formData.ptMonthlyAmount) || 200
            });

            if (onSuccess) onSuccess();
            return true;
        } catch (err) {
            // Handled in mutation hook
            return false;
        }
    };

    const isSubmitting = updateMutation.isPending;

    return {
        handleSubmit,
        onSubmit: handleSubmit,
        validate,
        errors,
        setErrors,
        isSubmitting,
        isLoading: isSubmitting
    };
};

export default usePayrollSettingsSubmit;
