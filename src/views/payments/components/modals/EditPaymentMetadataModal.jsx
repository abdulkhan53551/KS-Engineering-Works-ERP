import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import {
    FaPen,
    FaLock,
    FaCheck,
    FaCalendarAlt,
    FaUniversity,
    FaReceipt
} from 'react-icons/fa';
import moment from 'moment';
import { usePaymentMode } from '../../../dashboard/hooks/api.hooks';
import { useUpdatePaymentMetadata } from '../../hooks/usePaymentApi';
import './edit-payment-metadata-modal.scss';

/**
 * EditPaymentMetadataModal Component (Redesigned Enterprise Theme)
 * Provides a sleek, high-density modal for safely updating non-financial payment
 * details (transaction date, bank name, payment mode, reference no, notes).
 */
const EditPaymentMetadataModal = ({ show, onHide, payment }) => {
    const { data: paymentModes = [], isLoading: isLoadingModes } = usePaymentMode();
    const updateMutation = useUpdatePaymentMetadata();

    const [paymentDate, setPaymentDate] = useState('');
    const [paymentModeId, setPaymentModeId] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [referenceDate, setReferenceDate] = useState('');
    const [bankName, setBankName] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (payment && show) {
            setPaymentDate(
                payment.paymentDate || payment.payment_date
                    ? moment(payment.paymentDate || payment.payment_date).format('YYYY-MM-DD')
                    : ''
            );
            setPaymentModeId(
                payment.paymentModeId || payment.payment_mode_id
                    ? String(payment.paymentModeId || payment.payment_mode_id)
                    : ''
            );
            setReferenceNo(payment.referenceNo || payment.reference_no || '');
            setReferenceDate(
                payment.referenceDate || payment.reference_date
                    ? moment(payment.referenceDate || payment.reference_date).format('YYYY-MM-DD')
                    : ''
            );
            setBankName(payment.bankName || payment.bank_name || '');
            setNotes(payment.notes || '');
        }
    }, [payment, show]);

    // Dynamic labels based on selected payment mode
    const selectedModeObj = useMemo(() => {
        return paymentModes.find(
            (m) => String(m.id || m.value) === String(paymentModeId)
        );
    }, [paymentModes, paymentModeId]);

    const modeLabel = (selectedModeObj?.label || selectedModeObj?.name || '').toLowerCase();
    const isCheque = modeLabel.includes('cheque');
    const isBank = modeLabel.includes('bank') || modeLabel.includes('neft') || modeLabel.includes('rtgs') || modeLabel.includes('imps');
    const isUpi = modeLabel.includes('upi') || modeLabel.includes('qr');

    let referenceFieldLabel = 'Reference / Transaction No.';
    let referencePlaceholder = 'e.g. Ref #123456';
    let referenceDateLabel = 'Reference Date';

    if (isCheque) {
        referenceFieldLabel = 'Cheque Number';
        referencePlaceholder = 'e.g. CHQ-458921';
        referenceDateLabel = 'Cheque Date';
    } else if (isBank) {
        referenceFieldLabel = 'UTR / Transfer Ref Number';
        referencePlaceholder = 'e.g. UTR9876543210';
        referenceDateLabel = 'Transfer Date';
    } else if (isUpi) {
        referenceFieldLabel = 'UPI / Transaction Ref ID';
        referencePlaceholder = 'e.g. 324109823451';
        referenceDateLabel = 'Transaction Date';
    }

    if (!payment) return null;

    const paymentNo = payment.paymentNo || payment.payment_no || `PAY-${payment.id}`;
    const partyName = payment.partyDisplayName || payment.customerName || payment.partyName || payment.customer_name || 'Customer / Vendor';
    const totalAmount = Number(payment.totalAmount || payment.total_amount || 0);
    const paymentType = payment.paymentType || payment.payment_type || 'INWARD';
    const status = payment.status || 'COMPLETED';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!paymentDate) return;

        const payload = {
            id: payment.id,
            paymentDate,
            paymentModeId: paymentModeId ? Number(paymentModeId) : undefined,
            referenceNo: referenceNo.trim() || null,
            referenceDate: referenceDate || null,
            bankName: bankName.trim() || null,
            notes: notes.trim() || null
        };

        updateMutation.mutate(payload, {
            onSuccess: () => {
                onHide();
            }
        });
    };

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            backdrop="static"
            className="edit-payment-modal"
        >
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <div className="d-flex align-items-center">
                        <div className="header-icon-pill">
                            <FaPen size={13} />
                        </div>
                        <div className="header-title-box">
                            <div className="header-title-row">
                                <h6 className="modal-title-text">Edit Payment Details</h6>
                                <span className="voucher-no-pill">{paymentNo}</span>
                            </div>
                            <span className="modal-subtitle">
                                Correct transaction date, bank, reference/UTR number, or notes
                            </span>
                        </div>
                    </div>
                </Modal.Header>

                <Modal.Body>
                    {/* Locked Financial Context Banner */}
                    <div className="locked-context-card">
                        <div className="context-top-row">
                            <div className="party-block">
                                <span className="context-label">Party ({paymentType === 'OUTWARD' ? 'Vendor' : 'Customer'})</span>
                                <div className="party-name" title={partyName}>
                                    {partyName}
                                </div>
                            </div>
                            <div className="amount-block">
                                <span className="context-label">Total Amount</span>
                                <div className="amount-val">
                                    ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                        <div className="context-notice">
                            <FaLock size={9.5} className="lock-icon" />
                            <span>Financial amount & party are locked to preserve invoice balance integrity.</span>
                        </div>
                    </div>

                    <Row className="g-2.5">
                        {/* Transaction Date */}
                        <Col sm={6}>
                            <div className="form-group-custom">
                                <label className="field-label" htmlFor="fieldPaymentDate">
                                    <FaCalendarAlt size={10.5} className="field-icon text-primary" />
                                    <span>Payment Date</span>
                                    <span className="req-star">*</span>
                                </label>
                                <Form.Control
                                    id="fieldPaymentDate"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                    disabled={updateMutation.isPending}
                                />
                            </div>
                        </Col>

                        {/* Payment Mode */}
                        <Col sm={6}>
                            <div className="form-group-custom">
                                <label className="field-label" htmlFor="fieldPaymentMode">
                                    <span>Payment Mode</span>
                                    <span className="req-star">*</span>
                                </label>
                                <Form.Select
                                    id="fieldPaymentMode"
                                    value={paymentModeId}
                                    onChange={(e) => setPaymentModeId(e.target.value)}
                                    disabled={isLoadingModes || updateMutation.isPending}
                                    required
                                >
                                    <option value="">-- Select Mode --</option>
                                    {paymentModes.map((mode) => (
                                        <option key={mode.id || mode.value} value={mode.id || mode.value}>
                                            {mode.label || mode.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </Col>

                        {/* Bank Name */}
                        <Col sm={6}>
                            <div className="form-group-custom">
                                <label className="field-label" htmlFor="fieldBankName">
                                    <FaUniversity size={10.5} className="field-icon text-secondary" />
                                    <span>Bank Name</span>
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <Form.Control
                                    id="fieldBankName"
                                    type="text"
                                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    disabled={updateMutation.isPending}
                                    maxLength={150}
                                />
                            </div>
                        </Col>

                        {/* Reference / UTR / Cheque Number */}
                        <Col sm={6}>
                            <div className="form-group-custom">
                                <label className="field-label" htmlFor="fieldReferenceNo">
                                    <span>{referenceFieldLabel}</span>
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <Form.Control
                                    id="fieldReferenceNo"
                                    type="text"
                                    placeholder={referencePlaceholder}
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    disabled={updateMutation.isPending}
                                    maxLength={100}
                                />
                            </div>
                        </Col>

                        {/* Reference / Cheque Date */}
                        <Col sm={6}>
                            <div className="form-group-custom mb-0">
                                <label className="field-label" htmlFor="fieldReferenceDate">
                                    <span>{referenceDateLabel}</span>
                                    <span className="opt-badge">Optional</span>
                                </label>
                                <Form.Control
                                    id="fieldReferenceDate"
                                    type="date"
                                    value={referenceDate}
                                    onChange={(e) => setReferenceDate(e.target.value)}
                                    disabled={updateMutation.isPending}
                                />
                            </div>
                        </Col>

                        {/* Balanced Companion Status Box (Eliminates empty space on right) */}
                        <Col sm={6}>
                            <div className="companion-status-box">
                                <span className="box-title">Voucher Type & Status</span>
                                <div className="box-val-row">
                                    <span className="d-flex align-items-center gap-1 text-primary">
                                        <FaReceipt size={11} />
                                        <span>{paymentType === 'OUTWARD' ? 'Vendor Payment' : 'Customer Receipt'}</span>
                                    </span>
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 py-1 px-1.5 font-monospace" style={{ fontSize: '0.68rem' }}>
                                        {status}
                                    </span>
                                </div>
                            </div>
                        </Col>

                        {/* Notes / Narration */}
                        <Col sm={12} className="mt-2">
                            <div className="form-group-custom mb-0">
                                <label className="field-label" htmlFor="fieldNotes">
                                    <span>Notes / Narration</span>
                                    <span className="opt-badge">Internal</span>
                                </label>
                                <Form.Control
                                    id="fieldNotes"
                                    as="textarea"
                                    rows={2}
                                    placeholder="Enter any internal remark or note regarding this payment..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={updateMutation.isPending}
                                    maxLength={1000}
                                />
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={onHide}
                        disabled={updateMutation.isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-modal-submit"
                        disabled={updateMutation.isPending || !paymentDate}
                    >
                        {updateMutation.isPending ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <FaCheck size={11} />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

EditPaymentMetadataModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onHide: PropTypes.func.isRequired,
    payment: PropTypes.object
};

export default EditPaymentMetadataModal;
