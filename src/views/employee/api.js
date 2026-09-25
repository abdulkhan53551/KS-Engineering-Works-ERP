import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

/* =========================================================================
   EMPLOYEES APIS
   ========================================================================= */

export const fetchEmployees = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    if (params.search) query.append("search", params.search);
    if (params.status) query.append("status", params.status);
    if (params.employmentType) query.append("employmentType", params.employmentType);
    if (params.salaryType) query.append("salaryType", params.salaryType);
    if (params.department) query.append("department", params.department);
    if (params.designation) query.append("designation", params.designation);
    if (params.branchId) query.append("branchId", params.branchId);
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.trash !== undefined) query.append("trash", params.trash);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const res = await api.request({
        url: `/employees?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const fetchEmployeesMeta = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.branchId) query.append("branchId", params.branchId);

    const res = await api.request({
        url: `/employees/meta?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const fetchEmployeeById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/employees/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const fetchNextEmployeeCode = asyncHandler(async (firmId) => {
    const query = new URLSearchParams();
    if (firmId && firmId !== 'all') query.append("firmId", firmId);

    const res = await api.request({
        url: `/employees/next-code?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const createEmployee = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/employees`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const updateEmployee = asyncHandler(async ({ id, ...data }) => {
    const res = await api.request({
        url: `/employees/${id}`,
        method: requestMethod.PUT,
        data
    });
    return res.data;
});

export const deleteEmployee = asyncHandler(async ({ id, permanent = false }) => {
    const res = await api.request({
        url: `/employees/${id}?permanent=${Boolean(permanent)}`,
        method: requestMethod.DELETE
    });
    return res.data;
});

export const restoreEmployee = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/employees/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

export const fetchEmployeesDropdown = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.branchId) query.append("branchId", params.branchId);

    const res = await api.request({
        url: `/employees/dropdown?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

/* =========================================================================
   SHIFTS APIS
   ========================================================================= */

export const fetchShifts = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.search) query.append("search", params.search);

    const res = await api.request({
        url: `/shifts?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const fetchShiftById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/shifts/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const createShift = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/shifts`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const updateShift = asyncHandler(async ({ id, ...data }) => {
    const res = await api.request({
        url: `/shifts/${id}`,
        method: requestMethod.PUT,
        data
    });
    return res.data;
});

export const deleteShift = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/shifts/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});

export const assignShift = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/shifts/assign`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const fetchShiftAssignments = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.shiftId) query.append("shiftId", params.shiftId);
    if (params.employeeId) query.append("employeeId", params.employeeId);

    const res = await api.request({
        url: `/shifts/assignments?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

/* =========================================================================
   ATTENDANCE APIS
   ========================================================================= */

export const fetchAttendance = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.branchId) query.append("branchId", params.branchId);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    if (params.status) query.append("status", params.status);

    const res = await api.request({
        url: `/attendance?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const markAttendance = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/attendance/mark`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const bulkMarkAttendance = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/attendance/bulk-mark`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const markDateStatus = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/attendance/mark-date-status`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const fetchAttendanceSummary = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    if (params.branchId) query.append("branchId", params.branchId);

    const res = await api.request({
        url: `/attendance/summary?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

/* =========================================================================
   LEAVES APIS
   ========================================================================= */

export const fetchLeaves = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.status) query.append("status", params.status);
    if (params.leaveType) query.append("leaveType", params.leaveType);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const res = await api.request({
        url: `/leaves?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const fetchLeaveById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/leaves/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const applyLeave = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/leaves/apply`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const reviewLeave = asyncHandler(async ({ id, status, rejectionReason }) => {
    const res = await api.request({
        url: `/leaves/${id}/review`,
        method: requestMethod.PATCH,
        data: { status, rejectionReason }
    });
    return res.data;
});

export const cancelLeave = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/leaves/${id}/cancel`,
        method: requestMethod.PATCH
    });
    return res.data;
});

/* =========================================================================
   PAYROLL, SALARY TEMPLATES & SETTINGS APIS
   ========================================================================= */

export const fetchPayrollSettings = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);

    const res = await api.request({
        url: `/payroll/settings?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const updatePayrollSettings = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/payroll/settings`,
        method: requestMethod.PUT,
        data
    });
    return res.data;
});

export const fetchSalaryTemplates = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);

    const res = await api.request({
        url: `/payroll/templates?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const fetchSalaryTemplateById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/payroll/templates/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const createSalaryTemplate = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/payroll/templates`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const updateSalaryTemplate = asyncHandler(async ({ id, ...data }) => {
    const res = await api.request({
        url: `/payroll/templates/${id}`,
        method: requestMethod.PUT,
        data
    });
    return res.data;
});

export const deleteSalaryTemplate = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/payroll/templates/${id}`,
        method: requestMethod.DELETE
    });
    return res.data;
});

export const fetchSalarySlips = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.pageSize) query.append("pageSize", params.pageSize);
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);
    if (params.status) query.append("status", params.status);
    if (params.employeeId) query.append("employeeId", params.employeeId);
    if (params.search) query.append("search", params.search);

    const res = await api.request({
        url: `/payroll/slips?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const fetchSalarySlipById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/payroll/slips/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

export const generatePayroll = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/payroll/generate`,
        method: requestMethod.POST,
        data
    });
    return res.data;
});

export const approveSalarySlip = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/payroll/slips/${id}/approve`,
        method: requestMethod.PATCH
    });
    return res.data;
});

export const bulkPaySlips = asyncHandler(async (data) => {
    const res = await api.request({
        url: `/payroll/bulk-pay`,
        method: requestMethod.PATCH,
        data
    });
    return res.data;
});

export const fetchPayrollReport = asyncHandler(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.firmId) query.append("firmId", params.firmId);
    if (params.month) query.append("month", params.month);
    if (params.year) query.append("year", params.year);

    const res = await api.request({
        url: `/payroll/report?${query.toString()}`,
        method: requestMethod.GET
    });
    return res.data;
});
