import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getContactRoles,
    getContactRoleById,
    createContactRole,
    updateContactRole,
    deleteContactRole,
    restoreContactRole,
    bulkDeleteContactRoles,
    bulkRestoreContactRoles,
    getPartyRoles,
    getPartyRoleById,
    createPartyRole,
    updatePartyRole,
    deletePartyRole,
    restorePartyRole,
    bulkDeletePartyRoles,
    bulkRestorePartyRoles
} from "../api";
import { toast } from "react-toastify";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";

/* =========================================================================
   1. CONTACT ROLES HOOKS
   ========================================================================= */

export const useContactRolesList = ({ trash = false } = {}) => {
    return useQuery({
        queryKey: ["contactRolesMaster", { trash }],
        queryFn: () => getContactRoles({ trash }),
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const useContactRoleById = (id) => {
    return useQuery({
        queryKey: ["contactRoleById", id],
        queryFn: () => getContactRoleById(id),
        enabled: Boolean(id),
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useCreateContactRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["createContactRole"],
        mutationFn: createContactRole,
        onSuccess: (res) => {
            toast.success(res?.message || "Contact role created successfully.");
            queryClient.invalidateQueries({ queryKey: ["contactRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["contactRoles"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to create contact role";
            toast.error(errorMsg);
        }
    });
};

export const useUpdateContactRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["updateContactRole"],
        mutationFn: updateContactRole,
        onSuccess: (res) => {
            toast.success(res?.message || "Contact role updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["contactRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["contactRoles"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to update contact role";
            toast.error(errorMsg);
        }
    });
};

export const useDeleteContactRole = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deleteContactRole"],
        mutationFn: (param) => {
            const payload = typeof param === 'object' ? param : { id: param, isPermanentDelete: false };
            return deleteContactRole(payload);
        },
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Contact role deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["contactRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["contactRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete contact role";
            toast.error(errorMsg);
        }
    });
};

export const useRestoreContactRole = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restoreContactRole"],
        mutationFn: restoreContactRole,
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Contact role restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["contactRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["contactRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to restore contact role";
            toast.error(errorMsg);
        }
    });
};

export const useBulkDeleteContactRoles = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeleteContactRoles"],
        mutationFn: bulkDeleteContactRoles,
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Contact roles deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["contactRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["contactRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete contact roles";
            toast.error(errorMsg);
        }
    });
};

export const useBulkRestoreContactRoles = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestoreContactRoles"],
        mutationFn: bulkRestoreContactRoles,
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Contact roles restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["contactRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["contactRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to restore contact roles";
            toast.error(errorMsg);
        }
    });
};

/* =========================================================================
   3. PARTY ROLES HOOKS
   ========================================================================= */

export const usePartyRolesList = ({ trash = false } = {}) => {
    return useQuery({
        queryKey: ["partyRolesMaster", { trash }],
        queryFn: () => getPartyRoles({ trash }),
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const usePartyRoleById = (id) => {
    return useQuery({
        queryKey: ["partyRoleById", id],
        queryFn: () => getPartyRoleById(id),
        enabled: Boolean(id),
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useCreatePartyRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["createPartyRole"],
        mutationFn: createPartyRole,
        onSuccess: (res) => {
            toast.success(res?.message || "Party role created successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["masterPartyRoles"] });
            queryClient.invalidateQueries({ queryKey: ["partyRoles"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to create party role";
            toast.error(errorMsg);
        }
    });
};

export const useUpdatePartyRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["updatePartyRole"],
        mutationFn: updatePartyRole,
        onSuccess: (res) => {
            toast.success(res?.message || "Party role updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["masterPartyRoles"] });
            queryClient.invalidateQueries({ queryKey: ["partyRoles"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to update party role";
            toast.error(errorMsg);
        }
    });
};

export const useDeletePartyRole = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deletePartyRole"],
        mutationFn: (param) => {
            const payload = typeof param === 'object' ? param : { id: param, isPermanentDelete: false };
            return deletePartyRole(payload);
        },
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Party role deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["masterPartyRoles"] });
            queryClient.invalidateQueries({ queryKey: ["partyRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete party role";
            toast.error(errorMsg);
        }
    });
};

export const useRestorePartyRole = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restorePartyRole"],
        mutationFn: restorePartyRole,
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Party role restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["masterPartyRoles"] });
            queryClient.invalidateQueries({ queryKey: ["partyRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to restore party role";
            toast.error(errorMsg);
        }
    });
};

export const useBulkDeletePartyRoles = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeletePartyRoles"],
        mutationFn: bulkDeletePartyRoles,
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Party roles deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["masterPartyRoles"] });
            queryClient.invalidateQueries({ queryKey: ["partyRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete party roles";
            toast.error(errorMsg);
        }
    });
};

export const useBulkRestorePartyRoles = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestorePartyRoles"],
        mutationFn: bulkRestorePartyRoles,
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Party roles restored successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["masterPartyRoles"] });
            queryClient.invalidateQueries({ queryKey: ["partyRoles"] });
        },
        onError: (err) => {
            dispatch(clearLoading());
            closeModal();
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to restore party roles";
            toast.error(errorMsg);
        }
    });
};
