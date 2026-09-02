import { useState, useEffect, useRef } from "react";
import { useWatch } from "react-hook-form";
import { findDbStateByGstCode } from "../../../utilities/gstStateHelper";

/**
 * Custom hook to manage Party selection and live Billing -> Shipping address synchronization
 */
export const usePartyAddressSync = ({ setValue, getValues, control, billingStates = [], billingCities = [], shippingCities = [] }) => {
    const [sameAsBilling, setSameAsBilling] = useState(false);
    const pendingBillingCityIdRef = useRef(null);
    const pendingShippingCityIdRef = useRef(null);

    const [
        selectedBillingState,
        selectedShippingState,
        billingAddress1,
        billingPhone,
        billingEmail,
        billingPincode,
        billingCityId
    ] = useWatch({
        control,
        name: [
            "billingAddress.stateId",
            "shippingAddress.stateId",
            "billingAddress.addressLine1",
            "billingAddress.phoneNumber",
            "billingAddress.email",
            "billingAddress.pincode",
            "billingAddress.cityId"
        ]
    });

    // Sync Shipping Address when "Same as Billing" toggle is clicked
    const handleSameAsBillingChange = (checked) => {
        setSameAsBilling(checked);
        if (checked) {
            const billing = getValues("billingAddress") || {};
            setValue("shippingAddress.addressLine1", billing.addressLine1 || "", { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.phoneNumber", billing.phoneNumber || "", { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.email", billing.email || "", { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.stateId", billing.stateId ? Number(billing.stateId) : null, { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.cityId", billing.cityId ? Number(billing.cityId) : null, { shouldValidate: false, shouldDirty: true });
            setValue("shippingAddress.pincode", billing.pincode ? String(billing.pincode) : "", { shouldValidate: false, shouldDirty: true });
        }
    };

    // Sync live updates from billing to shipping ONLY when sameAsBilling is active and values differ
    useEffect(() => {
        if (!sameAsBilling) return;

        const currentShipping = getValues("shippingAddress") || {};
        const bAddr = billingAddress1 || "";
        const bPhone = billingPhone || "";
        const bEmail = billingEmail || "";
        const bState = selectedBillingState ? Number(selectedBillingState) : null;
        const bCity = billingCityId ? Number(billingCityId) : null;
        const bPin = billingPincode ? String(billingPincode) : "";

        if (currentShipping.addressLine1 !== bAddr) {
            setValue("shippingAddress.addressLine1", bAddr, { shouldValidate: false, shouldDirty: true });
        }
        if (currentShipping.phoneNumber !== bPhone) {
            setValue("shippingAddress.phoneNumber", bPhone, { shouldValidate: false, shouldDirty: true });
        }
        if (currentShipping.email !== bEmail) {
            setValue("shippingAddress.email", bEmail, { shouldValidate: false, shouldDirty: true });
        }
        if (Number(currentShipping.stateId || 0) !== Number(bState || 0)) {
            setValue("shippingAddress.stateId", bState, { shouldValidate: false, shouldDirty: true });
        }
        if (Number(currentShipping.cityId || 0) !== Number(bCity || 0)) {
            setValue("shippingAddress.cityId", bCity, { shouldValidate: false, shouldDirty: true });
        }
        if (String(currentShipping.pincode || "") !== bPin) {
            setValue("shippingAddress.pincode", bPin, { shouldValidate: false, shouldDirty: true });
        }
    }, [
        sameAsBilling,
        billingAddress1,
        billingPhone,
        billingEmail,
        selectedBillingState,
        billingCityId,
        billingPincode,
        setValue,
        getValues
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

    const handlePartySelect = (party) => {
        if (!party) return;
        const chosenName = party.displayName || party.legalName || "";
        setValue("customerName", chosenName, { shouldValidate: true, shouldDirty: true });

        const partyHasGst = Boolean(party.gstRegistered && party.gstin);
        setValue("hasGst", partyHasGst, { shouldValidate: true, shouldDirty: true });
        setValue("gstNumber", party.gstin || "", { shouldValidate: true, shouldDirty: true });

        // Resolve real DB state ID from party GSTIN if party address has no state
        let derivedPartyDbStateId = null;
        if (party.gstin && String(party.gstin).length >= 2) {
            const code = String(party.gstin).substring(0, 2);
            const foundDbState = findDbStateByGstCode(code, billingStates);
            if (foundDbState?.id) {
                derivedPartyDbStateId = Number(foundDbState.id);
            }
        }

        // Billing Address resolution
        const bAddr = party.billingAddress || null;
        const bStateId = bAddr?.stateId
            ? Number(bAddr.stateId)
            : (derivedPartyDbStateId || null);
        const bCityId = bAddr?.cityId ? Number(bAddr.cityId) : null;
        const bPincode = bAddr?.pincode ? String(bAddr.pincode) : "";
        const bAddressLine1 = bAddr?.address || "";
        const bPhone = bAddr?.phoneNumber || party.mobile || "";
        const bEmail = bAddr?.email || party.email || "";
        const bWebsite = bAddr?.website || party.website || "";

        pendingBillingCityIdRef.current = bCityId;

        setValue("billingAddress.addressLine1", bAddressLine1, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.phoneNumber", bPhone, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.email", bEmail, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.website", bWebsite, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.stateId", bStateId, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.cityId", bCityId, { shouldValidate: true, shouldDirty: true });
        setValue("billingAddress.pincode", bPincode, { shouldValidate: true, shouldDirty: true });

        // Shipping Address resolution
        const sAddr = (sameAsBilling || !party.shippingAddress) ? bAddr : party.shippingAddress;
        const sStateId = sAddr?.stateId ? Number(sAddr.stateId) : bStateId;
        const sCityId = sAddr?.cityId ? Number(sAddr.cityId) : bCityId;
        const sPincode = sAddr?.pincode ? String(sAddr.pincode) : bPincode;
        const sAddressLine1 = sAddr?.address || bAddressLine1;
        const sPhone = sAddr?.phoneNumber || party.mobile || "";
        const sEmail = sAddr?.email || party.email || "";

        pendingShippingCityIdRef.current = sCityId;

        setValue("shippingAddress.addressLine1", sAddressLine1, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.phoneNumber", sPhone, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.email", sEmail, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.stateId", sStateId, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.cityId", sCityId, { shouldValidate: true, shouldDirty: true });
        setValue("shippingAddress.pincode", sPincode, { shouldValidate: true, shouldDirty: true });
    };

    return {
        sameAsBilling,
        handleSameAsBillingChange,
        handlePartySelect
    };
};

export default usePartyAddressSync;
