import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    bulkDeleteParties,
    bulkRestoreParties,
    createParty,
    createPartyAddress,
    createPartyBankAccount,
    createPartyContact,
    deleteParty,
    deletePartyAddress,
    deletePartyBankAccount,
    deletePartyContact,
    getAddressTypes,
    getContactRoles,
    getMasterPartyRoles,
    getParties,
    getPartiesPagination,
    getPartyAddresses,
    getPartyAddressById,
    getPartyBankAccounts,
    getPartyBankAccountById,
    getPartyById,
    getPartyDetailsById,
    getPartyContacts,
    getPartyContactById,
    restoreParty,
    searchParties,
    updateParty,
    updatePartyAddress,
    updatePartyBankAccount,
    updatePartyContact
} from "../api";
import { toast } from "react-toastify";
import { clearLoading } from "../../../store/uiModal.slice";
import { useDispatch } from "react-redux";
import { useUIManager } from "../../../contexts/UIManagerContext";
import { useNavigate } from "react-router-dom";

/* =========================================================================
   1. MASTER HOOKS (Address Types, Contact Roles, Party Roles)
   ========================================================================= */

export const useAddressTypes = () => {
    return useQuery({
        queryKey: ["addressTypes"],
        queryFn: getAddressTypes,
        staleTime: Infinity,
        select: (result) => result?.data ?? result ?? []
    });
};

export const useContactRoles = () => {
    return useQuery({
        queryKey: ["contactRoles"],
        queryFn: getContactRoles,
        staleTime: Infinity,
        select: (result) => result?.data ?? result ?? []
    });
};

