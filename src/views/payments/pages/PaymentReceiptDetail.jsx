import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePaymentById } from '../hooks/usePaymentApi';
import { downloadPaymentPdf } from '../api';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import CancelPaymentModal from '../components/modals/CancelPaymentModal';
import {
    FaArrowLeft,
    FaFileDownload,
    FaTimesCircle,
    FaReceipt,
    FaMoneyBillWave,
    FaFileInvoice,
    FaInfoCircle,
    FaCheckCircle,
    FaUniversity
} from 'react-icons/fa';
import moment from 'moment';
import { toast } from 'react-toastify';

/**
 * PaymentReceiptDetail Component
 * Comprehensive view of a single receipt voucher with allocated invoice breakdown.
 */
const PaymentReceiptDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cancelModalOpen, setCancelModalOpen] = useState(false);

    const { data: payment, isLoading, isError, error } = usePaymentById(id);

    if (isLoading) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted small mt-2">Loading receipt details...</p>
            </Container>
        );
    }

    if (isError || !payment) {
        return (
            <Container fluid className="py-5 text-center">
                <Alert variant="danger" className="d-inline-block px-4 py-3">
                    <FaInfoCircle className="me-2" />
                    {error?.message || 'Payment receipt not found.'}
                </Alert>
                <div className="mt-3">
                    <Link to="/payments/receipts" className="btn btn-outline-secondary btn-sm">
                        Back to Receipts
                    </Link>
                </div>
            </Container>
        );
    }

    const paymentNo = payment.paymentNo || payment.payment_no || `REC-${payment.id}`;
    const totalAmount = Number(payment.totalAmount || payment.total_amount || 0);
    const allocatedAmount = Number(payment.allocatedAmount || payment.allocated_amount || 0);
    const unallocatedAmount = Number(payment.unallocatedAmount || payment.unallocated_amount || 0);
    const isCancelled = (payment.status || '').toUpperCase() === 'CANCELLED';
    const allocations = payment.allocations || [];

    const handleDownload = async () => {
        try {
            await downloadPaymentPdf(payment.id, paymentNo);
            toast.success(`Receipt ${paymentNo} downloaded.`);
        } catch (err) {
            toast.error(err?.message || 'Failed to download receipt PDF.');
        }
    };

    return (
        <Container fluid className="py-3 px-4">
            {/* Top Header Card with White Background Section */}
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
                                <div className="d-flex align-items-center gap-2">
                                    <h5 className="mb-0 fw-bold text-dark font-monospace">
                                        {paymentNo}
                                    </h5>
                                    <PaymentStatusBadge status={payment.status} />
                                </div>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    Receipt created on {payment.createdAt ? moment(payment.createdAt).format('DD/MM/YYYY, hh:mm A') : '-'}
                                </span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={handleDownload}
                                className="d-flex align-items-center shadow-sm"
                                style={{ fontSize: '0.84rem', fontWeight: 500 }}
                            >
                                <FaFileDownload size={12} style={{ marginRight: '0.45rem' }} />
                                <span>Download PDF Voucher</span>
                            </Button>

                            {!isCancelled && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => setCancelModalOpen(true)}
                                    className="d-flex align-items-center shadow-sm"
                                    style={{ fontSize: '0.84rem', fontWeight: 500 }}
                                >
                                    <FaTimesCircle size={12} style={{ marginRight: '0.45rem' }} />
                                    <span>Cancel Receipt</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Cancelled Alert Banner */}
            {isCancelled && (
                <Alert variant="danger" className="py-2.5 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.84rem' }}>
                    <FaTimesCircle className="text-danger flex-shrink-0" size={16} />
                    <div>
                        This payment receipt has been <strong>CANCELLED</strong>. All invoice balances were rolled back to their original amounts.
                    </div>
                </Alert>
            )}

            {/* Metric Summary Cards */}
            <Row className="g-3 mb-4">
                <Col lg={4} md={6}>
                    <Card className="shadow-sm border border-start border-4 border-start-primary h-100">
                        <Card.Body className="p-3">
                            <span className="text-muted small text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                                Total Received
                            </span>
                            <h4 className="fw-bold text-dark font-monospace mb-0 mt-1">
                                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4} md={6}>
                    <Card className="shadow-sm border border-start border-4 border-start-success h-100">
                        <Card.Body className="p-3">
                            <span className="text-muted small text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                                Allocated to Invoices
                            </span>
                            <h4 className="fw-bold text-success font-monospace mb-0 mt-1">
                                ₹{allocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4} md={12}>
                    <Card className="shadow-sm border border-start border-4 border-start-info h-100">
                        <Card.Body className="p-3">
                            <span className="text-muted small text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                                Advance Retained on Account
                            </span>
                            <h4 className="fw-bold text-info font-monospace mb-0 mt-1">
                                ₹{unallocatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Customer & Banking Info Cards */}
            <Row className="g-3 mb-4">
                {/* Customer Information */}
                <Col lg={6} md={12}>
                    <Card className="shadow-sm border h-100">
                        <Card.Header className="bg-transparent py-2.5 px-3 border-bottom">
                            <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Customer Details</h6>
                        </Card.Header>
                        <Card.Body className="p-3" style={{ fontSize: '0.84rem' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Customer Name:</span>
                                <strong className="text-dark">{payment.customerName || payment.partyName || 'Customer'}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Receipt Date:</span>
                                <span className="text-dark font-monospace">
                                    {payment.paymentDate ? moment(payment.paymentDate).format('DD/MM/YYYY') : '-'}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-muted">Payment Type:</span>
                                <Badge bg="soft-primary" className="text-primary">{payment.paymentType || 'INWARD'}</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Banking & Transaction Info */}
                <Col lg={6} md={12}>
                    <Card className="shadow-sm border h-100">
                        <Card.Header className="bg-transparent py-2.5 px-3 border-bottom">
                            <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Banking & Transaction Details</h6>
                        </Card.Header>
                        <Card.Body className="p-3" style={{ fontSize: '0.84rem' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Payment Mode:</span>
                                <strong className="text-dark">{payment.paymentMode || '—'}</strong>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Reference / UTR No:</span>
                                <span className="font-monospace text-dark">{payment.referenceNo || '—'}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Bank Name:</span>
                                <span>{payment.bankName || '—'}</span>
                            </div>
                            {payment.notes && (
                                <div className="d-flex justify-content-between pt-1 border-top">
                                    <span className="text-muted">Notes:</span>
                                    <span className="text-dark fst-italic">{payment.notes}</span>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Allocated Invoices Breakdown */}
            <Card className="shadow-sm border mb-4">
                <Card.Header className="bg-transparent py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <FaFileInvoice className="text-primary" size={16} />
                        <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                            Settled Invoices Breakdown
                        </h6>
                    </div>
                    <Badge bg="soft-secondary" className="text-secondary">
                        {allocations.length} {allocations.length === 1 ? 'Invoice Settled' : 'Invoices Settled'}
                    </Badge>
                </Card.Header>

                {allocations.length === 0 ? (
                    <Card.Body className="text-center py-4 text-muted" style={{ fontSize: '0.84rem' }}>
                        No invoices were settled in this receipt. 100% of the funds are retained as Customer Advance.
                    </Card.Body>
                ) : (
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.84rem' }}>
                            <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                                <tr>
                                    <th className="py-2.5 px-3">Invoice No</th>
                                    <th className="py-2.5 px-3">Invoice Date</th>
                                    <th className="py-2.5 px-3 text-end">Invoice Total</th>
                                    <th className="py-2.5 px-3 text-end">Cash Allocated</th>
                                    <th className="py-2.5 px-3 text-end">TDS Deducted</th>
                                    <th className="py-2.5 px-3 text-end">Write-off / Disc.</th>
                                    <th className="py-2.5 px-3">Write-off Reason</th>
                                    <th className="py-2.5 px-3 text-end">Total Settled</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allocations.map((item, idx) => {
                                    const cash = Number(item.allocatedAmount || item.allocated_amount || 0);
                                    const tds = Number(item.tdsAmount || item.tds_amount || 0);
                                    const writeOff = Number(item.writeOffAmount || item.write_off_amount || 0);
                                    const settled = Number(item.totalSettledAmount || (cash + tds + writeOff));

                                    return (
                                        <tr key={item.id || idx}>
                                            <td className="px-3 py-2.5 font-monospace fw-bold text-primary">
                                                {item.invoiceNo || item.invoice_no || `INV #${item.invoiceId}`}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted">
                                                {item.invoiceDate ? moment(item.invoiceDate).format('DD/MM/YYYY') : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace text-muted">
                                                ₹{Number(item.invoiceTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace fw-semibold text-success">
                                                ₹{cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace text-muted">
                                                {tds > 0 ? `₹${tds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace text-warning">
                                                {writeOff > 0 ? `₹${writeOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted small">
                                                {item.writeOffReason || item.write_off_reason || '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace fw-bold text-dark">
                                                ₹{settled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Cancel Modal */}
            <CancelPaymentModal
                show={cancelModalOpen}
                onHide={() => setCancelModalOpen(false)}
                payment={payment}
            />
        </Container>
    );
};

export default PaymentReceiptDetail;
