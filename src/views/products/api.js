import api from "../../lib/axios";
import { requestMethod } from "../../utilities/api/constants";
import { asyncHandler } from "../../utilities/asyncHandler";

/* =========================================================================
   PRODUCT & ITEM CATALOG APIS
   ========================================================================= */

/**
 * Get products list with filters and sorting
 * Endpoint: GET /products
 */
export const getProducts = asyncHandler(async ({ page = 1, pageSize = 10, search = '', itemType = '', status = '', trash = false, sortBy = 'created_at', sortOrder = 'desc' }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (itemType) params.itemType = itemType;
    if (status) params.status = status;
    if (trash) params.trash = trash;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const res = await api.request({
        url: '/products',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

/**
 * Get products pagination metadata
 * Endpoint: GET /products/pagination
 */
export const getProductsPagination = asyncHandler(async ({ page = 1, pageSize = 10, search = '', itemType = '', status = '', trash = false }) => {
    const params = { page, pageSize };
    if (search) params.search = search;
    if (itemType) params.itemType = itemType;
    if (status) params.status = status;
    if (trash) params.trash = trash;

    const res = await api.request({
        url: '/products/pagination',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

/**
 * Fast search for products (for autocomplete in Invoice & PO line-items)
 * Endpoint: GET /products/search
 */
export const searchProducts = asyncHandler(async ({ q = '', itemType = '', limit = 15 }) => {
    const params = { limit };
    if (q) params.q = q;
    if (itemType) params.itemType = itemType;

    const res = await api.request({
        url: '/products/search',
        method: requestMethod.GET,
        params
    });

    return res.data;
});

/**
 * Get single product by id
 * Endpoint: GET /products/:id
 */
export const getProductById = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/products/${id}`,
        method: requestMethod.GET
    });

    return res.data;
});

/**
 * Create new product
 * Endpoint: POST /products
 */
export const createProduct = asyncHandler(async (data) => {
    const res = await api.request({
        url: '/products',
        method: requestMethod.POST,
        data
    });

    return res.data;
});

/**
 * Update existing product
 * Endpoint: PATCH /products/:id
 */
export const updateProduct = asyncHandler(async (id, data) => {
    const res = await api.request({
        url: `/products/${id}`,
        method: requestMethod.PATCH,
        data
    });

    return res.data;
});

/**
 * Delete product (soft-delete to trash or permanent delete)
 * Endpoint: DELETE /products/:id
 */
export const deleteProduct = asyncHandler(async (id, isPermanentDelete = false) => {
    const res = await api.request({
        url: `/products/${id}`,
        method: requestMethod.DELETE,
        params: { isPermanentDelete }
    });

    return res.data;
});

/**
 * Restore product from trash
 * Endpoint: PATCH /products/:id/restore
 */
export const restoreProduct = asyncHandler(async (id) => {
    const res = await api.request({
        url: `/products/${id}/restore`,
        method: requestMethod.PATCH
    });

    return res.data;
});

/**
 * Bulk delete products
 * Endpoint: POST /products/bulk-delete
 */
export const bulkDeleteProducts = asyncHandler(async ({ ids = [], isPermanentDelete = false }) => {
    const res = await api.request({
        url: '/products/bulk-delete',
        method: requestMethod.POST,
        data: { ids, isPermanentDelete }
    });

    return res.data;
});

/**
 * Bulk restore products
 * Endpoint: PATCH /products/bulk-restore
 */
export const bulkRestoreProducts = asyncHandler(async ({ ids = [] }) => {
    const res = await api.request({
        url: '/products/bulk-restore',
        method: requestMethod.PATCH,
        data: { ids }
    });

    return res.data;
});