export const useMasterPartyRoles = () => {
    return useQuery({
        queryKey: ["masterPartyRoles"],
        queryFn: getMasterPartyRoles,
        staleTime: Infinity,
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

/* =========================================================================
   2. MAIN PARTY HOOKS
   ========================================================================= */

export const usePartyPagination = ({ page = 1, pageSize = 10, search = '', status = '', gstRegistered = '', trash = false }) => {
    return useQuery({
        queryKey: ["partyPagination", page, pageSize, search, status, gstRegistered, trash],
        queryFn: () => getPartiesPagination({ page, pageSize, search, status, gstRegistered, trash }),
        keepPreviousData: true,
        select: (result) => {
            const pagination = result?.data?.pagination ?? result?.pagination ?? {};
            const total = pagination.total ?? 0;
            const totalPages = pagination.totalPages ?? (Math.ceil(total / pageSize) || 1);

            const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
            const pageEnd = Math.min(page * pageSize, total);

            return {
                ...pagination,
                total,
                totalPages,
                pageStart,
                pageEnd
            };
        }
    });
};

export const useParties = ({ page = 1, pageSize = 10, search = '', status = '', gstRegistered = '', trash = false }) => {
    return useQuery({
        queryKey: ["partyList", page, pageSize, search, status, gstRegistered, trash],
        queryFn: () => getParties({ page, pageSize, search, status, gstRegistered, trash }),
        keepPreviousData: true,
        select: (result) => {
            const list = result?.data ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const usePartyById = (partyId) => {
    return useQuery({
        queryKey: ["partyById", partyId],
        queryFn: () => getPartyById(partyId),
        enabled: Boolean(partyId && partyId !== "create"),
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useSearchParties = (searchTerm) => {
    return useQuery({
        queryKey: ["partiesSearch", searchTerm],
        queryFn: () => searchParties(searchTerm),
        enabled: Boolean(searchTerm && searchTerm.trim().length >= 1),
        staleTime: 30000,
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const usePartyDetailsById = (partyId) => {
    return useQuery({
        queryKey: ["partyFullDetails", partyId],
        queryFn: () => getPartyDetailsById(partyId),
        enabled: Boolean(partyId),
        staleTime: 60000,
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useCreateParty = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationKey: ["createParty"],
        mutationFn: createParty,
        onSuccess: (res) => {
            const createdParty = res?.data ?? res ?? {};
            const id = createdParty?.id;
            toast.success(res?.message || "Party created successfully.");

            queryClient.invalidateQueries({ queryKey: ["partyList"] });
            queryClient.invalidateQueries({ queryKey: ["partyPagination"] });

            if (id) {
                navigate(`/parties/${id}/edit`, { replace: true });
            }
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to create party.";
            toast.error(message);
        }
    });
};

export const useUpdateParty = (id) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updateParty", id],
        mutationFn: (data) => updateParty(id, data),
        onSuccess: (res) => {
            toast.success(res?.message || "Party updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyById", id] });
            queryClient.invalidateQueries({ queryKey: ["partyFullDetails", id] });
            queryClient.invalidateQueries({ queryKey: ["partyList"] });
            queryClient.invalidateQueries({ queryKey: ["partyPagination"] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to update party.";
            toast.error(message);
        }
    });
};

export const useDeleteParty = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deleteParty"],
        mutationFn: ({ id, isPermanentDelete = false }) => deleteParty(id, isPermanentDelete),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Party deleted successfully.");

            queryClient.invalidateQueries({ queryKey: ["partyList"] });
            queryClient.invalidateQueries({ queryKey: ["partyPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message = error?.response?.data?.message || error?.message || "Something went wrong while deleting the party.";
            toast.error(message);
        }
    });
};

export const useRestoreParty = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["restoreParty"],
        mutationFn: (id) => restoreParty(id),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Party restored from Trash successfully.");

            queryClient.invalidateQueries({ queryKey: ["partyList"] });
            queryClient.invalidateQueries({ queryKey: ["partyPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message = error?.response?.data?.message || error?.message || "Failed to restore party.";
            toast.error(message);
        }
    });
};

export const useBulkDeleteParties = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkDeleteParties"],
        mutationFn: ({ ids, isPermanentDelete = false }) => bulkDeleteParties({ ids, isPermanentDelete }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Selected parties deleted successfully.");

            queryClient.invalidateQueries({ queryKey: ["partyList"] });
            queryClient.invalidateQueries({ queryKey: ["partyPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message = error?.response?.data?.message || error?.message || "Failed to delete selected parties.";
            toast.error(message);
        }
    });
};

export const useBulkRestoreParties = () => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["bulkRestoreParties"],
        mutationFn: ({ ids }) => bulkRestoreParties({ ids }),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Selected parties restored successfully.");

            queryClient.invalidateQueries({ queryKey: ["partyList"] });
            queryClient.invalidateQueries({ queryKey: ["partyPagination"] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message = error?.response?.data?.message || error?.message || "Failed to restore selected parties.";
            toast.error(message);
        }
    });
};


/* =========================================================================
   4. PARTY ADDRESSES HOOKS
   ========================================================================= */

export const usePartyAddresses = (partyId) => {
    return useQuery({
        queryKey: ["partyAddresses", partyId],
        queryFn: () => getPartyAddresses(partyId),
        enabled: Boolean(partyId && partyId !== "create"),
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const usePartyAddressById = (partyId, addressId) => {
    return useQuery({
        queryKey: ["partyAddress", partyId, addressId],
        queryFn: () => getPartyAddressById(partyId, addressId),
        enabled: Boolean(partyId && addressId),
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useCreatePartyAddress = (partyId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createPartyAddress", partyId],
        mutationFn: (data) => createPartyAddress(partyId, data),
        onSuccess: (res) => {
            toast.success(res?.message || "Address added successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyAddresses", partyId] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to add address.";
            toast.error(message);
        }
    });
};

export const useUpdatePartyAddress = (partyId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updatePartyAddress", partyId],
        mutationFn: ({ addressId, data }) => updatePartyAddress(partyId, addressId, data),
        onSuccess: (res) => {
            toast.success(res?.message || "Address updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyAddresses", partyId] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to update address.";
            toast.error(message);
        }
    });
};

export const useDeletePartyAddress = (partyId) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deletePartyAddress", partyId],
        mutationFn: (addressId) => deletePartyAddress(partyId, addressId),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Address deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyAddresses", partyId] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message = error?.response?.data?.message || error?.message || "Failed to delete address.";
            toast.error(message);
        }
    });
};

/* =========================================================================
   5. PARTY CONTACTS HOOKS
   ========================================================================= */

export const usePartyContacts = (partyId) => {
    return useQuery({
        queryKey: ["partyContacts", partyId],
        queryFn: () => getPartyContacts(partyId),
        enabled: Boolean(partyId && partyId !== "create"),
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const usePartyContactById = (partyId, contactId) => {
    return useQuery({
        queryKey: ["partyContact", partyId, contactId],
        queryFn: () => getPartyContactById(partyId, contactId),
        enabled: Boolean(partyId && contactId),
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useCreatePartyContact = (partyId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createPartyContact", partyId],
        mutationFn: (data) => createPartyContact(partyId, data),
        onSuccess: (res) => {
            toast.success(res?.message || "Contact added successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyContacts", partyId] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to add contact.";
            toast.error(message);
        }
    });
};

export const useUpdatePartyContact = (partyId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updatePartyContact", partyId],
        mutationFn: ({ contactId, data }) => updatePartyContact(partyId, contactId, data),
        onSuccess: (res) => {
            toast.success(res?.message || "Contact updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyContacts", partyId] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to update contact.";
            toast.error(message);
        }
    });
};

export const useDeletePartyContact = (partyId) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deletePartyContact", partyId],
        mutationFn: (contactId) => deletePartyContact(partyId, contactId),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Contact deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyContacts", partyId] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message = error?.response?.data?.message || error?.message || "Failed to delete contact.";
            toast.error(message);
        }
    });
};

/* =========================================================================
   6. PARTY BANK ACCOUNTS HOOKS
   ========================================================================= */

export const usePartyBankAccounts = (partyId) => {
    return useQuery({
        queryKey: ["partyBankAccounts", partyId],
        queryFn: () => getPartyBankAccounts(partyId),
        enabled: Boolean(partyId && partyId !== "create"),
        select: (result) => {
            const list = result?.data ?? result ?? [];
            return Array.isArray(list) ? list : [];
        }
    });
};

export const usePartyBankAccountById = (partyId, bankAccountId) => {
    return useQuery({
        queryKey: ["partyBankAccount", partyId, bankAccountId],
        queryFn: () => getPartyBankAccountById(partyId, bankAccountId),
        enabled: Boolean(partyId && bankAccountId),
        select: (result) => result?.data ?? result ?? {}
    });
};

export const useCreatePartyBankAccount = (partyId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["createPartyBankAccount", partyId],
        mutationFn: (data) => createPartyBankAccount(partyId, data),
        onSuccess: (res) => {
            toast.success(res?.message || "Bank account added successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyBankAccounts", partyId] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to add bank account.";
            toast.error(message);
        }
    });
};

export const useUpdatePartyBankAccount = (partyId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["updatePartyBankAccount", partyId],
        mutationFn: ({ bankAccountId, data }) => updatePartyBankAccount(partyId, bankAccountId, data),
        onSuccess: (res) => {
            toast.success(res?.message || "Bank account updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyBankAccounts", partyId] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error?.message || "Failed to update bank account.";
            toast.error(message);
        }
    });
};

export const useDeletePartyBankAccount = (partyId) => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    const { closeModal } = useUIManager();

    return useMutation({
        mutationKey: ["deletePartyBankAccount", partyId],
        mutationFn: (bankAccountId) => deletePartyBankAccount(partyId, bankAccountId),
        onSuccess: (res) => {
            dispatch(clearLoading());
            closeModal();
            toast.success(res?.message || "Bank account deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["partyBankAccounts", partyId] });
        },
        onError: (error) => {
            dispatch(clearLoading());
            const message = error?.response?.data?.message || error?.message || "Failed to delete bank account.";
            toast.error(message);
        }
    });
};
