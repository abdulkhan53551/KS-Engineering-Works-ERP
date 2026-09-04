import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

/* =========================================================================
   1. MASTER APIS (Address Types, Contact Roles, Party Roles)
   ========================================================================= */

/**
 * Get address types master
 * Endpoint: GET /masters/address-types
 */
export const getAddressTypes = asyncHandler(async () => {
    const res = await api.request({
        url: '/masters/address-types',
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Get contact roles master
 * Endpoint: GET /masters/contact-roles
 */
export const getContactRoles = asyncHandler(async () => {
    const res = await api.request({
        url: '/masters/contact-roles',
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Get all available roles for party
 * Endpoint: GET /parties/party-roles
 */
export const getMasterPartyRoles = asyncHandler(async () => {
    const res = await api.request({
        url: '/parties/party-roles',
        method: requestMethod.GET
    });
    return res.data;
});

/* =========================================================================
   2. MAIN PARTY APIS (CRUD & Pagination)
   ========================================================================= */

/**
 * Get parties with pagination
 * Endpoint: GET /parties/pagination
 */
export const getPartiesPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '', status = '', gstRegistered = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (status) params.status = status;
    if (trash) params.trash = trash;
    if (gstRegistered !== '' && gstRegistered !== null && gstRegistered !== undefined) {
        params.gstRegistered = gstRegistered;
    }

    const res = await api.request({
        url: '/parties/pagination',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

/**
 * Get parties list
 * Endpoint: GET /parties
 */
export const getParties = asyncHandler(async ({ page = 1, pageSize = 10, search = '', status = '', gstRegistered = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (status) params.status = status;
    if (trash) params.trash = trash;
    if (gstRegistered !== '' && gstRegistered !== null && gstRegistered !== undefined) {
        params.gstRegistered = gstRegistered;
    }

    const res = await api.request({
        url: '/parties',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

/**
 * Search parties for autocomplete
 * Endpoint: GET /parties/search?search=abc
 */
export const searchParties = asyncHandler(async (search) => {
    const query = typeof search === 'string' ? search.trim() : '';
    if (query.length < 2) {
        return { success: true, data: [] };
    }
    const res = await api.request({
        url: '/parties/search',
        method: requestMethod.GET,
        params: { search: query }
    });
    return res.data;
});

/**
 * Get party full details (including billingAddress and shippingAddress)
 * Endpoint: GET /parties/:partyId/details
 */
export const getPartyDetailsById = asyncHandler(async (partyId) => {
    const res = await api.request({
        url: `/parties/${partyId}/details`,
        method: requestMethod.GET
    });
    return res.data;
});

/**
 * Get party by id / party basic details
 * Endpoint: GET /parties/:partyId
 */
export const getPartyById = asyncHandler(async (partyId) => {
    const res = await api.request({
        url: `/parties/${partyId}`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Create party
 * Endpoint: POST /parties
 */
export const createParty = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/parties',
        method: requestMethod.POST,
        data
    });

    return res.data;
});

/**
 * Update party
 * Endpoint: PATCH /parties/:id
 */
export const updateParty = asyncHandler(async (id, data) => {
    const res = await api.request({
        url: `/parties/${id}`,
        method: requestMethod.PATCH,
        data
    });

    return res.data;
});

/**
 * Delete party (Soft delete or Permanent delete)
 * Endpoint: DELETE /parties/:id
 */
export const deleteParty = asyncHandler(async (id, isPermanentDelete = false) => {
    const res = await api.request({
        url: `/parties/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });

    return res.data;
});

/**
 * Restore party from trash
 * Endpoint: PATCH /parties/:id/restore
 */
export const restoreParty = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/parties/${id}/restore`,
        method: requestMethod.PATCH
    });

    return res.data;
});

/**
 * Bulk delete parties (Soft delete or Permanent delete)
 * Endpoint: POST /parties/bulk-delete
 */
export const bulkDeleteParties = asyncHandler(async ({ ids = [], isPermanentDelete = false }) => {
    const res = await api.request({
        url: '/parties/bulk-delete',
        method: requestMethod.POST,
        data: { ids, isPermanentDelete }
    });

    return res.data;
});

/**
 * Bulk restore parties from trash
 * Endpoint: PATCH /parties/bulk-restore
 */
export const bulkRestoreParties = asyncHandler(async ({ ids = [] }) => {
    const res = await api.request({
        url: '/parties/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });

    return res.data;
});


/* =========================================================================
   4. PARTY ADDRESSES APIS
   ========================================================================= */

/**
 * Get all addresses for a party
 * Endpoint: GET /parties/:partyId/addresses
 */
export const getPartyAddresses = asyncHandler(async (partyId) => {
    const res = await api.request({
        url: `/parties/${partyId}/addresses`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Get party address by ID
 * Endpoint: GET /parties/:partyId/addresses/:id
 */
export const getPartyAddressById = asyncHandler(async (partyId, addressId) => {
    const res = await api.request({
        url: `/parties/${partyId}/addresses/${addressId}`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Create party address
 * Endpoint: POST /parties/:partyId/addresses
 */
export const createPartyAddress = asyncHandler(async (partyId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/addresses`,
        method: requestMethod.POST,
        data
    });

    return res.data;
});

/**
 * Update party address
 * Endpoint: PATCH /parties/:partyId/addresses/:id
 */
export const updatePartyAddress = asyncHandler(async (partyId, addressId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/addresses/${addressId}`,
        method: requestMethod.PATCH,
        data
    });

    return res.data;
});

/**
 * Delete party address
 * Endpoint: DELETE /parties/:partyId/addresses/:id
 */
export const deletePartyAddress = asyncHandler(async (partyId, addressId) => {
    const res = await api.request({
        url: `/parties/${partyId}/addresses/${addressId}`,
        method: requestMethod.DELETE
    });

    return res.data;
});

/* =========================================================================
   5. PARTY CONTACTS APIS
   ========================================================================= */

/**
 * Get all contacts for a party
 * Endpoint: GET /parties/:partyId/contacts
 */
export const getPartyContacts = asyncHandler(async (partyId) => {
    const res = await api.request({
        url: `/parties/${partyId}/contacts`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Get party contact by ID
 * Endpoint: GET /parties/:partyId/contacts/:id
 */
export const getPartyContactById = asyncHandler(async (partyId, contactId) => {
    const res = await api.request({
        url: `/parties/${partyId}/contacts/${contactId}`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Create party contact
 * Endpoint: POST /parties/:partyId/contacts
 */
export const createPartyContact = asyncHandler(async (partyId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/contacts`,
        method: requestMethod.POST,
        data
    });

    return res.data;
});

/**
 * Update party contact
 * Endpoint: PATCH /parties/:partyId/contacts/:id
 */
export const updatePartyContact = asyncHandler(async (partyId, contactId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/contacts/${contactId}`,
        method: requestMethod.PATCH,
        data
    });

    return res.data;
});

/**
 * Delete party contact
 * Endpoint: DELETE /parties/:partyId/contacts/:id
 */
export const deletePartyContact = asyncHandler(async (partyId, contactId) => {
    const res = await api.request({
        url: `/parties/${partyId}/contacts/${contactId}`,
        method: requestMethod.DELETE
    });

    return res.data;
});

/* =========================================================================
   6. PARTY BANK ACCOUNTS APIS
   ========================================================================= */

/**
 * Get all bank accounts for a party
 * Endpoint: GET /parties/:partyId/bank-accounts
 */
export const getPartyBankAccounts = asyncHandler(async (partyId) => {
    const res = await api.request({
        url: `/parties/${partyId}/bank-accounts`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Get party bank account by ID
 * Endpoint: GET /parties/:partyId/bank-accounts/:id
 */
export const getPartyBankAccountById = asyncHandler(async (partyId, bankAccountId) => {
    const res = await api.request({
        url: `/parties/${partyId}/bank-accounts/${bankAccountId}`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Create party bank account
 * Endpoint: POST /parties/:partyId/bank-accounts
 */
export const createPartyBankAccount = asyncHandler(async (partyId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/bank-accounts`,
        method: requestMethod.POST,
        data
    });

    return res.data;
});

/**
 * Update party bank account
 * Endpoint: PATCH /parties/:partyId/bank-accounts/:id
 */
export const updatePartyBankAccount = asyncHandler(async (partyId, bankAccountId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/bank-accounts/${bankAccountId}`,
        method: requestMethod.PATCH,
        data
    });

    return res.data;
});

/**
 * Delete party bank account
 * Endpoint: DELETE /parties/:partyId/bank-accounts/:id
 */
export const deletePartyBankAccount = asyncHandler(async (partyId, bankAccountId) => {
    const res = await api.request({
        url: `/parties/${partyId}/bank-accounts/${bankAccountId}`,
        method: requestMethod.DELETE
    });

    return res.data;
});

/* =========================================================================
   8. PARTY BRANCHES APIS
   ========================================================================= */

/**
 * Get all branches for a party
 * Endpoint: GET /parties/:partyId/branches
 */
export const getPartyBranches = asyncHandler(async (partyId) => {
    const res = await api.request({
        url: `/parties/${partyId}/branches`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Get party branch by ID
 * Endpoint: GET /parties/:partyId/branches/:id
 */
export const getPartyBranchById = asyncHandler(async (partyId, branchId) => {
    const res = await api.request({
        url: `/parties/${partyId}/branches/${branchId}`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Create party branch
 * Endpoint: POST /parties/:partyId/branches
 */
export const createPartyBranch = asyncHandler(async (partyId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/branches`,
        method: requestMethod.POST,
        data
    });

    return res.data;
});

/**
 * Update party branch
 * Endpoint: PATCH /parties/:partyId/branches/:id
 */
export const updatePartyBranch = asyncHandler(async (partyId, branchId, data) => {
    const res = await api.request({
        url: `/parties/${partyId}/branches/${branchId}`,
        method: requestMethod.PATCH,
        data
    });

    return res.data;
});

/**
 * Set a branch as default branch
 * Endpoint: PATCH /parties/:partyId/branches/:id/set-default
 */
export const setDefaultPartyBranch = asyncHandler(async (partyId, branchId) => {
    const res = await api.request({
        url: `/parties/${partyId}/branches/${branchId}/set-default`,
        method: requestMethod.PATCH
    });

    return res.data;
});

/**
 * Delete party branch
 * Endpoint: DELETE /parties/:partyId/branches/:id
 */
export const deletePartyBranch = asyncHandler(async (partyId, branchId) => {
    const res = await api.request({
        url: `/parties/${partyId}/branches/${branchId}`,
        method: requestMethod.DELETE
    });

    return res.data;
});

