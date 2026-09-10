import React from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Table,
    Badge,
    Spinner
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaArrowLeft,
    FaEdit,
    FaTrashAlt,
    FaCreditCard,
    FaFileInvoiceDollar,
    FaCalendarAlt,
    FaRegCalendarAlt,
    FaBuilding,
    FaPaperclip,
    FaHistory,
    FaIdCard,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaCoins,
    FaReceipt,
    FaExternalLinkAlt,
    FaWallet
} from 'react-icons/fa';
import moment from 'moment';
import VendorBillStatusBadge from '../components/VendorBillStatusBadge';
import AttachmentManager from '../../../components/attachments/AttachmentManager';
import useVendorBillDetail from '../hooks/useVendorBillDetail';

const VendorBillDetail = () => {
    const {
        id,
        bill,
        isLoading,
        total,
        paid,
        balance,
        taxable,
        cgst,
        sgst,
        igst,
        totalGst,
        vendor,
        vendorName,
        payments,
        totalCashPaid,
        totalTdsDeducted,
        totalWriteOff,
        isDeleting,
        handleDelete
    } = useVendorBillDetail();

    if (isLoading) {
        return (
            <Container fluid className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2 fw-medium" style={{ fontSize: '0.88rem' }}>
                    Loading vendor bill...
                </p>
            </Container>
        );
    }

    if (!bill) {
        return (
            <Container fluid className="py-5 text-center">
                <FaFileInvoiceDollar size={44} className="text-secondary opacity-50 mb-3" />
                <h5 className="fw-bold text-dark">Vendor Bill Not Found</h5>
                <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                    The requested bill does not exist or may have been deleted.
                </p>
                <Link to="/purchase/vendor-bills" className="btn btn-primary btn-sm px-3 shadow-sm">
                    Back to Vendor Bills
                </Link>
            </Container>
        );
    }

    return (
        <div className="vendor-bill-detail-view vendor-payment-detail-view">
            <Container fluid className="py-3 px-4">
                {/* Top Header Card */}
                <Card className="shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '10px' }}>
                    <Card.Body className="py-2.5 px-3">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-3">
                                <Link
                                    to="/purchase/vendor-bills"
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
                                    title="Back to Vendor Bills"
                                >
                                    <FaArrowLeft size={13} />
                                </Link>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h5 className="mb-0 fw-bold text-dark font-monospace" style={{ letterSpacing: '-0.02em' }}>
                                            Bill #{bill.billNo || bill.bill_no}
                                        </h5>
                                        <VendorBillStatusBadge status={bill.paymentStatus || bill.payment_status || bill.status} />
                                    </div>
                                    <span className="text-muted d-block font-monospace" style={{ fontSize: '0.76rem', marginTop: '2px' }}>
                                        System ID: #{bill.id}
                                        <span className="mx-1.5 opacity-50">•</span>
                                        Recorded on {moment(bill.createdAt || bill.billDate).format('DD MMM YYYY')}
                                    </span>
                                </div>
                            </div>

                            {/* Top Action Buttons with comfortable logo-to-label spacing */}
                            <div className="d-flex align-items-center gap-2">
                                {balance > 0 && (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        className="d-flex align-items-center shadow-sm fw-semibold"
                                        style={{ fontSize: '0.84rem', padding: '0.42rem 0.95rem', borderRadius: '6px' }}
                                        onClick={() => navigate(`/payments/vendor-payments/create?partyId=${bill.partyId}&billId=${bill.id}`)}
                                        title="Record payment against this bill"
                                    >
                                        <FaCreditCard size={13} style={{ marginRight: '0.5rem' }} />
                                        <span>Record Payment</span>
                                    </Button>
                                )}

                                <Link
                                    to={`/purchase/vendor-bills/${id}/edit`}
                                    className="btn btn-outline-primary btn-sm d-flex align-items-center shadow-sm fw-semibold"
                                    style={{ fontSize: '0.84rem', padding: '0.42rem 0.95rem', borderRadius: '6px' }}
                                    title="Edit bill details"
                                >
                                    <FaEdit size={13} style={{ marginRight: '0.5rem' }} />
                                    <span>Edit Bill</span>
                                </Link>

                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="d-flex align-items-center shadow-sm fw-semibold"
                                    style={{ fontSize: '0.84rem', padding: '0.42rem 0.95rem', borderRadius: '6px' }}
                                    disabled={isDeleting}
                                    onClick={handleDelete}
                                    title="Delete vendor bill"
                                >
                                    <FaTrashAlt size={12} style={{ marginRight: '0.5rem' }} />
                                    <span>Delete</span>
                                </Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* Top Financial KPI Cards */}
                <Row className="g-3 mb-3">
                    <Col lg={4} md={6}>
                        <Card className="metric-summary-card shadow-sm border border-start border-4 border-start-primary h-100 bg-white">
                            <Card.Body className="p-3">
                                <span className="metric-title d-block mb-1">
                                    Total Bill Amount
                                </span>
                                <h4 className="metric-value fw-bold text-dark font-monospace mb-1">
                                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="metric-subtext">
                                    Total purchase liability on invoice
                                </span>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4} md={6}>
                        <Card className="metric-summary-card shadow-sm border border-start border-4 border-start-success h-100 bg-white">
                            <Card.Body className="p-3">
                                <span className="metric-title d-block mb-1">
                                    Total Paid / Settled
                                </span>
                                <h4 className="metric-value fw-bold text-success font-monospace mb-1">
                                    ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="metric-subtext">
                                    {payments.length} {payments.length === 1 ? 'disbursement linked' : 'disbursements linked'}
                                </span>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={4} md={12}>
                        <Card className={`metric-summary-card shadow-sm border border-start border-4 ${balance > 0 ? 'border-start-danger' : 'border-start-secondary'} h-100 bg-white`}>
                            <Card.Body className="p-3">
                                <span className="metric-title d-block mb-1">
                                    Outstanding Balance Due
                                </span>
                                <h4 className={`metric-value fw-bold ${balance > 0 ? 'text-danger' : 'text-secondary'} font-monospace mb-1`}>
                                    ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="metric-subtext">
                                    {balance > 0 ? 'Pending payment to supplier' : 'Fully settled and paid off'}
                                </span>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Middle Row: Vendor Information & Bill Tax Breakdown */}
                <Row className="g-3 mb-3">
                    {/* Supplier / Vendor Details */}
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
                                    <FaBuilding className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
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

                    {/* Invoice Dates & Tax Breakdown */}
                    <Col lg={6}>
                        <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                            <Card.Header
                                className="bg-white border-bottom py-2.5 px-3"
                                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            >
                                <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
                                    <FaFileInvoiceDollar className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
                                    <span>Invoice Dates & Financial Breakdown</span>
                                </h6>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaCalendarAlt className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Bill Date</span>
                                    </span>
                                    <span className="info-value font-monospace">
                                        {bill.billDate ? moment(bill.billDate).format('DD/MM/YYYY') : '-'}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaRegCalendarAlt className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Payment Due Date</span>
                                    </span>
                                    <span className="info-value font-monospace">
                                        {bill.dueDate ? (
                                            <span className={moment(bill.dueDate).isBefore(moment(), 'day') && balance > 0 ? 'text-danger fw-bold' : ''}>
                                                {moment(bill.dueDate).format('DD/MM/YYYY')}
                                                <span className="text-muted fw-normal small ms-1">({bill.dueDays ?? 30} days)</span>
                                            </span>
                                        ) : '-'}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaCoins className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Taxable Amount</span>
                                    </span>
                                    <span className="info-value font-monospace">
                                        ₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="info-label d-flex align-items-center">
                                        <FaReceipt className="text-muted flex-shrink-0" size={12} style={{ marginRight: '0.55rem' }} />
                                        <span>Total GST (CGST/SGST/IGST)</span>
                                    </span>
                                    <span className="info-value font-monospace">
                                        ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        {cgst > 0 && <span className="text-muted small fw-normal ms-1">(CGST: ₹{cgst.toFixed(2)}, SGST: ₹{sgst.toFixed(2)})</span>}
                                        {igst > 0 && <span className="text-muted small fw-normal ms-1">(IGST: ₹{igst.toFixed(2)})</span>}
                                    </span>
                                </div>

                                {Number(bill.otherCharges || 0) !== 0 && (
                                    <div className="info-row">
                                        <span className="info-label">Other Charges</span>
                                        <span className="info-value font-monospace">
                                            ₹{Number(bill.otherCharges).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                {Number(bill.roundOff || 0) !== 0 && (
                                    <div className="info-row">
                                        <span className="info-label">Round Off</span>
                                        <span className="info-value font-monospace">
                                            ₹{Number(bill.roundOff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}

                                {bill.notes && (
                                    <div className="mt-2.5 pt-2 border-top">
                                        <span className="text-muted d-block small mb-1 fw-semibold">Bill Remarks / Notes</span>
                                        <div className="p-2 rounded bg-light border border-light-subtle text-secondary" style={{ fontSize: '0.82rem' }}>
                                            "{bill.notes}"
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Bottom Section 1: Disbursement / Payment History */}
                <Card className="border-0 shadow-sm bg-white mb-3" style={{ borderRadius: '10px' }}>
                    <Card.Header
                        className="bg-white border-bottom py-2.5 px-3 d-flex justify-content-between align-items-center flex-wrap gap-2"
                        style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                    >
                        <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
                            <FaHistory className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
                            <span>Disbursement / Payment History</span>
                        </h6>
                        <div className="d-flex align-items-center gap-2">
                            <Badge bg="soft-secondary" className="text-secondary font-monospace px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                                {payments.length} {payments.length === 1 ? 'Voucher' : 'Vouchers'}
                            </Badge>
                            {balance > 0 && (
                                <Link
                                    to={`/payments/vendor-payments/create?partyId=${bill.partyId}&billId=${bill.id}`}
                                    className="btn btn-outline-primary btn-sm py-1 px-2.5 fw-semibold d-flex align-items-center shadow-sm"
                                    style={{ fontSize: '0.78rem' }}
                                >
                                    <FaCreditCard size={11} style={{ marginRight: '0.4rem' }} />
                                    <span>+ Pay Bill</span>
                                </Link>
                            )}
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {payments.length === 0 ? (
                            <div className="text-center py-5 px-3">
                                <div
                                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                                    style={{ width: '52px', height: '52px', backgroundColor: '#f1f5f9', color: '#64748b' }}
                                >
                                    <FaCreditCard size={22} className="opacity-75" />
                                </div>
                                <h6 className="fw-bold text-dark mb-1">No Disbursements Recorded Yet</h6>
                                <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '440px', fontSize: '0.84rem' }}>
                                    No outward payments have been allocated to settle this bill. You can record a payment voucher to settle the outstanding balance.
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <Table hover className="bills-detail-table align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Voucher #</th>
                                            <th>Payment Date</th>
                                            <th>Payment Mode</th>
                                            <th className="text-end">Cash Allocated</th>
                                            <th className="text-end">TDS Deducted</th>
                                            <th className="text-end">Write-Off</th>
                                            <th className="text-end">Total Settled</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p, idx) => {
                                            const cash = Number(p.allocatedAmount || p.allocated_amount || 0);
                                            const tds = Number(p.tdsAmount || p.tds_amount || 0);
                                            const wo = Number(p.writeOffAmount || p.write_off_amount || 0);
                                            const rowTotal = cash + tds + wo;
                                            const pId = p.paymentId || p.id;
                                            const pNo = p.paymentNo || p.payment_no || `PAY-${pId}`;

                                            return (
                                                <tr key={p.id || idx}>
                                                    <td>
                                                        <Link
                                                            to={`/payments/vendor-payments/${pId}`}
                                                            className="text-primary fw-bold font-monospace text-decoration-none d-inline-flex align-items-center gap-1"
                                                        >
                                                            <span>{pNo}</span>
                                                            <FaExternalLinkAlt size={10} className="opacity-50" />
                                                        </Link>
                                                    </td>
                                                    <td className="text-muted font-monospace">
                                                        {p.paymentDate ? moment(p.paymentDate).format('DD/MM/YYYY') : '-'}
                                                    </td>
                                                    <td>
                                                        <Badge bg="soft-primary" className="text-primary font-monospace px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                                            {p.paymentModeName || p.paymentMode || 'Bank'}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end font-monospace text-success fw-semibold">
                                                        ₹{cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="text-end font-monospace text-secondary">
                                                        {tds > 0 ? `₹${tds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                                    </td>
                                                    <td className="text-end font-monospace text-secondary">
                                                        {wo > 0 ? `₹${wo.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
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
                                            <td colSpan={3} className="text-uppercase text-secondary" style={{ letterSpacing: '0.04em' }}>
                                                Total Payment Breakdown
                                            </td>
                                            <td className="text-end font-monospace text-success fw-bold">
                                                ₹{totalCashPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-end font-monospace text-secondary fw-semibold">
                                                ₹{totalTdsDeducted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-end font-monospace text-secondary fw-semibold">
                                                ₹{totalWriteOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="text-end font-monospace text-primary fw-bold">
                                                ₹{(totalCashPaid + totalTdsDeducted + totalWriteOff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* Bottom Section 2: Attached Bill PDF / Scans */}
                <Card className="border-0 shadow-sm bg-white mb-3" style={{ borderRadius: '10px' }}>
                    <Card.Header
                        className="bg-white border-bottom py-2.5 px-3"
                        style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                    >
                        <h6 className="mb-0 fw-bold text-dark d-flex align-items-center" style={{ fontSize: '0.88rem' }}>
                            <FaPaperclip className="text-primary flex-shrink-0" size={14} style={{ marginRight: '0.55rem' }} />
                            <span>Attached Bill PDF / Scans</span>
                        </h6>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <AttachmentManager
                            entityType="VENDOR_BILL"
                            entityId={id}
                            folder="vendor-bills"
                        />
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default VendorBillDetail;
