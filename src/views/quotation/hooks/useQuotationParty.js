import { useCallback } from 'react';
import { findDbStateByGstCode, formatPlaceOfSupplyDisplay, GST_STATE_DATA } from '../../../utilities/gstStateHelper';

/**
 * Custom hook to handle Party / Customer selection, auto-filling branches, GST, contacts, and address.
 * 
 * @param {Object} params
 * @param {Function} params.setValue
 * @param {Array} params.billingStates
 * @returns {{ handlePartySelect: Function, handleClearParty: Function, handleDetachParty: Function }}
 */
export const useQuotationParty = ({ setValue, billingStates = [] }) => {
    // Party selection auto-fill via PartyAutocompleteInput
    const handlePartySelect = useCallback((party) => {
        if (!party || !setValue) return;
        setValue('partyId', party.id || null, { shouldDirty: true });
        const name = party.legalName || party.displayName || party.party_name || party.company_name || '';
        setValue('customerName', name, { shouldValidate: true, shouldDirty: true });

        const defaultBranch = Array.isArray(party.branches) && party.branches.length > 0
            ? (party.branches.find(b => b.isDefault || b.isHeadOffice) || party.branches[0])
            : null;

        const gst = (party.gstin || defaultBranch?.gstin || '').trim();
        if (gst) {
            setValue('hasGst', true, { shouldValidate: true, shouldDirty: true });
            setValue('gstNumber', gst.toUpperCase(), { shouldValidate: true, shouldDirty: true });
            if (gst.length >= 2) {
                const stateCode = gst.substring(0, 2);
                const dbState = findDbStateByGstCode(stateCode, billingStates);
                const posStateName = dbState?.name || GST_STATE_DATA[stateCode]?.name;
                setValue('placeOfSupply', formatPlaceOfSupplyDisplay(posStateName, stateCode), { shouldValidate: true, shouldDirty: true });
            }
        } else {
            setValue('hasGst', false, { shouldValidate: true, shouldDirty: true });
            setValue('gstNumber', '', { shouldValidate: true, shouldDirty: true });
        }

        const defaultContact = Array.isArray(party.contacts) && party.contacts.length > 0
            ? (party.contacts.find(c => c.isPrimary) || party.contacts[0])
            : null;

        setValue('contactPerson', defaultContact?.name || party.contact_person || party.primaryContactName || '', { shouldDirty: true });
        setValue('contactPhone', defaultContact?.phoneNumber || party.phone_number || party.mobile || '', { shouldDirty: true });
        setValue('contactEmail', defaultContact?.email || party.email || '', { shouldDirty: true });

        let addr = '';
        if (defaultBranch) {
            const parts = [
                defaultBranch.addressLine1 || defaultBranch.address,
                defaultBranch.addressLine2,
                defaultBranch.cityName || defaultBranch.city?.name,
                defaultBranch.stateName || defaultBranch.state?.name,
                defaultBranch.pincode
            ].filter(Boolean);
            addr = parts.join(', ');
        } else if (party.billingAddress) {
            if (typeof party.billingAddress === 'string') {
                addr = party.billingAddress;
            } else {
                const parts = [
                    party.billingAddress.addressLine1 || party.billingAddress.address,
                    party.billingAddress.cityName || party.billingAddress.city?.name,
                    party.billingAddress.stateName || party.billingAddress.state?.name,
                    party.billingAddress.pincode
                ].filter(Boolean);
                addr = parts.join(', ');
            }
        }
        setValue('billingAddress', addr, { shouldDirty: true });
    }, [setValue, billingStates]);

    const handleClearParty = useCallback(() => {
        if (!setValue) return;
        setValue('partyId', null, { shouldDirty: true });
        setValue('customerName', '', { shouldValidate: true, shouldDirty: true });
        setValue('hasGst', false, { shouldDirty: true });
        setValue('gstNumber', '', { shouldDirty: true });
        setValue('contactPerson', '', { shouldDirty: true });
        setValue('contactPhone', '', { shouldDirty: true });
        setValue('contactEmail', '', { shouldDirty: true });
        setValue('billingAddress', '', { shouldDirty: true });
    }, [setValue]);

    const handleDetachParty = useCallback(() => {
        if (!setValue) return;
        setValue('partyId', null, { shouldValidate: true, shouldDirty: true });
    }, [setValue]);

    return {
        handlePartySelect,
        handleClearParty,
        handleDetachParty
    };
};

export default useQuotationParty;
