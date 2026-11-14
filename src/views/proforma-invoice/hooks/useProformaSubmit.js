import { useCallback } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import { normalizePlaceOfSupplyDisplay } from '../../../utilities/gstStateHelper';
import { useCreateProforma, useUpdateProforma } from './useApi';

/**
 * Custom hook to manage Proforma Invoice form submissions.
 */
export const useProformaSubmit = ({
    id,
    isEditMode,
    isDuplicateMode,
    activeFirm,
    activeBranch,
    items = [],
    totals = {},
    status = 'DRAFT',
    handleSubmit
}) => {
    const createMutation = useCreateProforma();
    const updateMutation = useUpdateProforma();

    const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

    const onValidSubmit = useCallback((formData, actionType = 'DRAFT') => {
        const validItems = (items || []).filter(it => (it.itemName || it.item_name) && (it.itemName || it.item_name).trim() !== '');

        if (validItems.length === 0) {
            toast.error("Please add at least one line item to the Proforma Invoice.");
            return;
        }

        const submissionStatus = actionType === 'SENT' ? 'SENT' : (actionType === 'DRAFT' ? 'DRAFT' : (formData.status || status || 'DRAFT'));

        const payload = {
            firmId: activeFirm?.id ? Number(activeFirm.id) : undefined,
            firmBranchId: activeBranch?.id ? Number(activeBranch.id) : undefined,

            proformaNo: formData.proformaNo?.trim() || undefined,
            proformaDate: formData.proformaDate ? moment(formData.proformaDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
            dueDays: parseInt(formData.dueDays || 15, 10),
            dueDate: formData.dueDate ? moment(formData.dueDate).format('YYYY-MM-DD') : undefined,

            // Cross-module refs
            orderRefNo: formData.orderRefNo?.trim() || null,
            orderRefDate: formData.orderRefDate ? moment(formData.orderRefDate).format('YYYY-MM-DD') : null,
            quotationId: formData.quotationId ? Number(formData.quotationId) : null,
            taxInvoiceId: formData.taxInvoiceId ? Number(formData.taxInvoiceId) : null,

            // Buyer details
            partyId: formData.partyId ? Number(formData.partyId) : null,
            customerName: formData.customerName?.trim(),
            hasGst: Boolean(formData.hasGst),
            gstNumber: formData.hasGst && formData.gstNumber ? formData.gstNumber.trim().toUpperCase() : null,
            contactPerson: formData.contactPerson?.trim() || null,
            contactPhone: formData.contactPhone?.trim() || null,
            contactEmail: formData.contactEmail?.trim() || null,
            billingAddress: formData.billingAddress?.trim() || null,
            shippingAddress: formData.shippingAddress?.trim() || formData.billingAddress?.trim() || null,
            placeOfSupply: normalizePlaceOfSupplyDisplay(formData.placeOfSupply),

            // Dispatch
            dispatchThrough: formData.dispatchThrough?.trim() || null,
            destination: formData.destination?.trim() || null,

            // Commercial terms
            paymentTerms: formData.paymentTerms || null,
            deliveryPeriod: formData.deliveryPeriod || null,
            freightBasis: formData.freightBasis || null,
            warrantyTerms: formData.warrantyTerms || null,
            specialNotes: formData.specialNotes || null,
            termsAndConditions: formData.termsAndConditions || null,

            // Financial summary
            subTotal: totals.rawSubTotal !== undefined ? totals.rawSubTotal : parseFloat(formData.subTotal || 0),
            discountPercent: parseFloat(formData.discountPercent || 0),
            discountAmount: totals.docDiscountAmount !== undefined ? totals.docDiscountAmount : parseFloat(formData.discountAmount || 0),
            taxableAmount: totals.netTaxableAmount !== undefined ? totals.netTaxableAmount : parseFloat(formData.taxableAmount || 0),
            cgst: totals.cgst !== undefined ? totals.cgst : parseFloat(formData.cgst || 0),
            sgst: totals.sgst !== undefined ? totals.sgst : parseFloat(formData.sgst || 0),
            igst: totals.igst !== undefined ? totals.igst : parseFloat(formData.igst || 0),
            other: parseFloat(formData.other || 0),
            roundOff: totals.roundOff !== undefined ? totals.roundOff : parseFloat(formData.roundOff || 0),
            total: totals.grandTotal !== undefined ? totals.grandTotal : parseFloat(formData.total || 0),
            advanceAmountRequested: parseFloat(formData.advanceAmountRequested || 0),
            advanceReceived: parseFloat(formData.advanceReceived || 0),
            status: submissionStatus,

            // Items
            items: validItems.map((item, idx) => ({
                id: (isEditMode && !isDuplicateMode) ? item.id : undefined,
                productId: item.productId || item.product_id || null,
                itemName: (item.itemName || item.item_name).trim(),
                description: item.description?.trim() || null,
                drawingNumber: (item.drawingNumber || item.drawing_number)?.trim() || null,
                hsnSacCode: (item.hsnSacCode || item.hsn_sac_code)?.trim() || null,
                qty: parseFloat(item.qty || 1),
                unit: item.unit || 'Nos',
                rate: parseFloat(item.rate || 0),
                discountPercent: parseFloat(item.discountPercent ?? item.discount_percent ?? 0),
                discountAmount: parseFloat(item.discountAmount ?? item.discount_amount ?? 0),
                subTotal: parseFloat(item.subTotal ?? item.sub_total ?? 0),
                taxableAmount: parseFloat(item.taxableAmount ?? item.taxable_amount ?? 0),
                taxRate: parseFloat(item.taxRate !== undefined ? item.taxRate : (item.tax_rate !== undefined ? item.tax_rate : 18.00)),
                cgst: parseFloat(item.cgst || 0),
                sgst: parseFloat(item.sgst || 0),
                igst: parseFloat(item.igst || 0),
                total: parseFloat(item.total || 0),
                sortOrder: idx
            }))
        };

        if (isEditMode && !isDuplicateMode) {
            updateMutation.mutate({ id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    }, [
        id,
        isEditMode,
        isDuplicateMode,
        activeFirm,
        activeBranch,
        items,
        totals,
        status,
        createMutation,
        updateMutation
    ]);

    const handleSaveDraft = useCallback(() => {
        handleSubmit((data) => onValidSubmit(data, 'DRAFT'))();
    }, [handleSubmit, onValidSubmit]);

    const handleSaveAndSend = useCallback(() => {
        handleSubmit((data) => onValidSubmit(data, 'SENT'))();
    }, [handleSubmit, onValidSubmit]);

    const handleSaveChanges = useCallback(() => {
        handleSubmit((data) => onValidSubmit(data, 'UPDATE'))();
    }, [handleSubmit, onValidSubmit]);

    return {
        createMutation,
        updateMutation,
        isSubmitting,
        onValidSubmit,
        handleSaveDraft,
        handleSaveAndSend,
        handleSaveChanges
    };
};

export default useProformaSubmit;
