import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getProducts,
    getProductsPagination,
    searchProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct,
    bulkDeleteProducts,
    bulkRestoreProducts
} from "../api";
import { toast } from "react-toastify";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";
import { useNavigate } from "react-router-dom";

/* =========================================================================
   1. PRODUCT QUERIES
   ========================================================================= */

/**
 * Hook to fetch products list
 */
export const useProducts = ({ page = 1, pageSize = 10, search = '', itemType = '', status = '', trash = false, sortBy = 'created_at', sortOrder = 'desc' }) => {
    return useQuery({
        queryKey: ["productList", page, pageSize, search, itemType, status, trash, sortBy, sortOrder],
        queryFn: () => getProducts({ page, pageSize, search, itemType, status, trash, sortBy, sortOrder }),
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

/**
 * Hook to fetch paginated products metadata
 */
export const useProductPagination = ({ page = 1, pageSize = 10, search = '', itemType = '', status = '', trash = false }) => {
    return useQuery({
        queryKey: ["productPagination", page, pageSize, search, itemType, status, trash],
        queryFn: () => getProductsPagination({ page, pageSize, search, itemType, status, trash }),
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
        select: (result) => {
            return result?.pagination?.pagination ?? result?.data?.pagination?.pagination ?? result?.pagination ?? result?.data?.pagination ?? result ?? {};
        }
    });
};

/**
 * Hook to fetch single product by id
 */
export const useProductById = (id) => {
    return useQuery({
        queryKey: ["productById", id],
        queryFn: () => getProductById(id),
        enabled: Boolean(id && id !== 'create'),
        staleTime: 5 * 60 * 1000,
        select: (result) => result?.data ?? result ?? null
    });
};

/**
 * Hook to search products for autocomplete
 */
export const useProductSearch = ({ q = '', itemType = '', enabled = true, limit = 15 }) => {
    return useQuery({
        queryKey: ["productSearch", q, itemType, limit],
        queryFn: () => searchProducts({ q, itemType, limit }),
        enabled: Boolean(enabled && q && q.trim().length >= 1),
        staleTime: 60 * 1000,
        select: (result) => result?.data ?? []
    });
};

/* =========================================================================
   2. PRODUCT MUTATIONS
   ========================================================================= */

/**
 * Hook to create a product
 */
export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return useMutation({
        mutationKey: ["createProduct"],
        mutationFn: createProduct,
        onSuccess: (res) => {
            dispatch(clearLoading());
            toast.success(res.message || "Product created successfully.");
            queryClient.invalidateQueries({ queryKey: ["productList"] });
            queryClient.invalidateQueries({ queryKey: ["productPagination"] });
            queryClient.invalidateQueries({ queryKey: ["productSearch"] });
            navigate("/masters/products");
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to create product.";
            toast.error(message);
        }
    });
};

/**
 * Hook to create a product inline (for QuickAddProductModal inside invoice)
 */
export const useQuickCreateProduct = ({ onSuccessCallback } = {}) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    return useMutation({
        mutationKey: ["quickCreateProduct"],
        mutationFn: createProduct,
        onSuccess: (res) => {
            dispatch(clearLoading());
            toast.success(res.message || "Product created successfully.");
            queryClient.invalidateQueries({ queryKey: ["productList"] });
            queryClient.invalidateQueries({ queryKey: ["productPagination"] });
            queryClient.invalidateQueries({ queryKey: ["productSearch"] });
            if (onSuccessCallback) {
                onSuccessCallback(res?.data ?? res);
            }
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to create product.";
            toast.error(message);
        }
    });
};

/**
 * Hook to update an existing product
 */
export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return useMutation({
        mutationKey: ["updateProduct"],
        mutationFn: ({ id, data }) => updateProduct(id, data),
        onSuccess: (res) => {
            dispatch(clearLoading());
            toast.success(res.message || "Product updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["productList"] });
            queryClient.invalidateQueries({ queryKey: ["productPagination"] });
            queryClient.invalidateQueries({ queryKey: ["productById"] });
            queryClient.invalidateQueries({ queryKey: ["productSearch"] });
            navigate("/masters/products");
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update product.";
            toast.error(message);
        }
    });
};

/**
 * Hook to delete a product (soft delete or permanent delete)
 */
export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deleteProduct"],
        mutationFn: ({ id, isPermanentDelete = false }) => deleteProduct(id, isPermanentDelete),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Product deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["productList"] });
            queryClient.invalidateQueries({ queryKey: ["productPagination"] });
            queryClient.invalidateQueries({ queryKey: ["productSearch"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete product.";
            toast.error(message);
        }
    });
};

/**
 * Hook to restore a product from trash
 */
export const useRestoreProduct = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restoreProduct"],
        mutationFn: (id) => restoreProduct(id),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Product restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["productList"] });
            queryClient.invalidateQueries({ queryKey: ["productPagination"] });
            queryClient.invalidateQueries({ queryKey: ["productSearch"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore product.";
            toast.error(message);
        }
    });
};

/**
 * Hook to bulk delete products
 */
export const useBulkDeleteProducts = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeleteProducts"],
        mutationFn: ({ ids, isPermanentDelete = false }) => bulkDeleteProducts({ ids, isPermanentDelete }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected products deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["productList"] });
            queryClient.invalidateQueries({ queryKey: ["productPagination"] });
            queryClient.invalidateQueries({ queryKey: ["productSearch"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete selected products.";
            toast.error(message);
        }
    });
};

/**
 * Hook to bulk restore products
 */
export const useBulkRestoreProducts = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestoreProducts"],
        mutationFn: ({ ids }) => bulkRestoreProducts({ ids }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res.message || "Selected products restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["productList"] });
            queryClient.invalidateQueries({ queryKey: ["productPagination"] });
            queryClient.invalidateQueries({ queryKey: ["productSearch"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Failed to restore selected products.";
            toast.error(message);
        }
    });
};
