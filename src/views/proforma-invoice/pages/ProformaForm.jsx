import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Form, Row, Col, Button, Badge, Spinner, FormCheck } from 'react-bootstrap';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import moment from 'moment';
import { useSelector } from 'react-redux';
import {
    FaArrowLeft, FaSave, FaPaperPlane, FaFileInvoiceDollar,
    FaCalendarAlt, FaBuilding, FaTruck, FaGlobe, FaCoins,
    FaPercent, FaUndo, FaLock, FaCheck, FaTimes, FaMoneyBillWave,
    FaRegCalendarAlt
} from 'react-icons/fa';

import {
    useProformaById,
    useNextProformaNumber,
    useProformaAutoNumber,
    useProformaCalculation,
    useProformaHydrate,
    useProformaParty,
    useProformaSubmit,
    useProformaItems,
    createBlankProformaItem
} from '../hooks';

import { useCountryState } from '../../dashboard/hooks/api.hooks';
import PartyAutocompleteInput from '../../invoice/components/PartyAutocompleteInput';
import ProformaItemsTable from '../components/ProformaItemsTable';
import {
    findDbStateByGstCode,
    formatPlaceOfSupplyDisplay,
    normalizePlaceOfSupplyDisplay,
    GST_STATE_OPTIONS,
    GST_STATE_DATA
} from '../../../utilities/gstStateHelper';
import { numberToIndianRupeesWords } from '../../../utilities/numberToWords';
import { proformaValidationSchema } from '../../../validation/proforma.validation';
import '../../invoice/pages/invoice.scss';
import './proforma.scss';

export const DEFAULT_PROFORMA_TNC = `1. This Proforma Invoice is issued for commercial advance payment and order confirmation purposes only, not as a GST Tax Invoice.
2. Advance payment as specified must be credited to our bank account before production/dispatch commences.
3. Tax Invoice will be issued upon final dispatch of goods in accordance with GST regulations.
4. Delivery timeline begins upon receipt of advance payment and drawing approval.
5. Immediate inspection and confirmation required upon receipt of material.
6. All transactions and disputes are subject to Nashik (Maharashtra) jurisdiction only.`;

export const DEFAULT_PROFORMA_NOTES = `1. Please mention Proforma Invoice number in your bank remittance / NEFT / RTGS narration.
2. Prices and terms are firm based on customer-approved drawings and PO specifications.`;

