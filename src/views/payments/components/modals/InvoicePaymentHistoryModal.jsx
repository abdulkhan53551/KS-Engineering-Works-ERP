import React from 'react';
import { Modal, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaHistory, FaFileDownload, FaInfoCircle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useInvoicePaymentHistory } from '../../hooks/usePaymentApi';
import { downloadPaymentPdf } from '../../api';
import moment from 'moment';
import { toast } from 'react-toastify';

/**
 * Invoice Payment History Audit Modal
 * Displays all payment vouchers/receipts attached to a specific invoice.
 */
const InvoicePaymentHistoryModal = ({ show, onHide, invoiceId, invoiceNo = '' }) => {
    const { data: historyData = {}, isLoading } = useInvoicePaymentHistory(show ? invoiceId : null);

    const history = historyData.history || [];
    const totalAmount = Number(historyData.total || 0);
    const paidAmount = Number(historyData.paidAmount || 0);
    const balanceAmount = Number(historyData.balanceAmount || 0);

    const handleDownload = async (paymentId, paymentNo) => {
        try {
            await downloadPaymentPdf(paymentId, paymentNo);
            toast.success(`Receipt ${paymentNo} downloaded.`);
        } catch (err) {
            toast.error(err?.message || 'Failed to download receipt PDF.');
        }
    };

    if (!show) return null;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton className="border-bottom py-3">
                <div className="d-flex align-items-center gap-2">
                    <FaHistory className="text-primary" size={16} />
                    <Modal.Title className="h6 mb-0 fw-bold">
                        Payment History — <span className="text-primary font-monospace">{historyData.invoiceNo || invoiceNo || `INV #${invoiceId}`}</span>
                    </Modal.Title>
                </div>
            </Modal.Header>
            <Modal.Body className="p-4">
                {/* Summary Badges */}
                <div className="d-flex flex-wrap align-items-center gap-3 mb-3 p-3 bg-light rounded border">
                    <div>
                        <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>Total Invoice Amount</span>
                        <span className="fw-bold text-dark font-monospace" style={{ fontSize: '0.94rem' }}>
                            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="border-start ps-3">
                        <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>Total Paid</span>
                        <span className="fw-bold text-success font-monospace" style={{ fontSize: '0.94rem' }}>
                            ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="border-start ps-3">
                        <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>Remaining Balance</span>
                        <Badge bg={balanceAmount === 0 ? "soft-success" : "soft-danger"} className={`${balanceAmount === 0 ? "text-success" : "text-danger"} font-monospace px-2.5 py-1`} style={{ fontSize: '0.84rem' }}>
                            ₹{balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Badge>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" size="sm" variant="primary" className="mb-2" />
                        <p className="text-muted small mb-0">Loading payment records...</p>
                    </div>
                ) : history.length === 0 ? (
                    <Alert variant="info" className="text-center py-3 mb-0" style={{ fontSize: '0.84rem' }}>
                        <FaInfoCircle className="me-1" />
                        No payments have been recorded for this invoice yet.
                    </Alert>
                ) : (
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.82rem' }}>
                            <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                                <tr>
                                    <th className="py-2 px-3">Receipt No</th>
                                    <th className="py-2 px-3">Date</th>
                                    <th className="py-2 px-3">Payment Mode</th>
                                    <th className="py-2 px-3 text-end">Cash Paid</th>
                                    <th className="py-2 px-3 text-end">TDS Deducted</th>
                                    <th className="py-2 px-3 text-end">Write-off</th>
                                    <th className="py-2 px-3 text-end">Total Settled</th>
                                    <th className="py-2 px-3 text-center">Status</th>
                                    <th className="py-2 px-3 text-center">Receipt PDF</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item, idx) => (
                                    <tr key={item.allocationId || idx}>
                                        <td className="px-3 py-2 fw-bold text-primary font-monospace">
                                            {item.paymentNo || '-'}
                                        </td>
                                        <td className="px-3 py-2 text-muted">
                                            {item.paymentDate ? moment(item.paymentDate).format('DD/MM/YYYY') : '-'}
                                        </td>
                                        <td className="px-3 py-2">
                                            {item.paymentMode || '-'}
                                            {item.referenceNo && (
                                                <span className="text-muted d-block small font-monospace" style={{ fontSize: '0.72rem' }}>
                                                    Ref: {item.referenceNo}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-end font-monospace fw-semibold text-success">
                                            ₹{Number(item.cashPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-end font-monospace text-muted">
                                            {Number(item.tdsDeducted || 0) > 0 ? `₹${Number(item.tdsDeducted).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-end font-monospace text-warning">
                                            {Number(item.writeOffAmount || 0) > 0 ? `₹${Number(item.writeOffAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-end font-monospace fw-bold text-dark">
                                            ₹{Number(item.totalSettled || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <Badge bg={item.paymentStatus === 'COMPLETED' ? 'soft-success' : 'soft-danger'} className={item.paymentStatus === 'COMPLETED' ? 'text-success' : 'text-danger'}>
                                                {item.paymentStatus || 'COMPLETED'}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {item.paymentId && (
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleDownload(item.paymentId, item.paymentNo)}
                                                    className="p-1 px-2 d-inline-flex align-items-center gap-1"
                                                    style={{ fontSize: '0.74rem' }}
                                                    title="Download PDF"
                                                >
                                                    <FaFileDownload size={11} />
                                                    <span>PDF</span>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer className="border-top py-2 px-3">
                <Button variant="secondary" size="sm" onClick={onHide} style={{ fontSize: '0.84rem' }}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InvoicePaymentHistoryModal;
