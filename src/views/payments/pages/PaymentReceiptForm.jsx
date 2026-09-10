import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Badge, Container } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { useNavigate, Link } from 'react-router-dom';
import { createPaymentValidationSchema } from '../../../validation/payment.validation';
import { useCreatePayment, useNextReceiptNumber, useUnpaidInvoices } from '../hooks/usePaymentApi';
import usePaymentAllocation from '../hooks/usePaymentAllocation';
import PaymentBankingFields from '../components/forms/PaymentBankingFields';
import InvoiceAllocationGrid from '../components/InvoiceAllocationGrid';
import PaymentSummaryCard from '../components/PaymentSummaryCard';
import PartyAutocompleteInput from '../../invoice/components/PartyAutocompleteInput';
import { FaReceipt, FaUserCheck, FaArrowLeft, FaIdCard, FaPhone, FaWallet } from 'react-icons/fa';
import moment from 'moment';
import { toast } from 'react-toastify';
import './payment-receipt-form.scss';

/**
 * PaymentReceiptForm Component
 * Dedicated page to record customer payments, multi-invoice allocations, and advance retentions.
 */
const PaymentReceiptForm = () => {
    const navigate = useNavigate();

    const { data: nextReceiptNo = 'REC-AUTO' } = useNextReceiptNumber();
    const { mutate: createPaymentMutate, isPending: isCreating } = useCreatePayment();

    const [selectedParty, setSelectedParty] = useState(null);

    // Prevent trackpad two-finger scroll from changing number inputs
    useEffect(() => {
        const handleWheel = () => {
            if (document.activeElement && document.activeElement.type === 'number') {
                document.activeElement.blur();
            }
        };
        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, []);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(createPaymentValidationSchema),
        defaultValues: {
            paymentDate: moment().format('YYYY-MM-DD'),
            partyId: '',
            customerName: '',
            totalAmount: '',
            paymentModeId: '',
            referenceNo: '',
            referenceDate: moment().format('YYYY-MM-DD'),
            bankName: '',
            notes: ''
        }
    });

    const watchPartyId = useWatch({ control, name: 'partyId' });
    const watchCustomerName = useWatch({ control, name: 'customerName' });
    const watchTotalAmount = useWatch({ control, name: 'totalAmount' });
    const watchPaymentModeId = useWatch({ control, name: 'paymentModeId' });

    // Fetch unpaid invoices whenever a customer is selected
    const { data: unpaidInvoices = [], isLoading: isLoadingInvoices } = useUnpaidInvoices(watchPartyId);

    // Multi-invoice allocation math and invariant engine
    const {
        allocations,
        calculations,
        updateAllocationRow,
        handlePayFull,
        getAllocationsPayload
    } = usePaymentAllocation(unpaidInvoices, watchTotalAmount);

    // Handle party selection from autocomplete
    const handleSelectParty = (party) => {
        if (!party) return;
        setSelectedParty(party);
        const pId = Number(party.id);
        const name = party.displayName || party.legalName || '';
        setValue('partyId', pId, { shouldValidate: true });
        setValue('customerName', name, { shouldValidate: true });
    };

    // Handle clearing party
    const handleClearParty = () => {
        setSelectedParty(null);
        setValue('partyId', '', { shouldValidate: true });
        setValue('customerName', '', { shouldValidate: true });
    };

    // Main Form Submit Handler
    const handleFormSubmit = (formData) => {
        if (!calculations.isValid) {
            toast.error('Please resolve allocation errors before saving.');
            return;
        }

        const allocationsPayload = getAllocationsPayload();

        const payload = {
            paymentDate: formData.paymentDate,
            partyId: Number(formData.partyId),
            totalAmount: Number(formData.totalAmount),
            paymentModeId: Number(formData.paymentModeId),
            referenceNo: formData.referenceNo ? formData.referenceNo.trim() : undefined,
            referenceDate: formData.referenceDate || undefined,
            bankName: formData.bankName ? formData.bankName.trim() : undefined,
            notes: formData.notes ? formData.notes.trim() : undefined,
            allocations: allocationsPayload
        };

        createPaymentMutate(payload, {
            onSuccess: () => {
                navigate('/payments/receipts');
            }
        });
    };

    return (
        <div className="payment-receipt-page">
            <Container fluid className="py-3 px-4">
                {/* Top Bar / Header with White Background Section */}
                <Card className="shadow-sm border-0 mb-3 bg-white">
                    <Card.Body className="py-2.5 px-3">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                                <Link
                                    to="/payments/receipts"
                                    className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm text-dark border bg-light flex-shrink-0"
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        borderColor: '#cbd5e1'
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
                                    title="Back to Receipts"
                                >
                                    <FaArrowLeft size={14} />
                                </Link>
                                <div>
                                    <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                                        <FaReceipt className="text-primary" size={17} style={{ marginRight: '0.65rem' }} />
                                        Record Customer Payment Receipt
                                    </h5>
                                    <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                                        Collect inward funds, settle invoices, apply TDS deductions, or retain customer advance.
                                    </span>
                                </div>
                            </div>

                            {/* Receipt Preview Badge */}
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted small" style={{ marginRight: '0.35rem' }}>Receipt No:</span>
                                <Badge bg="primary" className="font-monospace px-3 py-1.5" style={{ fontSize: '0.88rem', letterSpacing: '0.04em' }}>
                                    {nextReceiptNo}
                                </Badge>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                <Form onSubmit={handleSubmit(handleFormSubmit)}>
                    {/* 1. Customer & Payment Date Selection Card */}
                    <Card className="receipt-form-card mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <span className="section-icon-badge" style={{ marginRight: '0.65rem' }}>
                                    <FaUserCheck size={16} />
                                </span>
                                <div>
                                    <h6 className="section-title">Customer & Receipt Date</h6>
                                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                        Select the paying customer and official receipt date
                                    </span>
                                </div>
                            </div>
                            <span className="step-pill">Step 1</span>
                        </Card.Header>
                        <Card.Body className="p-3.5">
                            <Row className="g-3">
                                {/* Customer Autocomplete (Hope UI floating input) */}
                                <Col lg={7} md={12}>
                                    <PartyAutocompleteInput
                                        value={watchCustomerName || ''}
                                        onChange={(e) => setValue('customerName', e.target.value, { shouldValidate: true, shouldDirty: true })}
                                        onSelectParty={handleSelectParty}
                                        onClearParty={handleClearParty}
                                        onDetachParty={handleClearParty}
                                        isInvalid={!!errors.partyId}
                                        errorMessage={errors.partyId?.message}
                                        placeholder="Search party by name or code..."
                                        label="Customer Name"
                                        required
                                    />
                                    {selectedParty && (
                                        <div className="customer-meta-chip mt-2 p-2 rounded-2 d-flex flex-wrap align-items-center" style={{ marginTop: '7px', gap: '1rem', fontSize: '0.76rem' }}>
                                            <span className="d-inline-flex align-items-center text-secondary">
                                                <FaIdCard className="text-muted" size={13} style={{ marginRight: '0.45rem' }} />
                                                <span style={{ marginRight: '0.35rem' }}>GSTIN:</span>
                                                <strong className="text-dark font-monospace">{selectedParty.gstin || 'Unregistered'}</strong>
                                            </span>
                                            <span className="text-muted opacity-50">|</span>
                                            <span className="d-inline-flex align-items-center text-secondary">
                                                <FaPhone className="text-muted" size={11} style={{ marginRight: '0.45rem' }} />
                                                <span style={{ marginRight: '0.35rem' }}>Phone:</span>
                                                <strong className="text-dark">{selectedParty.mobile || selectedParty.phone || '—'}</strong>
                                            </span>
                                            {Number(selectedParty.advanceBalance) > 0 && (
                                                <>
                                                    <span className="text-muted opacity-50">|</span>
                                                    <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 font-monospace d-inline-flex align-items-center">
                                                        <FaWallet size={10} style={{ marginRight: '0.45rem' }} />
                                                        <span>Advance on Record: ₹{Number(selectedParty.advanceBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </Badge>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </Col>

                                {/* Payment Date (Hope UI custom-form-floating) */}
                                <Col lg={5} md={12}>
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                        <Form.Control
                                            type="date"
                                            id="paymentDate"
                                            placeholder="Receipt Date"
                                            isInvalid={!!errors.paymentDate}
                                            {...register('paymentDate')}
                                        />
                                        <Form.Label htmlFor="paymentDate">
                                            Receipt Date <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.paymentDate?.message}
                                        </Form.Control.Feedback>
                                    </Form.Floating>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* 2. Banking Details Card */}
                    <PaymentBankingFields
                        register={register}
                        errors={errors}
                        watchPaymentModeId={watchPaymentModeId}
                        watchTotalAmount={watchTotalAmount}
                        disabled={isCreating}
                    />

                    {/* 3. Invoice Allocation Matrix (displayed when customer is selected) */}
                    {watchPartyId ? (
                        <InvoiceAllocationGrid
                            unpaidInvoices={unpaidInvoices}
                            isLoading={isLoadingInvoices}
                            allocations={allocations}
                            calculations={calculations}
                            updateAllocationRow={updateAllocationRow}
                            handlePayFull={handlePayFull}
                            disabled={isCreating}
                        />
                    ) : (
                        <Card className="receipt-form-card mb-4 bg-light">
                            <Card.Body className="p-4 text-center text-muted">
                                <span style={{ fontSize: '0.86rem' }}>
                                    Please select a customer above to view and settle their unpaid invoices.
                                </span>
                            </Card.Body>
                        </Card>
                    )}

                    {/* 4. Bottom Sticky Summary Bar */}
                    <PaymentSummaryCard
                        calculations={calculations}
                        isSubmitting={isCreating}
                        onSubmit={handleSubmit(handleFormSubmit)}
                        cancelUrl="/payments/receipts"
                    />
                </Form>
            </Container>
        </div>
    );
};

export default PaymentReceiptForm;
