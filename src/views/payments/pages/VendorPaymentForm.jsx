import React from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Controller } from 'react-hook-form';
import { Link } from 'react-router-dom';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import {
    FaArrowLeft,
    FaMoneyBillWave,
    FaSave,
    FaWallet,
    FaInfoCircle,
    FaRegCalendarAlt,
    FaEdit,
    FaFilePdf,
    FaBuilding,
    FaUniversity,
    FaBan,
    FaIdCard,
    FaPhone,
    FaFileInvoiceDollar
} from 'react-icons/fa';
import VendorBillAllocationGrid from '../components/VendorBillAllocationGrid';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import PartyAutocompleteInput from '../../invoice/components/PartyAutocompleteInput';
import { numberToIndianRupeesWords } from '../../../utilities/numberToWords';
import useVendorPaymentForm from '../hooks/useVendorPaymentForm';

/**
 * VendorPaymentForm Component
 * Presentation page for creating, editing, and viewing outward vendor payments.
 * All state, queries, mutations, and allocation calculations are managed by useVendorPaymentForm.
 */
const VendorPaymentForm = ({ mode = 'create' }) => {
    const {
        id,
        isView,
        isEdit,
        existingPayment,
        isLoadingPayment,
        paymentNo,
        isCancelled,
        isSaving,
        numericTotal,
        register,
        handleSubmit,
        setValue,
        control,
        errors,
        watchPartyId,
        watchVendorName,
        paymentModes,
        isLoadingModes,
        selectedParty,
        effectiveBills,
        isLoadingBills,
        allocations,
        calculations,
        updateAllocationRow,
        handlePayFull,
        referenceLabel,
        referencePlaceholder,
        handleSelectParty,
        handleClearParty,
        handleDetachParty,
        onSubmit,
        onValidationErrors,
        handleDownloadPdf
    } = useVendorPaymentForm({ mode });

    // Loading existing payment
    if ((isEdit || isView) && isLoadingPayment) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2">Loading payment voucher...</p>
            </Container>
        );
    }

    // Not found state
    if ((isEdit || isView) && !existingPayment && !isLoadingPayment) {
        return (
            <Container fluid className="py-5 text-center">
                <FaMoneyBillWave size={40} className="text-secondary opacity-50 mb-3" />
                <h5>Payment Voucher Not Found</h5>
                <p className="text-muted">The requested outward payment voucher does not exist or was deleted.</p>
                <Link to="/payments/vendor-payments" className="btn btn-primary btn-sm">
                    Back to Outward Payments
                </Link>
            </Container>
        );
    }

    return (
        <Container fluid className="py-3 px-4">
            {/* Header Card */}
            <Card className="shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px' }}>
                <Card.Body className="py-2.5 px-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-3">
                            <Link
                                to={isEdit && id ? `/payments/vendor-payments/${id}` : '/payments/vendor-payments'}
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
                                        {isView ? 'Outward Vendor Payment Voucher' : isEdit ? 'Edit Outward Vendor Payment' : 'Record Outward Vendor Payment'}
                                    </h5>
                                    <span className="badge bg-soft-primary text-primary font-monospace" style={{ fontSize: '0.80rem' }}>
                                        {paymentNo}
                                    </span>
                                    {existingPayment?.status && (
                                        <PaymentStatusBadge status={existingPayment.status} />
                                    )}
                                </div>
                                <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                                    {isView
                                        ? 'Detailed read-only voucher breakdown with allocated vendor bills and supplier advance.'
                                        : 'Disburse funds to a supplier, settle pending bills, and retain excess as vendor advance.'}
                                </span>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="d-flex align-items-center gap-2">
                            {isView ? (
                                <>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="d-flex align-items-center shadow-sm px-3"
                                        style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '6px' }}
                                        onClick={handleDownloadPdf}
                                    >
                                        <FaFilePdf size={13} style={{ marginRight: '0.5rem' }} />
                                        <span>Download PDF</span>
                                    </Button>

                                    {!isCancelled && (
                                        <Link
                                            to={`/payments/vendor-payments/${id}/edit`}
                                            className="btn btn-primary btn-sm d-flex align-items-center shadow-sm px-3"
                                            style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '6px' }}
                                        >
                                            <FaEdit size={13} style={{ marginRight: '0.5rem' }} />
                                            <span>Edit Voucher</span>
                                        </Link>
                                    )}

                                    <Link to="/payments/vendor-payments" className="btn btn-outline-secondary btn-sm px-3">
                                        Back to List
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={isEdit && id ? `/payments/vendor-payments/${id}` : '/payments/vendor-payments'}
                                        className="btn btn-outline-secondary btn-sm px-3"
                                    >
                                        Cancel
                                    </Link>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="px-3.5 d-flex align-items-center gap-1.5 shadow-sm fw-semibold"
                                        disabled={!calculations.isValid || isSaving || isCancelled}
                                        onClick={handleSubmit(onSubmit, onValidationErrors)}
                                    >
                                        {isSaving ? (
                                            <Spinner animation="border" size="sm" />
                                        ) : (
                                            <FaSave size={12} style={{ marginRight: '0.5rem' }} />
                                        )}
                                        <span>{isEdit ? 'Update Payment' : 'Save Payment'}</span>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Cancelled Warning Banner */}
            {isCancelled && (
                <Alert variant="danger" className="d-flex align-items-center gap-2 py-2.5 px-3 mb-3 shadow-sm" style={{ borderRadius: '10px' }}>
                    <FaBan size={18} className="flex-shrink-0" />
                    <div className="small">
                        <strong>This payment voucher was cancelled.</strong> Its bill allocations were rolled back and no further edits can be saved.
                        {existingPayment?.cancelReason && <span className="ms-1 font-italic">Reason: "{existingPayment.cancelReason}"</span>}
                    </div>
                </Alert>
            )}

            <Form onSubmit={handleSubmit(onSubmit, onValidationErrors)}>
                {/* Top Row: Step 1 & Step 2 (Left) + Disbursement Summary (Right) */}
                <Row className="g-3">
                    <Col lg={8}>
                        {/* Section 1: Supplier & Disbursement Overview */}
                        <Card className="border-0 shadow-sm bg-white mb-2" style={{ borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.90rem' }}>
                                    <FaBuilding className="text-primary" />
                                    <span>Supplier & Disbursement Details</span>
                                </h6>
                                <span className="badge bg-soft-primary text-primary text-uppercase font-monospace" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                    Step 1
                                </span>
                            </Card.Header>
                            <Card.Body className="py-2.5 px-3">
                                <Row className="g-3">
                                    {/* Vendor Selection */}
                                    <Col md={12}>
                                        {isView ? (
                                            <div className="bg-light p-3 rounded-2 border">
                                                <span className="text-muted small d-block mb-1">Supplier / Vendor:</span>
                                                <h6 className="fw-bold text-dark mb-0">{watchVendorName || 'Vendor'}</h6>
                                                {selectedParty?.gstin && (
                                                    <span className="text-muted small d-block font-monospace mt-1.5">
                                                        GSTIN: <strong>{selectedParty.gstin}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
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
                                                    disabled={isCancelled}
                                                    required
                                                />
                                                {/* Selected Vendor Meta Chip (Compact & Crisp) */}
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
                                                            <FaIdCard className="text-muted" size={13} />
                                                            <span>GSTIN:</span>
                                                            <strong className="text-dark font-monospace">{selectedParty.gstin || 'Unregistered'}</strong>
                                                        </span>
                                                        <span className="text-muted opacity-40">|</span>
                                                        <span className="text-secondary d-flex align-items-center gap-1.5">
                                                            <FaPhone className="text-muted" size={11} />
                                                            <span>Phone:</span>
                                                            <strong className="text-dark">{selectedParty.phone || selectedParty.mobile || '—'}</strong>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Col>

                                    {/* Modern Professional Flatpickr: Payment Date */}
                                    <Col md={6}>
                                        <Controller
                                            name="paymentDate"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <div>
                                                    <Form.Floating className={`custom-form-floating custom-form-floating-sm form-group mb-0 floating-date-field ${field.value ? 'has-value' : ''}`}>
                                                        <Flatpickr
                                                            id="paymentDate"
                                                            value={field.value}
                                                            disabled={isView || isCancelled}
                                                            onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                                            options={{
                                                                dateFormat: 'd/m/Y',
                                                                allowInput: true,
                                                                defaultDate: ['today']
                                                            }}
                                                            className={`form-control flatpickrdate ${error ? 'is-invalid' : ''}`}
                                                            placeholder=" "
                                                        />
                                                        <Form.Label htmlFor="paymentDate">
                                                            Payment Date <span className="text-danger">*</span>
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

                                    {/* Total Disbursed with Floating Label & No Spinners */}
                                    <Col md={6}>
                                        <div>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="number"
                                                    id="totalAmount"
                                                    step="0.01"
                                                    min="0.01"
                                                    placeholder="Total Disbursed"
                                                    disabled={isView || isCancelled}
                                                    isInvalid={!!errors.totalAmount}
                                                    {...register('totalAmount')}
                                                    onWheel={(e) => e.target.blur()}
                                                    className="font-monospace fw-bold no-spinners"
                                                />
                                                <Form.Label htmlFor="totalAmount">
                                                    Total Disbursed (₹) <span className="text-danger">*</span>
                                                </Form.Label>
                                            </Form.Floating>
                                            {errors.totalAmount && (
                                                <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.75rem' }}>
                                                    {errors.totalAmount.message}
                                                </div>
                                            )}
                                        </div>
                                        {/* Amount in Words Helper with generous 4-side padding */}
                                        {numericTotal > 0 && (
                                            <div
                                                className="mt-2 p-3 rounded-2 bg-soft-success border border-success border-opacity-25 d-flex align-items-center flex-wrap gap-2"
                                                style={{ marginTop: '0.55rem', fontSize: '0.80rem', lineHeight: '1.45', borderRadius: '8px' }}
                                            >
                                                <span className="text-muted fw-semibold">In Words:</span>
                                                <strong className="text-success font-monospace">{numberToIndianRupeesWords(numericTotal)}</strong>
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Clean horizontal divider with balanced spacing after Step 1 */}
                        <hr className="border-light-subtle my-2" />

                        {/* Section 2: Banking & Payment Channel */}
                        <Card className="border-0 shadow-sm bg-white mb-0" style={{ borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.90rem' }}>
                                    <FaUniversity className="text-primary" />
                                    <span>Payment Channel & Bank References</span>
                                </h6>
                                <span className="badge bg-soft-primary text-primary text-uppercase font-monospace" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                    Step 2
                                </span>
                            </Card.Header>
                            <Card.Body className="py-2.5 px-3">
                                <Row className="g-3">
                                    {/* Payment Mode */}
                                    <Col md={6}>
                                        <div>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Select
                                                    id="paymentModeId"
                                                    isInvalid={!!errors.paymentModeId}
                                                    disabled={isView || isCancelled || isLoadingModes}
                                                    {...register('paymentModeId')}
                                                >
                                                    <option value="">-- Select Payment Mode --</option>
                                                    {paymentModes.map((mode) => (
                                                        <option key={mode.id || mode.value} value={mode.id || mode.value}>
                                                            {mode.label || mode.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Label htmlFor="paymentModeId">
                                                    Payment Mode <span className="text-danger">*</span>
                                                </Form.Label>
                                            </Form.Floating>
                                            {errors.paymentModeId && (
                                                <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.75rem' }}>
                                                    {errors.paymentModeId.message}
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Reference / UTR / Cheque Number */}
                                    <Col md={6}>
                                        <div>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="text"
                                                    id="referenceNo"
                                                    placeholder={referencePlaceholder}
                                                    disabled={isView || isCancelled}
                                                    isInvalid={!!errors.referenceNo}
                                                    {...register('referenceNo')}
                                                />
                                                <Form.Label htmlFor="referenceNo">
                                                    {referenceLabel}
                                                </Form.Label>
                                            </Form.Floating>
                                            {errors.referenceNo && (
                                                <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.75rem' }}>
                                                    {errors.referenceNo.message}
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    {/* Modern Professional Flatpickr: Reference Date */}
                                    <Col md={6}>
                                        <Controller
                                            name="referenceDate"
                                            control={control}
                                            render={({ field, fieldState: { error } }) => (
                                                <div>
                                                    <Form.Floating className={`custom-form-floating custom-form-floating-sm form-group mb-0 floating-date-field ${field.value ? 'has-value' : ''}`}>
                                                        <Flatpickr
                                                            id="referenceDate"
                                                            value={field.value}
                                                            disabled={isView || isCancelled}
                                                            onChange={(selectedDates) => field.onChange(selectedDates[0] || null)}
                                                            options={{
                                                                dateFormat: 'd/m/Y',
                                                                allowInput: true
                                                            }}
                                                            className={`form-control flatpickrdate ${error ? 'is-invalid' : ''}`}
                                                            placeholder=" "
                                                        />
                                                        <Form.Label htmlFor="referenceDate">
                                                            Reference Date
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

                                    {/* Bank Name */}
                                    <Col md={6}>
                                        <div>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="text"
                                                    id="bankName"
                                                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                                                    disabled={isView || isCancelled}
                                                    isInvalid={!!errors.bankName}
                                                    {...register('bankName')}
                                                />
                                                <Form.Label htmlFor="bankName">
                                                    Disbursing Bank Name (Optional)
                                                </Form.Label>
                                            </Form.Floating>
                                            {errors.bankName && (
                                                <div className="invalid-feedback d-block mt-1 ps-1" style={{ fontSize: '0.75rem' }}>
                                                    {errors.bankName.message}
                                                </div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Column: Settlement Summary */}
                    <Col lg={4}>
                        <Card className="border-0 shadow-sm bg-white position-sticky mb-0" style={{ top: '80px', borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3.5"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.90rem' }}>
                                    Disbursement Summary
                                </h6>
                            </Card.Header>
                            <Card.Body className="py-2.5 px-3">
                                <div className="d-flex justify-content-between mb-2 small text-muted">
                                    <span>Total Disbursed:</span>
                                    <h5 className="font-monospace fw-bold text-dark mb-0">
                                        ₹{calculations.totalDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h5>
                                </div>

                                <div className="d-flex justify-content-between mb-2 small text-muted">
                                    <span>Allocated to Bills:</span>
                                    <span className="font-monospace fw-semibold text-success">
                                        ₹{calculations.totalCashAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {calculations.totalTdsDeducted > 0 && (
                                    <div className="d-flex justify-content-between mb-2 small text-muted">
                                        <span>TDS Deductions:</span>
                                        <span className="font-monospace text-dark">
                                            ₹{calculations.totalTdsDeducted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                {calculations.totalWriteOff > 0 && (
                                    <div className="d-flex justify-content-between mb-2 small text-muted">
                                        <span>Discounts / Write-Off:</span>
                                        <span className="font-monospace text-dark">
                                            ₹{calculations.totalWriteOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                <hr className="my-2.5" />

                                {/* Retained Advance Indicator with generous 4-side padding */}
                                <div
                                    className={`p-3 rounded-2 mb-3 ${calculations.unallocatedAdvance > 0
                                            ? 'bg-soft-info border border-info border-opacity-50'
                                            : 'bg-light border'
                                        }`}
                                    style={{ borderRadius: '8px' }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                                        <span className="small fw-semibold text-secondary d-flex align-items-center gap-2">
                                            <FaWallet className="text-info flex-shrink-0" size={15} />
                                            <span>Vendor Advance:</span>
                                        </span>
                                        <span className="fw-bold font-monospace text-info fs-6">
                                            ₹{calculations.unallocatedAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {calculations.unallocatedAdvance > 0 && (
                                        <span className="text-muted d-block ps-0.5" style={{ fontSize: '0.74rem', lineHeight: '1.45' }}>
                                            Excess disbursement held as advance on supplier's ledger.
                                        </span>
                                    )}
                                </div>

                                {/* Over-allocation Alert with generous padding */}
                                {calculations.isCashOverAllocated && (
                                    <Alert variant="danger" className="p-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.78rem', borderRadius: '8px' }}>
                                        <FaBan size={15} className="flex-shrink-0" />
                                        <span>Allocated cash exceeds total disbursed amount!</span>
                                    </Alert>
                                )}

                                {isView ? (
                                    <div className="d-grid gap-2">
                                        {!isCancelled && (
                                            <Link
                                                to={`/payments/vendor-payments/${id}/edit`}
                                                className="btn btn-primary btn-md fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                                            >
                                                <FaEdit size={14} />
                                                <span>Edit This Voucher</span>
                                            </Link>
                                        )}
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={handleDownloadPdf}
                                            className="d-flex align-items-center justify-content-center gap-2"
                                        >
                                            <FaFilePdf size={13} />
                                            <span>Download Voucher PDF</span>
                                        </Button>
                                        <Link to="/payments/vendor-payments" className="btn btn-outline-secondary btn-sm">
                                            Back to Outward Payments
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="primary"
                                            size="md"
                                            disabled={!calculations.isValid || isSaving || isCancelled}
                                            onClick={handleSubmit(onSubmit, onValidationErrors)}
                                            className="fw-semibold shadow-sm"
                                        >
                                            {isSaving ? (
                                                <Spinner animation="border" size="sm" className="me-2" />
                                            ) : (
                                                <FaSave size={14} style={{ marginRight: '0.5rem' }} />
                                            )}
                                            {isEdit ? 'Save Changes' : 'Confirm & Save Payment'}
                                        </Button>
                                        <Link
                                            to={isEdit && id ? `/payments/vendor-payments/${id}` : '/payments/vendor-payments'}
                                            className="btn btn-outline-secondary btn-sm"
                                        >
                                            Cancel
                                        </Link>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Section Divider between Step 2 and Step 3 */}
                <hr className="border-light-subtle my-2" />

                {/* Section 3: Pending Vendor Bills Allocation - FULL WIDTH */}
                <Row className="g-3">
                    <Col lg={12}>
                        <Card className="border-0 shadow-sm bg-white mb-0" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center flex-wrap gap-2"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.90rem' }}>
                                    <FaFileInvoiceDollar className="text-primary" />
                                    <span>Pending Vendor Bills Allocation</span>
                                </h6>
                                <span className="badge bg-soft-primary text-primary text-uppercase font-monospace" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                    Step 3
                                </span>
                            </Card.Header>
                            <Card.Body className="py-2.5 px-3">
                                {watchPartyId ? (
                                    <VendorBillAllocationGrid
                                        unpaidBills={effectiveBills}
                                        isLoading={isLoadingBills}
                                        allocations={allocations}
                                        calculations={calculations}
                                        updateAllocationRow={updateAllocationRow}
                                        handlePayFull={handlePayFull}
                                        disabled={isView || isCancelled}
                                    />
                                ) : (
                                    <div className="text-center py-5 px-4 bg-light rounded-2 border border-dashed my-1">
                                        <FaInfoCircle className="text-primary opacity-75 mb-2.5" size={32} />
                                        <h6 className="fw-bold mb-1.5 text-dark">No Vendor Selected</h6>
                                        <p className="text-muted small mb-0" style={{ maxWidth: '420px', margin: '0 auto', lineHeight: '1.5' }}>
                                            Search and select a vendor above to load and settle their outstanding bills.
                                        </p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Section Divider between Step 3 and Step 4 */}
                <hr className="border-light-subtle my-2" />

                {/* Section 4: Notes & Remarks - FULL WIDTH */}
                <Row className="g-3 mb-2">
                    <Col lg={12}>
                        <Card className="border-0 shadow-sm bg-white mb-0" style={{ borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3.5"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.90rem' }}>
                                    <FaInfoCircle className="text-secondary" />
                                    <span>Payment Remarks & Terms</span>
                                </h6>
                            </Card.Header>
                            <Card.Body className="py-2.5 px-3">
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        as="textarea"
                                        id="paymentNotes"
                                        style={{ height: '80px' }}
                                        placeholder="Remarks / Notes"
                                        disabled={isView || isCancelled}
                                        {...register('notes')}
                                    />
                                    <Form.Label htmlFor="paymentNotes">
                                        Payment Remarks / Settlement Terms (Optional)
                                    </Form.Label>
                                </Form.Floating>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
};

export default VendorPaymentForm;
