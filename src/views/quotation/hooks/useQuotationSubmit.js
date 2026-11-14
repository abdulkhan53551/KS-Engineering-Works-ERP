import { useCallback } from 'react';
import moment from 'moment';
import { toast } from 'react-toastify';
import { normalizePlaceOfSupplyDisplay } from '../../../utilities/gstStateHelper';
import {
    useCreateQuotation,
    useUpdateQuotation,
    useCreateQuotationRevision,
    useApproveQuotation
} from './useApi';

/**
 * Custom hook to manage Quotation form submissions, revisions, admin force updates, and approvals.
 * 
 * @param {Object} params
 * @param {string|number} params.id
 * @param {boolean} params.isEditMode
 * @param {boolean} params.isDuplicateMode
 * @param {Object} params.activeFirm
 * @param {Object} params.activeBranch
 * @param {Array} params.items
 * @param {Object} params.totals
 * @param {string} params.templateType
 * @param {any} params.tableSpecConfig
 * @param {Object} params.quotationData
 * @param {number} params.nextRevisionNo
 * @param {boolean} params.isLocked
 * @param {boolean} params.isRevisionMode
 * @param {Function} params.setIsRevisionMode
 * @param {boolean} params.isForceEditMode
 * @param {Function} params.setIsForceEditMode
 * @param {Function} params.setShowRevisionModal
 * @param {Function} params.handleSubmit
 * @param {Function} params.setValue
 * @param {number} params.watchedDiscountPercent
 * @param {string} params.defaultTncContent
 * @param {string} params.defaultSpecialNotes
 * @returns {{
 *   createMutation: Object,
 *   updateMutation: Object,
 *   revisionMutation: Object,
 *   approveMutation: Object,
 *   isSubmitting: boolean,
 *   onValidSubmit: Function,
 *   handleSaveDraft: Function,
 *   handleSubmitForApproval: Function,
 *   handleSaveRevision: Function,
 *   handleForceUpdateSubmit: Function,
 *   handleCreateRevision: Function,
 *   handleApproveReject: Function,
 *   handleGenerateStandardTnc: Function
 * }}
 */
