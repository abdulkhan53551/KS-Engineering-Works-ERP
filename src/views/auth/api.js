import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Login
export const login = asyncHandler(async (request) => {
  const res = await api.request({
    url: '/auth/login',
    method: requestMethod.POST,
    data: request
  });

  return res.data;
})

// Logout
export const logout = asyncHandler(async () => {
  const res = await api.request({
    url: '/auth/logout',
    method: requestMethod.POST
  });

  return res.data;
});

// Register
export const register = asyncHandler(async (request) => {
  const res = await api.request({
    url: '/auth/register',
    method: requestMethod.POST,
    data: request
  });

  return res.data;
});

// Forgot Password
export const forgotPassword = asyncHandler(async (request) => {
  const res = await api.request({
    url: '/auth/forgot-password',
    method: requestMethod.POST,
    data: request
  });

  return res.data;
});

// Validate Reset Token
export const validateResetToken = asyncHandler(async (token) => {
  const res = await api.request({
    url: `/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
    method: requestMethod.GET
  });

  return res.data;
});

// Reset Password
export const resetPassword = asyncHandler(async (request) => {
  const res = await api.request({
    url: '/auth/reset-password',
    method: requestMethod.POST,
    data: request
  });

  return res.data;
});

// Admin: Fetch Pending Registrations
export const fetchPendingRegistrations = asyncHandler(async () => {
  const res = await api.request({
    url: '/auth/admin/approvals/registrations',
    method: requestMethod.GET
  });

  return res.data;
});

// Admin: Approve Registration
export const approveUserRegistration = asyncHandler(async ({ id, roleId }) => {
  const res = await api.request({
    url: `/auth/admin/approvals/registrations/${id}/approve`,
    method: requestMethod.PATCH,
    data: { roleId }
  });

  return res.data;
});

// Admin: Reject Registration
export const rejectUserRegistration = asyncHandler(async (id) => {
  const res = await api.request({
    url: `/auth/admin/approvals/registrations/${id}/reject`,
    method: requestMethod.PATCH
  });

  return res.data;
});

// Admin: Fetch Rejected Registrations
export const fetchRejectedRegistrations = asyncHandler(async () => {
  const res = await api.request({
    url: '/auth/admin/approvals/rejected-registrations',
    method: requestMethod.GET
  });

  return res.data;
});

// Admin: Fetch Pending Password Resets
export const fetchPendingPasswordResets = asyncHandler(async () => {
  const res = await api.request({
    url: '/auth/admin/approvals/password-resets',
    method: requestMethod.GET
  });

  return res.data;
});

// Admin: Approve Password Reset
export const approveUserPasswordReset = asyncHandler(async (id) => {
  const res = await api.request({
    url: `/auth/admin/approvals/password-resets/${id}/approve`,
    method: requestMethod.PATCH
  });

  return res.data;
});

// Admin: Reject Password Reset
export const rejectUserPasswordReset = asyncHandler(async (id) => {
  const res = await api.request({
    url: `/auth/admin/approvals/password-resets/${id}/reject`,
    method: requestMethod.PATCH
  });

  return res.data;
});

// Admin: Fetch Roles
export const fetchRoles = asyncHandler(async () => {
  const res = await api.request({
    url: '/auth/admin/roles',
    method: requestMethod.GET
  });

  return res.data;
});