const ProformaForm = ({ mode = 'create' }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const quotationId = searchParams.get('quotationId');

    const isEditMode = mode === 'edit';
    const isDuplicateMode = mode === 'duplicate';

    // Active firm & branch from Redux
    const { activeFirm, activeBranch } = useSelector((state) => state.firmReducer || {});

    // Geographic states
    const { data: billingStates = [] } = useCountryState();

    // Local state
    const [status, setStatus] = useState('DRAFT');
    const [isRoundOffManual, setIsRoundOffManual] = useState(false);
    const [items, setItems] = useState([createBlankProformaItem(0)]);

    // Fetch existing proforma if in edit or duplicate mode
    const { data: proformaData, isLoading: isLoadingProforma } = useProformaById(id, {
        enabled: Boolean(id) && (isEditMode || isDuplicateMode)
    });

    // Expected next proforma number
    const { data: nextProformaNumber } = useNextProformaNumber();

    // React Hook Form
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        reset,
        control,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(proformaValidationSchema(isEditMode)),
        defaultValues: {
            proformaNo: '',
            proformaDate: new Date(),
            dueDays: 15,
            dueDate: moment().add(15, 'days').toDate(),
            orderRefNo: '',
            orderRefDate: null,
            quotationId: quotationId ? Number(quotationId) : null,
            taxInvoiceId: null,

            // Buyer
            partyId: null,
            customerName: '',
            hasGst: false,
            gstNumber: '',
            contactPerson: '',
            contactPhone: '',
            contactEmail: '',
            billingAddress: '',
            shippingAddress: '',
            placeOfSupply: '27-Maharashtra',

            // Dispatch
            dispatchThrough: 'Road Transport',
            destination: '',

            // Terms
            paymentTerms: 'Advance against Proforma Invoice',
            deliveryPeriod: '3-4 Weeks from advance receipt',
            freightBasis: 'Ex-Works / Extra at actuals',
            warrantyTerms: 'Immediate check upon receipt',
            specialNotes: DEFAULT_PROFORMA_NOTES,
            termsAndConditions: DEFAULT_PROFORMA_TNC,

            // Financials
            subTotal: 0,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            other: 0,
            roundOff: 0,
            roundOffManual: false,
            total: 0,
            advanceAmountRequested: 0,
            advanceReceived: 0,
            status: 'DRAFT',

            items: [createBlankProformaItem(0)]
        }
    });

    // Essential Form Watches (Only fields needed for interactive calculations or reactive UI)
    const [
        watchedCustomerName,
        watchedPlaceOfSupply,
        watchedHasGst,
        watchedProformaDate,
        watchedDueDays,
        watchedDiscountPercent,
        watchedOther,
        watchedRoundOff,
        watchedAdvanceRequested
    ] = useWatch({
        control,
        name: [
            'customerName',
            'placeOfSupply',
            'hasGst',
            'proformaDate',
            'dueDays',
            'discountPercent',
            'other',
            'roundOff',
            'advanceAmountRequested'
        ]
    });

    // Synchronize due date when proformaDate or dueDays changes
    useEffect(() => {
        if (watchedProformaDate && watchedDueDays !== undefined) {
            const days = parseInt(watchedDueDays, 10);
            if (!isNaN(days)) {
                const currentDueDate = getValues('dueDate');
                const nextDueDate = moment(watchedProformaDate).add(days, 'days').toDate();
                if (!currentDueDate || Math.abs(moment(currentDueDate).diff(moment(nextDueDate), 'days')) > 0) {
                    setValue('dueDate', nextDueDate, { shouldValidate: false, shouldDirty: false });
                }
            }
        }
    }, [watchedProformaDate, watchedDueDays, setValue, getValues]);

    // Custom Hook: Auto-Numbering (Preview and sync)
    useProformaAutoNumber({
        isEditMode,
        isDuplicateMode,
        nextProformaNumber,
        setValue,
        getValues
    });

    // Custom Hook: Party Selector
    const { handlePartySelect, handleClearParty, handleDetachParty } = useProformaParty({
        setValue,
        billingStates
    });

    // Custom Hook: Financial Calculations
    const {
        isInterState,
        rawSubTotal,
        itemsTaxableSum,
        docDiscountAmount,
        netTaxableAmount,
        cgst,
        sgst,
        igst,
        totalTaxes,
        otherCharges,
        totalBeforeRound,
        autoRoundOff,
        roundOff,
        grandTotal,
        reqAdvance,
        advancePercent,
        handleDiscountPercentChange,
        handleOtherChange,
        handleRoundOffChange,
        handleResetRoundOffAuto
    } = useProformaCalculation({
        items,
        watchedPlaceOfSupply,
        watchedDiscountPercent,
        watchedOther,
        watchedRoundOff,
        isRoundOffManual,
        setIsRoundOffManual,
        advanceAmountRequested: watchedAdvanceRequested,
        setValue
    });

    // Quick Advance Presets Handler
    const handleSetAdvancePreset = useCallback((ratio) => {
        const amt = parseFloat(((grandTotal * ratio) / 100).toFixed(2));
        setValue('advanceAmountRequested', amt, { shouldValidate: true, shouldDirty: true });
    }, [grandTotal, setValue]);

    // Balance amount payable
    const balancePayable = useMemo(() => {
        return Math.max(0, parseFloat((grandTotal - reqAdvance).toFixed(2)));
    }, [grandTotal, reqAdvance]);

    // Custom Hook: Items Management
    const {
        handleAddItem,
        handleRemoveItem,
        handleItemChange,
        handleProductSelect
    } = useProformaItems({
        items,
        setItems,
        setValue,
        isInterState
    });

    // Custom Hook: Hydrate Data
    useProformaHydrate({
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
    });

    // Custom Hook: Form Submissions
    const {
        isSubmitting,
        handleSaveDraft,
        handleSaveAndSend,
        handleSaveChanges
    } = useProformaSubmit({
        id,
        isEditMode,
        isDuplicateMode,
        activeFirm,
        activeBranch,
        items,
        totals: {
            rawSubTotal,
            docDiscountAmount,
            netTaxableAmount,
            cgst,
            sgst,
            igst,
            otherCharges,
            roundOff,
            grandTotal
        },
        status,
        handleSubmit
    });

    if (isLoadingProforma) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="danger" />
                <span className="ms-2 text-muted">Loading Proforma Invoice details...</span>
            </div>
        );
    }

    return (
        <div className="proforma-form-wrapper pb-5">
            {/* Header Sticky Action Bar */}
            <Card className="shadow-sm border-0 mb-3 sticky-top bg-white z-2">
                <Card.Body className="py-2.5 px-3">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-3">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => navigate('/sales/proforma-invoice')}
                                className="d-flex align-items-center gap-1.5"
                            >
                                <FaArrowLeft size={12} /> Back
                            </Button>
                            <div>
                                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                    <FaFileInvoiceDollar className="theme-crimson" size={18} />
                                    <span>
                                        {isEditMode ? `Edit Proforma #${proformaData?.proforma_no || ''}` :
                                            isDuplicateMode ? `Duplicate Proforma (from #${proformaData?.proforma_no || ''})` :
                                            'Create Proforma Invoice'}
                                    </span>
                                </h5>
                                {quotationId && (
                                    <span className="text-muted small">
                                        Derived from Quotation <span className="fw-semibold theme-crimson">#{quotationId}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <span className={`status-badge status-${(status || 'draft').toLowerCase().replace('_', '-')}`}>
                                {status || 'DRAFT'}
                            </span>

                            <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => navigate('/sales/proforma-invoice')}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>

                            {isEditMode && !isDuplicateMode ? (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={handleSaveChanges}
                                    disabled={isSubmitting}
                                    className="btn-crimson d-flex align-items-center gap-1.5 fw-semibold"
                                >
                                    {isSubmitting ? <Spinner animation="border" size="sm" /> : <FaSave size={12} />}
                                    <span>Update Proforma</span>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={handleSaveDraft}
                                        disabled={isSubmitting}
                                        className="btn-outline-crimson d-flex align-items-center gap-1.5 fw-semibold"
                                    >
                                        {isSubmitting ? <Spinner animation="border" size="sm" /> : <FaSave size={12} />}
                                        <span>Save as Draft</span>
                                    </Button>

                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={handleSaveAndSend}
                                        disabled={isSubmitting}
                                        className="btn-crimson d-flex align-items-center gap-1.5 fw-semibold"
                                    >
                                        {isSubmitting ? <Spinner animation="border" size="sm" /> : <FaPaperPlane size={12} />}
                                        <span>Save & Mark Sent</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>

            <Form>
                {/* 1. Document Core Details (Using Modern Form.Floating) */}
                <div className="form-section-card">
                    <div className="form-section-header">
                        <div className="section-title">
                            <FaCalendarAlt className="theme-crimson" size={13} />
                            <span>Proforma Invoice Particulars & References</span>
                        </div>
                    </div>
                    <div className="form-section-body">
                        <Row className="g-3 align-items-stretch">
                            {/* Proforma Number (Readonly with Lock & AUTO badge) */}
                            <Col sm={6} md={3}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0 readonly-floating-wrapper">
                                    <Form.Control
                                        type="text"
                                        id="proformaNo"
                                        placeholder="Proforma Invoice No"
                                        isInvalid={Boolean(errors.proformaNo)}
                                        readOnly
                                        tabIndex={-1}
                                        className="form-control-readonly-modern font-monospace"
                                        {...register('proformaNo')}
                                        value={getValues('proformaNo') || proformaData?.proforma_no || nextProformaNumber || ''}
                                    />
                                    <Form.Label htmlFor="proformaNo" className="d-flex align-items-center gap-1.5">
                                        <FaLock size={10} className="text-muted flex-shrink-0" />
                                        <span>Proforma No</span>
                                        {!isEditMode && <span className="readonly-pill-tag primary">AUTO #</span>}
                                        {isEditMode && <span className="readonly-pill-tag">LOCKED</span>}
                                    </Form.Label>
                                    <span className="readonly-watermark-icon" title="System-generated consecutive identifier">
                                        <FaLock size={11} />
                                    </span>
                                    <Form.Control.Feedback type="invalid">{errors.proformaNo?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Proforma Date (Flatpickr) */}
                            <Col sm={6} md={3}>
                                <Controller
                                    name="proformaDate"
                                    control={control}
                                    defaultValue={new Date()}
                                    render={({ field, fieldState: { error } }) => (
                                        <div className="position-relative">
                                            <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                                <Flatpickr
                                                    id="proformaDate"
                                                    value={field.value}
                                                    onChange={(selectedDates) => {
                                                        const date = selectedDates[0] || null;
                                                        field.onChange(date);
                                                        const days = parseInt(getValues('dueDays') || 15, 10);
                                                        if (date && !isNaN(days)) {
                                                            setValue(
                                                                'dueDate',
                                                                moment(date).add(days, 'days').toDate(),
                                                                { shouldDirty: true, shouldValidate: true }
                                                            );
                                                        }
                                                    }}
                                                    options={{
                                                        dateFormat: "d M Y",
                                                        allowInput: true
                                                    }}
                                                    className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                    placeholder=" "
                                                    disabled={isSubmitting}
                                                />
                                                <Form.Label htmlFor="proformaDate">
                                                    Proforma Date <span className="text-danger">*</span>
                                                </Form.Label>
                                                <FaRegCalendarAlt className="floating-date-icon" />
                                            </Form.Floating>
                                            {error && (
                                                <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.75rem' }}>
                                                    {error.message}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>

                            {/* Due in Days */}
                            <Col sm={6} md={3}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        max="365"
                                        id="dueDays"
                                        placeholder="Due in (Days)"
                                        isInvalid={Boolean(errors.dueDays)}
                                        disabled={isSubmitting}
                                        {...register('dueDays', {
                                            onChange: (e) => {
                                                const days = parseInt(e.target.value, 10);
                                                const pDate = getValues('proformaDate');
                                                if (pDate && !isNaN(days)) {
                                                    setValue(
                                                        'dueDate',
                                                        moment(pDate).add(days, 'days').toDate(),
                                                        { shouldDirty: true, shouldValidate: true }
                                                    );
                                                }
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="dueDays">
                                        Due in (Days) <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.dueDays?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Due Date (Flatpickr) */}
                            <Col sm={6} md={3}>
                                <Controller
                                    name="dueDate"
                                    control={control}
                                    defaultValue={moment().add(15, 'days').toDate()}
                                    render={({ field, fieldState: { error } }) => (
                                        <div className="position-relative">
                                            <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                                <Flatpickr
                                                    id="dueDate"
                                                    value={field.value}
                                                    onChange={(selectedDates) => {
                                                        const date = selectedDates[0] || null;
                                                        field.onChange(date);
                                                        const pDate = getValues('proformaDate');
                                                        if (pDate && date) {
                                                            const days = moment(date)
                                                                .startOf('day')
                                                                .diff(moment(pDate).startOf('day'), 'days');
                                                            setValue('dueDays', Math.max(0, days), {
                                                                shouldDirty: true,
                                                                shouldValidate: true
                                                            });
                                                        }
                                                    }}
                                                    options={{
                                                        dateFormat: "d M Y",
                                                        allowInput: true
                                                    }}
                                                    className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                    placeholder=" "
                                                    disabled={isSubmitting}
                                                />
                                                <Form.Label htmlFor="dueDate">Due Date</Form.Label>
                                                <FaRegCalendarAlt className="floating-date-icon" />
                                            </Form.Floating>
                                            {error && (
                                                <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.75rem' }}>
                                                    {error.message}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>

                            {/* Client PO / Order Ref */}
                            <Col sm={6} md={3}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="orderRefNo"
                                        placeholder="Client PO / Order Ref"
                                        disabled={isSubmitting}
                                        {...register('orderRefNo')}
                                    />
                                    <Form.Label htmlFor="orderRefNo">Client PO / Order Ref</Form.Label>
                                </Form.Floating>
                            </Col>

                            {/* Order / PO Date (Flatpickr) */}
                            <Col sm={6} md={3}>
                                <Controller
                                    name="orderRefDate"
                                    control={control}
                                    defaultValue={null}
                                    render={({ field, fieldState: { error } }) => (
                                        <div className="position-relative">
                                            <Form.Floating className={`custom-form-floating custom-form-floating-sm floating-date-field form-group mb-0 ${field.value ? 'has-value' : ''}`}>
                                                <Flatpickr
                                                    id="orderRefDate"
                                                    value={field.value}
                                                    onChange={(selectedDates) => {
                                                        field.onChange(selectedDates[0] || null);
                                                    }}
                                                    options={{
                                                        dateFormat: "d M Y",
                                                        allowInput: true
                                                    }}
                                                    className={`form-control flatpickrdate ${error ? "is-invalid" : ""}`}
                                                    placeholder=" "
                                                    disabled={isSubmitting}
                                                />
                                                <Form.Label htmlFor="orderRefDate">Order / PO Date</Form.Label>
                                                <FaRegCalendarAlt className="floating-date-icon" />
                                            </Form.Floating>
                                            {error && (
                                                <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.75rem' }}>
                                                    {error.message}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                />
                            </Col>

                            {/* Dispatch Mode */}
                            <Col sm={6} md={3}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="dispatchThrough"
                                        placeholder="Dispatch Mode"
                                        {...register('dispatchThrough')}
                                    />
                                    <Form.Label htmlFor="dispatchThrough">Dispatch Mode / Carrier</Form.Label>
                                </Form.Floating>
                            </Col>

                            {/* Destination */}
                            <Col sm={6} md={3}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="destination"
                                        placeholder="Destination City"
                                        {...register('destination')}
                                    />
                                    <Form.Label htmlFor="destination">Destination / Station</Form.Label>
                                </Form.Floating>
                            </Col>

                            {/* Place of Supply (POS) */}
                            <Col sm={12} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Select
                                        id="placeOfSupply"
                                        value={watchedPlaceOfSupply || '27-Maharashtra'}
                                        {...register('placeOfSupply')}
                                    >
                                        <option value="">Select Place of Supply...</option>
                                        {GST_STATE_OPTIONS.map(st => (
                                            <option key={st.code} value={st.value}>
                                                {st.label}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Label htmlFor="placeOfSupply" className="d-flex justify-content-between align-items-center w-100 pe-3">
                                        <span>Place of Supply (POS)</span>
                                        <span className={`badge ${isInterState ? 'bg-primary' : 'bg-success'} font-size-10`}>
                                            {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                                        </span>
                                    </Form.Label>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* 2. Buyer Information */}
                <div className="form-section-card">
                    <div className="form-section-header d-flex justify-content-between align-items-center">
                        <div className="section-title">
                            <FaBuilding className="theme-crimson" size={13} />
                            <span>Customer & Invoicing Particulars</span>
                        </div>
                    </div>
                    <div className="form-section-body">
                        <Row className="g-3 align-items-stretch">
                            {/* Party Autocomplete for Customer Name */}
                            <Col sm={12} md={6}>
                                <PartyAutocompleteInput
                                    value={watchedCustomerName || getValues('customerName') || ''}
                                    onChange={(e) => {
                                        const val = e?.target ? e.target.value : (typeof e === 'string' ? e : '');
                                        setValue('customerName', val, { shouldValidate: true, shouldDirty: true });
                                    }}
                                    onSelectParty={handlePartySelect}
                                    onClearParty={handleClearParty}
                                    onDetachParty={handleDetachParty}
                                    placeholder="Search party by name or code..."
                                    label="Customer Name"
                                    required
                                    isInvalid={Boolean(errors.customerName)}
                                    errorMessage={errors.customerName?.message}
                                />
                            </Col>

                            {/* GST Registered Toggle + GSTIN No */}
                            <Col sm={4} md={2} className="d-flex align-items-center">
                                <div
                                    className={`gst-toggle-box w-100 ${Boolean(watchedHasGst) ? 'active' : ''}`}
                                    onClick={() => {
                                        const nextVal = !watchedHasGst;
                                        setValue('hasGst', nextVal, { shouldValidate: true, shouldDirty: true });
                                        if (!nextVal) {
                                            setValue('gstNumber', '', { shouldValidate: true, shouldDirty: true });
                                        }
                                    }}
                                >
                                    <span className="gst-label-text">GST Reg.</span>
                                    <FormCheck
                                        type="switch"
                                        id="hasGst"
                                        checked={Boolean(watchedHasGst)}
                                        className="mb-0"
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setValue('hasGst', checked, { shouldValidate: true, shouldDirty: true });
                                            if (!checked) {
                                                setValue('gstNumber', '', { shouldValidate: true, shouldDirty: true });
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </Col>

                            <Col sm={8} md={4}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="gstNumber"
                                        placeholder={Boolean(watchedHasGst) ? "GSTIN No. (15 Characters)" : "GST Not Applicable"}
                                        disabled={!Boolean(watchedHasGst)}
                                        maxLength={15}
                                        tabIndex={!Boolean(watchedHasGst) ? -1 : 0}
                                        className={`text-uppercase font-monospace ${!Boolean(watchedHasGst) ? 'form-control-readonly-modern' : ''}`}
                                        isInvalid={Boolean(errors.gstNumber)}
                                        {...register('gstNumber', {
                                            onChange: (e) => {
                                                const upper = (e.target.value || '').toUpperCase();
                                                setValue('gstNumber', upper, { shouldValidate: true, shouldDirty: true });
                                                if (upper.length >= 2) {
                                                    const stateCode = upper.substring(0, 2);
                                                    const dbState = findDbStateByGstCode(stateCode, billingStates);
                                                    const posStateName = dbState?.name || GST_STATE_DATA[stateCode]?.name;
                                                    setValue('placeOfSupply', formatPlaceOfSupplyDisplay(posStateName, stateCode), { shouldValidate: true, shouldDirty: true });
                                                }
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="gstNumber">
                                        GSTIN No. {Boolean(watchedHasGst) ? <span className="text-danger">*</span> : <span className="text-muted small fst-italic ms-1">(Not Applicable)</span>}
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.gstNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Contact Person */}
                            <Col sm={12} md={4}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="contactPerson"
                                        placeholder="Contact Person"
                                        {...register('contactPerson')}
                                    />
                                    <Form.Label htmlFor="contactPerson">Contact Person</Form.Label>
                                </Form.Floating>
                            </Col>

                            {/* Contact Phone */}
                            <Col sm={6} md={4}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="contactPhone"
                                        placeholder="Contact Phone"
                                        isInvalid={Boolean(errors.contactPhone)}
                                        {...register('contactPhone')}
                                    />
                                    <Form.Label htmlFor="contactPhone">Contact Phone</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.contactPhone?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Contact Email */}
                            <Col sm={6} md={4}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="email"
                                        id="contactEmail"
                                        placeholder="Contact Email"
                                        isInvalid={Boolean(errors.contactEmail)}
                                        {...register('contactEmail')}
                                    />
                                    <Form.Label htmlFor="contactEmail">Contact Email</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.contactEmail?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Billing Address */}
                            <Col sm={12} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        as="textarea"
                                        id="billingAddress"
                                        rows={2}
                                        style={{ minHeight: '62px', paddingTop: '18px' }}
                                        placeholder="Billing Address"
                                        {...register('billingAddress')}
                                    />
                                    <Form.Label htmlFor="billingAddress">Billing Address</Form.Label>
                                </Form.Floating>
                            </Col>

                            {/* Shipping Address */}
                            <Col sm={12} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        as="textarea"
                                        id="shippingAddress"
                                        rows={2}
                                        style={{ minHeight: '62px', paddingTop: '18px' }}
                                        placeholder="Shipping Address"
                                        {...register('shippingAddress')}
                                    />
                                    <Form.Label htmlFor="shippingAddress">Shipping / Delivery Address</Form.Label>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* 3. Line Items Table */}
                <div className="form-section-card">
                    <div className="form-section-header d-flex justify-content-between align-items-center">
                        <div className="section-title">
                            <FaCoins className="theme-crimson" size={13} />
                            <span>Line Items & Pricing Schedule</span>
                        </div>
                        <span className="item-count-badge">
                            {items.length} Item{items.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="form-section-body p-2 p-md-3">
                        <ProformaItemsTable
                            items={items}
                            onAddItem={handleAddItem}
                            onRemoveItem={handleRemoveItem}
                            onItemChange={handleItemChange}
                            onProductSelect={handleProductSelect}
                            register={register}
                            errors={errors}
                        />
                    </div>
                </div>

                {/* 4. Commercial Terms & Enhanced Financial Summary */}
                <Row className="g-3 mb-3">
                    {/* Commercial Terms & Advance Terms */}
                    <Col lg={7}>
                        <div className="form-section-card h-100 mb-0">
                            <div className="form-section-header">
                                <div className="section-title">
                                    <FaTruck className="theme-crimson" size={13} />
                                    <span>Commercial Terms & Delivery Schedule</span>
                                </div>
                            </div>
                            <div className="form-section-body">
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                type="text"
                                                id="paymentTerms"
                                                placeholder="Payment Terms"
                                                {...register('paymentTerms')}
                                            />
                                            <Form.Label htmlFor="paymentTerms">Payment Terms</Form.Label>
                                        </Form.Floating>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                type="text"
                                                id="deliveryPeriod"
                                                placeholder="Delivery Period"
                                                {...register('deliveryPeriod')}
                                            />
                                            <Form.Label htmlFor="deliveryPeriod">Delivery Period</Form.Label>
                                        </Form.Floating>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                type="text"
                                                id="freightBasis"
                                                placeholder="Freight Basis"
                                                {...register('freightBasis')}
                                            />
                                            <Form.Label htmlFor="freightBasis">Freight Basis</Form.Label>
                                        </Form.Floating>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                type="text"
                                                id="warrantyTerms"
                                                placeholder="Warranty Terms"
                                                {...register('warrantyTerms')}
                                            />
                                            <Form.Label htmlFor="warrantyTerms">Warranty Terms</Form.Label>
                                        </Form.Floating>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                as="textarea"
                                                id="specialNotes"
                                                rows={2}
                                                style={{ minHeight: '62px', paddingTop: '18px' }}
                                                placeholder="Bank Remittance & Notes"
                                                {...register('specialNotes')}
                                            />
                                            <Form.Label htmlFor="specialNotes">Bank Remittance & Special Notes</Form.Label>
                                        </Form.Floating>
                                    </Col>

                                    <Col md={12}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                as="textarea"
                                                id="termsAndConditions"
                                                rows={3}
                                                style={{ minHeight: '80px', paddingTop: '18px' }}
                                                placeholder="Terms & Conditions"
                                                {...register('termsAndConditions')}
                                            />
                                            <Form.Label htmlFor="termsAndConditions">Terms & Conditions</Form.Label>
                                        </Form.Floating>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Col>

                    {/* Financial Totals & Enhanced Advance Request Card */}
                    <Col lg={5}>
                        <div className="totals-card h-100">
                            <div className="fw-bold text-dark font-size-14 pb-2 mb-2 border-bottom d-flex align-items-center justify-content-between">
                                <span className="d-flex align-items-center gap-1.5">
                                    <FaCoins className="theme-crimson" size={14} />
                                    Financial Summary
                                </span>
                                <span className="badge bg-light text-muted border font-size-11">INR (₹)</span>
                            </div>

                            {/* Line Items Subtotal */}
                            <div className="total-row">
                                <span>Sub Total:</span>
                                <span className="fw-semibold">
                                    ₹{rawSubTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Overall Discount */}
                            <div className="total-row">
                                <div className="d-flex align-items-center gap-1">
                                    <span>Discount:</span>
                                    <div className="input-group input-group-sm" style={{ width: '80px' }}>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            size="sm"
                                            value={watchedDiscountPercent ?? 0}
                                            onChange={(e) => handleDiscountPercentChange(e.target.value)}
                                            className="font-size-11 text-end p-1"
                                        />
                                        <span className="input-group-text p-1 font-size-10">%</span>
                                    </div>
                                </div>
                                <span className="text-danger fw-semibold">
                                    - ₹{docDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Net Taxable Amount */}
                            <div className="total-row fw-semibold text-dark border-top pt-1 mt-1">
                                <span>Taxable Amount:</span>
                                <span>
                                    ₹{netTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Tax breakdown */}
                            {isInterState ? (
                                <div className="total-row">
                                    <span>IGST (Inter-State):</span>
                                    <span className="fw-semibold">
                                        ₹{igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="total-row">
                                        <span>CGST (Central Tax):</span>
                                        <span className="fw-semibold">
                                            ₹{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="total-row">
                                        <span>SGST (State Tax):</span>
                                        <span className="fw-semibold">
                                            ₹{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* Other / Freight Charges */}
                            <div className="total-row">
                                <div className="d-flex align-items-center gap-1">
                                    <span>Freight / Other Charges:</span>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        size="sm"
                                        style={{ width: '90px' }}
                                        value={watchedOther ?? 0}
                                        onChange={(e) => handleOtherChange(e.target.value)}
                                        className="font-size-11 text-end p-1"
                                    />
                                </div>
                                <span className="fw-semibold">
                                    ₹{otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Round Off */}
                            <div className="total-row">
                                <div className="d-flex align-items-center gap-1.5">
                                    <span>Round Off:</span>
                                    {isRoundOffManual ? (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={handleResetRoundOffAuto}
                                            className="p-0 font-size-11 text-decoration-none theme-crimson"
                                            title="Reset to Auto Round Off"
                                        >
                                            (Reset Auto)
                                        </Button>
                                    ) : (
                                        <span className="badge bg-light text-muted border font-size-10">Auto</span>
                                    )}
                                </div>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    size="sm"
                                    style={{ width: '80px' }}
                                    value={roundOff}
                                    onChange={(e) => handleRoundOffChange(e.target.value)}
                                    className="font-size-11 text-end p-1"
                                />
                            </div>

                            {/* Grand Total */}
                            <div className="total-row highlight">
                                <span>Grand Total:</span>
                                <span className="theme-crimson font-size-18">
                                    ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>

                            {/* Words */}
                            <div className="text-muted font-size-11 mt-1 fst-italic">
                                {numberToIndianRupeesWords(grandTotal)}
                            </div>

                            {/* Enhanced Advance Payment Request Box */}
                            <div className="advance-box">
                                <div className="d-flex justify-content-between align-items-center mb-1.5">
                                    <div className="d-flex align-items-center gap-1.5">
                                        <FaMoneyBillWave className="theme-crimson" size={13} />
                                        <span className="fw-bold font-size-12 text-dark">Advance Payment Requested</span>
                                    </div>
                                    <span className="badge bg-crimson-light theme-crimson fw-bold font-size-11">
                                        {advancePercent}% Required
                                    </span>
                                </div>

                                {/* Quick Advance Presets */}
                                <div className="d-flex align-items-center gap-1.5 mb-2">
                                    <span className="text-muted font-size-11">Quick Set:</span>
                                    <button
                                        type="button"
                                        className={`preset-chip ${advancePercent === 30 ? 'active' : ''}`}
                                        onClick={() => handleSetAdvancePreset(30)}
                                    >
                                        30%
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-chip ${advancePercent === 50 ? 'active' : ''}`}
                                        onClick={() => handleSetAdvancePreset(50)}
                                    >
                                        50%
                                    </button>
                                    <button
                                        type="button"
                                        className={`preset-chip ${advancePercent === 100 ? 'active' : ''}`}
                                        onClick={() => handleSetAdvancePreset(100)}
                                    >
                                        100%
                                    </button>
                                </div>

                                <div className="input-group input-group-sm mb-2">
                                    <span className="input-group-text font-size-12">₹</span>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max={grandTotal}
                                        {...register('advanceAmountRequested')}
                                        className="fw-bold font-size-13 text-end"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Balance payable info */}
                                <div className="d-flex justify-content-between align-items-center font-size-11 text-muted border-top pt-1.5">
                                    <span>Balance on Dispatch:</span>
                                    <span className="fw-semibold text-dark">
                                        ₹{balancePayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default ProformaForm;
