import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

// Fetch Users List
export const fetchUsers = asyncHandler(async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("pageSize", params.pageSize);
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  if (params.roleId) query.append("roleId", params.roleId);
  if (params.trash !== undefined) query.append("trash", params.trash);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);

  const res = await api.request({
    url: `/users?${query.toString()}`,
    method: requestMethod.GET
  });

  return res.data;
});

// Fetch Users Pagination Meta
export const fetchUsersPagination = asyncHandler(async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("pageSize", params.pageSize);
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);
  if (params.roleId) query.append("roleId", params.roleId);
  if (params.trash !== undefined) query.append("trash", params.trash);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);

  const res = await api.request({
    url: `/users/meta?${query.toString()}`,
    method: requestMethod.GET
  });

  return res.data;
});

// Delete User (Soft or Permanent)
export const deleteUser = asyncHandler(async ({ id, permanent = false }) => {
  const res = await api.request({
    url: `/users/${id}?permanent=${Boolean(permanent)}`,
    method: requestMethod.DELETE
  });

  return res.data;
});

// Restore User from Recycle Bin
export const restoreUser = asyncHandler(async (id) => {
  const res = await api.request({
    url: `/users/${id}/restore`,
    method: requestMethod.PATCH
  });

  return res.data;
});

// Bulk Delete Users
export const bulkDeleteUsers = asyncHandler(async ({ ids, permanent = false }) => {
  const res = await api.request({
    url: `/users/bulk-delete`,
    method: requestMethod.POST,
    data: { ids, permanent }
  });

  return res.data;
});

// Bulk Restore Users
export const bulkRestoreUsers = asyncHandler(async ({ ids }) => {
  const res = await api.request({
    url: `/users/bulk-restore`,
    method: requestMethod.POST,
    data: { ids }
  });

  return res.data;
});

// Update User Role
export const updateUserRole = asyncHandler(async ({ id, roleId }) => {
  const res = await api.request({
    url: `/users/${id}/role`,
    method: requestMethod.PATCH,
    data: { roleId }
  });

  return res.data;
});

// Toggle User Active/Inactive Status
export const toggleUserStatus = asyncHandler(async ({ id, isActive }) => {
  const res = await api.request({
    url: `/users/${id}/status`,
    method: requestMethod.PATCH,
    data: { isActive }
  });

  return res.data;
});

// Admin Generate Password Reset Link
export const adminGenerateResetLink = asyncHandler(async (id) => {
  const res = await api.request({
    url: `/users/${id}/reset-link`,
    method: requestMethod.POST
  });

  return res.data;
});

// Fetch Roles (reuse /auth/admin/roles)
export const fetchRoles = asyncHandler(async () => {
  const res = await api.request({
    url: `/auth/admin/roles`,
    method: requestMethod.GET
  });

  return res.data;
});

// Admin Direct Set/Reset Password for a User
export const adminDirectResetPassword = asyncHandler(async ({ id, newPassword }) => {
  const res = await api.request({
    url: `/users/${id}/direct-reset-password`,
    method: requestMethod.POST,
    data: { newPassword }
  });

  return res.data;
});

