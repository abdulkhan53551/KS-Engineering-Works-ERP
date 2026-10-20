import { useEffect } from 'react';
import { getPartyDetailsById } from '../../party/api';
import { normalizePlaceOfSupplyDisplay } from '../../../utilities/gstStateHelper';
import { calculateQuotationRoundOffInfo } from './useQuotationCalculation';

/**
 * Custom hook to hydrate Quotation form in Edit or Duplicate mode.
 * 
 * @param {Object} params
 * @param {Object} params.quotationData
 * @param {boolean} params.isEditMode
 * @param {boolean} params.isDuplicateMode
 * @param {string} params.nextQuotationNumber
 * @param {Function} params.reset
 * @param {Function} params.setValue
 * @param {Function} params.getValues
 * @param {Function} params.setTemplateType
 * @param {Function} params.setTableSpecConfig
 * @param {Function} params.setApprovalStatus
 * @param {Function} params.setItems
 * @param {Array} params.defaultItems
 */
export const useQuotationHydrate = ({
    quotationData,
    isEditMode,
    isDuplicateMode,
    nextQuotationNumber,
    reset,
    setValue,
    getValues,
    setTemplateType,
    setTableSpecConfig,
    setApprovalStatus,
    setItems,
    defaultItems = []
}) => {
    useEffect(() => {
        if (!quotationData || (!isEditMode && !isDuplicateMode)) {
            return;
        }

        const tType = quotationData.templateType || quotationData.template_type || 'CARDS';
        if (setTemplateType) setTemplateType(tType);

        let specCfg = quotationData.tableSpecConfig || quotationData.table_spec_config || null;
        if (typeof specCfg === 'string') {
            try { specCfg = JSON.parse(specCfg); } catch (_) {}
        }
        if (setTableSpecConfig) setTableSpecConfig(specCfg);

        if (setApprovalStatus) {
            setApprovalStatus(isDuplicateMode ? 'PENDING' : (quotationData.approvalStatus || quotationData.approval_status || 'PENDING'));
        }

        const rawItems = quotationData.items || [];
        const formattedItems = (Array.isArray(rawItems) && rawItems.length > 0)
            ? rawItems.map(it => {
                let rawAnnex = it.annexureData !== undefined ? it.annexureData : it.annexure_data;
                while (typeof rawAnnex === 'string') {
                    try { rawAnnex = JSON.parse(rawAnnex); } catch (_) { break; }
                }
                return {
                    ...it,
                    id: isDuplicateMode ? undefined : it.id,
                    itemName: it.itemName || it.item_name || '',
                    drawingNumber: it.drawingNumber || it.drawing_number || '',
                    hsnSacCode: it.hsnSacCode || it.hsn_sac_code || '',
                    unit: it.unit || 'Nos',
                    annexureData: rawAnnex,
                    qty: parseFloat(it.qty || 1),
                    rate: parseFloat(it.rate || 0),
                    discountPercent: parseFloat(it.discountPercent ?? it.discount_percent ?? 0),
                    discountAmount: parseFloat(it.discountAmount ?? it.discount_amount ?? 0),
                    taxableAmount: parseFloat(it.taxableAmount ?? it.taxable_amount ?? 0),
                    taxRate: parseFloat(it.taxRate !== undefined ? it.taxRate : (it.tax_rate !== undefined ? it.tax_rate : 18)),
                    total: parseFloat(it.total || 0)
                };
            })
            : defaultItems;

        if (setItems) setItems(formattedItems);

        const rawGst = (quotationData.gstNumber || quotationData.gst_number || '').trim();
        const hasGstVal = Boolean(rawGst !== '');
        const custName = quotationData.customerName || quotationData.customer_name || quotationData.partyName || quotationData.party_name || quotationData.partyDisplayName || quotationData.party_display_name || '';

        const quotationNoVal = isDuplicateMode
            ? (nextQuotationNumber || '')
            : (quotationData.quotationNo || quotationData.quotation_no || '');

        const revisionNoVal = isDuplicateMode
            ? 0
            : (quotationData.revisionNo !== undefined ? quotationData.revisionNo : (quotationData.revision_no || 0));

        const rawDate = quotationData.quotationDate || quotationData.quotation_date;

        const includeAnnexureVal = quotationData.includeAnnexure !== undefined
            ? Boolean(quotationData.includeAnnexure)
            : (quotationData.include_annexure !== undefined ? Boolean(quotationData.include_annexure) : true);

        const posVal = normalizePlaceOfSupplyDisplay(quotationData.placeOfSupply || quotationData.place_of_supply);
        const isInterStateVal = posVal
            ? (!posVal.toLowerCase().includes('maharashtra') && !posVal.includes('27'))
            : false;

        const { roundOff: resolvedRoundOff, isRoundOffManual } = calculateQuotationRoundOffInfo(
            quotationData,
            formattedItems,
            isInterStateVal
        );

        const formData = {
            quotationNo: quotationNoVal,
            revisionNo: revisionNoVal,
            quotationDate: rawDate ? new Date(rawDate) : new Date(),
            validityDays: parseInt(quotationData.validityDays || quotationData.validity_days || 30, 10) || 30,
            clientRfqRef: quotationData.clientRfqRef || quotationData.client_rfq_ref || '',
            includeAnnexure: includeAnnexureVal,
            templateType: tType,
            tableSpecConfig: specCfg,
            partyId: quotationData.partyId || quotationData.party_id || null,
            customerName: custName,
            hasGst: hasGstVal,
            gstNumber: rawGst,
            contactPerson: quotationData.contactPerson || quotationData.contact_person || '',
            contactPhone: quotationData.contactPhone || quotationData.contact_phone || '',
            contactEmail: quotationData.contactEmail || quotationData.contact_email || '',
            billingAddress: quotationData.billingAddress || quotationData.billing_address || '',
            placeOfSupply: posVal,
            paymentTerms: quotationData.paymentTerms || quotationData.payment_terms || '30 Days from delivery',
            deliveryPeriod: quotationData.deliveryPeriod || quotationData.delivery_period || '4-6 Weeks from PO',
            freightBasis: quotationData.freightBasis || quotationData.freight_basis || 'Ex-Works / Extra at actuals',
            warrantyTerms: quotationData.warrantyTerms || quotationData.warranty_terms || '12 Months against manufacturing defects',
            specialNotes: quotationData.specialNotes || quotationData.special_notes || '',
            termsAndConditions: quotationData.termsAndConditions || quotationData.terms_and_conditions || '',
            discountPercent: parseFloat(quotationData.discountPercent ?? quotationData.discount_percent ?? 0),
            discountAmount: parseFloat(quotationData.discountAmount ?? quotationData.discount_amount ?? 0),
            other: parseFloat(quotationData.other ?? 0),
            roundOff: isDuplicateMode ? 0 : resolvedRoundOff,
            roundOffManual: isDuplicateMode ? false : isRoundOffManual,
            items: formattedItems
        };

        reset(formData);

        // Explicitly set each field with setValue so all watchers and form controls update reactively
        Object.entries(formData).forEach(([k, v]) => {
            if (k !== 'items') {
                setValue(k, v, { shouldValidate: false, shouldDirty: false });
            }
        });

        // If contact details are empty in quotation snapshot but partyId exists, enrich from party master
        const targetPartyId = quotationData.partyId || quotationData.party_id;
        const existingContactPerson = quotationData.contactPerson || quotationData.contact_person;
        const existingContactPhone = quotationData.contactPhone || quotationData.contact_phone;
        const existingContactEmail = quotationData.contactEmail || quotationData.contact_email;

        if (targetPartyId && (!existingContactPerson || !existingContactPhone || !existingContactEmail)) {
            getPartyDetailsById(targetPartyId).then(res => {
                const party = res?.data ?? res;
                if (party) {
                    const defaultContact = Array.isArray(party.contacts) && party.contacts.length > 0
                        ? (party.contacts.find(c => c.isPrimary) || party.contacts[0])
                        : null;
                    const contactName = defaultContact?.name || party.contact_person || party.primaryContactName || '';
                    const contactPhone = defaultContact?.phoneNumber || party.phone_number || party.mobile || '';
                    const contactEmail = defaultContact?.email || party.email || '';

                    if (contactName && !getValues("contactPerson")) {
                        setValue("contactPerson", contactName, { shouldDirty: false });
                    }
                    if (contactPhone && !getValues("contactPhone")) {
                        setValue("contactPhone", contactPhone, { shouldDirty: false });
                    }
                    if (contactEmail && !getValues("contactEmail")) {
                        setValue("contactEmail", contactEmail, { shouldDirty: false });
                    }
                }
            }).catch(() => {});
        }
    }, [quotationData, isEditMode, isDuplicateMode, nextQuotationNumber, reset, setValue, getValues, setTemplateType, setTableSpecConfig, setApprovalStatus, setItems, defaultItems]);
};

export default useQuotationHydrate;
