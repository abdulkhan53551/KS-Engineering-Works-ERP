import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';
import { Ban, AlertTriangle, FileText, Building2, Calendar, X, ShieldAlert, History } from 'lucide-react';
import moment from 'moment';

const REASON_PRESETS = [
    'Customer requested order cancellation',
    'Data entry error / Duplicate billing',
    'Goods returned / Rejected at delivery',
    'Pricing or GSTIN mismatch',
    'Other reason'
];

const CancelInvoiceModal = ({
    show,
    onHide,
    invoice,
    onConfirm,
    isLoading = false,
    onOpenPaymentHistory
}) => {
    const [reasonPreset, setReasonPreset] = useState(REASON_PRESETS[0]);
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        if (show) {
            setReasonPreset(REASON_PRESETS[0]);
            setCustomReason('');
        }
    }, [show]);

    if (!invoice) return null;

    const invoiceNo = invoice.invoiceNo || invoice.invoice_no || 'Invoice';
    const customerName = invoice.customerName || invoice.partyName || invoice.party_name;
    const rawDate = invoice.invoiceDate || invoice.date || invoice.invoice_date;
    const formattedDate = rawDate ? moment(rawDate).format('DD MMM YYYY') : null;
    const totalAmount = invoice.total !== undefined ? Number(invoice.total || 0) : null;
    const paidAmount = Number(
        invoice.paidAmount !== undefined
            ? invoice.paidAmount
            : (invoice.paid_amount || 0)
    );
    const hasActivePayments = paidAmount > 0;

    const handleConfirmClick = () => {
        const finalReason = reasonPreset === 'Other reason'
            ? (customReason.trim() || 'Other reason')
            : reasonPreset;
        onConfirm(invoice.invoiceId || invoice.id, finalReason);
    };

    return (
        <Modal
            show={show}
            onHide={isLoading ? undefined : onHide}
            centered
            backdrop={isLoading ? 'static' : true}
            keyboard={!isLoading}
            contentClassName="border-0 shadow-lg rounded-4 overflow-hidden"
        >
            {/* Top Accent Gradient (Amber for Payment Blocked, Crimson for Cancellation) */}
            <div
                style={{
                    height: '4px',
                    background: hasActivePayments
                        ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%)'
                        : 'linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
                }}
            />

            <Modal.Body className="p-4 position-relative">
                {/* Close Button */}
                {!isLoading && (
                    <button
                        type="button"
                        onClick={onHide}
                        className="btn btn-sm btn-link text-muted position-absolute p-0 text-decoration-none shadow-none"
                        style={{
                            top: '16px',
                            right: '16px',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.color = '#0f172a';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#64748b';
                        }}
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                )}

                {/* Hero Badge Icon */}
                <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
                    style={{
                        width: '56px',
                        height: '56px',
                        background: hasActivePayments ? '#fef3c7' : '#fee2e2',
                        color: hasActivePayments ? '#d97706' : '#dc2626',
                        boxShadow: hasActivePayments ? '0 0 0 6px #fffbeb' : '0 0 0 6px #fef2f2'
                    }}
                >
                    {hasActivePayments ? (
                        <ShieldAlert size={28} strokeWidth={2.2} />
                    ) : (
                        <Ban size={28} strokeWidth={2.2} />
                    )}
                </div>

                {/* Header Title & Subtitle */}
                <div className="text-center mb-3">
                    <h5 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.01em' }}>
                        {hasActivePayments ? 'Cannot Cancel Invoice' : 'Cancel Invoice?'}
                    </h5>
                    <p className="text-muted small mb-0 px-2" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                        {hasActivePayments
                            ? 'This invoice has active payment receipts recorded against it.'
                            : 'Are you sure you want to cancel this invoice? Once confirmed, this invoice will be marked void under GST regulations.'
                        }
                    </p>
                </div>

                {/* Invoice Summary Card */}
                <div
                    className="rounded-3 p-3 mb-3"
                    style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    {/* Invoice No + Target Status */}
                    <div
                        className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom"
                        style={{ borderColor: '#e2e8f0' }}
                    >
                        <div className="d-flex align-items-center gap-2">
                            <FileText size={16} className="text-secondary" />
                            <span className="font-monospace fw-bold text-dark fs-6">{invoiceNo}</span>
                        </div>
                        <span
                            className="badge rounded-pill fw-semibold font-monospace"
                            style={{
                                backgroundColor: hasActivePayments ? '#fef3c7' : '#fee2e2',
                                color: hasActivePayments ? '#b45309' : '#b91c1c',
                                border: hasActivePayments ? '1px solid #fde68a' : '1px solid #fecaca',
                                fontSize: '0.70rem',
                                letterSpacing: '0.03em',
                                padding: '4px 8px'
                            }}
                        >
                            {hasActivePayments ? 'PAYMENT ATTACHED' : 'WILL BE CANCELLED'}
                        </span>
                    </div>

                    {/* Customer */}
                    {customerName && (
                        <div className="d-flex align-items-center justify-content-between mb-1.5 text-muted small">
                            <span className="d-flex align-items-center gap-1.5">
                                <Building2 size={13} className="text-secondary" />
                                <span>Customer</span>
                            </span>
                            <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '220px' }}>
                                {customerName}
                            </span>
                        </div>
                    )}

                    {/* Invoice Date */}
                    {formattedDate && (
                        <div className="d-flex align-items-center justify-content-between mb-1.5 text-muted small">
                            <span className="d-flex align-items-center gap-1.5">
                                <Calendar size={13} className="text-secondary" />
                                <span>Invoice Date</span>
                            </span>
                            <span className="text-secondary font-monospace">
                                {formattedDate}
                            </span>
                        </div>
                    )}

                    {/* Total Amount */}
                    {totalAmount !== null && (
                        <div
                            className="d-flex align-items-center justify-content-between pt-2 mt-1 border-top"
                            style={{ borderColor: '#e2e8f0' }}
                        >
                            <span className="text-muted small fw-medium">Total Value</span>
                            <span className="font-monospace fw-bold text-dark fs-6">
                                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}

                    {/* Active Recorded Payments */}
                    {hasActivePayments && (
                        <div
                            className="d-flex align-items-center justify-content-between pt-2 mt-1 border-top"
                            style={{ borderColor: '#e2e8f0' }}
                        >
                            <span className="text-muted small fw-medium">Payments Received</span>
                            <span className="font-monospace fw-bold text-success fs-6">
                                ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    )}
                </div>

                {hasActivePayments ? (
                    /* Active Payments Resolution Notice Box */
                    <div
                        className="rounded-3 p-3 mb-4 text-start"
                        style={{
                            background: '#fffbf0',
                            border: '1px solid #fde68a'
                        }}
                    >
                        <div className="d-flex align-items-center gap-1.5 text-warning-emphasis fw-bold small mb-1.5">
                            <AlertTriangle size={15} className="text-warning flex-shrink-0" />
                            <span>Why is this action blocked?</span>
                        </div>
                        <p className="text-secondary small mb-2" style={{ fontSize: '0.79rem', lineHeight: '1.45' }}>
                            Under GST & financial accounting principles, an invoice cannot be cancelled while payments are settled against it. You must first cancel or roll back the attached payment receipts.
                        </p>
                        <div className="bg-white rounded-2 p-2.5 border border-warning-subtle small text-dark" style={{ fontSize: '0.77rem' }}>
                            <div className="fw-semibold text-warning-emphasis mb-1">Required Steps:</div>
                            <ol className="mb-0 ps-3 text-muted" style={{ lineHeight: '1.5' }}>
                                <li>Click <strong>"View Payment Receipts"</strong> below.</li>
                                <li>Cancel the active receipt(s) to revert settled amount to ₹0.00.</li>
                                <li>Return here to cancel this invoice.</li>
                            </ol>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Reason Selection */}
                        <div className="mb-3 text-start">
                            <label className="form-label text-dark fw-semibold small mb-1.5 d-flex align-items-center justify-content-between">
                                <span>Reason for Cancellation <span className="text-danger">*</span></span>
                            </label>
                            <Form.Select
                                size="sm"
                                className="rounded-3 py-2 border-1 shadow-none"
                                style={{ fontSize: '0.84rem' }}
                                value={reasonPreset}
                                onChange={(e) => setReasonPreset(e.target.value)}
                                disabled={isLoading}
                            >
                                {REASON_PRESETS.map((preset) => (
                                    <option key={preset} value={preset}>
                                        {preset}
                                    </option>
                                ))}
                            </Form.Select>

                            {reasonPreset === 'Other reason' && (
                                <div className="mt-2">
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        size="sm"
                                        className="rounded-3 shadow-none"
                                        placeholder="Please enter specific cancellation reason..."
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        disabled={isLoading}
                                        style={{ fontSize: '0.82rem' }}
                                        maxLength={400}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        {/* GST & Document Release Notice Box */}
                        <div
                            className="rounded-3 p-2.5 mb-4"
                            style={{
                                background: '#fffbf0',
                                border: '1px solid #fde68a'
                            }}
                        >
                            <div className="d-flex align-items-center gap-1.5 text-warning-emphasis fw-bold small mb-1">
                                <AlertTriangle size={15} className="text-warning flex-shrink-0" />
                                <span style={{ fontSize: '0.80rem' }}>Permanent GST Action:</span>
                            </div>
                            <ul className="mb-0 ps-3 text-secondary small" style={{ fontSize: '0.76rem', lineHeight: '1.45' }}>
                                <li>
                                    Under GST rules, cancelled invoices <strong>cannot be restored or un-cancelled</strong>.
                                </li>
                                <li>
                                    Linked Delivery Challans & Purchase Orders will be <strong>unlinked for re-billing</strong>.
                                </li>
                            </ul>
                        </div>
                    </>
                )}

                {/* Action Buttons */}
                <div className="d-flex align-items-center gap-2">
                    <Button
                        type="button"
                        variant="light"
                        onClick={onHide}
                        disabled={isLoading}
                        className="w-50 py-2.5 rounded-3 fw-semibold border shadow-none"
                        style={{
                            backgroundColor: '#f1f5f9',
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            fontSize: '0.86rem'
                        }}
                    >
                        {hasActivePayments ? 'Close' : 'Keep Invoice'}
                    </Button>

                    {hasActivePayments ? (
                        onOpenPaymentHistory ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => onOpenPaymentHistory(invoice.invoiceId || invoice.id, invoiceNo)}
                                className="w-50 py-2.5 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                style={{
                                    background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                                    border: 'none',
                                    fontSize: '0.86rem'
                                }}
                            >
                                <History size={15} />
                                <span>View Payment Receipts</span>
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onHide}
                                className="w-50 py-2.5 rounded-3 fw-semibold"
                                style={{ fontSize: '0.86rem' }}
                            >
                                Close
                            </Button>
                        )
                    ) : (
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleConfirmClick}
                            disabled={isLoading}
                            className="w-50 py-2.5 rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                            style={{
                                background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)',
                                fontSize: '0.86rem'
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <Spinner animation="border" size="sm" />
                                    <span>Cancelling...</span>
                                </>
                            ) : (
                                <>
                                    <Ban size={15} />
                                    <span>Yes, Cancel Invoice</span>
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default CancelInvoiceModal;
