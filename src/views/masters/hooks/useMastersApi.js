import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    getAddressTypes,
    getAddressTypeById,
    createAddressType,
    updateAddressType,
    deleteAddressType,
    getContactRoles,
    getContactRoleById,
    createContactRole,
    updateContactRole,
    deleteContactRole,
    getPartyRoles,
    getPartyRoleById,
    createPartyRole,
    updatePartyRole,
    deletePartyRole
} from "../api";
import { toast } from "react-toastify";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";

/* =========================================================================
   1. ADDRESS TYPES HOOKS
   ========================================================================= */

export const useAddressTypesList = () => {
    return useQuery({
        queryKey: ["addressTypesMaster"],
        queryFn: getAddressTypes,
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const useAddressTypeById = (id) => {
    return useQuery({
        queryKey: ["addressTypeById", id],
        queryFn: () => getAddressTypeById(id),
        enabled: Boolean(id),
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useCreateAddressType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["createAddressType"],
        mutationFn: createAddressType,
        onSuccess: (res) => {
            toast.success(res?.message || "Address type created successfully.");
            queryClient.invalidateQueries({ queryKey: ["addressTypesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["addressTypes"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to create address type";
            toast.error(errorMsg);
        }
    });
};

export const useUpdateAddressType = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["updateAddressType"],
        mutationFn: updateAddressType,
        onSuccess: (res) => {
            toast.success(res?.message || "Address type updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["addressTypesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["addressTypes"] });
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to update address type";
            toast.error(errorMsg);
        }
    });
};

export const useDeleteAddressType = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    return useMutation({
        mutationKey: ["deleteAddressType"],
        mutationFn: deleteAddressType,
        onSuccess: (res) => {
            toast.success(res?.message || "Address type deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["addressTypesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["addressTypes"] });
            dispatch(clearLoading());
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete address type";
            toast.error(errorMsg);
            dispatch(clearLoading());
        }
    });
};

/* =========================================================================
   2. CONTACT ROLES HOOKS
   ========================================================================= */

export const useContactRolesList = () => {
    return useQuery({
        queryKey: ["contactRolesMaster"],
        queryFn: getContactRoles,
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
    return useMutation({
        mutationKey: ["deleteContactRole"],
        mutationFn: deleteContactRole,
        onSuccess: (res) => {
            toast.success(res?.message || "Contact role deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["contactRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["contactRoles"] });
            dispatch(clearLoading());
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete contact role";
            toast.error(errorMsg);
            dispatch(clearLoading());
        }
    });
};

/* =========================================================================
   3. PARTY ROLES HOOKS
   ========================================================================= */

export const usePartyRolesList = () => {
    return useQuery({
        queryKey: ["partyRolesMaster"],
        queryFn: getPartyRoles,
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
    return useMutation({
        mutationKey: ["deletePartyRole"],
        mutationFn: deletePartyRole,
        onSuccess: (res) => {
            toast.success(res?.message || "Party role deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyRolesMaster"] });
            queryClient.invalidateQueries({ queryKey: ["masterPartyRoles"] });
            queryClient.invalidateQueries({ queryKey: ["partyRoles"] });
            dispatch(clearLoading());
        },
        onError: (err) => {
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to delete party role";
            toast.error(errorMsg);
            dispatch(clearLoading());
        }
    });
};
