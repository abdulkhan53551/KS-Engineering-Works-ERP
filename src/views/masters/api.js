import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

/* =========================================================================
   1. CONTACT ROLES API
   ========================================================================= */

/**
 * Get all contact roles
 * Endpoint: GET /masters/contact-roles
 */
export const getContactRoles = asyncHandler(async (params = {}) => {
    const res = await api.request({
        url: '/masters/contact-roles',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Get contact role by ID
 * Endpoint: GET /masters/contact-roles/:id
 */
export const getContactRoleById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/masters/contact-roles/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Create contact role
 * Endpoint: POST /masters/contact-roles
 * Payload: { roleCode, roleName, description }
 */
export const createContactRole = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/masters/contact-roles',
        method: requestMethod.POST,
        data
    });
    return res.data;
});

/**
 * Update contact role
 * Endpoint: PATCH /masters/contact-roles/:id
 * Payload: { roleCode, roleName, description }
 */
export const updateContactRole = asyncHandler(async ({ id, data }) => {
    const res = await api.request({
        url: `/masters/contact-roles/${id}`,
        method: requestMethod.PATCH,
        data
    });
    return res.data;
});

/**
 * Delete contact role (soft delete or permanent delete)
 * Endpoint: DELETE /masters/contact-roles/:id?isPermanentDelete=false/true
 */
export const deleteContactRole = asyncHandler(async ({ id, isPermanentDelete = false }) => {
    const res = await api.request({
        url: `/masters/contact-roles/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });
    return res.data;
});

/**
 * Restore contact role from trash
 * Endpoint: PATCH /masters/contact-roles/:id/restore
 */
export const restoreContactRole = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/masters/contact-roles/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

/**
 * Bulk delete contact roles
 * Endpoint: POST /masters/contact-roles/bulk-delete
 */
export const bulkDeleteContactRoles = asyncHandler(async ({ ids = [], isPermanentDelete = false }) => {
    const res = await api.request({
        url: '/masters/contact-roles/bulk-delete',
        method: requestMethod.POST,
        data: { ids, isPermanentDelete }
    });
    return res.data;
});

/**
 * Bulk restore contact roles
 * Endpoint: PATCH /masters/contact-roles/bulk-restore
 */
export const bulkRestoreContactRoles = asyncHandler(async ({ ids = [] }) => {
    const res = await api.request({
        url: '/masters/contact-roles/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });
    return res.data;
});

/* =========================================================================
   3. PARTY ROLES API
   ========================================================================= */

/**
 * Get all party roles
 * Endpoint: GET /parties/party-roles
 */
export const getPartyRoles = asyncHandler(async (params = {}) => {
    const res = await api.request({
        url: '/parties/party-roles',
        method: requestMethod.GET,
        params
    });
    return res.data;
});

/**
 * Get party role by ID
 * Endpoint: GET /parties/party-roles/:id
 */
export const getPartyRoleById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/parties/party-roles/${id}`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Create party role
 * Endpoint: POST /parties/party-roles
 * Payload: { roleCode, roleName, description }
 */
export const createPartyRole = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/parties/party-roles',
        method: requestMethod.POST,
        data
    });
    return res.data;
});

/**
 * Update party role
 * Endpoint: PATCH /parties/party-roles/:id
 * Payload: { roleCode, roleName, description }
 */
export const updatePartyRole = asyncHandler(async ({ id, data }) => {
    const res = await api.request({
        url: `/parties/party-roles/${id}`,
        method: requestMethod.PATCH,
        data
    });
    return res.data;
});

/**
 * Delete party role (soft delete or permanent delete)
 * Endpoint: DELETE /parties/party-roles/:id?isPermanentDelete=false/true
 */
export const deletePartyRole = asyncHandler(async ({ id, isPermanentDelete = false }) => {
    const res = await api.request({
        url: `/parties/party-roles/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });
    return res.data;
});

/**
 * Restore party role from trash
 * Endpoint: PATCH /parties/party-roles/:id/restore
 */
export const restorePartyRole = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/parties/party-roles/${id}/restore`,
        method: requestMethod.PATCH
    });
    return res.data;
});

/**
 * Bulk delete party roles
 * Endpoint: POST /parties/party-roles/bulk-delete
 */
export const bulkDeletePartyRoles = asyncHandler(async ({ ids = [], isPermanentDelete = false }) => {
    const res = await api.request({
        url: '/parties/party-roles/bulk-delete',
        method: requestMethod.POST,
        data: { ids, isPermanentDelete }
    });
    return res.data;
});

/**
 * Bulk restore party roles
 * Endpoint: PATCH /parties/party-roles/bulk-restore
 */
export const bulkRestorePartyRoles = asyncHandler(async ({ ids = [] }) => {
    const res = await api.request({
        url: '/parties/party-roles/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });
    return res.data;
});
