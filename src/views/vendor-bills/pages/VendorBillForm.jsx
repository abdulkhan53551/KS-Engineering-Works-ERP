import React from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Form,
    Button,
    Badge,
    Alert,
    Spinner,
    ButtonGroup
} from 'react-bootstrap';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import {
    FaArrowLeft,
    FaBuilding,
    FaSave,
    FaLock,
    FaPaperclip,
    FaCoins,
    FaRegCalendarAlt,
    FaIdCard,
    FaPhone,
    FaMapMarkerAlt
} from 'react-icons/fa';
import moment from 'moment';
import PartyAutocompleteInput from '../../invoice/components/PartyAutocompleteInput';
import AttachmentManager from '../../../components/attachments/AttachmentManager';
import { numberToIndianRupeesWords } from '../../../utilities/numberToWords';
import useVendorBillForm, { GST_RATES } from '../hooks/useVendorBillForm';

/**
 * VendorBillForm Component
 * Presentation page for creating and editing vendor purchase bills.
 * All form state, Joi validation, tax calculations, and submit logic are managed by useVendorBillForm.
 */
const VendorBillForm = ({ mode = 'create' }) => {
    const {
        id,
        isEdit,
        existingBill,
        isLoadingBill,
        isMonetaryLocked,
        paidAmount,
        selectedParty,
        billNoConflictError,
        setBillNoConflictError,
        register,
        handleSubmit,
        setValue,
        getValues,
        control,
        errors,
        watchDueDays,
        watchVendorName,
        taxableAmount,
        setTaxableAmount,
        gstRate,
        setGstRate,
        taxType,
        setTaxType,
        cgst,
        setCgst,
        sgst,
        setSgst,
        igst,
        setIgst,
        otherCharges,
        setOtherCharges,
        roundOff,
        setRoundOff,
        totals,
        isCreating,
        isUpdating,
        handleSelectParty,
        handleClearParty,
        handleDetachParty,
        handleDueDaysChange,
        onSubmit,
        onValidationErrors
    } = useVendorBillForm({ mode });

    if (isEdit && isLoadingBill) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2">Loading vendor bill details...</p>
            </Container>
        );
    }

    return (
        <div className="vendor-bill-form-view vendor-payment-detail-view">
            <Container fluid className="py-3 px-4">
                {/* Header Card */}
                <Card className="shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px' }}>
                    <Card.Body className="py-2.5 px-3">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                                <Link
                                    to={isEdit && id ? `/purchase/vendor-bills/${id}` : '/purchase/vendor-bills'}
                                    className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm text-dark border bg-light flex-shrink-0"
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderColor: '#cbd5e1',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#3a57e8';
                                        e.currentTarget.style.color = '#ffffff';
                                        e.currentTarget.style.borderColor = '#3a57e8';
                                        e.currentTarget.style.transform = 'translateX(-3px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                        e.currentTarget.style.color = '#1e293b';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }}
                                    title="Back"
                                >
                                    <FaArrowLeft size={14} />
                                </Link>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h5 className="mb-0 fw-bold text-dark">
                                            {isEdit ? 'Edit Vendor Bill' : 'Record New Vendor Bill'}
                                        </h5>
                                        {isEdit && existingBill?.billNo && (
                                            <span className="badge bg-soft-primary text-primary font-monospace" style={{ fontSize: '0.80rem' }}>
                                                {existingBill.billNo}
                                            </span>
                                        )}
                                        {existingBill?.paymentStatus && (
                                            <span
                                                className={`badge font-monospace ${
                                                    existingBill.paymentStatus === 'PAID'
                                                        ? 'bg-soft-success text-success'
                                                        : existingBill.paymentStatus === 'PARTIAL'
                                                        ? 'bg-soft-warning text-warning'
                                                        : 'bg-soft-danger text-danger'
                                                }`}
                                                style={{ fontSize: '0.72rem' }}
                                            >
                                                {existingBill.paymentStatus}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                                        {isEdit
                                            ? 'Update vendor invoice details, taxable calculations, and payment credit terms.'
                                            : 'Record a new purchase invoice from a supplier, calculate GST taxes, and set payment terms.'}
                                    </span>
                                </div>
                            </div>

                            {/* Top Action Buttons */}
                            <div className="d-flex align-items-center gap-2">
                                <Link
                                    to={isEdit && id ? `/purchase/vendor-bills/${id}` : '/purchase/vendor-bills'}
                                    className="btn btn-outline-secondary btn-sm px-3"
                                >
                                    Cancel
                                </Link>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="px-3.5 d-flex align-items-center gap-1.5 shadow-sm fw-semibold"
                                    disabled={isCreating || isUpdating}
                                    onClick={handleSubmit(onSubmit, onValidationErrors)}
                                >
                                    {(isCreating || isUpdating) ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <FaSave size={12} style={{ marginRight: '0.5rem' }} />
                                    )}
                                    <span>{isEdit ? 'Update Bill' : 'Save Bill'}</span>
                                </Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Monetary Lock Warning Banner */}
                {isMonetaryLocked && (
                    <Alert variant="warning" className="border-0 shadow-sm d-flex align-items-center gap-2 mb-3 py-2.5 px-3" style={{ borderRadius: '10px' }}>
                        <FaLock size={16} className="text-warning flex-shrink-0" />
                        <div style={{ fontSize: '0.82rem' }}>
                            <strong>Monetary Fields Locked:</strong> Payments totaling{' '}
                            <strong className="font-monospace text-dark">₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>{' '}
                            have been recorded against this bill. Financial figures (taxable, tax rates, GST splits, total) cannot be edited. Non-monetary fields (due date, notes, attachments) remain editable.
                        </div>
                    </Alert>
                )}

                {/* Duplicate Bill Conflict Alert */}
                {billNoConflictError && (
                    <Alert variant="danger" dismissible onClose={() => setBillNoConflictError('')} className="border-0 shadow-sm mb-3 py-2.5 px-3" style={{ borderRadius: '10px' }}>
                        <strong>Duplicate Bill:</strong> {billNoConflictError}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit(onSubmit, onValidationErrors)}>
                    <Row className="g-3">
                        {/* Left Column: Form Steps */}
                        <Col lg={8}>
                            {/* Section 1: Supplier & Invoice Details */}
                            <Card className="border-0 shadow-sm bg-white mb-2" style={{ borderRadius: '10px' }}>
                                <Card.Header
                                    className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center"
                                    style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                                >
                                    <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.90rem' }}>
                                        <FaBuilding className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
                                        <span>Supplier & Invoice Details</span>
                                    </h6>
                                    <span className="badge bg-soft-primary text-primary text-uppercase font-monospace" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                        Step 1
                                    </span>
                                </Card.Header>
                                <Card.Body className="py-2.5 px-3">
                                    <Row className="g-3">
                                        {/* Vendor Selection */}
                                        <Col md={12}>
                                            <PartyAutocompleteInput
                                                label="Supplier / Vendor Name"
                                                placeholder="Search vendor by name, legal entity, or GSTIN..."
                                                value={watchVendorName || ''}
                                                onChange={(e) => setValue('vendorName', e.target.value, { shouldValidate: true, shouldDirty: true })}
                                                onSelectParty={handleSelectParty}
                                                onClearParty={handleClearParty}
                                                onDetachParty={handleDetachParty}
                                                isInvalid={!!errors.partyId}
                                                errorMessage={errors.partyId?.message}
                                                disabled={isMonetaryLocked}
                                                required
                                            />
                                            {/* Selected Vendor Meta Chip */}
                                            {selectedParty && (
                                                <div
                                                    className="vendor-meta-chip d-flex flex-wrap align-items-center gap-3"
                                                    style={{
                                                        marginTop: '7px',
                                                        padding: '0.35rem 0.75rem',
                                                        fontSize: '0.76rem',
                                                        borderRadius: '6px',
                                                        backgroundColor: '#f8fafc',
                                                        border: '1px solid #e2e8f0'
                                                    }}
                                                >
                                                    <span className="text-secondary d-flex align-items-center gap-1.5">
                                                        <FaIdCard className="text-muted" size={13} style={{ marginRight: '0.45rem' }} />
                                                        <span>GSTIN:</span>
                                                        <strong className="text-dark font-monospace ms-1">{selectedParty.gstin || 'Unregistered'}</strong>
                                                    </span>
                                                    <span className="text-muted opacity-40">|</span>
                                                    <span className="text-secondary d-flex align-items-center gap-1.5">
                                                        <FaPhone className="text-muted" size={11} style={{ marginRight: '0.45rem' }} />
                                                        <span>Phone:</span>
                                                        <strong className="text-dark ms-1">{selectedParty.phone || selectedParty.mobile || '—'}</strong>
                                                    </span>
                                                    {selectedParty.city && (
                                                        <>
                                                            <span className="text-muted opacity-40">|</span>
                                                            <span className="text-secondary d-flex align-items-center gap-1.5">
                                                                <FaMapMarkerAlt className="text-muted" size={11} style={{ marginRight: '0.45rem' }} />
                                                                <span>City:</span>
                                                                <span className="text-dark ms-1">{selectedParty.city}</span>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </Col>

                                        {/* Bill No with Floating Label */}
                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="text"
                                                    id="billNo"
                                                    placeholder="Vendor Bill No"
                                                    disabled={isMonetaryLocked}
                                                    isInvalid={!!errors.billNo || !!billNoConflictError}
                                                    {...register('billNo', {
                                                        onChange: () => setBillNoConflictError('')
                                                    })}
                                                />
                                                <Form.Label htmlFor="billNo">
                                                    Vendor Bill No <span className="text-danger">*</span>
                                                </Form.Label>
                                                <Form.Control.Feedback type="invalid">
                                                    {errors.billNo?.message || billNoConflictError}
                                                </Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        {/* Credit Period (Due Days) with Floating Label */}
                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="number"
                                                    id="dueDays"
                                                    min="0"
                                                    placeholder="Credit Days"
                                                    disabled={isMonetaryLocked}
                                                    value={watchDueDays ?? 30}
                                                    onChange={(e) => handleDueDaysChange(e.target.value)}
                                                    className="no-spinners"
                                                />
                                                <Form.Label htmlFor="dueDays">
                                                    Credit Period (Due Days)
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {/* Modern Professional Flatpickr: Bill Date */}
                                        <Col md={6}>
                                            <Controller
                                                name="billDate"
                                                control={control}
                                                render={({ field, fieldState: { error } }) => (
                                                    <div>
                                                        <Form.Floating className={`custom-form-floating custom-form-floating-sm form-group mb-0 floating-date-field ${field.value ? 'has-value' : ''}`}>
                                                            <Flatpickr
                                                                id="billDate"
                                                                value={field.value}
                                                                disabled={isMonetaryLocked}
                                                                onChange={(selectedDates) => {
                                                                    const date = selectedDates[0] || null;
                                                                    field.onChange(date);
                                                                    const days = Number(getValues('dueDays') ?? 30);
                                                                    if (date) {
                                                                        setValue(
                                                                            'dueDate',
                                                                            moment(date).add(days, 'days').toDate(),
                                                                            { shouldDirty: true, shouldValidate: true }
                                                                        );
                                                                    }
                                                                }}
                                                                options={{
                                                                    dateFormat: 'd/m/Y',
                                                                    allowInput: true,
                                                                    defaultDate: ['today']
                                                                }}
                                                                className={`form-control flatpickrdate ${error ? 'is-invalid' : ''}`}
                                                                placeholder=" "
                                                            />
                                                            <Form.Label htmlFor="billDate">
                                                                Bill Date <span className="text-danger">*</span>
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

                                        {/* Modern Professional Flatpickr: Due Date */}
                                        <Col md={6}>
                                            <Controller
                                                name="dueDate"
                                                control={control}
                                                render={({ field, fieldState: { error } }) => (
                                                    <div>
                                                        <Form.Floating className={`custom-form-floating custom-form-floating-sm form-group mb-0 floating-date-field ${field.value ? 'has-value' : ''}`}>
                                                            <Flatpickr
                                                                id="dueDate"
                                                                value={field.value}
                                                                disabled={isMonetaryLocked}
                                                                onChange={(selectedDates) => {
                                                                    const date = selectedDates[0] || null;
                                                                    field.onChange(date);
                                                                    const bDate = getValues('billDate') || new Date();
                                                                    if (bDate && date) {
                                                                        const days = moment(date).diff(moment(bDate), 'days');
                                                                        setValue('dueDays', Math.max(0, days), {
                                                                            shouldDirty: true,
                                                                            shouldValidate: true
                                                                        });
                                                                    }
                                                                }}
                                                                options={{
                                                                    dateFormat: 'd/m/Y',
                                                                    allowInput: true
                                                                }}
                                                                className={`form-control flatpickrdate ${error ? 'is-invalid' : ''}`}
                                                                placeholder=" "
                                                            />
                                                            <Form.Label htmlFor="dueDate">
                                                                Due Date <span className="text-danger">*</span>
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
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Clean horizontal divider with balanced spacing after Step 1 */}
                            <hr className="border-light-subtle my-2" />

                            {/* Section 2: Financials & Tax Engine */}
                            <Card className="border-0 shadow-sm bg-white mb-0" style={{ borderRadius: '10px' }}>
                                <Card.Header
                                    className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center"
                                    style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                                >
                                    <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.90rem' }}>
                                        <FaCoins className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
                                        <span>Taxable Amount & GST Calculation Engine</span>
                                    </h6>
                                    <div className="d-flex align-items-center gap-2">
                                        {isMonetaryLocked && (
                                            <Badge bg="secondary" className="d-flex align-items-center gap-1">
                                                <FaLock size={10} /> Locked
                                            </Badge>
                                        )}
                                        <span className="badge bg-soft-primary text-primary text-uppercase font-monospace" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                            Step 2
                                        </span>
                                    </div>
                                </Card.Header>
                                <Card.Body className="py-2.5 px-3">
                                    <Row className="g-3">
                                        {/* Taxable Amount with Floating Label & No Spinners */}
                                        <Col md={6}>
                                            <div>
                                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                    <Form.Control
                                                        type="number"
                                                        id="taxableAmount"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="Taxable Amount"
                                                        value={taxableAmount === 0 ? '' : taxableAmount}
                                                        disabled={isMonetaryLocked}
                                                        onChange={(e) => setTaxableAmount(e.target.value)}
                                                        onWheel={(e) => e.target.blur()}
                                                        className="font-monospace fw-bold no-spinners"
                                                    />
                                                    <Form.Label htmlFor="taxableAmount">
                                                        Taxable Amount (₹) <span className="text-danger">*</span>
                                                    </Form.Label>
                                                </Form.Floating>
                                                {/* Taxable Amount in Words Helper */}
                                                {Number(taxableAmount) > 0 && (
                                                    <div
                                                        className="mt-2 p-2.5 rounded-2 bg-soft-success border border-success border-opacity-25 d-flex align-items-center flex-wrap gap-2"
                                                        style={{ fontSize: '0.78rem', lineHeight: '1.45', borderRadius: '6px' }}
                                                    >
                                                        <span className="text-muted fw-semibold">Taxable in Words:</span>
                                                        <strong className="text-success font-monospace">{numberToIndianRupeesWords(taxableAmount)}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        </Col>

                                        {/* GST Rate Preset Buttons */}
                                        <Col md={6}>
                                            <div className="h-100 d-flex flex-column justify-content-center">
                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                    <Form.Label className="small fw-semibold text-secondary mb-0" style={{ fontSize: '0.78rem' }}>
                                                        GST Rate Slab
                                                    </Form.Label>
                                                    <span className="badge bg-soft-primary text-primary font-monospace" style={{ fontSize: '0.72rem' }}>
                                                        {gstRate}% Slab Selected
                                                    </span>
                                                </div>
                                                <ButtonGroup className="w-100 shadow-sm" style={{ borderRadius: '6px', overflow: 'hidden' }}>
                                                    {GST_RATES.map((rate) => (
                                                        <Button
                                                            key={rate}
                                                            variant={gstRate === rate ? 'primary' : 'outline-secondary'}
                                                            size="sm"
                                                            className="fw-semibold"
                                                            style={{ fontSize: '0.80rem', padding: '0.38rem 0' }}
                                                            disabled={isMonetaryLocked}
                                                            onClick={() => setGstRate(rate)}
                                                        >
                                                            {rate}%
                                                        </Button>
                                                    ))}
                                                </ButtonGroup>
                                            </div>
                                        </Col>

                                        {/* Tax Type Toggle */}
                                        <Col md={12}>
                                            <div
                                                className="p-2.5 rounded-2 bg-light border d-flex align-items-center justify-content-between flex-wrap gap-2"
                                                style={{ borderRadius: '8px' }}
                                            >
                                                <span className="small fw-semibold text-secondary" style={{ fontSize: '0.80rem' }}>
                                                    GST Tax Regime:
                                                </span>
                                                <div className="d-flex gap-3">
                                                    <Form.Check
                                                        inline
                                                        type="radio"
                                                        id="tax-intra"
                                                        label="Intra-State (CGST + SGST)"
                                                        name="taxType"
                                                        checked={taxType === 'INTRA'}
                                                        disabled={isMonetaryLocked}
                                                        onChange={() => setTaxType('INTRA')}
                                                        className="small fw-medium"
                                                    />
                                                    <Form.Check
                                                        inline
                                                        type="radio"
                                                        id="tax-inter"
                                                        label="Inter-State (IGST)"
                                                        name="taxType"
                                                        checked={taxType === 'INTER'}
                                                        disabled={isMonetaryLocked}
                                                        onChange={() => setTaxType('INTER')}
                                                        className="small fw-medium"
                                                    />
                                                </div>
                                            </div>
                                        </Col>

                                        {/* Tax Inputs with Floating Labels */}
                                        {taxType === 'INTRA' ? (
                                            <>
                                                <Col md={6}>
                                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                        <Form.Control
                                                            type="number"
                                                            id="cgst"
                                                            step="0.01"
                                                            placeholder="CGST Amount"
                                                            value={cgst === 0 ? '' : cgst}
                                                            disabled={isMonetaryLocked}
                                                            onChange={(e) => setCgst(e.target.value)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="font-monospace no-spinners"
                                                        />
                                                        <Form.Label htmlFor="cgst">CGST Amount (₹)</Form.Label>
                                                    </Form.Floating>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                        <Form.Control
                                                            type="number"
                                                            id="sgst"
                                                            step="0.01"
                                                            placeholder="SGST Amount"
                                                            value={sgst === 0 ? '' : sgst}
                                                            disabled={isMonetaryLocked}
                                                            onChange={(e) => setSgst(e.target.value)}
                                                            onWheel={(e) => e.target.blur()}
                                                            className="font-monospace no-spinners"
                                                        />
                                                        <Form.Label htmlFor="sgst">SGST Amount (₹)</Form.Label>
                                                    </Form.Floating>
                                                </Col>
                                            </>
                                        ) : (
                                            <Col md={12}>
                                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                    <Form.Control
                                                        type="number"
                                                        id="igst"
                                                        step="0.01"
                                                        placeholder="IGST Amount"
                                                        value={igst === 0 ? '' : igst}
                                                        disabled={isMonetaryLocked}
                                                        onChange={(e) => setIgst(e.target.value)}
                                                        onWheel={(e) => e.target.blur()}
                                                        className="font-monospace no-spinners"
                                                    />
                                                    <Form.Label htmlFor="igst">IGST Amount (₹)</Form.Label>
                                                </Form.Floating>
                                            </Col>
                                        )}

                                        {/* Other Charges & Round Off with Floating Labels */}
                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="number"
                                                    id="otherCharges"
                                                    step="0.01"
                                                    placeholder="Other Charges"
                                                    value={otherCharges === 0 ? '' : otherCharges}
                                                    disabled={isMonetaryLocked}
                                                    onChange={(e) => setOtherCharges(e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="font-monospace no-spinners"
                                                />
                                                <Form.Label htmlFor="otherCharges">Other Charges / Freight (₹)</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="number"
                                                    id="roundOff"
                                                    step="0.01"
                                                    placeholder="Round Off"
                                                    value={roundOff === 0 ? '' : roundOff}
                                                    disabled={isMonetaryLocked}
                                                    onChange={(e) => setRoundOff(e.target.value)}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="font-monospace no-spinners"
                                                />
                                                <Form.Label htmlFor="roundOff">Round Off (+/- ₹)</Form.Label>
                                            </Form.Floating>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Section Divider between Step 2 and Step 3 */}
                            <hr className="border-light-subtle my-2" />

                            {/* Section 3: Remarks & Attachments */}
                            <Card className="border-0 shadow-sm bg-white mb-0" style={{ borderRadius: '10px' }}>
                                <Card.Header
                                    className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center"
                                    style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                                >
                                    <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.90rem' }}>
                                        <FaPaperclip className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
                                        <span>Remarks & Attachments</span>
                                    </h6>
                                    <span className="badge bg-soft-primary text-primary text-uppercase font-monospace" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                        Step 3
                                    </span>
                                </Card.Header>
                                <Card.Body className="py-2.5 px-3">
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                        <Form.Control
                                            as="textarea"
                                            id="notes"
                                            style={{ height: '80px' }}
                                            placeholder="Notes / Remarks"
                                            {...register('notes')}
                                        />
                                        <Form.Label htmlFor="notes">Notes / Bill Remarks (Optional)</Form.Label>
                                    </Form.Floating>

                                    {isEdit && id ? (
                                        <div className="pt-2 border-top">
                                            <h6 className="small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.04em', fontSize: '0.74rem' }}>
                                                Attached Documents & Invoices
                                            </h6>
                                            <AttachmentManager
                                                entityType="VENDOR_BILL"
                                                entityId={id}
                                                folder="vendor-bills"
                                            />
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-2 bg-light border border-dashed text-center">
                                            <span className="small text-muted" style={{ fontSize: '0.78rem' }}>
                                                ℹ️ Original vendor invoice PDFs, scan receipts, and delivery challans can be uploaded immediately upon saving this bill.
                                            </span>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Right Column: Live Financial Summary Breakdown */}
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm bg-white position-sticky mb-0" style={{ top: '80px', borderRadius: '10px' }}>
                                <Card.Header
                                    className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center"
                                    style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                                >
                                    <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.90rem' }}>
                                        Bill Financial Summary
                                    </h6>
                                    <span className="badge bg-soft-success text-success font-monospace" style={{ fontSize: '0.68rem' }}>
                                        Live Calculation
                                    </span>
                                </Card.Header>
                                <Card.Body className="py-2.5 px-3">
                                    <div className="d-flex justify-content-between mb-2 small text-muted">
                                        <span>Taxable Subtotal:</span>
                                        <h6 className="font-monospace fw-bold text-dark mb-0">
                                            ₹{totals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h6>
                                    </div>

                                    {taxType === 'INTRA' ? (
                                        <>
                                            <div className="d-flex justify-content-between mb-2 small text-muted">
                                                <span>CGST ({gstRate > 0 ? `${gstRate / 2}%` : '0%'}):</span>
                                                <span className="font-monospace text-dark">
                                                    ₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2 small text-muted">
                                                <span>SGST ({gstRate > 0 ? `${gstRate / 2}%` : '0%'}):</span>
                                                <span className="font-monospace text-dark">
                                                    ₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="d-flex justify-content-between mb-2 small text-muted">
                                            <span>IGST ({gstRate}%):</span>
                                            <span className="font-monospace text-dark">
                                                ₹{totals.igst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}

                                    {(totals.cgst + totals.sgst + totals.igst > 0) && (
                                        <div className="d-flex justify-content-between mb-2 small text-muted">
                                            <span className="fw-semibold">Total GST:</span>
                                            <span className="font-monospace fw-semibold text-primary">
                                                ₹{(totals.cgst + totals.sgst + totals.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}

                                    {totals.otherCharges !== 0 && (
                                        <div className="d-flex justify-content-between mb-2 small text-muted">
                                            <span>Other Charges:</span>
                                            <span className="font-monospace text-dark">
                                                ₹{totals.otherCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}

                                    {totals.roundOff !== 0 && (
                                        <div className="d-flex justify-content-between mb-2 small text-muted">
                                            <span>Round Off:</span>
                                            <span className="font-monospace text-dark">
                                                {totals.roundOff > 0 ? '+' : ''}₹{totals.roundOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}

                                    <hr className="my-2.5" />

                                    {/* Grand Total Row */}
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="fw-bold text-dark fs-6">Grand Total:</span>
                                        <h4 className="fw-bold text-primary font-monospace mb-0">
                                            ₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h4>
                                    </div>

                                    {/* Grand Total in Words Box */}
                                    {totals.total > 0 && (
                                        <div
                                            className="p-3 rounded-2 bg-soft-success border border-success border-opacity-25 mb-3"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <span className="text-muted fw-semibold d-block mb-1" style={{ fontSize: '0.74rem' }}>
                                                Grand Total in Words:
                                            </span>
                                            <strong className="text-success font-monospace d-block" style={{ fontSize: '0.80rem', lineHeight: '1.4' }}>
                                                {numberToIndianRupeesWords(totals.total)}
                                            </strong>
                                        </div>
                                    )}

                                    {/* In Edit Mode: Paid vs Balance Payable */}
                                    {isEdit && paidAmount > 0 && (
                                        <div className="p-3 rounded-2 bg-light border mb-3" style={{ borderRadius: '8px', fontSize: '0.80rem' }}>
                                            <div className="d-flex justify-content-between mb-1.5 text-muted">
                                                <span>Total Paid to Date:</span>
                                                <span className="font-monospace fw-semibold text-success">
                                                    ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between text-muted">
                                                <span>Balance Payable:</span>
                                                <span className="font-monospace fw-bold text-danger">
                                                    ₹{Math.max(0, totals.total - paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="primary"
                                            size="md"
                                            disabled={isCreating || isUpdating}
                                            onClick={handleSubmit(onSubmit, onValidationErrors)}
                                            className="fw-semibold shadow-sm d-flex align-items-center justify-content-center"
                                        >
                                            {(isCreating || isUpdating) ? (
                                                <Spinner animation="border" size="sm" className="me-2" />
                                            ) : (
                                                <FaSave size={14} style={{ marginRight: '0.5rem' }} />
                                            )}
                                            <span>{isEdit ? 'Save Changes' : 'Confirm & Save Bill'}</span>
                                        </Button>
                                        <Link
                                            to={isEdit && id ? `/purchase/vendor-bills/${id}` : '/purchase/vendor-bills'}
                                            className="btn btn-outline-secondary btn-sm text-center"
                                        >
                                            Cancel
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            </Container>
        </div>
    );
};

export default VendorBillForm;
