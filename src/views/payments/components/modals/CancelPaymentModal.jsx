import React from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaTimes, FaUndo } from 'react-icons/fa';
import { useCancelPayment } from '../../hooks/usePaymentApi';

/**
 * Cancel Payment Confirmation Modal
 * Explains the atomic rollback of invoice balances and payment statuses.
 */
const CancelPaymentModal = ({ show, onHide, payment }) => {
    const { mutate: cancelPaymentMutate, isPending } = useCancelPayment();

    if (!payment) return null;

    const paymentNo = payment.paymentNo || payment.payment_no || `REC-${payment.id}`;
    const totalAmount = Number(payment.totalAmount || payment.total_amount || 0);

    const handleConfirm = () => {
        cancelPaymentMutate(payment.id, {
            onSuccess: () => {
                onHide();
            }
        });
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton className="border-bottom py-3">
                <div className="d-flex align-items-center gap-2 text-danger">
                    <FaExclamationTriangle size={18} />
                    <Modal.Title className="h6 mb-0 fw-bold">
                        Cancel Payment Receipt {paymentNo}?
                    </Modal.Title>
                </div>
            </Modal.Header>
            <Modal.Body className="p-4">
                <Alert variant="warning" className="d-flex align-items-start gap-2 mb-3" style={{ fontSize: '0.84rem' }}>
                    <FaUndo className="text-warning mt-1 flex-shrink-0" size={14} />
                    <div>
                        <strong>Automatic Rollback Warning:</strong> Cancelling this receipt will immediately roll back all settled amounts on the associated invoices and revert their payment statuses to <strong>PENDING</strong> or <strong>PARTIAL</strong>.
                    </div>
                </Alert>

                <p className="text-muted small mb-1">
                    Customer: <strong className="text-dark">{payment.customerName || payment.partyName || 'Customer'}</strong>
                </p>
                <p className="text-muted small mb-0">
                    Total Amount to Reverse: <strong className="text-dark font-monospace">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </p>
            </Modal.Body>
            <Modal.Footer className="border-top py-2 px-3">
                <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={isPending} style={{ fontSize: '0.84rem' }}>
                    Keep Active
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="d-flex align-items-center gap-1.5"
                    style={{ fontSize: '0.84rem', fontWeight: 600 }}
                >
                    {isPending ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" />
                            <span>Cancelling Receipt...</span>
                        </>
                    ) : (
                        <>
                            <FaTimes size={12} />
                            <span>Yes, Cancel & Rollback</span>
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CancelPaymentModal;
