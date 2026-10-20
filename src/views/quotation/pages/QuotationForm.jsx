import React, { useState, useEffect, useMemo } from 'react';
import { Card, Form, Row, Col, Button, Badge, FormCheck, Spinner, Modal } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Flatpickr from "react-flatpickr";
import { Controller, useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import {
    FaRegCalendarAlt,
    FaFileAlt,
    FaShoppingCart,
    FaCoins,
    FaPercent,
    FaUndo,
    FaArrowLeft,
    FaCheck,
    FaTimes,
    FaHistory,
    FaColumns,
    FaSave,
    FaPaperPlane,
    FaLock,
    FaCheckCircle,
    FaBan,
    FaFilePdf,
    FaMapMarkerAlt,
    FaEdit,
    FaExclamationTriangle,
    FaLayerGroup,
    FaGlobe,
    FaThLarge,
    FaThList,
    FaSlidersH,
    FaBuilding,
    FaTruck,
    FaMagic
} from 'react-icons/fa';
import moment from 'moment';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import '../../invoice/pages/invoice.scss';
import './quotation.scss';

import {
    useQuotationById,
    useNextQuotationNumber,
    useQuotationAutoNumber,
    useQuotationCalculation,
    useQuotationHydrate,
    useQuotationParty,
    useQuotationSubmit,
    useQuotationSpecs
} from '../hooks';

import { useProducts } from '../../products/hooks/useApi';
import { useCountryState } from '../../dashboard/hooks/api.hooks';
import PartyAutocompleteInput from '../../invoice/components/PartyAutocompleteInput';
import QuotationItemsTable from '../components/QuotationItemsTable';
import TechnicalSpecsModal from '../components/TechnicalSpecsModal';
import TableSpecConfigModal from '../components/TableSpecConfigModal';
import MatrixRowSpecsModal from '../components/MatrixRowSpecsModal';
import QuotationPdfModal from '../components/QuotationPdfModal';
import { findDbStateByGstCode, formatPlaceOfSupplyDisplay, normalizePlaceOfSupplyDisplay, GST_STATE_OPTIONS, GST_STATE_DATA } from '../../../utilities/gstStateHelper';
import { numberToIndianRupeesWords } from '../../../utilities/numberToWords';
import { quotationValidationSchema } from '../../../validation/quotation.validation';

// Default engineering terms and conditions content for precision machining & manufacturing
export const DEFAULT_TNC_CONTENT = `1. Prices quoted are Ex-Works Nashik. GST, freight, forwarding, and transit insurance extra as applicable.
2. Rates are valid for 30 days from quotation date.
3. Payment terms strictly as agreed. Delayed payments attract interest @ 18% p.a.
4. Delivery schedule commences from receipt of confirmed PO and drawing clearance.
5. Standard 12 months warranty against manufacturing defects from the date of supply.
6. All transactions and disputes are subject to Nashik (Maharashtra) jurisdiction only.`;

export const DEFAULT_SPECIAL_NOTES = `1. Components will be manufactured strictly adhering to customer-approved drawings and technical specifications.
2. Pre-dispatch inspection report (PDIR) and manufacturer test certificate will accompany dispatch.
3. Any engineering revision or design change post-PO will be subject to revised price & delivery schedule.`;

const defaultFormValue = {
    quotationNo: "",
    revisionNo: 0,
    quotationDate: new Date(),
    validityDays: 30,
    clientRfqRef: "",
    includeAnnexure: true,
    templateType: "CARDS",
    tableSpecConfig: null,
    partyId: null,
    customerName: "",
    hasGst: false,
    gstNumber: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    billingAddress: "",
    placeOfSupply: "Maharashtra (State Code: 27)",
    paymentTerms: "30 Days from delivery",
    deliveryPeriod: "4-6 Weeks from PO",
    freightBasis: "Ex-Works / Extra at actuals",
    warrantyTerms: "12 Months against manufacturing defects",
    specialNotes: DEFAULT_SPECIAL_NOTES,
    termsAndConditions: DEFAULT_TNC_CONTENT,
    discountPercent: 0,
    discountAmount: 0,
    other: 0,
    roundOff: 0,
    roundOffManual: false,
    items: [
        {
            itemName: "",
            drawingNumber: "",
            hsnSacCode: "",
            qty: 1,
            unit: "Nos",
            rate: 0,
            discountPercent: 0,
            discountAmount: 0,
            subTotal: 0,
            taxableAmount: 0,
            taxRate: 18,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: 0
        }
    ]
};

const QuotationForm = ({ mode = 'create' }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const isEditMode = mode === 'edit' && Boolean(id);
    const isDuplicateMode = mode === 'duplicate';

    // Tenant / Active Firm & Branch Context
    const { activeFirm, activeBranch } = useSelector(state => state.firmReducer || {});

    // Queries
    const { data: quotationData, isLoading: isQuotationLoading } = useQuotationById(id, {
        enabled: Boolean(isEditMode || isDuplicateMode)
    });

    const { data: nextQuotationNumber } = useNextQuotationNumber();
    const { data: productsList = [] } = useProducts({ page: 1, pageSize: 200, status: 'ACTIVE' });
    const { data: billingStates = [] } = useCountryState();


    // Form Hook with Joi Validation Resolver
    const formMethods = useForm({
        resolver: joiResolver(quotationValidationSchema(isEditMode)),
        shouldUnregister: false,
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: {
            ...defaultFormValue
        }
    });

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        control,
        formState: { errors },
        clearErrors,
        getValues
    } = formMethods;

    // Watch scalar fields to drive UI reactively without re-render cascades
    const [
        watchedQuotationNo,
        watchedRevisionNo,
        watchedPartyId,
        watchedCustomerName,
        watchedClientRfqRef,
        watchedValidityDays,
        watchedHasGst,
        watchedGstNumber,
        watchedContactPerson,
        watchedContactPhone,
        watchedContactEmail,
        watchedBillingAddress,
        watchedPlaceOfSupply,
        watchedDiscountPercent,
        watchedDiscountAmount,
        watchedOther,
        watchedRoundOff,
        watchedRoundOffManual,
        watchedIncludeAnnexure
    ] = useWatch({
        control,
        name: [
            "quotationNo",
            "revisionNo",
            "partyId",
            "customerName",
            "clientRfqRef",
            "validityDays",
            "hasGst",
            "gstNumber",
            "contactPerson",
            "contactPhone",
            "contactEmail",
            "billingAddress",
            "placeOfSupply",
            "discountPercent",
            "discountAmount",
            "other",
            "roundOff",
            "roundOffManual",
            "includeAnnexure"
        ]
    });

    // Managed State for Presentation Template & Annexures
    const [templateType, setTemplateType] = useState('CARDS'); // 'CARDS' or 'MATRIX'
    const [tableSpecConfig, setTableSpecConfig] = useState(null);
    const [items, setItems] = useState(defaultFormValue.items);
    const [approvalStatus, setApprovalStatus] = useState('PENDING');
    const [isRevisionMode, setIsRevisionMode] = useState(false);
    const [isForceEditMode, setIsForceEditMode] = useState(false);
    const [showRevisionModal, setShowRevisionModal] = useState(false);

    // 1. Technical Specs & Modals Management Custom Hook
    const {
        showSpecsModal,
        setShowSpecsModal,
        showMatrixSpecsModal,
        setShowMatrixSpecsModal,
        activeSpecItem,
        activeSpecIdx,
        showConfigModal,
        setShowConfigModal,
        showPdfModal,
        setShowPdfModal,
        activeMatrixColumnsCount,
        handleOpenSpecs,
        handleSaveSpecs
    } = useQuotationSpecs({
        items,
        templateType,
        tableSpecConfig,
        onUpdateItemAnnexure: (idx, updatedAnnexureData) => {
            setItems(prev => {
                const next = [...prev];
                next[idx] = {
                    ...next[idx],
                    annexureData: updatedAnnexureData,
                    annexure_data: updatedAnnexureData
                };
                setValue('items', next, { shouldValidate: true, shouldDirty: true });
                return next;
            });
        }
    });

    // 2. Financial Totals & Interstate Calculation Custom Hook
    const { 
        isInterState, 
        totals,
        handleDiscountPercentChange,
        handleDiscountAmountChange,
        handleOtherChange,
        handleRoundOffChange,
        handleResetRoundOffAuto 
    } = useQuotationCalculation({
        items,
        watchedPlaceOfSupply,
        watchedDiscountAmount,
        watchedOther,
        watchedRoundOff,
        watchedRoundOffManual,
        setValue,
        getValues
    });

    const isLocked = isEditMode && approvalStatus === 'APPROVED' && !isRevisionMode && !isForceEditMode;

    // 3. Auto-generate Quotation Number & Revision Sequence Custom Hook
    const { baseRevisionNo, nextRevisionNo } = useQuotationAutoNumber({
        isEditMode,
        isDuplicateMode,
        nextQuotationNumber,
        setValue,
        getValues,
        quotationData,
        watchedRevisionNo
    });

    // 4. Hydrate Form in Edit or Duplicate Mode Custom Hook
    useQuotationHydrate({
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
        defaultItems: defaultFormValue.items
    });

    // 5. Party Selection & Address / Contact Auto-fill Custom Hook
    const { handlePartySelect, handleClearParty, handleDetachParty } = useQuotationParty({
        setValue,
        billingStates
    });

    // 6. Form Submission, Revisions, Force Updates & Approval Workflow Custom Hook
    const {
        createMutation,
        updateMutation,
        revisionMutation,
        approveMutation,
        handleSaveDraft,
        handleSubmitForApproval,
        handleSaveRevision,
        handleForceUpdateSubmit,
        handleCreateRevision,
        handleApproveReject,
        handleGenerateStandardTnc
    } = useQuotationSubmit({
        id,
        isEditMode,
        isDuplicateMode,
        activeFirm,
        activeBranch,
        items,
        totals,
        templateType,
        tableSpecConfig,
        quotationData,
        nextRevisionNo,
        isLocked,
        isRevisionMode,
        setIsRevisionMode,
        isForceEditMode,
        setIsForceEditMode,
        setShowRevisionModal,
        handleSubmit,
        setValue,
        watchedDiscountPercent,
        defaultTncContent: DEFAULT_TNC_CONTENT,
        defaultSpecialNotes: DEFAULT_SPECIAL_NOTES
    });

    if ((isEditMode || isDuplicateMode) && isQuotationLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center p-5">
                <Spinner animation="border" variant="danger" />
                <span className="ms-2">Loading quotation details...</span>
            </div>
        );
    }

    return (
        <div className="quotation-module container-fluid py-3">
            {/* Hidden snapshot inputs for complete React Hook Form registration */}
            <input type="hidden" {...register("partyId")} />
            <input type="hidden" {...register("revisionNo")} />
            <input type="hidden" {...register("templateType")} />

            {/* Top Bar Actions & Status Header Card */}
            {/* Top Bar Actions & Status Header Card */}
            <div className="quotation-top-header-card">
                <div className="d-flex align-items-center gap-2.5 flex-wrap">
                    <Button
                        variant="light"
                        size="sm"
                        className="quotation-back-btn"
                        onClick={() => navigate('/sales/quotation')}
                    >
                        <FaArrowLeft size={11} />
                        <span>Back</span>
                    </Button>
                    <h4 className="quotation-header-title mb-0">
                        {isRevisionMode ? (
                            <>
                                <span>Create Revision</span>
                                {watchedQuotationNo && (
                                    <span className="quotation-no-badge">#{watchedQuotationNo}</span>
                                )}
                                <Badge bg="primary" className="rounded-pill fw-semibold px-2.5 py-1" style={{ fontSize: '0.70rem' }}>
                                    REV-{String(nextRevisionNo).padStart(2, '0')} (DRAFT)
                                </Badge>
                            </>
                        ) : isForceEditMode ? (
                            <>
                                <span>Direct Edit (Force Update)</span>
                                {watchedQuotationNo && (
                                    <span className="quotation-no-badge">#{watchedQuotationNo}</span>
                                )}
                                <Badge bg="warning" text="dark" className="rounded-pill fw-semibold px-2.5 py-1" style={{ fontSize: '0.70rem' }}>
                                    ADMIN OVERRIDE
                                </Badge>
                            </>
                        ) : isEditMode ? (
                            <>
                                <span>Edit Quotation</span>
                                {watchedQuotationNo && (
                                    <span className="quotation-no-badge">#{watchedQuotationNo}</span>
                                )}
                                <span className={`status-pill status-${(approvalStatus || 'draft').toLowerCase()}`}>
                                    {approvalStatus || 'DRAFT'}
                                </span>
                            </>
                        ) : isDuplicateMode ? (
                            <>
                                <span>Duplicate Quotation</span>
                                {(quotationData?.quotationNo || quotationData?.quotation_no) && (
                                    <Badge bg="soft-primary" className="text-primary border border-primary-subtle fs-7 fw-normal py-1 px-2">
                                        Cloned from #{quotationData.quotationNo || quotationData.quotation_no}
                                    </Badge>
                                )}
                            </>
                        ) : (
                            <>
                                <span>Create Commercial Quotation</span>
                                <span className="badge rounded-pill bg-light text-secondary border font-monospace px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                    DRAFT
                                </span>
                            </>
                        )}
                    </h4>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div className={`quotation-tax-chip ${isInterState ? 'inter-state' : 'intra-state'}`}>
                        <FaGlobe size={11} />
                        <span>{isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}</span>
                        {watchedPlaceOfSupply && (
                            <>
                                <span className="dot-sep">•</span>
                                <span>POS: <strong>{watchedPlaceOfSupply}</strong></span>
                            </>
                        )}
                    </div>

                    {isEditMode && id && (
                        <Button
                            variant="outline-danger"
                            size="sm"
                            className="quotation-preview-btn"
                            onClick={() => setShowPdfModal(true)}
                            title="Generate and preview commercial PDF"
                        >
                            <FaFilePdf size={12} />
                            <span>Live PDF Preview</span>
                        </Button>
                    )}

                    {isRevisionMode ? (
                        <>
                            <Button
                                variant="light"
                                size="sm"
                                className="quotation-draft-btn"
                                onClick={() => {
                                    setIsRevisionMode(false);
                                    setValue('revisionNo', baseRevisionNo);
                                }}
                            >
                                Cancel Revision
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 fw-semibold shadow-none"
                                style={{ fontSize: '0.82rem' }}
                                disabled={revisionMutation.isLoading}
                                onClick={handleSaveRevision}
                            >
                                <FaSave size={13} />
                                <span>Save as Revision REV-{String(nextRevisionNo).padStart(2, '0')}</span>
                            </Button>
                        </>
                    ) : isForceEditMode ? (
                        <>
                            <Button
                                variant="light"
                                size="sm"
                                className="quotation-draft-btn"
                                onClick={() => setIsForceEditMode(false)}
                            >
                                Cancel Direct Edit
                            </Button>
                            <Button
                                variant="warning"
                                size="sm"
                                className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 fw-semibold shadow-none text-dark"
                                style={{ fontSize: '0.82rem' }}
                                disabled={updateMutation.isLoading}
                                onClick={handleForceUpdateSubmit}
                            >
                                <FaSave size={13} />
                                <span>Update Approved Quotation</span>
                            </Button>
                        </>
                    ) : isLocked ? (
                        <div className="d-flex align-items-center gap-2">
                            <Button
                                variant="light"
                                size="sm"
                                className="quotation-draft-btn"
                                onClick={() => setIsForceEditMode(true)}
                                title="Unlock to directly edit this approved quotation"
                            >
                                <FaEdit size={12} />
                                <span>Admin Direct Edit</span>
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                className="quotation-submit-btn"
                                onClick={handleCreateRevision}
                                disabled={revisionMutation.isLoading}
                                title="Unlock form to edit items and create revision REV-0X"
                            >
                                <FaHistory size={12} />
                                <span>Create Revision (REV-{String(nextRevisionNo).padStart(2, '0')})</span>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button
                                variant="light"
                                size="sm"
                                className="quotation-draft-btn"
                                disabled={createMutation.isLoading || updateMutation.isLoading}
                                onClick={handleSaveDraft}
                            >
                                <FaSave size={12} />
                                <span>Save Draft</span>
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                className="quotation-submit-btn"
                                disabled={createMutation.isLoading || updateMutation.isLoading}
                                onClick={handleSubmitForApproval}
                            >
                                <FaPaperPlane size={11} />
                                <span>Submit for Approval</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* INVARIANT NOTICE: REVISION MODE ACTIVE */}
            {isRevisionMode && (
                <div className="quotation-workflow-banner banner-revision" role="alert">
                    <div className="d-flex align-items-center gap-3">
                        <div className="workflow-icon-box">
                            <FaHistory size={16} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="workflow-title">
                                    Editing Formal Revision: REV-{String(nextRevisionNo).padStart(2, '0')}
                                </span>
                                <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em', background: '#bfdbfe', color: '#1e3a8a', border: '1px solid #93c5fd' }}>
                                    BASE: #{watchedQuotationNo} (REV-{String(baseRevisionNo).padStart(2, '0')})
                                </span>
                            </div>
                            <div className="workflow-desc">
                                All items, rates, and specifications are unlocked. Make your modifications below and click <b>"Save as Revision REV-{String(nextRevisionNo).padStart(2, '0')}"</b> to register this revision.
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap ms-md-auto">
                        <Button
                            variant="light"
                            size="sm"
                            className="quotation-draft-btn"
                            onClick={() => {
                                setIsRevisionMode(false);
                                setValue('revisionNo', baseRevisionNo);
                            }}
                        >
                            Cancel Revision
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 fw-semibold shadow-none"
                            style={{ fontSize: '0.82rem' }}
                            disabled={revisionMutation.isLoading}
                            onClick={handleSaveRevision}
                        >
                            <FaSave size={12} />
                            <span>Save as Revision REV-{String(nextRevisionNo).padStart(2, '0')}</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* INVARIANT NOTICE: FORCE EDIT MODE ACTIVE */}
            {isForceEditMode && (
                <div className="quotation-workflow-banner banner-pending" role="alert">
                    <div className="d-flex align-items-center gap-3">
                        <div className="workflow-icon-box">
                            <FaExclamationTriangle size={16} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="workflow-title">
                                    Admin Direct Edit Mode (Force Update)
                                </span>
                                <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em', background: '#fed7aa', color: '#9a3412', border: '1px solid #fdba74' }}>
                                    OVERRIDING APPROVAL
                                </span>
                            </div>
                            <div className="workflow-desc">
                                You are editing this approved quotation directly. On saving, approval status will be reset to PENDING for re-verification.
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap ms-md-auto">
                        <Button
                            variant="light"
                            size="sm"
                            className="quotation-draft-btn"
                            onClick={() => setIsForceEditMode(false)}
                        >
                            Cancel Direct Edit
                        </Button>
                        <Button
                            variant="warning"
                            size="sm"
                            className="d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-2 fw-semibold shadow-none text-dark"
                            style={{ fontSize: '0.82rem' }}
                            disabled={updateMutation.isLoading}
                            onClick={handleForceUpdateSubmit}
                        >
                            <FaSave size={12} />
                            <span>Update Approved Quotation</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* INVARIANT NOTICE: APPROVED & LOCKED QUOTATION (Invoice Module Style) */}
            {isLocked && (
                <div className="quotation-workflow-banner banner-locked" role="alert">
                    <div className="d-flex align-items-center gap-3">
                        <div className="workflow-icon-box">
                            <FaCheckCircle size={16} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="workflow-title">
                                    Quotation Officially Approved & Locked
                                </span>
                                <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em', background: '#bbf7d0', color: '#14532d', border: '1px solid #86efac' }}>
                                    REV-{String(baseRevisionNo).padStart(2, '0')} APPROVED
                                </span>
                            </div>
                            <div className="workflow-desc">
                                This commercial quotation is locked for revision tracking and auditing. To alter rates, quantities or engineering specifications, create a new formal revision or use admin direct edit.
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap ms-md-auto">
                        <Button
                            variant="light"
                            size="sm"
                            className="quotation-draft-btn"
                            onClick={() => setIsForceEditMode(true)}
                            title="Directly edit this approved quotation without creating a new revision"
                        >
                            <FaEdit size={12} />
                            <span>Admin Direct Edit</span>
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            className="quotation-submit-btn"
                            disabled={revisionMutation.isLoading}
                            onClick={handleCreateRevision}
                            title="Unlock form to modify rates, specs and save as new formal revision"
                        >
                            <FaHistory size={12} />
                            <span>Create Revision (REV-{String(nextRevisionNo).padStart(2, '0')})</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* INVARIANT NOTICE: PENDING APPROVAL (Invoice Module Style) */}
            {isEditMode && approvalStatus === 'PENDING' && (
                <div className="quotation-workflow-banner banner-pending" role="alert">
                    <div className="d-flex align-items-center gap-3">
                        <div className="workflow-icon-box">
                            <FaLock size={15} />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="workflow-title">
                                    Pending Management Approval
                                </span>
                                <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em', background: '#fed7aa', color: '#9a3412', border: '1px solid #fdba74' }}>
                                    UNDER REVIEW
                                </span>
                            </div>
                            <div className="workflow-desc">
                                Please review the technical specifications, line item discounts and commercial payment terms before authorizing this quote.
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-md-auto flex-shrink-0">
                        <Button
                            variant="success"
                            size="sm"
                            className="btn-approve"
                            disabled={approveMutation.isLoading}
                            onClick={() => handleApproveReject(true)}
                        >
                            <FaCheck size={12} />
                            <span>Approve Quotation</span>
                        </Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            className="btn-reject"
                            disabled={approveMutation.isLoading}
                            onClick={() => handleApproveReject(false)}
                        >
                            <FaTimes size={12} />
                            <span>Reject Offer</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* SECTION 1: PRESENTATION TEMPLATE SELECTION CARD */}
            <div className="form-section-card">
                <div className="form-section-header">
                    <div className="section-title-wrap">
                        <div className="section-icon-badge primary">
                            <FaColumns />
                        </div>
                        <div>
                            <h6 className="section-title">Presentation Template & Annexure Layout</h6>
                            <p className="section-subtitle">Select executive card presentation or compact tabular engineering matrix for PDF Annexure</p>
                        </div>
                    </div>
                    {templateType === 'CARDS' ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1 font-monospace" style={{ fontSize: '11px' }}>
                            Card Dossier Active
                        </span>
                    ) : (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1 font-monospace" style={{ fontSize: '11px' }}>
                            Tabular Matrix Active
                        </span>
                    )}
                </div>

                <Row className="g-3">
                    {/* Template 1: Dynamic Configurable Cards */}
                    <Col md={6}>
                        <div
                            className={`template-selector-card ${templateType === 'CARDS' ? 'selected' : ''}`}
                            onClick={() => {
                                if (isLocked) return;
                                setTemplateType('CARDS');
                                setValue('templateType', 'CARDS');
                            }}
                        >
                            <div>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="template-radio-indicator"></div>
                                        <div className={`template-icon-chip ${templateType === 'CARDS' ? 'active' : ''}`}>
                                            <FaThLarge />
                                        </div>
                                        <div>
                                            <div className="template-title">
                                                Template 1: Dynamic Configurable Cards
                                            </div>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>Executive PDF Dossier</small>
                                        </div>
                                    </div>
                                    <Badge bg={templateType === 'CARDS' ? 'danger' : 'light'} className={`template-badge ${templateType === 'CARDS' ? 'text-white' : 'text-secondary border'}`}>
                                        1–12 Cards per Item
                                    </Badge>
                                </div>
                                <p className="template-desc">
                                    Commercial offer table on Page 1 followed by structured accordion specification cards (1 to 12 cards per item) with highlighted key-values, badges, and executive presentation.
                                </p>
                            </div>
                            <div className="template-feature-chips">
                                <span className="feature-chip">📄 Multi-Card Dossier</span>
                                <span className="feature-chip">🌟 Highlight Key-Values</span>
                                <span className="feature-chip">📑 Annexure-1 Cards</span>
                            </div>
                        </div>
                    </Col>

                    {/* Template 2: Pure Tabular Matrix */}
                    <Col md={6}>
                        <div
                            className={`template-selector-card ${templateType === 'MATRIX' ? 'selected' : ''}`}
                            onClick={() => {
                                if (isLocked) return;
                                setTemplateType('MATRIX');
                                setValue('templateType', 'MATRIX');
                            }}
                        >
                            <div>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div className="d-flex align-items-center gap-2.5">
                                        <div className="template-radio-indicator"></div>
                                        <div className={`template-icon-chip ${templateType === 'MATRIX' ? 'active' : ''}`}>
                                            <FaThList />
                                        </div>
                                        <div>
                                            <div className="template-title">
                                                Template 2: Pure Tabular Matrix
                                            </div>
                                            <small className="text-muted" style={{ fontSize: '11px' }}>Engineering Specification Sheet</small>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-1.5 align-items-center">
                                        <Badge bg={templateType === 'MATRIX' ? 'danger' : 'light'} className={`template-badge ${templateType === 'MATRIX' ? 'text-white' : 'text-secondary border'}`}>
                                            {activeMatrixColumnsCount} Spec Columns ({3 + activeMatrixColumnsCount} Total)
                                        </Badge>
                                        <button
                                            type="button"
                                            className="btn-configure-columns"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowConfigModal(true);
                                            }}
                                            title="Configure which specification columns appear"
                                        >
                                            <FaSlidersH size={10} /> Columns
                                        </button>
                                    </div>
                                </div>
                                <p className="template-desc">
                                    Commercial offer table on Page 1 followed by an ultra-compact 8-column technical matrix table on Page 2 with customizable specification columns.
                                </p>
                            </div>
                            <div className="template-feature-chips">
                                <span className="feature-chip">📊 Compact Matrix</span>
                                <span className="feature-chip">⚙️ 8-Column Architecture</span>
                                <span className="feature-chip">📐 Engineering Standard</span>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* SECTION 2: QUOTATION PARTICULARS & BUYER DETAILS (SINGLE SECTION, 2 COLUMNS) */}
            <div className="form-section-card">
                <div className="form-section-header">
                    <div className="section-title-wrap">
                        <div className="section-icon-badge primary">
                            <FaFileAlt />
                        </div>
                        <div>
                            <h6 className="section-title">Quotation Particulars & Buyer Details</h6>
                            <p className="section-subtitle">Core quotation identifiers, customer autocomplete, dates, and GST settings</p>
                        </div>
                    </div>
                </div>

                <Row className="g-4 align-items-stretch quotation-two-columns">
                    {/* Column 1 (Left): Quotation Particulars & Validity */}
                    <Col lg="6" md="12" className="col-divider-left d-flex flex-column justify-content-between">
                        <div>
                            <div className="column-group-header mb-3 pb-1 border-bottom d-flex align-items-center gap-2">
                                <FaFileAlt className="text-danger" size={12} />
                                <span className="fw-bold small text-dark text-uppercase">
                                    Quotation Particulars & Validity
                                </span>
                            </div>

                            <Row className="g-3 align-items-stretch">
                                {/* Quotation No (Readonly with Lock & Revision tag) */}
                                <Col sm="6">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0 readonly-floating-wrapper">
                                        <Form.Control
                                            type="text"
                                            id="quotationNo"
                                            placeholder="Quotation No"
                                            isInvalid={!!errors.quotationNo}
                                            readOnly
                                            tabIndex={-1}
                                            className="form-control-readonly-modern font-monospace"
                                            {...register("quotationNo")}
                                            value={watchedQuotationNo || getValues("quotationNo") || quotationData?.quotationNo || quotationData?.quotation_no || ''}
                                        />
                                        <Form.Label htmlFor="quotationNo" className="d-flex align-items-center gap-1.5">
                                            <FaLock size={10} className="text-muted flex-shrink-0" />
                                            <span>Quotation No</span>
                                            {!isEditMode && <span className="readonly-pill-tag primary">AUTO #</span>}
                                            {isEditMode && isLocked ? (
                                                <span className="readonly-pill-tag">LOCKED</span>
                                            ) : isEditMode ? (
                                                <span className="readonly-pill-tag primary">REV-{String(watchedRevisionNo || 0).padStart(2, '0')}</span>
                                            ) : null}
                                        </Form.Label>
                                        <span className="readonly-watermark-icon" title="System-generated quotation identifier">
                                            <FaLock size={11} />
                                        </span>
                                        <Form.Control.Feedback type="invalid">{errors.quotationNo?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                </Col>

                                {/* Quotation Date (Flatpickr) */}
                                <Col sm="6">
                                    <Controller
                                        name="quotationDate"
                                        control={control}
                                        defaultValue={new Date()}
                                        render={({ field, fieldState: { error } }) => (
                                            <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                                <Flatpickr
                                                    {...field}
                                                    id="quotationDate"
                                                    value={field.value}
                                                    onChange={(selectedDates) => {
                                                        field.onChange(selectedDates[0] || null);
                                                    }}
                                                    options={{
                                                        dateFormat: "d M Y",
                                                        allowInput: false
                                                    }}
                                                    className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                    placeholder=" "
                                                    disabled={isLocked}
                                                />
                                                <Form.Label htmlFor="quotationDate">
                                                    Quotation Date <span className="text-danger">*</span>
                                                </Form.Label>
                                                <FaRegCalendarAlt className="floating-date-icon" />
                                                <Form.Control.Feedback type="invalid">
                                                    {error?.message}
                                                </Form.Control.Feedback>
                                            </Form.Floating>
                                        )}
                                    />
                                </Col>

                                {/* Validity Days */}
                                <Col sm="6">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                        <Form.Control
                                            type="number"
                                            id="validityDays"
                                            placeholder="Validity (Days)"
                                            min={1}
                                            max={365}
                                            disabled={isLocked}
                                            isInvalid={!!errors.validityDays}
                                            value={watchedValidityDays !== undefined && watchedValidityDays !== null ? watchedValidityDays : (getValues("validityDays") || 30)}
                                            {...register("validityDays", {
                                                valueAsNumber: true,
                                                onChange: (e) => {
                                                    const num = parseInt(e.target.value, 10);
                                                    setValue("validityDays", isNaN(num) ? 30 : num, { shouldValidate: true, shouldDirty: true });
                                                }
                                            })}
                                        />
                                        <Form.Label htmlFor="validityDays">
                                            Validity (Days) <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control.Feedback type="invalid">{errors.validityDays?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                </Col>

                                {/* Client RFQ Ref */}
                                <Col sm="6">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                        <Form.Control
                                            type="text"
                                            id="clientRfqRef"
                                            placeholder="Client RFQ Ref"
                                            disabled={isLocked}
                                            value={watchedClientRfqRef !== undefined && watchedClientRfqRef !== null ? watchedClientRfqRef : (getValues("clientRfqRef") || quotationData?.clientRfqRef || quotationData?.client_rfq_ref || '')}
                                            isInvalid={!!errors.clientRfqRef}
                                            {...register("clientRfqRef", {
                                                onChange: (e) => setValue("clientRfqRef", e.target.value, { shouldValidate: true, shouldDirty: true })
                                            })}
                                        />
                                        <Form.Label htmlFor="clientRfqRef">
                                            Client RFQ Ref <span className="text-muted small fst-italic ms-1">(Optional)</span>
                                        </Form.Label>
                                        <Form.Control.Feedback type="invalid">{errors.clientRfqRef?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                </Col>

                                {/* Place of Supply (POS) */}
                                <Col sm="12">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                        <Form.Select
                                            id="placeOfSupply"
                                            disabled={isLocked}
                                            value={watchedPlaceOfSupply !== undefined && watchedPlaceOfSupply !== null ? watchedPlaceOfSupply : (getValues("placeOfSupply") || quotationData?.placeOfSupply || quotationData?.place_of_supply || 'Maharashtra (State Code: 27)')}
                                            isInvalid={!!errors.placeOfSupply}
                                            {...register("placeOfSupply", {
                                                onChange: (e) => setValue("placeOfSupply", e.target.value, { shouldValidate: true, shouldDirty: true })
                                            })}
                                        >
                                            <option value="">Select Place of Supply (State / UT)...</option>
                                            {GST_STATE_OPTIONS.map((st) => (
                                                <option key={st.code} value={st.value}>
                                                    {st.label}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Label htmlFor="placeOfSupply">
                                            Place of Supply (POS) <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control.Feedback type="invalid">{errors.placeOfSupply?.message}</Form.Control.Feedback>
                                    </Form.Floating>
                                </Col>
                            </Row>
                        </div>

                        {/* Tax Rule & Supply Jurisdiction Status Callout */}
                        <div className="pos-tax-status-box mt-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2">
                                    <FaGlobe className={isInterState ? 'text-primary' : 'text-success'} size={13} />
                                    <span className="fw-bold small text-dark">
                                        {isInterState ? 'Inter-State Supply (IGST Applicable)' : 'Intra-State Supply (CGST + SGST Applicable)'}
                                    </span>
                                </div>
                                <Badge bg={isInterState ? 'primary' : 'success'} className="px-2 py-0.5 rounded-pill" style={{ fontSize: '10px' }}>
                                    {isInterState ? 'IGST 18%' : 'CGST 9% + SGST 9%'}
                                </Badge>
                            </div>
                            <div className="text-muted small mt-1 d-flex align-items-center gap-1.5" style={{ fontSize: '11px' }}>
                                <span>Origin: <strong>Maharashtra (27)</strong></span>
                                <span>•</span>
                                <span>Destination: <strong>{watchedPlaceOfSupply || 'Maharashtra (27)'}</strong></span>
                            </div>
                        </div>
                    </Col>

                    {/* Column 2 (Right): Customer & Invoicing Particulars */}
                    <Col lg="6" md="12" className="col-divider-right">
                        <div className="column-group-header mb-3 pb-1 border-bottom d-flex align-items-center gap-2">
                            <FaBuilding className="text-danger" size={12} />
                            <span className="fw-bold small text-dark text-uppercase">
                                Customer & Invoicing Particulars
                            </span>
                        </div>

                        <Row className="g-3 align-items-stretch">
                            {/* Customer / Buyer Name */}
                            <Col sm="12">
                                <PartyAutocompleteInput
                                    value={watchedCustomerName || ''}
                                    onChange={(e) => setValue('customerName', e.target.value, { shouldValidate: true, shouldDirty: true })}
                                    onSelectParty={handlePartySelect}
                                    onClearParty={handleClearParty}
                                    onDetachParty={handleDetachParty}
                                    isInvalid={!!errors.customerName}
                                    errorMessage={errors.customerName?.message}
                                    placeholder="Search party by name or code..."
                                    label="Customer Name"
                                    required
                                    disabled={isLocked}
                                    {...register('customerName')}
                                />
                            </Col>

                            {/* GST Registered Toggle + GSTIN No */}
                            <Col sm="4" className="d-flex align-items-center">
                                <div
                                    className={`gst-toggle-box w-100 ${Boolean(watchedHasGst || quotationData?.gstNumber || quotationData?.gst_number) ? 'active' : ''}`}
                                    onClick={() => {
                                        if (isLocked) return;
                                        const nextVal = !watchedHasGst;
                                        setValue("hasGst", nextVal, { shouldValidate: true, shouldDirty: true });
                                        if (!nextVal) {
                                            setValue("gstNumber", "", { shouldValidate: true, shouldDirty: true });
                                        }
                                    }}
                                >
                                    <span className="gst-label-text">
                                        GST Reg.
                                    </span>
                                    <FormCheck
                                        type="switch"
                                        id="hasGst"
                                        checked={Boolean(watchedHasGst !== undefined ? watchedHasGst : (quotationData?.gstNumber || quotationData?.gst_number))}
                                        disabled={isLocked}
                                        className="mb-0"
                                        isInvalid={!!errors.hasGst}
                                        {...register("hasGst", {
                                            onChange: (e) => {
                                                const checked = e.target.checked;
                                                setValue("hasGst", checked, { shouldValidate: true, shouldDirty: true });
                                                if (!checked) {
                                                    setValue("gstNumber", "", { shouldValidate: true, shouldDirty: true });
                                                }
                                            }
                                        })}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </Col>

                            <Col sm="8">
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="gstNumber"
                                        placeholder={Boolean(watchedHasGst || quotationData?.gstNumber || quotationData?.gst_number) ? "GSTIN No. (15 Characters)" : "GST Not Applicable (Toggle switch to enter)"}
                                        disabled={!Boolean(watchedHasGst || quotationData?.gstNumber || quotationData?.gst_number) || isLocked}
                                        maxLength={15}
                                        tabIndex={!Boolean(watchedHasGst || quotationData?.gstNumber || quotationData?.gst_number) ? -1 : 0}
                                        className={`text-uppercase font-monospace ${!Boolean(watchedHasGst || quotationData?.gstNumber || quotationData?.gst_number) ? 'form-control-readonly-modern' : ''}`}
                                        value={watchedGstNumber !== undefined && watchedGstNumber !== null ? watchedGstNumber : (getValues("gstNumber") || quotationData?.gstNumber || quotationData?.gst_number || '')}
                                        isInvalid={!!errors.gstNumber}
                                        {...register("gstNumber", {
                                            onChange: (e) => {
                                                const upper = (e.target.value || "").toUpperCase();
                                                setValue("gstNumber", upper, { shouldValidate: true, shouldDirty: true });
                                                if (upper.length >= 2) {
                                                    const stateCode = upper.substring(0, 2);
                                                    const dbState = findDbStateByGstCode(stateCode, billingStates);
                                                    const posStateName = dbState?.name || GST_STATE_DATA[stateCode]?.name;
                                                    setValue("placeOfSupply", formatPlaceOfSupplyDisplay(posStateName, stateCode), { shouldValidate: true, shouldDirty: true });
                                                }
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="gstNumber">
                                        GSTIN No. {Boolean(watchedHasGst || quotationData?.gstNumber || quotationData?.gst_number) ? <span className="text-danger">*</span> : <span className="text-muted small fst-italic ms-1">(Not Applicable)</span>}
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.gstNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Contact Person */}
                            <Col sm="12">
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="contactPerson"
                                        placeholder="Contact Person"
                                        disabled={isLocked}
                                        value={watchedContactPerson !== undefined && watchedContactPerson !== null ? watchedContactPerson : (getValues("contactPerson") || quotationData?.contactPerson || quotationData?.contact_person || '')}
                                        isInvalid={!!errors.contactPerson}
                                        {...register("contactPerson", {
                                            onChange: (e) => setValue("contactPerson", e.target.value, { shouldValidate: true, shouldDirty: true })
                                        })}
                                    />
                                    <Form.Label htmlFor="contactPerson">Contact Person</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.contactPerson?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Contact Phone & Email */}
                            <Col sm="6">
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="contactPhone"
                                        placeholder="Contact Phone"
                                        disabled={isLocked}
                                        value={watchedContactPhone !== undefined && watchedContactPhone !== null ? watchedContactPhone : (getValues("contactPhone") || quotationData?.contactPhone || quotationData?.contact_phone || '')}
                                        isInvalid={!!errors.contactPhone}
                                        {...register("contactPhone", {
                                            onChange: (e) => setValue("contactPhone", e.target.value, { shouldValidate: true, shouldDirty: true })
                                        })}
                                    />
                                    <Form.Label htmlFor="contactPhone">Contact Phone</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.contactPhone?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col sm="6">
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="email"
                                        id="contactEmail"
                                        placeholder="Contact Email"
                                        disabled={isLocked}
                                        value={watchedContactEmail !== undefined && watchedContactEmail !== null ? watchedContactEmail : (getValues("contactEmail") || quotationData?.contactEmail || quotationData?.contact_email || '')}
                                        isInvalid={!!errors.contactEmail}
                                        {...register("contactEmail", {
                                            onChange: (e) => setValue("contactEmail", e.target.value, { shouldValidate: true, shouldDirty: true })
                                        })}
                                    />
                                    <Form.Label htmlFor="contactEmail">Contact Email</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.contactEmail?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Billing / Plant Address */}
                            <Col sm="12">
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        as="textarea"
                                        id="billingAddress"
                                        rows={2}
                                        style={{ minHeight: '62px', paddingTop: '18px' }}
                                        placeholder="Billing / Plant Address"
                                        disabled={isLocked}
                                        value={watchedBillingAddress !== undefined && watchedBillingAddress !== null ? watchedBillingAddress : (getValues("billingAddress") || quotationData?.billingAddress || quotationData?.billing_address || '')}
                                        isInvalid={!!errors.billingAddress}
                                        {...register("billingAddress", {
                                            onChange: (e) => setValue("billingAddress", e.target.value, { shouldValidate: true, shouldDirty: true })
                                        })}
                                    />
                                    <Form.Label htmlFor="billingAddress">Billing / Plant Address</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.billingAddress?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>

            {/* SECTION 4: LINE ITEMS & TECHNICAL SPECIFICATIONS */}
            <div className="form-section-card">
                <div className="form-section-header d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="section-title-wrap">
                        <div className="section-icon-badge primary">
                            <FaLayerGroup />
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <h6 className="section-title mb-0">Commercial Line Items & Engineering Specifications</h6>
                                <span className="item-count-badge">
                                    {items.length} {items.length === 1 ? 'Item' : 'Items'}
                                </span>
                            </div>
                            <p className="section-subtitle mb-0">Multi-attribute product search, drawing numbers, quantities, rates, and annexure attachments</p>
                        </div>
                    </div>

                    {/* PDF Annexure - 1 Print Provision */}
                    <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-3 border bg-white shadow-xs">
                        <div className="d-flex flex-column text-end me-1">
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                                Print Technical Specs (Annexure - 1)
                            </span>
                            <span style={{ fontSize: '11px', color: watchedIncludeAnnexure !== false ? '#16a34a' : '#dc2626', fontWeight: 500 }}>
                                {watchedIncludeAnnexure !== false ? '✓ Included in PDF Dossier' : '✕ Omitted from PDF Dossier'}
                            </span>
                        </div>
                        <Form.Check 
                            type="switch"
                            id="include-annexure-switch"
                            checked={watchedIncludeAnnexure !== false}
                            onChange={(e) => setValue('includeAnnexure', e.target.checked, { shouldDirty: true })}
                            disabled={isLocked}
                            className="ms-1 fs-5 custom-theme-switch"
                            style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                        />
                    </div>
                </div>

                <div className="p-0">
                    <QuotationItemsTable
                        items={items}
                        setItems={(updater) => {
                            setItems(prevItems => {
                                const nextItems = typeof updater === 'function' ? updater(prevItems) : updater;
                                setValue('items', nextItems, { shouldValidate: false, shouldDirty: true });
                                return nextItems;
                            });
                        }}
                        register={register}
                        errors={errors}
                        setValue={setValue}
                        clearErrors={clearErrors}
                        products={productsList}
                        isInterState={isInterState}
                        disabled={isLocked}
                        templateType={templateType}
                        tableSpecConfig={tableSpecConfig}
                        onOpenSpecsModal={handleOpenSpecs}
                    />
                </div>
            </div>

            {/* SECTION 5: COMMERCIAL TERMS & DELIVERY LOGISTICS */}
            <div className="form-section-card">
                <div className="form-section-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="section-title-wrap">
                        <div className="section-icon-badge indigo">
                            <FaTruck />
                        </div>
                        <div>
                            <h6 className="section-title">Commercial Terms & Delivery Logistics</h6>
                            <p className="section-subtitle">Payment schedules, delivery timeframe, freight terms, warranty period, and commercial clauses</p>
                        </div>
                    </div>
                    {!isLocked && (
                        <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            className="d-flex align-items-center gap-1.5 px-2.5 py-1 fw-semibold shadow-none text-nowrap"
                            style={{ fontSize: '12px', borderRadius: '6px' }}
                            onClick={handleGenerateStandardTnc}
                            title="Generate and populate standard manufacturing Terms & Conditions"
                        >
                            <FaMagic size={11} />
                            <span>Generate Standard T&C</span>
                        </Button>
                    )}
                </div>

                <Row className="g-3 align-items-stretch">
                    <Col lg="6" md="6" sm="12">
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="text"
                                id="paymentTerms"
                                placeholder="Payment Terms"
                                disabled={isLocked}
                                isInvalid={!!errors.paymentTerms}
                                {...register("paymentTerms")}
                            />
                            <Form.Label htmlFor="paymentTerms">Payment Terms</Form.Label>
                            <Form.Control.Feedback type="invalid">{errors.paymentTerms?.message}</Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    <Col lg="6" md="6" sm="12">
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="text"
                                id="deliveryPeriod"
                                placeholder="Delivery Period"
                                disabled={isLocked}
                                isInvalid={!!errors.deliveryPeriod}
                                {...register("deliveryPeriod")}
                            />
                            <Form.Label htmlFor="deliveryPeriod">Delivery Period</Form.Label>
                            <Form.Control.Feedback type="invalid">{errors.deliveryPeriod?.message}</Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    <Col lg="6" md="6" sm="12">
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="text"
                                id="freightBasis"
                                placeholder="Freight Basis"
                                disabled={isLocked}
                                isInvalid={!!errors.freightBasis}
                                {...register("freightBasis")}
                            />
                            <Form.Label htmlFor="freightBasis">Freight & Transport Terms</Form.Label>
                            <Form.Control.Feedback type="invalid">{errors.freightBasis?.message}</Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    <Col lg="6" md="6" sm="12">
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="text"
                                id="warrantyTerms"
                                placeholder="Warranty Terms"
                                disabled={isLocked}
                                isInvalid={!!errors.warrantyTerms}
                                {...register("warrantyTerms")}
                            />
                            <Form.Label htmlFor="warrantyTerms">Warranty & Guarantee Terms</Form.Label>
                            <Form.Control.Feedback type="invalid">{errors.warrantyTerms?.message}</Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    <Col lg="6" md="12">
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                as="textarea"
                                id="specialNotes"
                                placeholder="Special Technical Notes & Commercial Clauses"
                                style={{ minHeight: '80px', paddingTop: '20px' }}
                                disabled={isLocked}
                                isInvalid={!!errors.specialNotes}
                                {...register("specialNotes")}
                            />
                            <Form.Label htmlFor="specialNotes">Special Technical Notes & Commercial Clauses</Form.Label>
                            <Form.Control.Feedback type="invalid">{errors.specialNotes?.message}</Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    <Col lg="6" md="12">
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                as="textarea"
                                id="termsAndConditions"
                                placeholder="General Terms & Conditions"
                                style={{ minHeight: '80px', paddingTop: '20px' }}
                                disabled={isLocked}
                                isInvalid={!!errors.termsAndConditions}
                                {...register("termsAndConditions")}
                            />
                            <Form.Label htmlFor="termsAndConditions">General Terms & Conditions</Form.Label>
                            <Form.Control.Feedback type="invalid">{errors.termsAndConditions?.message}</Form.Control.Feedback>
                        </Form.Floating>
                    </Col>
                </Row>
            </div>

            {/* SECTION 6: DISCOUNTS, FINANCIAL ADJUSTMENTS & SUMMARY BREAKDOWN */}
            <Row className="g-4 mt-2 mb-4">
                {/* Left Column: Discounts & Financial Adjustments Card + Amount in Words */}
                <Col lg="6">
                    <div className="charges-adjustments-card">
                        <div className="charges-header">
                            <div className="d-flex align-items-center gap-2.5">
                                <div className="charges-icon-badge">
                                    <FaPercent size={13} />
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '14.5px' }}>
                                        Discounts & Financial Adjustments
                                    </h6>
                                    <small className="text-muted" style={{ fontSize: '11px' }}>Taxable deductions & freight allocations</small>
                                </div>
                            </div>
                            <span className="badge bg-light text-secondary border font-monospace px-2 py-1" style={{ fontSize: '10.5px' }}>
                                Commercial Adjustments
                            </span>
                        </div>

                        <Row className="g-3">
                            {/* Overall Discount % */}
                            <Col lg="6" sm="6">
                                <Form.Group className="form-group mb-0">
                                    <Form.Label className="fw-semibold small text-secondary d-flex justify-content-between mb-1">
                                        <span>Overall Discount (%)</span>
                                        <span className="text-muted small">Percent off taxable</span>
                                    </Form.Label>
                                    <div className="input-group">
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            id="discountPercent"
                                            placeholder="0.00"
                                            disabled={isLocked}
                                            className="text-end fw-semibold"
                                            value={watchedDiscountPercent ?? 0}
                                            onFocus={(e) => e.target.select()}
                                            onClick={(e) => e.target.select()}
                                            onChange={(e) => handleDiscountPercentChange(e.target.value)}
                                        />
                                        <span className="input-group-text">%</span>
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Overall Discount Amount (₹) */}
                            <Col lg="6" sm="6">
                                <Form.Group className="form-group mb-0">
                                    <Form.Label className="fw-semibold small text-secondary d-flex justify-content-between mb-1">
                                        <span>Discount Amount (₹)</span>
                                        <span className="text-muted small">Flat deduction</span>
                                    </Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            id="discountAmount"
                                            placeholder="0.00"
                                            disabled={isLocked}
                                            className="text-end fw-semibold"
                                            value={watchedDiscountAmount ?? 0}
                                            onFocus={(e) => e.target.select()}
                                            onClick={(e) => e.target.select()}
                                            onChange={(e) => handleDiscountAmountChange(e.target.value)}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Other Charges (₹) */}
                            <Col lg="6" sm="6">
                                <Form.Group className="form-group mb-0">
                                    <Form.Label className="fw-semibold small text-secondary d-flex justify-content-between mb-1">
                                        <span>Other / Freight Charges (₹)</span>
                                        <span className="text-muted small">Freight / packaging</span>
                                    </Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text">+ ₹</span>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            id="other"
                                            placeholder="0.00"
                                            disabled={isLocked}
                                            className="text-end fw-semibold"
                                            value={watchedOther ?? 0}
                                            onFocus={(e) => e.target.select()}
                                            onClick={(e) => e.target.select()}
                                            onChange={(e) => handleOtherChange(e.target.value)}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>

                            {/* Round Off Input & Auto/Manual Controller */}
                            <Col lg="6" sm="6">
                                <Form.Group className="form-group mb-0">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <Form.Label className="fw-semibold small text-secondary mb-0">
                                            Round Off (₹)
                                        </Form.Label>
                                        {watchedRoundOffManual ? (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-decoration-none text-danger small d-flex align-items-center gap-1"
                                                disabled={isLocked}
                                                onClick={handleResetRoundOffAuto}
                                                title="Recalculate round off automatically"
                                            >
                                                <FaUndo size={10} /> Reset to Auto
                                            </Button>
                                        ) : (
                                            <span className="badge bg-success-subtle text-success small py-0.5 px-2 border border-success-subtle" style={{ fontSize: '10.5px' }}>
                                                Auto-Calculated
                                            </span>
                                        )}
                                    </div>
                                    <div className="input-group">
                                        <span className="input-group-text">± ₹</span>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            id="roundOff"
                                            placeholder="0.00"
                                            disabled={isLocked}
                                            className={`text-end fw-semibold ${watchedRoundOffManual ? 'border-danger bg-danger-subtle bg-opacity-10' : ''}`}
                                            value={watchedRoundOffManual ? (watchedRoundOff ?? '') : Number(totals.roundOff || 0).toFixed(2)}
                                            onFocus={(e) => e.target.select()}
                                            onClick={(e) => e.target.select()}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setValue("roundOffManual", true, { shouldDirty: true });
                                                setValue("roundOff", val, { shouldDirty: true });
                                            }}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (val !== '' && val !== null && val !== undefined && !Number.isNaN(Number(val))) {
                                                    setValue("roundOff", parseFloat(Number(val).toFixed(2)), { shouldValidate: true, shouldDirty: true });
                                                } else {
                                                    setValue("roundOff", 0, { shouldValidate: true, shouldDirty: true });
                                                }
                                            }}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {/* Amount In Words Card */}
                    <div className="amount-in-words-box">
                        <div className="d-flex justify-content-between align-items-center mb-1.5">
                            <div className="words-label">
                                <FaCoins size={13} className="text-danger" />
                                <span>Amount In Words (Indian Rupees)</span>
                            </div>
                            <span className="pos-summary-chip">
                                <span>{isInterState ? 'IGST 18%' : 'CGST 9% + SGST 9%'}</span>
                            </span>
                        </div>
                        <div className="words-text">
                            {numberToIndianRupeesWords(totals.total)}
                        </div>
                        <div className="text-muted small mt-2 d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                            <span>Place of Supply: <strong>{watchedPlaceOfSupply || 'Maharashtra (State Code: 27)'}</strong></span>
                            <span>•</span>
                            <span>{isInterState ? 'Inter-State Offer' : 'Intra-State Offer'}</span>
                        </div>
                    </div>
                </Col>

                {/* Right Column: Quotation Financial Breakdown */}
                <Col lg="6">
                    <div className="invoice-summary-card">
                        <div className="summary-header">
                            <div className="d-flex align-items-center gap-2">
                                <span>Quotation Financial Breakdown</span>
                            </div>
                            <span className="currency-pill">INR (₹)</span>
                        </div>

                        <div className="summary-row">
                            <span className="label">Sub Total (Gross Line Items)</span>
                            <span className="value">₹{totals.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {totals.discountAmount > 0 && (
                            <div className="summary-row text-success">
                                <span className="label">Commercial Discount</span>
                                <span className="value text-success">-₹{totals.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        <div className="summary-row highlight">
                            <span className="label">Taxable Value</span>
                            <span className="value fw-bold text-dark">₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {isInterState ? (
                            <div className="summary-row">
                                <span className="label">
                                    <span>Integrated Tax (IGST)</span>
                                    <span className="tax-rate-pill">18%</span>
                                </span>
                                <span className="value val-tax">₹{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ) : (
                            <>
                                <div className="summary-row">
                                    <span className="label">
                                        <span>Central Tax (CGST)</span>
                                        <span className="tax-rate-pill">9%</span>
                                    </span>
                                    <span className="value val-tax">₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">
                                        <span>State Tax (SGST)</span>
                                        <span className="tax-rate-pill">9%</span>
                                    </span>
                                    <span className="value val-tax">₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </>
                        )}

                        {totals.other > 0 && (
                            <div className="summary-row">
                                <span className="label">Other / Freight Charges</span>
                                <span className="value text-secondary">+₹{totals.other.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        {totals.roundOff !== 0 && (
                            <div className="summary-row">
                                <span className="label">Round Off Adjustment</span>
                                <span className="value">{totals.roundOff > 0 ? `+${totals.roundOff.toFixed(2)}` : totals.roundOff.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="grand-total-banner">
                            <div className="total-title-wrap">
                                <span className="total-title">Total Commercial Offer</span>
                                <span className="net-payable-badge">Net Payable</span>
                            </div>
                            <span className="total-amount">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* FORM BOTTOM ACTION BAR */}
            <div className="quotation-bottom-actions-bar">
                <div className="d-flex align-items-center gap-3">
                    <Button
                        variant="light"
                        className="px-3 py-2 fw-semibold d-flex align-items-center gap-2 border bg-white text-dark shadow-xs"
                        onClick={() => navigate('/sales/quotation')}
                    >
                        <FaArrowLeft size={12} className="text-secondary" />
                        <span>Back to Quotations</span>
                    </Button>

                    <div className="d-none d-md-flex align-items-center gap-2 text-muted small border-start ps-3">
                        <span className="badge bg-light text-dark border">
                            {items.length} {items.length === 1 ? 'Item' : 'Items'}
                        </span>
                        <span>•</span>
                        <span>Total: <strong className="text-dark font-monospace">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2.5 flex-wrap">
                    {/* Live PDF Preview button if in edit mode */}
                    {isEditMode && id && (
                        <Button
                            variant="outline-danger"
                            className="d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold border-danger-subtle"
                            onClick={() => setShowPdfModal(true)}
                            title="Generate and preview commercial PDF"
                        >
                            <FaFilePdf size={13} />
                            <span>Preview PDF</span>
                        </Button>
                    )}

                    {isRevisionMode ? (
                        <>
                            <Button
                                variant="outline-secondary"
                                className="px-3.5 py-2 fw-semibold"
                                onClick={() => {
                                    setIsRevisionMode(false);
                                    setValue('revisionNo', baseRevisionNo);
                                }}
                            >
                                Cancel Revision
                            </Button>
                            <Button
                                variant="primary"
                                className="d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
                                disabled={revisionMutation.isLoading}
                                onClick={handleSaveRevision}
                            >
                                {revisionMutation.isLoading ? <Spinner size="sm" /> : <FaSave size={14} />}
                                <span>Save Revision REV-{String(nextRevisionNo).padStart(2, '0')}</span>
                            </Button>
                        </>
                    ) : isForceEditMode ? (
                        <>
                            <Button
                                variant="outline-secondary"
                                className="px-3.5 py-2 fw-semibold"
                                onClick={() => setIsForceEditMode(false)}
                            >
                                Cancel Direct Edit
                            </Button>
                            <Button
                                variant="warning"
                                className="d-flex align-items-center gap-2 px-4 py-2 fw-bold text-dark shadow-sm"
                                disabled={updateMutation.isLoading}
                                onClick={handleForceUpdateSubmit}
                            >
                                {updateMutation.isLoading ? <Spinner size="sm" /> : <FaSave size={14} />}
                                <span>Update Approved Quotation</span>
                            </Button>
                        </>
                    ) : isLocked ? (
                        <>
                            <Button
                                variant="outline-secondary"
                                className="d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold"
                                onClick={() => setIsForceEditMode(true)}
                                title="Directly edit this approved quotation"
                            >
                                <FaEdit size={13} />
                                <span>Admin Direct Edit</span>
                            </Button>
                            <Button
                                variant="danger"
                                className="btn-action-primary d-flex align-items-center gap-2"
                                disabled={revisionMutation.isLoading}
                                onClick={handleCreateRevision}
                                title="Unlock form to modify rates, specs and save as new formal revision"
                            >
                                <FaHistory size={14} />
                                <span>Create Revision (REV-{String(nextRevisionNo).padStart(2, '0')})</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="outline-secondary"
                                className="d-flex align-items-center gap-2 px-3.5 py-2 fw-semibold bg-white border"
                                disabled={createMutation.isLoading || updateMutation.isLoading}
                                onClick={handleSaveDraft}
                            >
                                <FaSave size={13} className="text-secondary" />
                                <span>Save Draft</span>
                            </Button>
                            <Button
                                variant="danger"
                                className="btn-action-primary d-flex align-items-center gap-2"
                                disabled={createMutation.isLoading || updateMutation.isLoading}
                                onClick={handleSubmitForApproval}
                            >
                                {(createMutation.isLoading || updateMutation.isLoading) ? <Spinner size="sm" /> : <FaPaperPlane size={14} />}
                                <span>Submit for Approval</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Approved Quotation Revision Decision Modal */}
            <Modal
                show={showRevisionModal}
                onHide={() => setShowRevisionModal(false)}
                centered
                className="revision-decision-modal"
            >
                <Modal.Header closeButton className="border-bottom-0 pb-1">
                    <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold text-dark">
                        <FaLock className="text-warning" />
                        <span>Quotation #{watchedQuotationNo} is Approved & Locked</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="py-2">
                    <p className="text-secondary mb-3" style={{ fontSize: '0.88rem', lineHeight: '1.5' }}>
                        This commercial quotation is locked for auditing integrity. To make changes to line items, prices, or technical specifications, please choose one of the options below:
                    </p>
                    <div className="d-flex flex-column gap-2.5">
                        <div
                            className="p-3 rounded-3 border d-flex align-items-start gap-3 revision-option-card"
                            style={{ background: '#f8fafc', borderColor: '#cbd5e1', cursor: 'pointer' }}
                            onClick={() => {
                                setShowRevisionModal(false);
                                setValue('revisionNo', nextRevisionNo);
                                setIsRevisionMode(true);
                                setIsForceEditMode(false);
                            }}
                        >
                            <div className="rounded-circle bg-primary-subtle text-primary p-2 flex-shrink-0 mt-0.5">
                                <FaHistory size={16} />
                            </div>
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between mb-0.5">
                                    <strong className="text-dark">Create Formal Revision (REV-{String(nextRevisionNo).padStart(2, '0')})</strong>
                                    <Badge bg="primary">Recommended</Badge>
                                </div>
                                <small className="text-muted d-block">
                                    Unlocks all items, rates, and specifications to save as formal revision REV-{String(nextRevisionNo).padStart(2, '0')}.
                                </small>
                            </div>
                        </div>

                        <div
                            className="p-3 rounded-3 border d-flex align-items-start gap-3 revision-option-card"
                            style={{ background: '#fffbeb', borderColor: '#fde68a', cursor: 'pointer' }}
                            onClick={() => {
                                setShowRevisionModal(false);
                                setIsForceEditMode(true);
                                setIsRevisionMode(false);
                            }}
                        >
                            <div className="rounded-circle bg-warning-subtle text-warning p-2 flex-shrink-0 mt-0.5">
                                <FaEdit size={16} />
                            </div>
                            <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between mb-0.5">
                                    <strong className="text-dark">Admin Direct Edit (Force Update)</strong>
                                    <Badge bg="warning" text="dark">Admin Override</Badge>
                                </div>
                                <small className="text-muted d-block">
                                    Directly overwrite the approved quotation without creating a revision. Approval will be reset to PENDING.
                                </small>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-top-0 pt-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => setShowRevisionModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modals */}
            <TechnicalSpecsModal
                show={showSpecsModal}
                onHide={() => setShowSpecsModal(false)}
                item={activeSpecIdx !== null && items[activeSpecIdx] ? items[activeSpecIdx] : activeSpecItem}
                onSave={handleSaveSpecs}
            />

            <MatrixRowSpecsModal
                show={showMatrixSpecsModal}
                onHide={() => setShowMatrixSpecsModal(false)}
                item={activeSpecIdx !== null && items[activeSpecIdx] ? items[activeSpecIdx] : activeSpecItem}
                tableSpecConfig={tableSpecConfig}
                onSave={handleSaveSpecs}
            />

            <TableSpecConfigModal
                show={showConfigModal}
                onHide={() => setShowConfigModal(false)}
                config={tableSpecConfig}
                onSave={(newConfig) => {
                    setTableSpecConfig(newConfig);
                    setValue('tableSpecConfig', newConfig, { shouldDirty: true });
                }}
            />

            <QuotationPdfModal
                show={showPdfModal}
                onHide={() => setShowPdfModal(false)}
                quotationId={id}
                quotationNo={watchedQuotationNo}
                revisionNo={watchedRevisionNo}
                initialIncludeAnnexure={watchedIncludeAnnexure !== false}
            />
        </div>
    );
};

export default QuotationForm;
