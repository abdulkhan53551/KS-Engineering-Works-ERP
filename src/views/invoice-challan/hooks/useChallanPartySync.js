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
 * Custom hook to manage consignee/party selection, multi-branch resolution,
 * and live delivery address synchronization for Delivery Challan.
 */
export const useChallanPartySync = ({
    setValue,
    getValues,
    initialPartyId = null,
    initialPartyBranchId = null,
    isEditMode = false
}) => {
    const [selectedParty, setSelectedParty] = useState(null);
    const [partyBranches, setPartyBranches] = useState([]);
    const [selectedBranchId, setSelectedBranchId] = useState(initialPartyBranchId ? Number(initialPartyBranchId) : null);
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

                        if (initialPartyBranchId) {
                            setSelectedBranchId(Number(initialPartyBranchId));
                        } else if (branches.length > 0) {
                            const def = branches.find(b => b.isDefault || b.isHeadOffice) || branches[0];
                            setSelectedBranchId(def.id);
                            setValue('partyBranchId', def.id, { shouldDirty: false });
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

    // 2. Select a branch and update address
    const handleSelectBranch = useCallback((branchId) => {
        if (!branchId) return;
        const bId = Number(branchId);
        setSelectedBranchId(bId);
        setValue('partyBranchId', bId, { shouldDirty: true, shouldValidate: true });

        const targetBranch = partyBranches.find(b => Number(b.id) === bId);
        if (targetBranch) {
            const formatted = formatBranchAddress(targetBranch);
            if (formatted) {
                setValue('deliveryAddress', formatted, { shouldDirty: true, shouldValidate: true });
            }
        }
    }, [partyBranches, setValue]);

    // 3. Handle Party selection from Autocomplete
    const handlePartySelect = useCallback(async (party) => {
        if (!party) return;
        const pId = party.id ? Number(party.id) : null;
        const custName = party.legalName || party.displayName || party.legal_name || party.display_name || '';

        setValue('partyId', pId, { shouldValidate: true, shouldDirty: true });
        setValue('customerName', custName, { shouldValidate: true, shouldDirty: true });

        // Helper to apply branches to form
        const applyBranches = (branchesList) => {
            const branches = Array.isArray(branchesList) ? branchesList : [];
            setPartyBranches(branches);

            if (branches.length > 0) {
                const defaultBranch = branches.find(b => b.isDefault || b.isHeadOffice) || branches[0];
                setSelectedBranchId(defaultBranch.id);
                setValue('partyBranchId', defaultBranch.id, { shouldDirty: true, shouldValidate: true });

                const formatted = formatBranchAddress(defaultBranch);
                if (formatted) {
                    setValue('deliveryAddress', formatted, { shouldDirty: true, shouldValidate: true });
                }
            } else {
                setSelectedBranchId(null);
                setValue('partyBranchId', null, { shouldDirty: true });

                // Direct address fallback if any
                const fallbackAddr = party.address || party.billingAddress?.address || '';
                if (fallbackAddr) {
                    setValue('deliveryAddress', fallbackAddr, { shouldDirty: true, shouldValidate: true });
                }
            }
        };

        // If party already contains branches
        if (Array.isArray(party.branches) && party.branches.length > 0) {
            setSelectedParty(party);
            applyBranches(party.branches);
        } else if (pId) {
            // Asynchronously fetch full party details if branches missing from summary
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
            setSelectedBranchId(null);
            setValue('partyBranchId', null, { shouldDirty: true });
        }
    }, [setValue]);

    // 4. Handle Clear Party
    const handleClearParty = useCallback(() => {
        setSelectedParty(null);
        setPartyBranches([]);
        setSelectedBranchId(null);
        setValue('partyId', null, { shouldDirty: true });
        setValue('partyBranchId', null, { shouldDirty: true });
        setValue('customerName', '', { shouldValidate: true, shouldDirty: true });
        setValue('deliveryAddress', '', { shouldDirty: true });
    }, [setValue]);

    // 5. Handle Detach Party (convert to custom manual consignee)
    const handleDetachParty = useCallback(() => {
        setSelectedParty(null);
        setPartyBranches([]);
        setSelectedBranchId(null);
        setValue('partyId', null, { shouldDirty: true });
        setValue('partyBranchId', null, { shouldDirty: true });
    }, [setValue]);

    return {
        selectedParty,
        partyBranches,
        selectedBranchId,
        isLoadingBranches,
        handleSelectBranch,
        handlePartySelect,
        handleClearParty,
        handleDetachParty
    };
};

export default useChallanPartySync;
