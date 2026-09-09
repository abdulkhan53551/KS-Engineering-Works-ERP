import React from 'react';
import { Container, Row, Col, Card, Button, Table, Spinner, Modal, Form, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaArrowLeft,
    FaFilePdf,
    FaBan,
    FaMoneyBillWave,
    FaBuilding,
    FaUniversity,
    FaFileInvoiceDollar,
    FaWallet,
    FaIdCard,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaCreditCard,
    FaHashtag,
    FaCalendarAlt,
    FaCheckCircle,
    FaInfoCircle,
    FaExternalLinkAlt
} from 'react-icons/fa';
import moment from 'moment';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import useVendorPaymentDetail from '../hooks/useVendorPaymentDetail';

const VendorPaymentDetail = () => {
    const {
        id,
        payment,
        isLoading,
        paymentNo,
        isCancelled,
        total,
        allocated,
        advance,
        vendor,
        vendorName,
        allocations,
        totalCashAllocated,
        totalTdsDeducted,
        totalWriteOff,
        grandSettled,
        showCancelModal,
        setShowCancelModal,
        cancelReason,
        setCancelReason,
        isCancelling,
        handleDownloadPdf,
        handleConfirmCancel
    } = useVendorPaymentDetail();

    if (isLoading) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2 fw-medium" style={{ fontSize: '0.88rem' }}>
                    Loading payment voucher...
                </p>
            </Container>
        );
    }

    if (!payment) {
        return (
            <Container fluid className="py-5 text-center">
                <FaMoneyBillWave size={44} className="text-secondary opacity-50 mb-3" />
                <h5 className="fw-bold text-dark">Payment Voucher Not Found</h5>
                <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                    The requested payment voucher does not exist or was removed.
                </p>
                <Link to="/payments/vendor-payments" className="btn btn-primary btn-sm px-3 shadow-sm">
                    Back to Outward Payments
                </Link>
            </Container>
        );
    }

    return (
        <div className="vendor-payment-detail-view">
            <Container fluid className="py-3 px-4">
                {/* Top Header Card */}
                <Card className="shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '10px' }}>
                    <Card.Body className="py-2.5 px-3">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                                <Link
                                    to="/payments/vendor-payments"
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
                                    title="Back to Outward Payments"
                                >
                                    <FaArrowLeft size={13} />
                                </Link>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h5 className="mb-0 fw-bold text-dark font-monospace" style={{ letterSpacing: '-0.02em' }}>
                                            {paymentNo}
                                        </h5>
                                        <PaymentStatusBadge status={payment.status} />
                                    </div>
                                    <span className="text-muted d-block" style={{ fontSize: '0.76rem', marginTop: '2px' }}>
                                        Disbursement Date: <strong className="text-secondary">{payment.paymentDate ? moment(payment.paymentDate).format('DD MMMM YYYY') : '-'}</strong>
                                        {payment.createdAt && (
                                            <>
                                                <span className="mx-1.5 opacity-50">•</span>
                                                Recorded on {moment(payment.createdAt).format('DD/MM/YYYY, hh:mm A')}
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Top Actions: Clear icon-to-label spacing with marginRight: 0.5rem */}
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="d-flex align-items-center shadow-sm"
                                    style={{
                                        fontSize: '0.84rem',
                                        fontWeight: 600,
                                        padding: '0.42rem 0.95rem',
                                        borderRadius: '6px'
                                    }}
                                    onClick={handleDownloadPdf}
                                    title="Download printable PDF voucher"
                                >
                                    <FaFilePdf size={13} style={{ marginRight: '0.5rem' }} />
                                    <span>Download PDF</span>
                                </Button>

                                {!isCancelled && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="d-flex align-items-center shadow-sm"
                                        style={{
                                            fontSize: '0.84rem',
                                            fontWeight: 600,
                                            padding: '0.42rem 0.95rem',
                                            borderRadius: '6px'
                                        }}
                                        onClick={() => setShowCancelModal(true)}
                                        title="Cancel voucher and restore bill balances"
                                    >
                                        <FaBan size={13} style={{ marginRight: '0.5rem' }} />
                                        <span>Cancel Voucher</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Cancelled Alert Banner */}
                {isCancelled && (
                    <div
                        className="alert alert-danger d-flex align-items-start gap-2.5 mb-3 py-2.5 px-3 border-0 shadow-sm"
                        style={{ borderRadius: '8px', fontSize: '0.84rem' }}
                    >
                        <FaBan className="text-danger flex-shrink-0 mt-0.5" size={15} />
                        <div>
                            <strong>This outward payment voucher was CANCELLED</strong>
                            {payment.cancelledAt && (
                                <> on {moment(payment.cancelledAt).format('DD MMMM YYYY, hh:mm A')}</>
                            )}
                            . All allocated funds have been reversed and vendor bill balances are fully restored.
                            {payment.cancelReason && (
                                <div className="mt-1 text-danger-emphasis fst-italic">
                                    Reason: "{payment.cancelReason}"
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* KPI Financial Metric Summary Cards */}
                <Row className="g-3 mb-3">
                    <Col lg={4} md={6}>
                        <Card className="metric-summary-card shadow-sm border border-start border-4 border-start-primary h-100 bg-white">
                            <Card.Body className="p-3">
                                <span className="metric-title d-block mb-1">
                                    Total Amount Disbursed
                                </span>
                                <h4 className="metric-value fw-bold text-dark font-monospace mb-1">
                                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="metric-subtext">
                                    Total outward cash outflow for this voucher
                                </span>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4} md={6}>
                        <Card className="metric-summary-card shadow-sm border border-start border-4 border-start-success h-100 bg-white">
                            <Card.Body className="p-3">
                                <span className="metric-title d-block mb-1">
                                    Settled Against Bills
                                </span>
                                <h4 className="metric-value fw-bold text-success font-monospace mb-1">
                                    ₹{allocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="metric-subtext">
                                    {allocations.length} {allocations.length === 1 ? 'bill settled' : 'bills settled'} in this disbursement
                                </span>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4} md={12}>
                        <Card className="metric-summary-card shadow-sm border border-start border-4 border-start-info h-100 bg-white">
                            <Card.Body className="p-3">
                                <span className="metric-title d-block mb-1">
                                    Advance Retained on Account
                                </span>
                                <h4 className="metric-value fw-bold text-info font-monospace mb-1">
                                    ₹{advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="metric-subtext">
                                    {advance > 0 ? 'Surplus funds retained for upcoming purchases' : 'Fully allocated against vendor bills'}
                                </span>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Middle Row: Vendor Information & Banking Details */}
                <Row className="g-3 mb-3">
                    {/* Supplier / Vendor Details */}
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                                    <FaBuilding className="text-primary" size={14} />
                                    <span>Supplier / Vendor Details</span>
                                </h6>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <div className="mb-3">
                                    <span className="text-muted d-block small mb-1">Vendor Name</span>
                                    <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>
                                        {vendorName}
                                    </h6>
                                    {vendor.legalName && vendor.legalName !== vendorName && (
                                        <span className="text-muted small d-block">
                                            Legal: {vendor.legalName}
                                        </span>
                                    )}
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaIdCard className="text-muted flex-shrink-0" size={13} style={{ marginRight: '0.55rem' }} />
                                        <span>GSTIN / Tax ID</span>
                                    </span>
                                    <span className="info-value font-monospace">
                                        {vendor.gstin ? (
                                            <strong className="text-dark">{vendor.gstin}</strong>
                                        ) : (
                                            <span className="text-muted fw-normal">Unregistered / Not Provided</span>
                                        )}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaPhoneAlt className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Phone Number</span>
                                    </span>
                                    <span className="info-value">
                                        {vendor.phone ? vendor.phone : <span className="text-muted fw-normal">—</span>}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaMapMarkerAlt className="text-muted flex-shrink-0" size={13} style={{ marginRight: '0.55rem' }} />
                                        <span>City / Location</span>
                                    </span>
                                    <span className="info-value">
                                        {vendor.city || vendor.state ? (
                                            `${vendor.city || ''}${vendor.city && vendor.state ? ', ' : ''}${vendor.state || ''}`
                                        ) : (
                                            <span className="text-muted fw-normal">—</span>
                                        )}
                                    </span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Disbursement Channel & Banking Details */}
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
                                    <FaUniversity className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
                                    <span>Payment Channel & Bank References</span>
                                </h6>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaCreditCard className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Payment Mode</span>
                                    </span>
                                    <span className="info-value">
                                        <Badge bg="soft-primary" className="text-primary font-monospace px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
                                            {payment.paymentModeName || payment.paymentMode || 'Electronic / Bank'}
                                        </Badge>
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaUniversity className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Bank Account / Name</span>
                                    </span>
                                    <span className="info-value">
                                        {payment.bankName ? (
                                            <strong className="text-dark">{payment.bankName}</strong>
                                        ) : (
                                            <span className="text-muted fw-normal">—</span>
                                        )}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaHashtag className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>UTR / Transaction Ref No</span>
                                    </span>
                                    <span className="info-value font-monospace">
                                        {payment.referenceNo ? (
                                            <strong className="text-dark">{payment.referenceNo}</strong>
                                        ) : (
                                            <span className="text-muted fw-normal">—</span>
                                        )}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaCalendarAlt className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Reference / Instrument Date</span>
                                    </span>
                                    <span className="info-value font-monospace">
                                        {payment.referenceDate ? (
                                            moment(payment.referenceDate).format('DD/MM/YYYY')
                                        ) : (
                                            <span className="text-muted fw-normal">—</span>
                                        )}
                                    </span>
                                </div>

                                {payment.notes && (
                                    <div className="mt-2.5 pt-2 border-top">
                                        <span className="text-muted d-block small mb-1 fw-semibold">Payment Notes / Remarks</span>
                                        <div className="p-2 rounded bg-light border border-light-subtle text-secondary" style={{ fontSize: '0.82rem' }}>
                                            "{payment.notes}"
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Bottom Section: Settled Vendor Bills Breakdown */}
                <Card className="border-0 shadow-sm bg-white mb-3" style={{ borderRadius: '10px' }}>
                    <Card.Header
                        className="bg-white border-bottom py-2.5 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2"
                        style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                    >
                        <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.88rem' }}>
                            <FaFileInvoiceDollar className="text-primary" size={14} />
                            <span>Allocated Vendor Bills Breakdown</span>
                        </h6>
                        <Badge bg="soft-secondary" className="text-secondary font-monospace px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                            {allocations.length} {allocations.length === 1 ? 'Bill Allocated' : 'Bills Allocated'}
                        </Badge>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {allocations.length === 0 ? (
                            <div className="text-center py-5 px-3">
                                <div
                                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                    style={{ width: '56px', height: '56px', backgroundColor: '#e0f2fe', color: '#0284c7' }}
                                >
                                    <FaWallet size={24} />
                                </div>
                                <h6 className="fw-bold text-dark mb-1">100% Pure Advance Disbursement</h6>
                                <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '480px', fontSize: '0.84rem' }}>
                                    No vendor bills were allocated to this voucher. The entire amount of{' '}
                                    <strong className="text-dark font-monospace">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>{' '}
                                    is credited as advance on the vendor's ledger and can be adjusted against future bills.
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="bills-detail-table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Bill Number</th>
                                            <th>Bill Date</th>
                                            <th className="text-end">Cash Allocated</th>
                                            <th className="text-end">TDS Deducted</th>
                                            <th className="text-end">Write-Off</th>
                                            <th className="text-end">Total Settled</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allocations.map((a, idx) => {
                                            const cash = Number(a.allocatedAmount || a.allocated_amount || 0);
                                            const tds = Number(a.tdsAmount || a.tds_amount || 0);
                                            const wo = Number(a.writeOffAmount || a.write_off_amount || 0);
                                            const rowTotal = cash + tds + wo;
                                            const billId = a.vendorBillId || a.billId;
                                            const billNo = a.billNo || a.bill_no || `BILL-${billId}`;

                                            return (
                                                <tr key={a.id || idx}>
                                                    <td>
                                                        <Link
                                                            to={`/purchase/vendor-bills/${billId}`}
                                                            className="text-primary fw-bold font-monospace text-decoration-none d-inline-flex align-items-center gap-1"
                                                        >
                                                            <span>{billNo}</span>
                                                            <FaExternalLinkAlt size={10} className="opacity-50" />
                                                        </Link>
                                                    </td>
                                                    <td className="text-muted font-monospace">
                                                        {a.billDate ? moment(a.billDate).format('DD/MM/YYYY') : '-'}
                                                    </td>
                                                    <td className="text-end font-monospace text-success fw-semibold">
                                                        ₹{cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-end font-monospace text-secondary">
                                                        {tds > 0 ? `₹${tds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                                    </td>
                                                    <td className="text-end font-monospace text-secondary">
                                                        {wo > 0 ? (
                                                            <span title={a.writeOffReason ? `Reason: ${a.writeOffReason}` : 'Written Off'}>
                                                                ₹{wo.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="text-end font-monospace fw-bold text-dark">
                                                        ₹{rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={2} className="text-uppercase text-secondary" style={{ letterSpacing: '0.04em' }}>
                                                Total Settle Breakdown
                                            </td>
                                            <td className="text-end font-monospace text-success fw-bold">
                                                ₹{totalCashAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-end font-monospace text-secondary fw-semibold">
                                                ₹{totalTdsDeducted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-end font-monospace text-secondary fw-semibold">
                                                ₹{totalWriteOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-end font-monospace text-primary fw-bold">
                                                ₹{grandSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            {/* Cancel Voucher Confirmation Modal */}
            <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                <Modal.Header closeButton className="py-2.5 px-3">
                    <Modal.Title className="d-flex align-items-center gap-2 text-danger" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                        <FaBan size={15} />
                        <span>Cancel Outward Payment Voucher</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-3">
                    <p className="text-muted small mb-3">
                        Are you sure you want to cancel payment voucher <strong className="text-dark font-monospace">{paymentNo}</strong>?
                        All allocated cash and discounts will be reversed, and the corresponding vendor bill balances will be immediately restored.
                    </p>
                    <Form.Group>
                        <Form.Label className="small fw-semibold text-secondary mb-1">
                            Reason for Cancellation <span className="text-muted fw-normal">(optional)</span>
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="e.g. Cheque bounced, entered duplicate voucher, wrong account..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            style={{ fontSize: '0.84rem' }}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="py-2 px-3">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setShowCancelModal(false)}
                        disabled={isCancelling}
                        className="px-3"
                    >
                        Keep Voucher
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleConfirmCancel}
                        disabled={isCancelling}
                        className="d-flex align-items-center shadow-sm px-3 fw-semibold"
                    >
                        {isCancelling && <Spinner animation="border" size="sm" className="me-1.5" />}
                        <FaBan size={12} style={{ marginRight: '0.45rem' }} />
                        <span>Confirm Cancellation</span>
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default VendorPaymentDetail;
