import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
    fetchEmployees,
    fetchEmployeesMeta,
    fetchEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    restoreEmployee,
    fetchEmployeesDropdown,
    fetchShifts,
    fetchShiftById,
    createShift,
    updateShift,
    deleteShift,
    assignShift,
    fetchShiftAssignments,
    fetchAttendance,
    markAttendance,
    bulkMarkAttendance,
    markDateStatus,
    fetchAttendanceSummary,
    fetchLeaves,
    fetchLeaveById,
    applyLeave,
    reviewLeave,
    cancelLeave,
    fetchPayrollSettings,
    updatePayrollSettings,
    fetchSalaryTemplates,
    fetchSalaryTemplateById,
    createSalaryTemplate,
    updateSalaryTemplate,
    deleteSalaryTemplate,
    fetchSalarySlips,
    fetchSalarySlipById,
    generatePayroll,
    approveSalarySlip,
    bulkPaySlips,
    fetchPayrollReport
} from "../api";

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const selectData = (result) => result?.data ?? result ?? EMPTY_OBJECT;
const selectList = (result) => Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : EMPTY_ARRAY);

/* =========================================================================
   EMPLOYEES HOOKS
   ========================================================================= */

export const useEmployees = (params = {}) => {
    return useQuery({
        queryKey: ["employees", params],
        queryFn: () => fetchEmployees(params),
        select: selectData,
        keepPreviousData: true
    });
};

export const useEmployeesMeta = (params = {}) => {
    return useQuery({
        queryKey: ["employees-meta", params],
        queryFn: () => fetchEmployeesMeta(params),
        select: selectData
    });
};

export const useEmployee = (id) => {
    return useQuery({
        queryKey: ["employee", id],
        queryFn: () => fetchEmployeeById(id),
        select: selectData,
        enabled: Boolean(id)
    });
};

export const useCreateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEmployee,
        onSuccess: () => {
            toast.success("Employee created successfully.");
            queryClient.invalidateQueries(["employees"]);
            queryClient.invalidateQueries(["employees-meta"]);
            queryClient.invalidateQueries(["employees-dropdown"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to create employee.");
        }
    });
};

export const useUpdateEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateEmployee,
        onSuccess: (res, vars) => {
            toast.success("Employee updated successfully.");
            queryClient.invalidateQueries(["employees"]);
            queryClient.invalidateQueries(["employee", vars.id]);
            queryClient.invalidateQueries(["employees-meta"]);
            queryClient.invalidateQueries(["employees-dropdown"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update employee.");
        }
    });
};

export const useDeleteEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEmployee,
        onSuccess: (res, vars) => {
            toast.success(vars.permanent ? "Employee deleted permanently." : "Employee moved to recycle bin.");
            queryClient.invalidateQueries(["employees"]);
            queryClient.invalidateQueries(["employees-meta"]);
            queryClient.invalidateQueries(["employees-dropdown"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete employee.");
        }
    });
};

export const useRestoreEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: restoreEmployee,
        onSuccess: () => {
            toast.success("Employee restored successfully.");
            queryClient.invalidateQueries(["employees"]);
            queryClient.invalidateQueries(["employees-meta"]);
            queryClient.invalidateQueries(["employees-dropdown"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to restore employee.");
        }
    });
};

export const useEmployeesDropdown = (params = {}) => {
    return useQuery({
        queryKey: ["employees-dropdown", params],
        queryFn: () => fetchEmployeesDropdown(params),
        select: selectList
    });
};

/* =========================================================================
   SHIFTS HOOKS
   ========================================================================= */

export const useShifts = (params = {}) => {
    return useQuery({
        queryKey: ["shifts", params],
        queryFn: () => fetchShifts(params),
        select: selectList
    });
};

export const useShift = (id) => {
    return useQuery({
        queryKey: ["shift", id],
        queryFn: () => fetchShiftById(id),
        select: selectData,
        enabled: Boolean(id)
    });
};

export const useCreateShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createShift,
        onSuccess: () => {
            toast.success("Shift created successfully.");
            queryClient.invalidateQueries(["shifts"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to create shift.");
        }
    });
};

export const useUpdateShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateShift,
        onSuccess: (res, vars) => {
            toast.success("Shift updated successfully.");
            queryClient.invalidateQueries(["shifts"]);
            queryClient.invalidateQueries(["shift", vars.id]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update shift.");
        }
    });
};

export const useDeleteShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteShift,
        onSuccess: () => {
            toast.success("Shift deleted successfully.");
            queryClient.invalidateQueries(["shifts"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete shift.");
        }
    });
};

export const useAssignShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: assignShift,
        onSuccess: () => {
            toast.success("Shift assigned successfully.");
            queryClient.invalidateQueries(["shifts"]);
            queryClient.invalidateQueries(["shift-assignments"]);
            queryClient.invalidateQueries(["employees"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to assign shift.");
        }
    });
};

export const useShiftAssignments = (params = {}) => {
    return useQuery({
        queryKey: ["shift-assignments", params],
        queryFn: () => fetchShiftAssignments(params),
        select: selectList
    });
};

/* =========================================================================
   ATTENDANCE HOOKS
   ========================================================================= */

export const useAttendance = (params = {}) => {
    return useQuery({
        queryKey: ["attendance", params],
        queryFn: () => fetchAttendance(params),
        select: selectList
    });
};

export const useMarkAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markAttendance,
        onSuccess: () => {
            toast.success("Attendance marked successfully.");
            queryClient.invalidateQueries(["attendance"]);
            queryClient.invalidateQueries(["attendance-summary"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to mark attendance.");
        }
    });
};

