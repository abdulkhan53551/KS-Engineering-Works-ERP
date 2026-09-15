import api from "../../../lib/axios";
import { requestMethod } from "../../../utilities/api/constants";
import { asyncHandler } from "../../../utilities/asyncHandler";

// Fetch all roles with user counts and system flags
export const fetchRolesList = asyncHandler(async () => {
    const res = await api.request({
        url: '/admin/roles',
        method: requestMethod.GET
    });
    return res.data;
});

// Fetch full permission matrix (modules, permissions, role mapping)
export const fetchPermissionMatrix = asyncHandler(async () => {
    const res = await api.request({
        url: '/admin/permissions/matrix',
        method: requestMethod.GET
    });
    return res.data;
});

// Update permissions for a specific role
export const saveRolePermissions = asyncHandler(async (roleId, permissionIds) => {
    const res = await api.request({
        url: `/admin/roles/${roleId}/permissions`,
        method: requestMethod.PUT,
        data: { permissionIds }
    });
    return res.data;
});

// Create a new custom role
export const createRoleApi = asyncHandler(async (roleData) => {
    const res = await api.request({
        url: '/admin/roles',
        method: requestMethod.POST,
        data: roleData
    });
    return res.data;
});

// Delete a custom role
export const deleteRoleApi = asyncHandler(async (roleId) => {
    const res = await api.request({
        url: `/admin/roles/${roleId}`,
        method: requestMethod.DELETE
    });
    return res.data;
});
