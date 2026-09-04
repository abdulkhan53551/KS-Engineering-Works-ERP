import { useState, useEffect, useRef, useCallback } from "react";
import { useWatch } from "react-hook-form";
import { findDbStateByGstCode } from "../../../utilities/gstStateHelper";

/**
 * Custom hook to manage Party selection, Multi-Branch resolution, and dynamic
 * Billing -> Shipping address synchronization and Place of Supply / Tax switching.
 */
export const usePartyAddressSync = ({
    setValue,
    getValues,
    control,
    clearErrors,
    billingStates = [],
    billingCities = [],
    shippingCities = [],
    isEditMode = false
}) => {
    // Shipping Mode: 'SAME_AS_BILLING' | 'OTHER_BRANCH' | 'CUSTOM_SITE'
    const [shippingMode, setShippingMode] = useState('SAME_AS_BILLING');
    const [selectedParty, setSelectedParty] = useState(null);
    const [partyBranches, setPartyBranches] = useState([]);
    const [selectedBillingBranchId, setSelectedBillingBranchId] = useState(null);
    const [selectedShippingBranchId, setSelectedShippingBranchId] = useState(null);

    const pendingBillingCityIdRef = useRef(null);
    const pendingShippingCityIdRef = useRef(null);
    const hasHydratedShippingModeRef = useRef(!isEditMode);
    const selectedPartyRef = useRef(selectedParty);

    useEffect(() => {
        selectedPartyRef.current = selectedParty;
    }, [selectedParty]);

    const sameAsBilling = shippingMode === 'SAME_AS_BILLING';

    const [
        selectedBillingState,
        selectedShippingState,
        billingAddress1,
        billingPhone,
        billingEmail,
        billingPincode,
        billingCityId,
        billingBranchName,
        billingGstin
    ] = useWatch({
        control,
        name: [
            "billingAddress.stateId",
            "shippingAddress.stateId",
            "billingAddress.addressLine1",
            "billingAddress.phoneNumber",
            "billingAddress.email",
            "billingAddress.pincode",
            "billingAddress.cityId",
            "billingAddress.branchName",
            "billingAddress.gstin"
        ]
    });

    // Helper to copy billing address to shipping address
    const syncBillingToShipping = useCallback(() => {
        const billing = getValues("billingAddress") || {};
        setValue("shippingAddress.branchName", billing.branchName || "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.gstin", billing.gstin || "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.addressLine1", billing.addressLine1 || "", { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.phoneNumber", billing.phoneNumber || "", { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.email", billing.email || "", { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.stateId", billing.stateId ? Number(billing.stateId) : null, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.cityId", billing.cityId ? Number(billing.cityId) : null, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.pincode", billing.pincode ? String(billing.pincode) : "", { shouldValidate: true, shouldDirty: true });

        if (clearErrors) {
            if (billing.addressLine1) clearErrors("shippingAddress.addressLine1");
            if (billing.stateId) clearErrors("shippingAddress.stateId");
            if (billing.cityId) clearErrors("shippingAddress.cityId");
            if (billing.pincode) clearErrors("shippingAddress.pincode");
        }
    }, [getValues, setValue, clearErrors]);

    // Helper: Apply a branch object to Shipping Address form fields
    const applyBranchToShipping = useCallback((branch, party) => {
        if (!branch) return;

        const activeParty = party || selectedPartyRef.current;
        const sAddr = branch.shippingAddress || branch.billingAddress || (typeof branch.address === 'object' ? branch.address : null);
        const addressText = typeof branch.address === 'string' ? branch.address : (sAddr?.address || "");
        const stateId = Number(branch.stateId || sAddr?.stateId || 0) || null;
        const cityId = Number(branch.cityId || sAddr?.cityId || 0) || null;
        const pincode = String(branch.pincode || sAddr?.pincode || "");
        const phone = branch.mobile || branch.phoneNumber || sAddr?.phoneNumber || activeParty?.mobile || "";
        const email = branch.email || sAddr?.email || activeParty?.email || "";
        const branchGstin = (branch.gstin || activeParty?.gstin || "").trim();

        pendingShippingCityIdRef.current = cityId;

        setValue("shippingAddress.branchName", branch.branchName || "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.gstin", branchGstin, { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.addressLine1", addressText, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.phoneNumber", phone, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.email", email, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.stateId", stateId, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.cityId", cityId, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.pincode", pincode, { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    // Handle Shipping Mode Toggle
    const handleShippingModeChange = useCallback((mode) => {
        setShippingMode(mode);
        if (mode === 'SAME_AS_BILLING') {
            setSelectedShippingBranchId(selectedBillingBranchId);
            syncBillingToShipping();
        } else if (mode === 'OTHER_BRANCH') {
            // Default to other branch if available
            const otherBranch = partyBranches.find(b => Number(b.id) !== Number(selectedBillingBranchId)) || partyBranches[0];
            if (otherBranch) {
                setSelectedShippingBranchId(Number(otherBranch.id));
                applyBranchToShipping(otherBranch, selectedParty || selectedPartyRef.current);
            }
        } else if (mode === 'CUSTOM_SITE') {
            setSelectedShippingBranchId(null);
            setValue("shippingAddress.branchName", "", { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.gstin", "", { shouldValidate: false, shouldDirty: true });
        }
    }, [selectedBillingBranchId, partyBranches, selectedParty, syncBillingToShipping, applyBranchToShipping, setValue]);

    // Legacy handler for backward compatibility
    const handleSameAsBillingChange = useCallback((checked) => {
        handleShippingModeChange(checked ? 'SAME_AS_BILLING' : 'CUSTOM_SITE');
    }, [handleShippingModeChange]);

    // Live sync from billing to shipping ONLY when in SAME_AS_BILLING mode
    useEffect(() => {
        if (!sameAsBilling) return;
        // In edit/duplicate mode, do not run live-sync until shipping mode has been hydrated
        if (isEditMode && !hasHydratedShippingModeRef.current) return;

        const currentShipping = getValues("shippingAddress") || {};
        const bAddr = billingAddress1 || "";
        const bPhone = billingPhone || "";
        const bEmail = billingEmail || "";
        const bState = selectedBillingState ? Number(selectedBillingState) : null;
        const bCity = billingCityId ? Number(billingCityId) : null;
        const bPin = billingPincode ? String(billingPincode) : "";
        const bBranch = billingBranchName || "";
        const bGstin = billingGstin || "";

        if (currentShipping.branchName !== bBranch) {
            setValue("shippingAddress.branchName", bBranch, { shouldValidate: false, shouldDirty: true });
        }
        if (currentShipping.gstin !== bGstin) {
            setValue("shippingAddress.gstin", bGstin, { shouldValidate: false, shouldDirty: true });
        }
        if (currentShipping.addressLine1 !== bAddr) {
            setValue("shippingAddress.addressLine1", bAddr, { shouldValidate: true, shouldDirty: true });
            if (bAddr && clearErrors) clearErrors("shippingAddress.addressLine1");
        }
        if (currentShipping.phoneNumber !== bPhone) {
            setValue("shippingAddress.phoneNumber", bPhone, { shouldValidate: true, shouldDirty: true });
            if (bPhone && clearErrors) clearErrors("shippingAddress.phoneNumber");
        }
        if (currentShipping.email !== bEmail) {
            setValue("shippingAddress.email", bEmail, { shouldValidate: true, shouldDirty: true });
            if (bEmail && clearErrors) clearErrors("shippingAddress.email");
        }
        if (Number(currentShipping.stateId || 0) !== Number(bState || 0)) {
            setValue("shippingAddress.stateId", bState, { shouldValidate: true, shouldDirty: true });
            if (bState && clearErrors) clearErrors("shippingAddress.stateId");
        }
        if (Number(currentShipping.cityId || 0) !== Number(bCity || 0)) {
            setValue("shippingAddress.cityId", bCity, { shouldValidate: true, shouldDirty: true });
            if (bCity && clearErrors) clearErrors("shippingAddress.cityId");
        }
        if (String(currentShipping.pincode || "") !== bPin) {
            setValue("shippingAddress.pincode", bPin, { shouldValidate: true, shouldDirty: true });
            if (bPin && clearErrors) clearErrors("shippingAddress.pincode");
        }
    }, [
        sameAsBilling,
        isEditMode,
        billingAddress1,
        billingPhone,
        billingEmail,
        selectedBillingState,
        billingCityId,
        billingPincode,
        billingBranchName,
        billingGstin,
        setValue,
        getValues,
        clearErrors
    ]);

    // Asynchronously re-apply billing city once cities arrive for the selected state
    useEffect(() => {
        const targetCityId = pendingBillingCityIdRef.current || getValues("billingAddress.cityId");
        if (!targetCityId || !billingCities || billingCities.length === 0) return;

        const cityExists = billingCities.some((c) => Number(c.id || c.cityId) === Number(targetCityId));
        if (cityExists) {
            setValue("billingAddress.cityId", Number(targetCityId), { shouldValidate: true, shouldDirty: true });
            pendingBillingCityIdRef.current = null;
        }
    }, [billingCities, selectedBillingState, setValue, getValues]);

    // Asynchronously re-apply shipping city once cities arrive for the selected state
    useEffect(() => {
        const targetCityId = pendingShippingCityIdRef.current || getValues("shippingAddress.cityId");
        if (!targetCityId || !shippingCities || shippingCities.length === 0) return;

        const cityExists = shippingCities.some((c) => Number(c.id || c.cityId) === Number(targetCityId));
        if (cityExists) {
            setValue("shippingAddress.cityId", Number(targetCityId), { shouldValidate: true, shouldDirty: true });
            pendingShippingCityIdRef.current = null;
        }
    }, [shippingCities, selectedShippingState, setValue, getValues]);

    // Helper: Apply a branch object to Billing Address form fields
    const applyBranchToBilling = useCallback((branch, party) => {
        if (!branch) return;

        const activeParty = party || selectedPartyRef.current;
        const bAddr = branch.billingAddress || (typeof branch.address === 'object' ? branch.address : null);
        const addressText = typeof branch.address === 'string' ? branch.address : (bAddr?.address || "");
        const stateId = Number(branch.stateId || bAddr?.stateId || 0) || null;
        const cityId = Number(branch.cityId || bAddr?.cityId || 0) || null;
        const pincode = String(branch.pincode || bAddr?.pincode || "");
        const phone = branch.mobile || branch.phoneNumber || bAddr?.phoneNumber || activeParty?.mobile || "";
        const email = branch.email || bAddr?.email || activeParty?.email || "";
        
        // Resolve GSTIN: Branch specific GSTIN > Party primary GSTIN
        const effectiveGstin = (branch.gstin || activeParty?.gstin || "").trim();
        const hasGstFlag = Boolean(effectiveGstin);

        pendingBillingCityIdRef.current = cityId;

        setValue("branchId", Number(branch.id), { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.branchName", branch.branchName || "", { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.gstin", effectiveGstin, { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.addressLine1", addressText, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.phoneNumber", phone, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.email", email, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.stateId", stateId, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.cityId", cityId, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.pincode", pincode, { shouldValidate: true, shouldDirty: true });

        // Update overall invoice GST info from branch or party
        setValue("hasGst", hasGstFlag, { shouldValidate: true, shouldDirty: true });
        setValue("gstNumber", effectiveGstin, { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    // Handler when user selects a different Billing Branch from dropdown
    const handleSelectBillingBranch = useCallback((branchId) => {
        const branch = partyBranches.find(b => Number(b.id) === Number(branchId));
        if (!branch) return;

        const activeParty = selectedParty || selectedPartyRef.current;
        setSelectedBillingBranchId(Number(branch.id));
        applyBranchToBilling(branch, activeParty);

        if (sameAsBilling) {
            setSelectedShippingBranchId(Number(branch.id));
            applyBranchToShipping(branch, activeParty);
            syncBillingToShipping();
        }
    }, [partyBranches, selectedParty, applyBranchToBilling, applyBranchToShipping, sameAsBilling, syncBillingToShipping]);

    // Handler when user selects a different Shipping Branch from dropdown
    const handleSelectShippingBranch = useCallback((branchId) => {
        const branch = partyBranches.find(b => Number(b.id) === Number(branchId));
        if (!branch) return;

        const activeParty = selectedParty || selectedPartyRef.current;
        setSelectedShippingBranchId(Number(branch.id));
        applyBranchToShipping(branch, activeParty);
    }, [partyBranches, selectedParty, applyBranchToShipping]);

    // Main Party Select Callback (called by PartyAutocompleteInput)
    const handlePartySelect = useCallback((party) => {
        if (!party) return;

        const chosenName = party.displayName || party.legalName || "";
        setValue("customerName", chosenName, { shouldValidate: true, shouldDirty: true });
        setValue("partyId", Number(party.id), { shouldValidate: true, shouldDirty: true });

        setSelectedParty(party);

        const branches = Array.isArray(party.branches) ? party.branches : [];
        setPartyBranches(branches);

        // Always reset shipping mode to SAME_AS_BILLING when switching to a new party
        setShippingMode('SAME_AS_BILLING');

        // Resolve default branch: party.defaultBranch || branch where isDefault=true || first branch
        const defaultBranch = party.defaultBranch || branches.find(b => b.isDefault) || branches[0] || null;

        if (defaultBranch) {
            setSelectedBillingBranchId(Number(defaultBranch.id));
            setSelectedShippingBranchId(Number(defaultBranch.id));
            applyBranchToBilling(defaultBranch, party);
            applyBranchToShipping(defaultBranch);
        } else {
            // Fallback for parties without branches (backward compatibility)
            setSelectedBillingBranchId(null);
            setSelectedShippingBranchId(null);
            setValue("branchId", null, { shouldValidate: false, shouldDirty: true });

            const partyHasGst = Boolean(party.gstRegistered && party.gstin);
            setValue("hasGst", partyHasGst, { shouldValidate: true, shouldDirty: true });
            setValue("gstNumber", party.gstin || "", { shouldValidate: true, shouldDirty: true });

            let derivedPartyDbStateId = null;
            if (party.gstin && String(party.gstin).length >= 2) {
                const code = String(party.gstin).substring(0, 2);
                const foundDbState = findDbStateByGstCode(code, billingStates);
                if (foundDbState?.id) {
                    derivedPartyDbStateId = Number(foundDbState.id);
                }
            }

            const bAddr = party.billingAddress || null;
            const bStateId = bAddr?.stateId ? Number(bAddr.stateId) : (derivedPartyDbStateId || null);
            const bCityId = bAddr?.cityId ? Number(bAddr.cityId) : null;
            const bPincode = bAddr?.pincode ? String(bAddr.pincode) : "";
            const bAddressLine1 = bAddr?.address || "";
            const bPhone = bAddr?.phoneNumber || party.mobile || "";
            const bEmail = bAddr?.email || party.email || "";
            const bWebsite = bAddr?.website || party.website || "";

            pendingBillingCityIdRef.current = bCityId;

            setValue("billingAddress.branchName", "", { shouldValidate: false, shouldDirty: true });
            setValue("billingAddress.gstin", party.gstin || "", { shouldValidate: false, shouldDirty: true });
            setValue("billingAddress.addressLine1", bAddressLine1, { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.phoneNumber", bPhone, { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.email", bEmail, { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.website", bWebsite, { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.stateId", bStateId, { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.cityId", bCityId, { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.pincode", bPincode, { shouldValidate: true, shouldDirty: true });

            const sAddr = (sameAsBilling || !party.shippingAddress) ? bAddr : party.shippingAddress;
            const sStateId = sAddr?.stateId ? Number(sAddr.stateId) : bStateId;
            const sCityId = sAddr?.cityId ? Number(sAddr.cityId) : bCityId;
            const sPincode = sAddr?.pincode ? String(sAddr.pincode) : bPincode;
            const sAddressLine1 = sAddr?.address || bAddressLine1;
            const sPhone = sAddr?.phoneNumber || party.mobile || "";
            const sEmail = sAddr?.email || party.email || "";

            pendingShippingCityIdRef.current = sCityId;

            setValue("shippingAddress.branchName", "", { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.gstin", party.gstin || "", { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.addressLine1", sAddressLine1, { shouldValidate: true, shouldDirty: true });
            setValue("shippingAddress.phoneNumber", sPhone, { shouldValidate: true, shouldDirty: true });
            setValue("shippingAddress.email", sEmail, { shouldValidate: true, shouldDirty: true });
            setValue("shippingAddress.stateId", sStateId, { shouldValidate: true, shouldDirty: true });
            setValue("shippingAddress.cityId", sCityId, { shouldValidate: true, shouldDirty: true });
            setValue("shippingAddress.pincode", sPincode, { shouldValidate: true, shouldDirty: true });
        }
    }, [
        setValue,
        billingStates,
        sameAsBilling,
        applyBranchToBilling,
        applyBranchToShipping
    ]);

    // Clear party association & blank out address fields when customer name is erased or custom typed
    const handleClearParty = useCallback(() => {
        setSelectedParty(null);
        setPartyBranches([]);
        setSelectedBillingBranchId(null);
        setSelectedShippingBranchId(null);
        setShippingMode('SAME_AS_BILLING');

        pendingBillingCityIdRef.current = null;
        pendingShippingCityIdRef.current = null;

        // Clear party & branch relational pointers
        setValue("partyId", null, { shouldValidate: false, shouldDirty: true });
        setValue("branchId", null, { shouldValidate: false, shouldDirty: true });

        // Reset GST
        setValue("hasGst", false, { shouldValidate: false, shouldDirty: true });
        setValue("gstNumber", "", { shouldValidate: false, shouldDirty: true });

        // Clear Billing Address fields
        setValue("billingAddress.branchName", "", { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.gstin", "", { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.addressLine1", "", { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.phoneNumber", "", { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.email", "", { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.website", "", { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.stateId", null, { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.cityId", null, { shouldValidate: false, shouldDirty: true });
        setValue("billingAddress.pincode", "", { shouldValidate: false, shouldDirty: true });

        // Clear Shipping Address fields
        setValue("shippingAddress.branchName", "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.gstin", "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.addressLine1", "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.phoneNumber", "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.email", "", { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.stateId", null, { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.cityId", null, { shouldValidate: false, shouldDirty: true });
        setValue("shippingAddress.pincode", "", { shouldValidate: false, shouldDirty: true });

        if (clearErrors) {
            clearErrors(["billingAddress", "shippingAddress", "partyId", "branchId", "customerName", "gstNumber"]);
        }
    }, [setValue, clearErrors]);

    // Detach party database association without erasing already filled address fields
    const handleDetachParty = useCallback(() => {
        if (selectedParty || getValues("partyId")) {
            setSelectedParty(null);
            setPartyBranches([]);
            setSelectedBillingBranchId(null);
            setSelectedShippingBranchId(null);
            setShippingMode('SAME_AS_BILLING');
            setValue("partyId", null, { shouldValidate: true, shouldDirty: true });
            setValue("branchId", null, { shouldValidate: false, shouldDirty: true });
        }
    }, [selectedParty, getValues, setValue]);

    /**
     * Resolves and restores the shipping mode and selected branch from the invoice snapshot
     * and the party's branch list.
     */
    const resolveAndApplyShippingMode = useCallback((invoiceData, branchesList = [], billingBranchId = null) => {
        if (!invoiceData) return 'SAME_AS_BILLING';

        const branches = Array.isArray(branchesList) && branchesList.length > 0 ? branchesList : partyBranches;
        const bBranchId = billingBranchId ?? selectedBillingBranchId ?? invoiceData.branch_id ?? invoiceData.branchId;

        const shipping = invoiceData.shippingAddress || {};
        const billing = invoiceData.billingAddress || {};

        const sBranchName = (invoiceData.shipping_branch_name || invoiceData.shippingBranchName || shipping.branchName || "").trim();
        const bBranchName = (invoiceData.billing_branch_name || invoiceData.billingBranchName || billing.branchName || "").trim();
        const sGstin = (invoiceData.shipping_gstin || invoiceData.shippingGstin || shipping.gstin || "").trim();

        // 1. Try to match shipping branch in party branches list
        let matchedBranch = null;
        if (sBranchName) {
            matchedBranch = branches.find(b =>
                b.branchName && b.branchName.trim().toLowerCase() === sBranchName.toLowerCase()
            );
        }
        if (!matchedBranch && (invoiceData.shipping_branch_id || invoiceData.shippingBranchId)) {
            const sId = invoiceData.shipping_branch_id || invoiceData.shippingBranchId;
            matchedBranch = branches.find(b => Number(b.id) === Number(sId));
        }
        if (!matchedBranch && sGstin) {
            matchedBranch = branches.find(b => b.gstin && b.gstin.trim().toUpperCase() === sGstin.toUpperCase());
        }

        // 2. If matched branch found
        if (matchedBranch) {
            const isSameAsBillingBranch = bBranchId
                ? Number(matchedBranch.id) === Number(bBranchId)
                : (bBranchName ? matchedBranch.branchName?.trim().toLowerCase() === bBranchName.toLowerCase() : false);

            if (!isSameAsBillingBranch && branches.length > 1) {
                // Secondary branch selected -> OTHER_BRANCH
                setShippingMode('OTHER_BRANCH');
                setSelectedShippingBranchId(Number(matchedBranch.id));
                setValue("shippingAddress.branchName", matchedBranch.branchName || "", { shouldValidate: false, shouldDirty: false });
                setValue("shippingAddress.gstin", matchedBranch.gstin || "", { shouldValidate: false, shouldDirty: false });
                hasHydratedShippingModeRef.current = true;
                return 'OTHER_BRANCH';
            } else {
                // Same branch as billing
                setShippingMode('SAME_AS_BILLING');
                setSelectedShippingBranchId(Number(matchedBranch.id));
                hasHydratedShippingModeRef.current = true;
                return 'SAME_AS_BILLING';
            }
        }

        // 3. If sBranchName exists and party has multiple branches, but branch wasn't matched exactly:
        // (e.g. slight name discrepancy)
        if (sBranchName && branches.length > 1) {
            setShippingMode('OTHER_BRANCH');
            // Try matching non-billing branch
            const otherBranch = branches.find(b => Number(b.id) !== Number(bBranchId)) || branches[0];
            if (otherBranch) {
                setSelectedShippingBranchId(Number(otherBranch.id));
            }
            setValue("shippingAddress.branchName", sBranchName, { shouldValidate: false, shouldDirty: false });
            hasHydratedShippingModeRef.current = true;
            return 'OTHER_BRANCH';
        }

        // 4. Custom Site vs Same as Billing
        const sAddr = (shipping.addressLine1 || shipping.address || (typeof invoiceData.shippingAddress === 'string' ? invoiceData.shippingAddress : "")).trim();
        const bAddr = (billing.addressLine1 || billing.address || (typeof invoiceData.billingAddress === 'string' ? invoiceData.billingAddress : "")).trim();

        if (sAddr && bAddr && sAddr !== bAddr) {
            setShippingMode('CUSTOM_SITE');
            setSelectedShippingBranchId(null);
            hasHydratedShippingModeRef.current = true;
            return 'CUSTOM_SITE';
        }

        // Fallback default
        setShippingMode('SAME_AS_BILLING');
        setSelectedShippingBranchId(bBranchId ? Number(bBranchId) : null);
        hasHydratedShippingModeRef.current = true;
        return 'SAME_AS_BILLING';
    }, [partyBranches, selectedBillingBranchId, setValue]);

    return {
        selectedParty,
        setSelectedParty,
        partyBranches,
        setPartyBranches,
        selectedBillingBranchId,
        setSelectedBillingBranchId,
        selectedShippingBranchId,
        setSelectedShippingBranchId,
        shippingMode,
        setShippingMode,
        sameAsBilling,
        handleShippingModeChange,
        handleSameAsBillingChange,
        handleSelectBillingBranch,
        handleSelectShippingBranch,
        handlePartySelect,
        handleClearParty,
        handleDetachParty,
        resolveAndApplyShippingMode
    };
};

export default usePartyAddressSync;