export const useBulkMarkAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bulkMarkAttendance,
        onSuccess: () => {
            toast.success("Attendance marked successfully.");
            queryClient.invalidateQueries(["attendance"]);
            queryClient.invalidateQueries(["attendance-summary"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to save attendance.");
        }
    });
};

export const useMarkDateStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markDateStatus,
        onSuccess: () => {
            toast.success("Date status applied successfully.");
            queryClient.invalidateQueries(["attendance"]);
            queryClient.invalidateQueries(["attendance-summary"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to mark date status.");
        }
    });
};

export const useAttendanceSummary = (params = {}) => {
    return useQuery({
        queryKey: ["attendance-summary", params],
        queryFn: () => fetchAttendanceSummary(params),
        select: selectData,
        enabled: Boolean(params.month && params.year)
    });
};

/* =========================================================================
   LEAVES HOOKS
   ========================================================================= */

export const useLeaves = (params = {}) => {
    return useQuery({
        queryKey: ["leaves", params],
        queryFn: () => fetchLeaves(params),
        select: selectData,
        keepPreviousData: true
    });
};

export const useLeave = (id) => {
    return useQuery({
        queryKey: ["leave", id],
        queryFn: () => fetchLeaveById(id),
        select: selectData,
        enabled: Boolean(id)
    });
};

export const useApplyLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: applyLeave,
        onSuccess: () => {
            toast.success("Leave application submitted.");
            queryClient.invalidateQueries(["leaves"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to submit leave.");
        }
    });
};

export const useReviewLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: reviewLeave,
        onSuccess: (res, vars) => {
            toast.success(`Leave application ${vars.status.toLowerCase()} successfully.`);
            queryClient.invalidateQueries(["leaves"]);
            queryClient.invalidateQueries(["attendance"]);
            queryClient.invalidateQueries(["attendance-summary"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to review leave.");
        }
    });
};

export const useCancelLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: cancelLeave,
        onSuccess: () => {
            toast.success("Leave application cancelled.");
            queryClient.invalidateQueries(["leaves"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to cancel leave.");
        }
    });
};

/* =========================================================================
   PAYROLL HOOKS
   ========================================================================= */

export const usePayrollSettings = (params = {}) => {
    return useQuery({
        queryKey: ["payroll-settings", params],
        queryFn: () => fetchPayrollSettings(params),
        select: selectData
    });
};

export const useUpdatePayrollSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updatePayrollSettings,
        onSuccess: () => {
            toast.success("Payroll settings updated successfully.");
            queryClient.invalidateQueries(["payroll-settings"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update payroll settings.");
        }
    });
};

export const useSalaryTemplates = (params = {}) => {
    return useQuery({
        queryKey: ["salary-templates", params],
        queryFn: () => fetchSalaryTemplates(params),
        select: selectList
    });
};

export const useSalaryTemplate = (id) => {
    return useQuery({
        queryKey: ["salary-template", id],
        queryFn: () => fetchSalaryTemplateById(id),
        select: selectData,
        enabled: Boolean(id)
    });
};

export const useCreateSalaryTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSalaryTemplate,
        onSuccess: () => {
            toast.success("Salary template created successfully.");
            queryClient.invalidateQueries(["salary-templates"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to create salary template.");
        }
    });
};

export const useUpdateSalaryTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSalaryTemplate,
        onSuccess: (res, vars) => {
            toast.success("Salary template updated successfully.");
            queryClient.invalidateQueries(["salary-templates"]);
            queryClient.invalidateQueries(["salary-template", vars.id]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to update salary template.");
        }
    });
};

export const useDeleteSalaryTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSalaryTemplate,
        onSuccess: () => {
            toast.success("Salary template deleted successfully.");
            queryClient.invalidateQueries(["salary-templates"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to delete salary template.");
        }
    });
};

export const useSalarySlips = (params = {}) => {
    return useQuery({
        queryKey: ["salary-slips", params],
        queryFn: () => fetchSalarySlips(params),
        select: selectData,
        keepPreviousData: true
    });
};

export const useSalarySlip = (id) => {
    return useQuery({
        queryKey: ["salary-slip", id],
        queryFn: () => fetchSalarySlipById(id),
        select: selectData,
        enabled: Boolean(id)
    });
};

export const useGeneratePayroll = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: generatePayroll,
        onSuccess: (res) => {
            toast.success(res?.message || "Payroll generated successfully.");
            queryClient.invalidateQueries(["salary-slips"]);
            queryClient.invalidateQueries(["payroll-report"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to generate payroll.");
        }
    });
};

export const useApproveSalarySlip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: approveSalarySlip,
        onSuccess: () => {
            toast.success("Salary slip approved successfully.");
            queryClient.invalidateQueries(["salary-slips"]);
            queryClient.invalidateQueries(["salary-slip"]);
            queryClient.invalidateQueries(["payroll-report"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to approve salary slip.");
        }
    });
};

export const useBulkPaySlips = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bulkPaySlips,
        onSuccess: () => {
            toast.success("Salary slips marked as PAID successfully.");
            queryClient.invalidateQueries(["salary-slips"]);
            queryClient.invalidateQueries(["payroll-report"]);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || err?.message || "Failed to mark slips as paid.");
        }
    });
};

export const usePayrollReport = (params = {}) => {
    return useQuery({
        queryKey: ["payroll-report", params],
        queryFn: () => fetchPayrollReport(params),
        select: selectData,
        enabled: Boolean(params.month && params.year)
    });
};
