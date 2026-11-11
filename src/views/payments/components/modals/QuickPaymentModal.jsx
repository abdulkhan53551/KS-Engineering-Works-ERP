import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { createPaymentValidationSchema } from '../../../../validation/payment.validation';
import { useCreatePayment, useNextReceiptNumber } from '../../hooks/usePaymentApi';
import { usePaymentMode } from '../../../dashboard/hooks/api.hooks';
import { useInvoiceById } from '../../../invoice/hooks/useApi';
import { toast } from 'react-toastify';
import {
    FaMoneyCheckAlt,
    FaSave,
    FaBolt,
    FaBuilding,
    FaExclamationTriangle,
    FaChevronDown,
    FaChevronUp,
    FaCheckCircle,
    FaTimes
} from 'react-icons/fa';
import moment from 'moment';
import { numberToIndianRupeesWords } from '../../../../utilities/numberToWords';
import './quick-payment-modal.scss';

/**
 * Quick Payment Modal
 * Enterprise-grade, fintech-inspired payment recording modal with inset floating labels,
 * scrollable viewport container, and complete suppression of mousewheel/trackpad scroll counters.
 */
const QuickPaymentModal = ({ show, onHide, invoice }) => {
    const { data: nextReceiptNo = '' } = useNextReceiptNumber();
    const { data: paymentModes = [] } = usePaymentMode();
    const { mutate: createPaymentMutate, isPending } = useCreatePayment();

    const [showDeductions, setShowDeductions] = useState(false);

    const invId = invoice?.id || invoice?.invoiceId;
    const invNo = invoice?.invoiceNo || invoice?.invoice_no || '';
    const rawPartyId = invoice?.partyId || invoice?.party_id || invoice?.party?.id;

    // Fallback: If invoice row did not include partyId, load it via useInvoiceById
    const { data: fullInvoice } = useInvoiceById(!rawPartyId && invId ? invId : 0);
    const resolvedPartyId = Number(rawPartyId || fullInvoice?.partyId || fullInvoice?.party_id || 0);

    const customerName = invoice?.customerName || invoice?.customer_name || fullInvoice?.customerName || 'Customer';
    const invoiceTotal = Number(invoice?.total ?? invoice?.grandTotal ?? fullInvoice?.total ?? 0);
    const alreadyPaid = Number(invoice?.paidAmount ?? invoice?.paid_amount ?? fullInvoice?.paidAmount ?? fullInvoice?.paid_amount ?? 0);
    const balanceDue = Number(
        invoice?.balanceAmount !== undefined && invoice?.balanceAmount !== null
            ? invoice.balanceAmount
            : (invoice?.balance_amount !== undefined && invoice?.balance_amount !== null
                ? invoice.balance_amount
                : (fullInvoice?.balanceAmount !== undefined && fullInvoice?.balanceAmount !== null
                    ? fullInvoice.balanceAmount
                    : Math.max(0, invoiceTotal - alreadyPaid)))
    );

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        clearErrors,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(createPaymentValidationSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: {
            paymentDate: moment().format('YYYY-MM-DD'),
            partyId: resolvedPartyId > 0 ? resolvedPartyId : '',
            totalAmount: balanceDue > 0 ? String(balanceDue) : '',
            allocatedAmount: balanceDue > 0 ? String(balanceDue) : '',
            tdsAmount: '',
            writeOffAmount: '',
            writeOffReason: '',
            paymentModeId: paymentModes[0]?.id ? String(paymentModes[0].id) : '',
            referenceNo: '',
            referenceDate: moment().format('YYYY-MM-DD'),
            bankName: '',
            notes: ''
        }
    });

    const watchTotalAmount = watch('totalAmount');
    const [watchAllocCash, watchTds, watchWriteOff] = [
        watch('allocatedAmount'),
        watch('tdsAmount'),
        watch('writeOffAmount')
    ];

    // Reset when modal opens with new invoice
    useEffect(() => {
        if (show && invoice) {
            const bal = Number(
                invoice.balanceAmount !== undefined && invoice.balanceAmount !== null
                    ? invoice.balanceAmount
                    : (invoice.balance_amount !== undefined && invoice.balance_amount !== null
                        ? invoice.balance_amount
                        : Math.max(0, Number(invoice.total || 0) - Number(invoice.paidAmount || 0)))
            );
            const initialAmount = bal > 0 ? String(bal) : '';
            const pId = Number(invoice.partyId || invoice.party_id || resolvedPartyId || 0);
            const defaultModeId = paymentModes[0]?.id || paymentModes[0]?.value || '';

            reset({
                paymentDate: moment().format('YYYY-MM-DD'),
                partyId: pId > 0 ? pId : '',
                totalAmount: initialAmount,
                allocatedAmount: initialAmount,
                tdsAmount: '',
                writeOffAmount: '',
                writeOffReason: '',
                paymentModeId: defaultModeId ? String(defaultModeId) : '',
                referenceNo: '',
                referenceDate: moment().format('YYYY-MM-DD'),
                bankName: '',
                notes: `Payment against invoice ${invoice.invoiceNo || invoice.invoice_no}`
            });
            setShowDeductions(false);
            clearErrors();
        }
    }, [show, invoice, reset, paymentModes, clearErrors]);

    // Keep partyId in form state synced when resolvedPartyId changes
    useEffect(() => {
        if (resolvedPartyId && resolvedPartyId > 0) {
            setValue('partyId', resolvedPartyId, { shouldValidate: true });
            clearErrors('partyId');
        }
    }, [resolvedPartyId, setValue, clearErrors]);

    // Default payment mode selection once options load
    useEffect(() => {
        if (paymentModes && paymentModes.length > 0) {
            const currentMode = watch('paymentModeId');
            if (!currentMode) {
                setValue('paymentModeId', String(paymentModes[0]?.id || paymentModes[0]?.value || ''), { shouldValidate: true });
                clearErrors('paymentModeId');
            }
        }
    }, [paymentModes, watch, setValue, clearErrors]);

    // Numeric Sanitizer & Hard Ceiling Validator:
    // Disallows entering digits that would cause the value to exceed the allowed balance
    const handleAmountChange = (rawVal, fieldName) => {
        let clean = rawVal.replace(/[^0-9.]/g, '');
        const parts = clean.split('.');
        if (parts.length > 2) {
            clean = parts[0] + '.' + parts.slice(1).join('');
        }
        if (parts[1] && parts[1].length > 2) {
            clean = parts[0] + '.' + parts[1].slice(0, 2);
        }

        // Prevent redundant leading zeros (e.g. "05" -> "5", but keep "0" and "0.x")
        if (clean.length > 1 && clean.startsWith('0') && clean[1] !== '.') {
            clean = clean.replace(/^0+/, '') || '0';
        }

        const balDue = Number(balanceDue || 0);

        if (clean !== '' && clean !== '.') {
            const num = parseFloat(clean);
            if (isNaN(num)) return;

            if (fieldName === 'totalAmount') {
                const currentTds = parseFloat(watchTds) || 0;
                const currentWriteOff = parseFloat(watchWriteOff) || 0;
                const maxAllowedCash = Math.max(0, Math.round((balDue - currentTds - currentWriteOff) * 100) / 100);

                // Hard block: do not allow entering more digits than the allowed value
                if (num > maxAllowedCash + 0.0001) {
                    return;
                }

                setValue('totalAmount', clean, { shouldValidate: false, shouldDirty: true });
                setValue('allocatedAmount', clean, { shouldValidate: false });
                clearErrors('totalAmount');
                clearErrors('allocatedAmount');
                return;
            }

            if (fieldName === 'tdsAmount') {
                const currentWriteOff = parseFloat(watchWriteOff) || 0;
                const maxAllowedTds = Math.max(0, Math.round((balDue - currentWriteOff) * 100) / 100);

                // Hard block: TDS cannot exceed balance due minus write-off
                if (num > maxAllowedTds + 0.0001) {
                    return;
                }

                setValue('tdsAmount', clean, { shouldValidate: false, shouldDirty: true });
                clearErrors('tdsAmount');

                // If cash + tds + writeoff exceeds balance, auto-adjust cash down to maintain balance invariant
                const currentCash = parseFloat(watchTotalAmount) || 0;
                if (currentCash + num + currentWriteOff > balDue + 0.0001) {
                    const adjustedCash = Math.max(0, Math.round((balDue - num - currentWriteOff) * 100) / 100);
                    const adjustedCashStr = adjustedCash > 0 ? String(adjustedCash) : '';
                    setValue('totalAmount', adjustedCashStr, { shouldValidate: false, shouldDirty: true });
                    setValue('allocatedAmount', adjustedCashStr, { shouldValidate: false });
                    clearErrors('totalAmount');
                }
                return;
            }

            if (fieldName === 'writeOffAmount') {
                const currentTds = parseFloat(watchTds) || 0;
                const maxAllowedWriteOff = Math.max(0, Math.round((balDue - currentTds) * 100) / 100);

                // Hard block: Write-off cannot exceed balance due minus TDS
                if (num > maxAllowedWriteOff + 0.0001) {
                    return;
                }

                setValue('writeOffAmount', clean, { shouldValidate: false, shouldDirty: true });
                clearErrors('writeOffAmount');

                // If cash + tds + writeoff exceeds balance, auto-adjust cash down to maintain balance invariant
                const currentCash = parseFloat(watchTotalAmount) || 0;
                if (currentCash + currentTds + num > balDue + 0.0001) {
                    const adjustedCash = Math.max(0, Math.round((balDue - currentTds - num) * 100) / 100);
                    const adjustedCashStr = adjustedCash > 0 ? String(adjustedCash) : '';
                    setValue('totalAmount', adjustedCashStr, { shouldValidate: false, shouldDirty: true });
                    setValue('allocatedAmount', adjustedCashStr, { shouldValidate: false });
                    clearErrors('totalAmount');
                }
                return;
            }
        }

        // Handles empty string or lone decimal point "."
        setValue(fieldName, clean, { shouldValidate: false, shouldDirty: true });
        if (fieldName === 'totalAmount') {
            setValue('allocatedAmount', clean, { shouldValidate: false });
        }
        clearErrors(fieldName);
        if (fieldName === 'writeOffAmount' && (!clean || parseFloat(clean) === 0)) {
            clearErrors('writeOffReason');
        }
    };

    // Live Amount In Words
    const amountInWords = useMemo(() => {
        const val = parseFloat(watchTotalAmount);
        if (!val || isNaN(val) || val <= 0) return null;
        return numberToIndianRupeesWords(val);
    }, [watchTotalAmount]);

    const handleFormSubmit = (formData) => {
        const allocCash = Number(formData.allocatedAmount || formData.totalAmount || 0);
        const tds = Number(formData.tdsAmount || 0);
        const writeOff = Number(formData.writeOffAmount || 0);
        const finalPartyId = Number(formData.partyId || resolvedPartyId);

        if (!finalPartyId || finalPartyId <= 0) {
            toast.error('Customer party is required to record a payment.');
            return;
        }

        if (allocCash <= 0) {
            toast.error('Received cash amount must be greater than zero.');
            return;
        }

        if (writeOff > 0 && (!formData.writeOffReason || !formData.writeOffReason.trim())) {
            toast.error('Reason is required when write-off discount is applied.');
            return;
        }

        const payload = {
            paymentDate: moment(formData.paymentDate).format('YYYY-MM-DD'),
            partyId: finalPartyId,
            totalAmount: Number(formData.totalAmount),
            paymentModeId: Number(formData.paymentModeId),
            referenceNo: formData.referenceNo ? formData.referenceNo.trim() : undefined,
            referenceDate: formData.referenceDate ? moment(formData.referenceDate).format('YYYY-MM-DD') : undefined,
            bankName: formData.bankName ? formData.bankName.trim() : undefined,
            notes: formData.notes ? formData.notes.trim() : undefined,
            allocations: [
                {
                    invoiceId: Number(invId),
                    allocatedAmount: allocCash,
                    tdsAmount: tds,
                    writeOffAmount: writeOff,
                    writeOffReason: writeOff > 0 ? formData.writeOffReason.trim() : undefined
                }
            ]
        };

        createPaymentMutate(payload, {
            onSuccess: () => {
                onHide();
            }
        });
    };

    const handleFormError = (validationErrors) => {
        console.error('Quick Payment Form Validation Errors:', validationErrors);
        const firstKey = Object.keys(validationErrors)[0];
        if (firstKey && validationErrors[firstKey]?.message) {
            toast.error(validationErrors[firstKey].message);
        } else {
            toast.error('Please fill in all required fields properly.');
        }
    };

    if (!invoice) return null;

    const allocCashNum = Number(watchAllocCash || watchTotalAmount || 0);
    const tdsNum = Number(watchTds || 0);
    const writeOffNum = Number(watchWriteOff || 0);
    const totalSettled = allocCashNum + tdsNum + writeOffNum;
    const remainingBalance = Math.max(0, balanceDue - totalSettled);
    const isOverSettled = totalSettled > balanceDue + 0.009;

    // Quick Action Presets
    const handleFillFull = () => {
        setValue('totalAmount', String(balanceDue), { shouldValidate: true, shouldDirty: true });
        setValue('allocatedAmount', String(balanceDue), { shouldValidate: true });
        setValue('tdsAmount', '');
        setValue('writeOffAmount', '');
        setValue('writeOffReason', '');
        clearErrors();
    };

    const handleFillHalf = () => {
        const half = Math.round((balanceDue / 2) * 100) / 100;
        setValue('totalAmount', String(half), { shouldValidate: true, shouldDirty: true });
        setValue('allocatedAmount', String(half), { shouldValidate: true });
        clearErrors();
    };

    const handleClearAmount = () => {
        setValue('totalAmount', '', { shouldValidate: true, shouldDirty: true });
        setValue('allocatedAmount', '', { shouldValidate: true });
        clearErrors();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" scrollable className="quick-payment-modal">
            {/* Modal Header */}
            <Modal.Header closeButton className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <div className="receipt-icon-badge shadow-sm me-3">
                        <FaMoneyCheckAlt size={18} />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Modal.Title className="h6 mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.01em', fontSize: '1.08rem' }}>
                                Record Payment
                            </Modal.Title>
                            <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-monospace px-2 py-0.5 ms-1" style={{ fontSize: '0.72rem' }}>
                                #{invNo}
                            </span>
                            {nextReceiptNo && (
                                <span className="badge bg-light text-muted border font-monospace px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                    Receipt: {nextReceiptNo}
                                </span>
                            )}
                        </div>
                        {/* Customer Section with clear margin space between logo & label */}
                        <div className="customer-info-row d-flex align-items-center mt-1.5 flex-wrap">
                            <span className="customer-logo-pill d-inline-flex align-items-center justify-content-center">
                                <FaBuilding className="text-primary" size={11} />
                            </span>
                            <span className="customer-title-label text-muted fw-semibold">Customer:</span>
                            <strong className="customer-display-name text-dark fw-bold">{customerName}</strong>
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Form onSubmit={handleSubmit(handleFormSubmit, handleFormError)}>
                <input type="hidden" {...register('partyId', { valueAsNumber: true })} value={resolvedPartyId || ''} />
                <input type="hidden" {...register('allocatedAmount')} value={watchAllocCash || watchTotalAmount || ''} />

                <Modal.Body className="py-2.5 px-3">
                    {!resolvedPartyId && (
                        <Alert variant="warning" className="py-1.5 px-2 mb-2 small d-flex align-items-center gap-2 rounded-2 border-warning-subtle">
                            <FaExclamationTriangle className="text-warning flex-shrink-0" size={13} />
                            <div>
                                This invoice is not linked to a customer in the database. Please edit the invoice to link a customer before recording payments.
                            </div>
                        </Alert>
                    )}
                    {/* Invoice Balances Summary Ribbon */}
                    <div className="invoice-summary-ribbon mb-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="summary-col">
                            <span className="summary-title">Total Invoice:</span>
                            <span className="summary-val text-dark">₹{invoiceTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="summary-col">
                            <span className="summary-title">Paid so far:</span>
                            <span className="summary-val text-success">₹{alreadyPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="summary-col">
                            <span className="summary-title">Balance Due:</span>
                            <span className="summary-val text-danger">₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Hero Cash Amount Received Input Card */}
                    <div className={`hero-amount-card mb-2 ${errors.totalAmount ? 'has-error' : ''}`}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="hero-label">
                                Cash Amount Received (₹) <span className="text-danger">*</span>
                            </span>
                            <div className="d-flex align-items-center gap-1.5">
                                <button
                                    type="button"
                                    className="quick-action-pill btn-pill-primary"
                                    onClick={handleFillFull}
                                    title="Auto-fill full balance"
                                >
                                    <FaBolt size={9} className="me-1" />
                                    Full Due (₹{balanceDue.toLocaleString('en-IN')})
                                </button>
                                <button
                                    type="button"
                                    className="quick-action-pill btn-pill-secondary"
                                    onClick={handleFillHalf}
                                    title="50% Split"
                                >
                                    50%
                                </button>
                                <button
                                    type="button"
                                    className="quick-action-pill btn-pill-secondary"
                                    onClick={handleClearAmount}
                                    title="Clear field"
                                >
                                    <FaTimes size={9} />
                                </button>
                            </div>
                        </div>

                        {/* Amount Input with Currency Symbol */}
                        <div className="hero-input-row">
                            <span className="hero-currency">₹</span>
                            <input
                                type="text"
                                inputMode="decimal"
                                id="heroTotalAmount"
                                placeholder="0.00"
                                className="hero-input"
                                autoComplete="off"
                                onWheel={(e) => e.currentTarget.blur()}
                                {...register('totalAmount')}
                                value={watchTotalAmount || ''}
                                onChange={(e) => handleAmountChange(e.target.value, 'totalAmount')}
                            />
                        </div>

                        {/* Live Amount In Words */}
                        {amountInWords && (
                            <div className="amount-words-pill" title={amountInWords}>
                                <strong>In Words:</strong> {amountInWords}
                            </div>
                        )}

                        {errors.totalAmount && (
                            <div className="text-danger small mt-1" style={{ fontSize: '0.74rem' }}>
                                {errors.totalAmount.message}
                            </div>
                        )}
                    </div>

                    {/* Over-settled Alert */}
                    {isOverSettled && (
                        <Alert variant="danger" className="py-1.5 px-2.5 mb-2 small d-flex align-items-center gap-2 rounded-2 border-danger-subtle">
                            <FaExclamationTriangle className="text-danger flex-shrink-0 me-1" size={13} />
                            <div>
                                Settled amount (₹{totalSettled.toFixed(2)}) exceeds balance due (₹{balanceDue.toFixed(2)}). Excess: <strong>₹{(totalSettled - balanceDue).toFixed(2)}</strong>.
                            </div>
                        </Alert>
                    )}

                    {/* Form Grid with Standard Floating Labels */}
                    <Row className="g-2 mb-2 mt-2.5 form-grid-row">
                        {/* Payment Date */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    type="date"
                                    id="quickPaymentDate"
                                    placeholder="Payment Date"
                                    isInvalid={!!errors.paymentDate}
                                    {...register('paymentDate')}
                                    style={{ fontSize: '0.84rem' }}
                                />
                                <Form.Label htmlFor="quickPaymentDate" style={{ fontSize: '0.78rem' }}>
                                    Payment Date <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.72rem' }}>
                                    {errors.paymentDate?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Payment Mode */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Select
                                    id="quickPaymentModeId"
                                    isInvalid={!!errors.paymentModeId}
                                    {...register('paymentModeId', { required: 'Payment mode is required.' })}
                                    style={{ fontSize: '0.84rem' }}
                                >
                                    <option value="">-- Select Mode --</option>
                                    {paymentModes.map((mode) => (
                                        <option key={mode.id || mode.value} value={String(mode.id || mode.value)}>
                                            {mode.label || mode.name}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Label htmlFor="quickPaymentModeId" style={{ fontSize: '0.78rem' }}>
                                    Payment Mode <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.72rem' }}>
                                    {errors.paymentModeId?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Reference / UTR No */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    type="text"
                                    id="quickReferenceNo"
                                    placeholder="Reference / UTR / Cheque No"
                                    className="font-monospace"
                                    isInvalid={!!errors.referenceNo}
                                    {...register('referenceNo')}
                                    style={{ fontSize: '0.84rem' }}
                                />
                                <Form.Label htmlFor="quickReferenceNo" style={{ fontSize: '0.78rem' }}>
                                    Reference / UTR / Cheque No
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.72rem' }}>
                                    {errors.referenceNo?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Deposited Bank Name */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    type="text"
                                    id="quickBankName"
                                    placeholder="Deposited Bank Name"
                                    isInvalid={!!errors.bankName}
                                    {...register('bankName')}
                                    style={{ fontSize: '0.84rem' }}
                                />
                                <Form.Label htmlFor="quickBankName" style={{ fontSize: '0.78rem' }}>
                                    Deposited Bank Name
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.72rem' }}>
                                    {errors.bankName?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Notes / Remarks */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    type="text"
                                    id="quickNotes"
                                    placeholder="Notes / Remarks"
                                    isInvalid={!!errors.notes}
                                    {...register('notes')}
                                    style={{ fontSize: '0.84rem' }}
                                />
                                <Form.Label htmlFor="quickNotes" style={{ fontSize: '0.78rem' }}>
                                    Notes / Remarks
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.72rem' }}>
                                    {errors.notes?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                    </Row>

                    {/* Deductions & Settlement Adjustments (TDS & Write-off) */}
                    <div className={`deductions-panel mb-2 ${showDeductions || tdsNum > 0 || writeOffNum > 0 ? 'is-active' : ''}`}>
                        <div
                            className="d-flex justify-content-between align-items-center cursor-pointer user-select-none"
                            onClick={() => setShowDeductions(!showDeductions)}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className="fw-semibold text-dark small d-flex align-items-center gap-1.5" style={{ fontSize: '0.78rem' }}>
                                <span>TDS Deductions & Write-off Adjustments</span>
                                {(tdsNum > 0 || writeOffNum > 0) && (
                                    <span className="badge bg-primary text-white font-monospace px-1.5 py-0.5 ms-1" style={{ fontSize: '0.68rem' }}>
                                        Active
                                    </span>
                                )}
                            </span>
                            <Button
                                variant="link"
                                size="sm"
                                type="button"
                                className="p-0 text-muted text-decoration-none d-flex align-items-center gap-1"
                                style={{ fontSize: '0.74rem' }}
                            >
                                <span>{showDeductions ? 'Hide' : 'Add / Adjust'}</span>
                                {showDeductions ? <FaChevronUp size={10} className="ms-1" /> : <FaChevronDown size={10} className="ms-1" />}
                            </Button>
                        </div>

                        {(showDeductions || tdsNum > 0 || writeOffNum > 0) && (
                            <Row className="g-2 mt-1 pt-1.5 border-top form-grid-row">
                                {/* TDS Deducted */}
                                <Col md={6}>
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                        <Form.Control
                                            type="text"
                                            inputMode="decimal"
                                            id="quickTdsAmount"
                                            placeholder="TDS Deducted (₹)"
                                            className="font-monospace"
                                            autoComplete="off"
                                            onWheel={(e) => e.currentTarget.blur()}
                                            value={watchTds || ''}
                                            onChange={(e) => handleAmountChange(e.target.value, 'tdsAmount')}
                                            style={{ fontSize: '0.84rem' }}
                                        />
                                        <Form.Label htmlFor="quickTdsAmount" style={{ fontSize: '0.78rem' }}>
                                            TDS Deducted (₹)
                                        </Form.Label>
                                    </Form.Floating>
                                </Col>

                                {/* Write-off / Discount */}
                                <Col md={6}>
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                        <Form.Control
                                            type="text"
                                            inputMode="decimal"
                                            id="quickWriteOffAmount"
                                            placeholder="Write-off / Discount (₹)"
                                            className="font-monospace"
                                            autoComplete="off"
                                            onWheel={(e) => e.currentTarget.blur()}
                                            value={watchWriteOff || ''}
                                            onChange={(e) => handleAmountChange(e.target.value, 'writeOffAmount')}
                                            style={{ fontSize: '0.84rem' }}
                                        />
                                        <Form.Label htmlFor="quickWriteOffAmount" style={{ fontSize: '0.78rem' }}>
                                            Write-off / Discount (₹)
                                        </Form.Label>
                                    </Form.Floating>
                                </Col>

                                {/* Write-off Reason (Mandatory when write-off > 0) */}
                                {writeOffNum > 0 && (
                                    <Col md={12}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                type="text"
                                                id="quickWriteOffReason"
                                                placeholder="Write-off Reason"
                                                isInvalid={!!errors.writeOffReason}
                                                {...register('writeOffReason', { required: writeOffNum > 0 })}
                                                style={{ fontSize: '0.84rem' }}
                                            />
                                            <Form.Label htmlFor="quickWriteOffReason" className="text-danger" style={{ fontSize: '0.78rem' }}>
                                                Write-off Reason <span className="text-danger">*</span>
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid" style={{ fontSize: '0.72rem' }}>
                                                {errors.writeOffReason?.message || 'Reason is required for write-off discount.'}
                                            </Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>
                                )}
                            </Row>
                        )}
                    </div>

                    {/* Financial Reconciliation Status Strip */}
                    <div className="reconciliation-card">
                        <Row className="g-2 text-center text-sm-start align-items-center">
                            <Col xs={4} className="recon-item">
                                <span className="recon-label">Cash Received</span>
                                <span className="recon-value text-primary">
                                    ₹{allocCashNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </Col>
                            <Col xs={4} className="recon-item border-start ps-2.5">
                                <span className="recon-label">Total Settling</span>
                                <span className="recon-value text-dark">
                                    ₹{totalSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </Col>
                            <Col xs={4} className="recon-item border-start ps-2.5">
                                <span className="recon-label">Remaining Balance</span>
                                {remainingBalance <= 0.001 ? (
                                    <span className="badge bg-success-subtle text-success border border-success-subtle font-monospace px-2 py-0.5 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                        <FaCheckCircle size={9} className="me-1" />
                                        <span>₹0.00 (Cleared)</span>
                                    </span>
                                ) : (
                                    <span className="recon-value text-danger">
                                        ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                            </Col>
                        </Row>
                    </div>
                </Modal.Body>

                {/* Fixed Modal Footer */}
                <Modal.Footer className="d-flex align-items-center justify-content-between">
                    <div className="d-none d-sm-block text-muted" style={{ fontSize: '0.78rem' }}>
                        <span>Voucher Total: </span>
                        <strong className="text-dark font-monospace" style={{ fontSize: '0.88rem' }}>
                            ₹{allocCashNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                    </div>
                    <div className="d-flex align-items-center gap-2 ms-auto">
                        <Button
                            variant="light"
                            size="sm"
                            type="button"
                            onClick={onHide}
                            disabled={isPending}
                            className="btn-modal-cancel"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            type="submit"
                            disabled={isPending || isOverSettled || allocCashNum <= 0 || !resolvedPartyId}
                            className="btn-modal-submit"
                        >
                            {isPending ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-1" />
                                    <span>Recording...</span>
                                </>
                            ) : (
                                <>
                                    <FaSave size={12} className="me-1" />
                                    <span>Record Payment • ₹{allocCashNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default QuickPaymentModal;
