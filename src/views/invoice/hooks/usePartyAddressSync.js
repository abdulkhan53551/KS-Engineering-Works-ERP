import { useState, useEffect } from "react";
import { useWatch } from "react-hook-form";

/**
 * Custom hook to manage Party selection and live Billing -> Shipping address synchronization
 */
export const usePartyAddressSync = ({ setValue, getValues, control }) => {
    const [sameAsBilling, setSameAsBilling] = useState(false);

    const [
        selectedBillingState,
        billingAddress1,
        billingPhone,
        billingEmail,
        billingPincode,
        billingCityId
    ] = useWatch({
        control,
        name: [
            "billingAddress.stateId",
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

    const handlePartySelect = (party) => {
        if (!party) return;
        const chosenName = party.displayName || party.legalName || "";
        setValue("customerName", chosenName, { shouldValidate: true, shouldDirty: true });

        const partyHasGst = Boolean(party.gstRegistered && party.gstin);
        setValue("hasGst", partyHasGst, { shouldValidate: true, shouldDirty: true });
        setValue("gstNumber", party.gstin || "", { shouldValidate: true, shouldDirty: true });

        if (party.billingAddress) {
            setValue("billingAddress.addressLine1", party.billingAddress.address || "", { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.phoneNumber", party.mobile || "", { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.email", party.email || "", { shouldValidate: true, shouldDirty: true });
            setValue("billingAddress.website", party.website || "", { shouldValidate: true, shouldDirty: true });
            if (party.billingAddress.stateId) {
                setValue("billingAddress.stateId", Number(party.billingAddress.stateId), { shouldValidate: true, shouldDirty: true });
            }
            if (party.billingAddress.cityId) {
                setValue("billingAddress.cityId", Number(party.billingAddress.cityId), { shouldValidate: true, shouldDirty: true });
            }
            if (party.billingAddress.pincode) {
                setValue("billingAddress.pincode", String(party.billingAddress.pincode), { shouldValidate: true, shouldDirty: true });
            }
        } else {
            if (party.mobile) setValue("billingAddress.phoneNumber", party.mobile, { shouldValidate: true, shouldDirty: true });
            if (party.email) setValue("billingAddress.email", party.email, { shouldValidate: true, shouldDirty: true });
            if (party.website) setValue("billingAddress.website", party.website, { shouldValidate: true, shouldDirty: true });
        }

        const shippingSource = (sameAsBilling || !party.shippingAddress) ? party.billingAddress : party.shippingAddress;
        if (shippingSource) {
            setValue("shippingAddress.addressLine1", shippingSource.address || "", { shouldValidate: true, shouldDirty: true });
            setValue("shippingAddress.phoneNumber", party.mobile || "", { shouldValidate: true, shouldDirty: true });
            setValue("shippingAddress.email", party.email || "", { shouldValidate: true, shouldDirty: true });
            if (shippingSource.stateId) {
                setValue("shippingAddress.stateId", Number(shippingSource.stateId), { shouldValidate: true, shouldDirty: true });
            }
            if (shippingSource.cityId) {
                setValue("shippingAddress.cityId", Number(shippingSource.cityId), { shouldValidate: true, shouldDirty: true });
            }
            if (shippingSource.pincode) {
                setValue("shippingAddress.pincode", String(shippingSource.pincode), { shouldValidate: true, shouldDirty: true });
            }
        } else {
            if (party.mobile) setValue("shippingAddress.phoneNumber", party.mobile, { shouldValidate: true, shouldDirty: true });
            if (party.email) setValue("shippingAddress.email", party.email, { shouldValidate: true, shouldDirty: true });
        }
    };

    return {
        sameAsBilling,
        handleSameAsBillingChange,
        handlePartySelect
    };
};

export default usePartyAddressSync;
