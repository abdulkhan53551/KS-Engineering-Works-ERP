import { useState, useEffect, useRef, useCallback } from 'react';
import { getPartyDetailsById } from '../../party/api';

/**
 * Format a branch object into a clean, human-readable address line.
 */
export const formatBranchAddress = (branch) => {
    if (!branch) return '';
    const rawAddr = (branch.address || branch.addressLine1 || '').trim();
    const city = (branch.cityName || branch.city || '').trim();
    const state = (branch.stateName || branch.state || '').trim();
    const pincode = (branch.pincode || '').toString().trim();

    const parts = [rawAddr];
    if (city) parts.push(city);
    if (state && pincode) {
        parts.push(`${state} - ${pincode}`);
    } else if (state) {
        parts.push(state);
    } else if (pincode) {
        parts.push(pincode);
    }
    return parts.filter(Boolean).join(', ');
};

/**
 * Custom hook to manage customer party selection, multi-branch resolution,
 * and live billing/delivery address synchronization for Customer Purchase Order.
 */
export const usePoPartySync = ({
    setValue,
    getValues,
    initialPartyId = null,
    initialPartyBranchId = null,
    isEditMode = false
}) => {
    const [selectedParty, setSelectedParty] = useState(null);
    const [partyBranches, setPartyBranches] = useState([]);
    const [selectedBillingBranchId, setSelectedBillingBranchId] = useState(null);
    const [selectedDeliveryBranchId, setSelectedDeliveryBranchId] = useState(initialPartyBranchId ? Number(initialPartyBranchId) : null);
    const [isLoadingBranches, setIsLoadingBranches] = useState(false);

    // Keep track of edit-mode initial hydration
    const hasHydratedEditRef = useRef(false);

    // 1. Hydrate party branches in edit mode if initialPartyId exists
    useEffect(() => {
        if (isEditMode && initialPartyId && !hasHydratedEditRef.current) {
            hasHydratedEditRef.current = true;
            setIsLoadingBranches(true);
            getPartyDetailsById(initialPartyId)
                .then((res) => {
                    const details = res?.data ?? res;
                    if (details) {
                        setSelectedParty(details);
                        const branches = Array.isArray(details.branches) ? details.branches : [];
                        setPartyBranches(branches);

                        if (branches.length > 0) {
                            const def = branches.find(b => b.isDefault || b.isHeadOffice) || branches[0];
                            setSelectedBillingBranchId(def.id);

                            if (initialPartyBranchId) {
                                setSelectedDeliveryBranchId(Number(initialPartyBranchId));
                            } else {
                                setSelectedDeliveryBranchId(def.id);
                                setValue('partyBranchId', def.id, { shouldDirty: false });
                            }
                        }
                    }
                })
                .catch((err) => {
                    console.error('Failed to load party branches in edit mode:', err);
                })
                .finally(() => {
                    setIsLoadingBranches(false);
                });
        }
    }, [isEditMode, initialPartyId, initialPartyBranchId, setValue]);

    // 2. Select a branch and update billing address
    const handleSelectBillingBranch = useCallback((branchId) => {
        if (!branchId) return;
        const bId = Number(branchId);
        setSelectedBillingBranchId(bId);

        const targetBranch = partyBranches.find(b => Number(b.id) === bId);
        if (targetBranch) {
            const formatted = formatBranchAddress(targetBranch);
            if (formatted) {
                setValue('billingAddress', formatted, { shouldDirty: true, shouldValidate: true });
            }
        }
    }, [partyBranches, setValue]);

    // 3. Select a branch and update delivery address
    const handleSelectDeliveryBranch = useCallback((branchId) => {
        if (!branchId) return;
        const bId = Number(branchId);
        setSelectedDeliveryBranchId(bId);
        setValue('partyBranchId', bId, { shouldDirty: true, shouldValidate: true });

        const targetBranch = partyBranches.find(b => Number(b.id) === bId);
        if (targetBranch) {
            const formatted = formatBranchAddress(targetBranch);
            if (formatted) {
                setValue('deliveryAddress', formatted, { shouldDirty: true, shouldValidate: true });
            }
        }
    }, [partyBranches, setValue]);

    // Backward-compatible alias
    const handleSelectBranch = handleSelectDeliveryBranch;

    // 4. Handle Party selection from Autocomplete
    const handlePartySelect = useCallback(async (party) => {
        if (!party) return;
        const pId = party.id ? Number(party.id) : null;
        const custName = party.legalName || party.displayName || party.legal_name || party.display_name || '';

        setValue('partyId', pId, { shouldValidate: true, shouldDirty: true });
        setValue('customerName', custName, { shouldValidate: true, shouldDirty: true });

        // Auto-populate billing address from party master
        const billingAddr = party.billingAddress?.address || party.address || '';
        if (billingAddr && !getValues('billingAddress')) {
            setValue('billingAddress', billingAddr, { shouldDirty: true });
        }

        const applyBranches = (branchesList) => {
            const branches = Array.isArray(branchesList) ? branchesList : [];
            setPartyBranches(branches);

            if (branches.length > 0) {
                const defaultBranch = branches.find(b => b.isDefault || b.isHeadOffice) || branches[0];
                setSelectedBillingBranchId(defaultBranch.id);
                setSelectedDeliveryBranchId(defaultBranch.id);
                setValue('partyBranchId', defaultBranch.id, { shouldDirty: true, shouldValidate: true });

                const formatted = formatBranchAddress(defaultBranch);
                if (formatted) {
                    setValue('billingAddress', formatted, { shouldDirty: true });
                    setValue('deliveryAddress', formatted, { shouldDirty: true, shouldValidate: true });
                }
            } else {
                setSelectedBillingBranchId(null);
                setSelectedDeliveryBranchId(null);
                setValue('partyBranchId', null, { shouldDirty: true });

                const fallbackAddr = party.address || party.billingAddress?.address || '';
                if (fallbackAddr) {
                    setValue('billingAddress', fallbackAddr, { shouldDirty: true });
                    setValue('deliveryAddress', fallbackAddr, { shouldDirty: true, shouldValidate: true });
                }
            }
        };

        if (Array.isArray(party.branches) && party.branches.length > 0) {
            setSelectedParty(party);
            applyBranches(party.branches);
        } else if (pId) {
            setIsLoadingBranches(true);
            try {
                const res = await getPartyDetailsById(pId);
                const fullDetails = res?.data ?? res ?? party;
                setSelectedParty(fullDetails);
                applyBranches(fullDetails.branches || []);
            } catch (err) {
                console.error('Failed to load party details:', err);
                applyBranches([]);
            } finally {
                setIsLoadingBranches(false);
            }
        } else {
            setPartyBranches([]);
            setSelectedBillingBranchId(null);
            setSelectedDeliveryBranchId(null);
            setValue('partyBranchId', null, { shouldDirty: true });
        }
    }, [setValue, getValues]);

    // 5. Clear party
    const handleClearParty = useCallback(() => {
        setSelectedParty(null);
        setPartyBranches([]);
        setSelectedBillingBranchId(null);
        setSelectedDeliveryBranchId(null);
        setValue('partyId', null, { shouldDirty: true, shouldValidate: true });
        setValue('partyBranchId', null, { shouldDirty: true });
        setValue('customerName', '', { shouldDirty: true, shouldValidate: true });
        setValue('billingAddress', '', { shouldDirty: true });
        setValue('deliveryAddress', '', { shouldDirty: true });
    }, [setValue]);

    // 6. Detach party
    const handleDetachParty = useCallback(() => {
        setSelectedParty(null);
        setPartyBranches([]);
        setSelectedBillingBranchId(null);
        setSelectedDeliveryBranchId(null);
        setValue('partyId', null, { shouldDirty: true, shouldValidate: true });
        setValue('partyBranchId', null, { shouldDirty: true });
    }, [setValue]);

    return {
        selectedParty,
        partyBranches,
        selectedBranchId: selectedDeliveryBranchId,
        selectedBillingBranchId,
        selectedDeliveryBranchId,
        isLoadingBranches,
        handleSelectBranch,
        handleSelectBillingBranch,
        handleSelectDeliveryBranch,
        handlePartySelect,
        handleClearParty,
        handleDetachParty
    };
};

export default usePoPartySync;
