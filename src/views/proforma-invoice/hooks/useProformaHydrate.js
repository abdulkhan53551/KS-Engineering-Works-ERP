import { useEffect } from 'react';
import moment from 'moment';
import { getQuotationById } from '../../quotation/api';
import { normalizePlaceOfSupplyDisplay } from '../../../utilities/gstStateHelper';
import { calculateProformaRoundOffInfo } from './useProformaCalculation';
import { createBlankProformaItem } from './useProformaItems';

/**
 * Helper to safely format any date value into an HTML5 date input compliant string (YYYY-MM-DD).
 */
const formatToDateInput = (val, fallback = '') => {
    if (!val) return fallback;
    const m = moment(val);
    return m.isValid() ? m.format('YYYY-MM-DD') : fallback;
};

/**
 * Custom hook to hydrate Proforma Invoice form in:
 * - Edit mode
 * - Duplicate mode
 * - Pre-filled from Quotation conversion (`?quotationId=...`)
 */
export const useProformaHydrate = ({
    proformaData,
    quotationId,
    isEditMode,
    isDuplicateMode,
    nextProformaNumber,
    reset,
    setValue,
    getValues,
    setStatus,
    setItems,
    setIsRoundOffManual
}) => {
    // 1. Hydrate from existing Proforma (Edit or Duplicate)
    useEffect(() => {
        if (!proformaData || (!isEditMode && !isDuplicateMode)) {
            return;
        }

        if (setStatus) {
            setStatus(isDuplicateMode ? 'DRAFT' : (proformaData.status || 'DRAFT'));
        }

        const rawItems = proformaData.items || [];
        const formattedItems = (Array.isArray(rawItems) && rawItems.length > 0)
            ? rawItems.map((it, idx) => ({
                id: isDuplicateMode ? undefined : it.id,
                productId: it.productId || it.product_id || null,
                itemName: it.itemName || it.item_name || '',
                description: it.description || '',
                drawingNumber: it.drawingNumber || it.drawing_number || '',
                hsnSacCode: it.hsnSacCode || it.hsn_sac_code || '',
                unit: it.unit || 'Nos',
                qty: parseFloat(it.qty || 1),
                rate: parseFloat(it.rate || 0),
                discountPercent: parseFloat(it.discountPercent ?? it.discount_percent ?? 0),
                discountAmount: parseFloat(it.discountAmount ?? it.discount_amount ?? 0),
                taxableAmount: parseFloat(it.taxableAmount ?? it.taxable_amount ?? 0),
                taxRate: parseFloat(it.taxRate !== undefined ? it.taxRate : (it.tax_rate !== undefined ? it.tax_rate : 18)),
                cgst: parseFloat(it.cgst || 0),
                sgst: parseFloat(it.sgst || 0),
                igst: parseFloat(it.igst || 0),
                total: parseFloat(it.total || 0),
                sortOrder: it.sortOrder !== undefined ? it.sortOrder : (it.sort_order !== undefined ? it.sort_order : idx)
            }))
            : [createBlankProformaItem(0)];

        if (setItems) setItems(formattedItems);

        const rawGst = (proformaData.gstNumber || proformaData.gst_number || '').trim();
        const hasGstVal = Boolean(rawGst !== '');
        const custName = proformaData.customerName || proformaData.customer_name || '';

        const proformaNoVal = isDuplicateMode
            ? (nextProformaNumber || '')
            : (proformaData.proformaNo || proformaData.proforma_no || '');

        const rawDate = proformaData.proformaDate || proformaData.proforma_date;
        const rawDueDate = proformaData.dueDate || proformaData.due_date;
        const rawOrderDate = proformaData.orderRefDate || proformaData.order_ref_date;

        const dueDaysVal = parseInt(proformaData.dueDays ?? proformaData.due_days ?? 15, 10) || 15;

        const proformaDateVal = (rawDate && moment(rawDate).isValid())
            ? moment(rawDate).toDate()
            : new Date();

        const orderRefDateVal = (rawOrderDate && moment(rawOrderDate).isValid())
            ? moment(rawOrderDate).toDate()
            : null;

        const dueDateVal = (rawDueDate && moment(rawDueDate).isValid())
            ? moment(rawDueDate).toDate()
            : moment(proformaDateVal).add(dueDaysVal, 'days').toDate();

        const roundOffInfo = calculateProformaRoundOffInfo(proformaData, formattedItems);
        if (setIsRoundOffManual) {
            setIsRoundOffManual(roundOffInfo.isRoundOffManual);
        }

        const formData = {
            proformaNo: proformaNoVal,
            proformaDate: proformaDateVal,
            dueDays: dueDaysVal,
            dueDate: dueDateVal,
            orderRefNo: proformaData.orderRefNo || proformaData.order_ref_no || '',
            orderRefDate: orderRefDateVal,
            quotationId: isDuplicateMode ? null : (proformaData.quotationId || proformaData.quotation_id || null),
            taxInvoiceId: isDuplicateMode ? null : (proformaData.taxInvoiceId || proformaData.tax_invoice_id || null),

            // Buyer info
            partyId: proformaData.partyId || proformaData.party_id || null,
            customerName: custName,
            hasGst: hasGstVal,
            gstNumber: rawGst,
            contactPerson: proformaData.contactPerson || proformaData.contact_person || '',
            contactPhone: proformaData.contactPhone || proformaData.contact_phone || '',
            contactEmail: proformaData.contactEmail || proformaData.contact_email || '',
            billingAddress: proformaData.billingAddress || proformaData.billing_address || '',
            shippingAddress: proformaData.shippingAddress || proformaData.shipping_address || '',
            placeOfSupply: normalizePlaceOfSupplyDisplay(proformaData.placeOfSupply || proformaData.place_of_supply || ''),

            // Dispatch
            dispatchThrough: proformaData.dispatchThrough || proformaData.dispatch_through || '',
            destination: proformaData.destination || '',

            // Terms
            paymentTerms: proformaData.paymentTerms || proformaData.payment_terms || '',
            deliveryPeriod: proformaData.deliveryPeriod || proformaData.delivery_period || '',
            freightBasis: proformaData.freightBasis || proformaData.freight_basis || '',
            warrantyTerms: proformaData.warrantyTerms || proformaData.warranty_terms || '',
            specialNotes: proformaData.specialNotes || proformaData.special_notes || '',
            termsAndConditions: proformaData.termsAndConditions || proformaData.terms_and_conditions || '',

            // Financials
            subTotal: parseFloat(proformaData.subTotal ?? proformaData.sub_total ?? 0),
            discountPercent: parseFloat(proformaData.discountPercent ?? proformaData.discount_percent ?? 0),
            discountAmount: parseFloat(proformaData.discountAmount ?? proformaData.discount_amount ?? 0),
            taxableAmount: parseFloat(proformaData.taxableAmount ?? proformaData.taxable_amount ?? 0),
            cgst: parseFloat(proformaData.cgst ?? 0),
            sgst: parseFloat(proformaData.sgst ?? 0),
            igst: parseFloat(proformaData.igst ?? 0),
            other: parseFloat(proformaData.other ?? 0),
            roundOff: roundOffInfo.roundOff,
            roundOffManual: roundOffInfo.isRoundOffManual,
            total: parseFloat(proformaData.total ?? 0),
            advanceAmountRequested: parseFloat(proformaData.advanceAmountRequested ?? proformaData.advance_amount_requested ?? 0),
            advanceReceived: parseFloat(proformaData.advanceReceived ?? proformaData.advance_received ?? 0),
            status: isDuplicateMode ? 'DRAFT' : (proformaData.status || 'DRAFT'),

            items: formattedItems
        };

        reset(formData);
    }, [
        proformaData,
        isEditMode,
        isDuplicateMode,
        nextProformaNumber,
        reset,
        setStatus,
        setItems,
        setIsRoundOffManual
    ]);

    // 2. Pre-fill from Quotation conversion (`quotationId`) in Create mode
    useEffect(() => {
        if (!quotationId || isEditMode || isDuplicateMode) {
            return;
        }

        let isMounted = true;
        getQuotationById(quotationId)
            .then(res => {
                if (!isMounted) return;
                const q = res?.data || res;
                if (!q) return;

                const rawItems = q.items || [];
                const formattedItems = (Array.isArray(rawItems) && rawItems.length > 0)
                    ? rawItems.map((it, idx) => ({
                        id: undefined,
                        productId: it.productId || it.product_id || null,
                        itemName: it.itemName || it.item_name || '',
                        description: it.description || '',
                        drawingNumber: it.drawingNumber || it.drawing_number || '',
                        hsnSacCode: it.hsnSacCode || it.hsn_sac_code || '',
                        unit: it.unit || 'Nos',
                        qty: parseFloat(it.qty || 1),
                        rate: parseFloat(it.rate || 0),
                        discountPercent: parseFloat(it.discountPercent ?? it.discount_percent ?? 0),
                        discountAmount: parseFloat(it.discountAmount ?? it.discount_amount ?? 0),
                        taxableAmount: parseFloat(it.taxableAmount ?? it.taxable_amount ?? 0),
                        taxRate: parseFloat(it.taxRate !== undefined ? it.taxRate : (it.tax_rate !== undefined ? it.tax_rate : 18)),
                        cgst: parseFloat(it.cgst || 0),
                        sgst: parseFloat(it.sgst || 0),
                        igst: parseFloat(it.igst || 0),
                        total: parseFloat(it.total || 0),
                        sortOrder: idx
                    }))
                    : [createBlankProformaItem(0)];

                if (setItems) setItems(formattedItems);

                const rawGst = (q.gstNumber || q.gst_number || '').trim();
                const hasGstVal = Boolean(rawGst !== '');

                setValue('quotationId', Number(quotationId), { shouldDirty: true });
                setValue('partyId', q.partyId || q.party_id || null, { shouldDirty: true });
                setValue('customerName', q.customerName || q.customer_name || '', { shouldValidate: true, shouldDirty: true });
                setValue('hasGst', hasGstVal, { shouldDirty: true });
                setValue('gstNumber', rawGst, { shouldDirty: true });
                setValue('contactPerson', q.contactPerson || q.contact_person || '', { shouldDirty: true });
                setValue('contactPhone', q.contactPhone || q.contact_phone || '', { shouldDirty: true });
                setValue('contactEmail', q.contactEmail || q.contact_email || '', { shouldDirty: true });
                setValue('billingAddress', q.billingAddress || q.billing_address || '', { shouldDirty: true });
                setValue('shippingAddress', q.shippingAddress || q.shipping_address || q.billingAddress || '', { shouldDirty: true });
                setValue('placeOfSupply', normalizePlaceOfSupplyDisplay(q.placeOfSupply || q.place_of_supply || ''), { shouldDirty: true });

                // Dates
                setValue('proformaDate', new Date(), { shouldDirty: true });
                const defaultDueDays = 15;
                setValue('dueDays', defaultDueDays, { shouldDirty: true });
                setValue('dueDate', moment().add(defaultDueDays, 'days').toDate(), { shouldDirty: true });

                // Fill PO/RFQ ref if quotation had client RFQ ref
                if (q.clientRfqRef || q.client_rfq_ref) {
                    setValue('orderRefNo', q.clientRfqRef || q.client_rfq_ref, { shouldDirty: true });
                }
                const qOrderDate = q.orderRefDate || q.order_ref_date || q.rfqDate || q.rfq_date;
                if (qOrderDate && moment(qOrderDate).isValid()) {
                    setValue('orderRefDate', moment(qOrderDate).toDate(), { shouldDirty: true });
                }

                if (q.paymentTerms || q.payment_terms) {
                    setValue('paymentTerms', q.paymentTerms || q.payment_terms, { shouldDirty: true });
                }
                if (q.deliveryPeriod || q.delivery_period) {
                    setValue('deliveryPeriod', q.deliveryPeriod || q.delivery_period, { shouldDirty: true });
                }
                if (q.freightBasis || q.freight_basis) {
                    setValue('freightBasis', q.freightBasis || q.freight_basis, { shouldDirty: true });
                }
                if (q.warrantyTerms || q.warranty_terms) {
                    setValue('warrantyTerms', q.warrantyTerms || q.warranty_terms, { shouldDirty: true });
                }

                setValue('discountPercent', parseFloat(q.discountPercent ?? q.discount_percent ?? 0), { shouldDirty: true });
                setValue('items', formattedItems, { shouldDirty: true });
            })
            .catch(err => {
                console.error("Failed to prefill from Quotation:", err);
            });

        return () => {
            isMounted = false;
        };
    }, [quotationId, isEditMode, isDuplicateMode, setValue, setItems]);
};

export default useProformaHydrate;
