import { useState } from 'react';
import { toast } from 'react-toastify';
import { useMarkAttendance } from '../../common/hooks/useEmployeeApi';
import { attendanceHoursValidationSchema, validateWithJoi } from '../../../../validation/employee.validation';

/**
 * Hook to decouple and manage manual attendance / punch hours modal submission & validation
 */
export const useAttendanceHoursSubmit = ({ onSaved, onHide, onSuccess } = {}) => {
    const [errors, setErrors] = useState({});
    const markAttendanceMutation = useMarkAttendance();

    const validate = (payload) => {
        const { errors: validationErrors } = validateWithJoi(attendanceHoursValidationSchema, payload);
        setErrors(validationErrors);
        return validationErrors;
    };

    const handleSubmit = async (eOrData, maybeData) => {
        let formData = eOrData;
        if (eOrData && typeof eOrData.preventDefault === 'function') {
            eOrData.preventDefault();
            formData = maybeData;
        }

        const payload = {
            employeeId: formData.employee?.id || formData.employeeId,
            firmId: formData.employee?.firmId || formData.employee?.firm_id || formData.firmId,
            branchId: formData.employee?.branchId || formData.employee?.branch_id || formData.branchId || null,
            attendanceDate: formData.date || formData.attendanceDate,
            status: formData.status,
            checkIn: formData.checkIn || null,
            checkOut: formData.checkOut || null,
            totalHours: formData.totalHours === '' || formData.totalHours === null ? 0 : parseFloat(formData.totalHours),
            overtimeHours: formData.overtimeHours === '' || formData.overtimeHours === null ? 0 : parseFloat(formData.overtimeHours),
            overtimeType: (parseFloat(formData.overtimeHours) > 0) ? (formData.overtimeType || 'NORMAL') : 'NORMAL',
            remarks: formData.remarks?.trim() || null
        };

        const errs = validate(payload);
        if (Object.keys(errs).length > 0) {
            toast.error('Please fix the errors in the attendance form.');
            return false;
        }

        try {
            await markAttendanceMutation.mutateAsync(payload);
            if (onSaved) {
                onSaved(payload);
            }
            if (onSuccess) {
                onSuccess(payload);
            } else if (onHide) {
                onHide();
            }
            return true;
        } catch (err) {
            // Handled in mutation hook
            return false;
        }
    };

    const isLoading = markAttendanceMutation.isPending;

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

export default useAttendanceHoursSubmit;