export const useQuotationSubmit = ({
    id,
    isEditMode,
    isDuplicateMode,
    activeFirm,
    activeBranch,
    items = [],
    totals = {},
    templateType = 'CARDS',
    tableSpecConfig = null,
    quotationData,
    nextRevisionNo = 1,
    isLocked = false,
    isRevisionMode = false,
    setIsRevisionMode,
    isForceEditMode = false,
    setIsForceEditMode,
    setShowRevisionModal,
    handleSubmit,
    setValue,
    watchedDiscountPercent = 0,
    defaultTncContent = '',
    defaultSpecialNotes = ''
}) => {
    const createMutation = useCreateQuotation();
    const updateMutation = useUpdateQuotation();
    const revisionMutation = useCreateQuotationRevision();
    const approveMutation = useApproveQuotation();

    const isSubmitting = createMutation.isLoading || updateMutation.isLoading || revisionMutation.isLoading || approveMutation.isLoading;

    const onValidSubmit = useCallback((formData, actionType = 'DRAFT') => {
        // If quotation is locked without being in Revision Mode or Force Edit Mode, prompt user
        if (isLocked && !isRevisionMode && !isForceEditMode) {
            if (setShowRevisionModal) setShowRevisionModal(true);
            return;
        }

        const validItems = (items || []).filter(it => (it.itemName || it.item_name) && (it.itemName || it.item_name).trim() !== '');
        const isRev = actionType === 'REVISION' || isRevisionMode;
        const targetRevNo = isRev
            ? nextRevisionNo
            : (formData.revisionNo !== undefined ? formData.revisionNo : (quotationData?.revisionNo !== undefined ? quotationData.revisionNo : 0));

        const payload = {
            firmId: activeFirm?.id ? Number(activeFirm.id) : undefined,
            firmBranchId: activeBranch?.id ? Number(activeBranch.id) : undefined,
            quotationNo: formData.quotationNo || undefined,
            revisionNo: targetRevNo,
            quotationDate: formData.quotationDate ? moment(formData.quotationDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
            validityDays: Number(formData.validityDays) || 30,
            clientRfqRef: formData.clientRfqRef?.trim() || null,
            includeAnnexure: formData.includeAnnexure !== false,
            templateType: templateType,
            tableSpecConfig: tableSpecConfig,
            partyId: formData.partyId ? parseInt(formData.partyId, 10) : null,
            customerName: formData.customerName,
            gstNumber: formData.gstNumber || '',
            contactPerson: formData.contactPerson || '',
            contactPhone: formData.contactPhone || '',
            contactEmail: formData.contactEmail || '',
            billingAddress: formData.billingAddress || '',
            placeOfSupply: normalizePlaceOfSupplyDisplay(formData.placeOfSupply?.trim()),
            paymentTerms: formData.paymentTerms || '',
            deliveryPeriod: formData.deliveryPeriod || '',
            freightBasis: formData.freightBasis || '',
            warrantyTerms: formData.warrantyTerms || '',
            specialNotes: formData.specialNotes || '',
            termsAndConditions: formData.termsAndConditions || '',
            subTotal: totals.subTotal,
            discountPercent: parseFloat(formData.discountPercent ?? watchedDiscountPercent ?? 0),
            discountAmount: totals.discountAmount,
            taxableAmount: totals.taxableAmount,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            other: totals.other,
            roundOff: totals.roundOff,
            total: totals.total,
            status: actionType === 'SUBMIT' ? 'PENDING_APPROVAL' : 'DRAFT',
            approvalStatus: 'PENDING',
            items: validItems.map((it, idx) => ({
                id: isRev || isDuplicateMode ? undefined : it.id,
                productId: it.productId || it.product_id || null,
                itemName: it.itemName || it.item_name || '',
                drawingNumber: it.drawingNumber || it.drawing_number || '',
                hsnSacCode: it.hsnSacCode || it.hsn_sac_code || '',
                qty: parseFloat(it.qty || 1),
                unit: it.unit || 'Nos',
                rate: parseFloat(it.rate || 0),
                discountPercent: parseFloat(it.discountPercent ?? it.discount_percent ?? 0),
                discountAmount: parseFloat(it.discountAmount ?? it.discount_amount ?? 0),
                taxableAmount: parseFloat(it.taxableAmount ?? it.taxable_amount ?? 0),
                taxRate: parseFloat(it.taxRate !== undefined ? it.taxRate : (it.tax_rate !== undefined ? it.tax_rate : 18)),
                cgst: parseFloat(it.cgst || 0),
                sgst: parseFloat(it.sgst || 0),
                igst: parseFloat(it.igst || 0),
                total: parseFloat(it.total || 0),
                annexureData: it.annexureData !== undefined ? it.annexureData : (it.annexure_data || null),
                sortOrder: it.sortOrder !== undefined ? it.sortOrder : idx
            }))
        };

        if (isRev) {
            revisionMutation.mutate({ id, data: payload });
        } else if (isForceEditMode) {
            updateMutation.mutate({ id, data: { ...payload, forceUpdate: true } });
        } else if (isEditMode) {
            updateMutation.mutate({ id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    }, [
        id,
        isEditMode,
        isDuplicateMode,
        isLocked,
        isRevisionMode,
        isForceEditMode,
        setShowRevisionModal,
        items,
        nextRevisionNo,
        quotationData,
        activeFirm,
        activeBranch,
        templateType,
        tableSpecConfig,
        totals,
        watchedDiscountPercent,
        createMutation,
        updateMutation,
        revisionMutation
    ]);

    const handleSaveDraft = handleSubmit
        ? handleSubmit(
            (data) => onValidSubmit(data, 'DRAFT'),
            (err) => console.warn("Quotation Form Validation Errors:", err)
        )
        : () => {};

    const handleSubmitForApproval = handleSubmit
        ? handleSubmit(
            (data) => onValidSubmit(data, 'SUBMIT'),
            (err) => console.warn("Quotation Form Validation Errors:", err)
        )
        : () => {};

    const handleSaveRevision = handleSubmit
        ? handleSubmit(
            (data) => onValidSubmit(data, 'REVISION'),
            (err) => console.warn("Quotation Form Validation Errors:", err)
        )
        : () => {};

    const handleForceUpdateSubmit = handleSubmit
        ? handleSubmit(
            (data) => onValidSubmit(data, 'FORCE_UPDATE'),
            (err) => console.warn("Quotation Form Validation Errors:", err)
        )
        : () => {};

    const handleCreateRevision = useCallback(() => {
        if (setValue) setValue('revisionNo', nextRevisionNo);
        if (setIsRevisionMode) setIsRevisionMode(true);
        if (setIsForceEditMode) setIsForceEditMode(false);
    }, [nextRevisionNo, setValue, setIsRevisionMode, setIsForceEditMode]);

    const handleApproveReject = useCallback((approved) => {
        approveMutation.mutate({
            id,
            approvalStatus: approved ? 'APPROVED' : 'REJECTED'
        });
    }, [id, approveMutation]);

    const handleGenerateStandardTnc = useCallback(() => {
        if (setValue) {
            setValue("termsAndConditions", defaultTncContent, { shouldDirty: true, shouldValidate: true });
            setValue("specialNotes", defaultSpecialNotes, { shouldDirty: true, shouldValidate: true });
            toast.success("Standard Terms & Conditions generated!");
        }
    }, [setValue, defaultTncContent, defaultSpecialNotes]);

    return {
        createMutation,
        updateMutation,
        revisionMutation,
        approveMutation,
        isSubmitting,
        onValidSubmit,
        handleSaveDraft,
        handleSubmitForApproval,
        handleSaveRevision,
        handleForceUpdateSubmit,
        handleCreateRevision,
        handleApproveReject,
        handleGenerateStandardTnc
    };
};

export default useQuotationSubmit;
