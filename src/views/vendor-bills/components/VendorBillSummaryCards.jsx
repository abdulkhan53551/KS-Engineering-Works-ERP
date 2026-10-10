import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaCheckCircle, FaExclamationCircle, FaLayerGroup } from 'react-icons/fa';

/**
 * Summary KPI cards for Vendor Bills: Total Bills, Paid, Balance Due, and Status counts
 */
const VendorBillSummaryCards = ({ summary = {}, isLoading = false }) => {
    const totalAmount = Number(summary.totalBillsAmount || 0);
    const paidAmount = Number(summary.totalPaidAmount || 0);
    const balanceDue = Number(summary.totalBalanceDue || 0);
    const unpaidCount = Number(summary.unpaidCount || 0);
    const partialCount = Number(summary.partialCount || 0);
    const paidCount = Number(summary.paidCount || 0);

    return (
        <Row className="g-3 mb-3">
            {/* Total Bills Card */}
            <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                    <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                        <div>
                            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                Total Bills
                            </span>
                            <h4 className="fw-bold text-primary font-monospace mb-0 mt-1">
                                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                {summary.totalCount || 0} Total Recorded
                            </span>
                        </div>
                        <div
                            className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '44px', height: '44px' }}
                        >
                            <FaFileInvoiceDollar className="text-primary" size={18} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Total Paid Card */}
            <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                    <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                        <div>
                            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                Total Paid
                            </span>
                            <h4 className="fw-bold text-success font-monospace mb-0 mt-1">
                                ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                {paidCount} Bills Settled
                            </span>
                        </div>
                        <div
                            className="rounded-circle bg-soft-success d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '44px', height: '44px' }}
                        >
                            <FaCheckCircle className="text-success" size={18} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Total Balance Due Card */}
            <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                    <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                        <div>
                            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                Outstanding Due
                            </span>
                            <h4 className="fw-bold text-danger font-monospace mb-0 mt-1">
                                ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                {unpaidCount + partialCount} Bills Pending
                            </span>
                        </div>
                        <div
                            className="rounded-circle bg-soft-danger d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '44px', height: '44px' }}
                        >
                            <FaExclamationCircle className="text-danger" size={18} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>

            {/* Pending Split Breakdown */}
            <Col lg={3} sm={6}>
                <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                    <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                        <div>
                            <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                Status Breakdown
                            </span>
                            <div className="d-flex align-items-center gap-2 mt-1">
                                <span className="badge bg-warning text-dark font-monospace" style={{ fontSize: '0.75rem' }}>
                                    {unpaidCount} Unpaid
                                </span>
                                <span className="badge bg-info text-dark font-monospace" style={{ fontSize: '0.75rem' }}>
                                    {partialCount} Partial
                                </span>
                            </div>
                            <span className="text-muted small d-block mt-1" style={{ fontSize: '0.72rem' }}>
                                {paidCount} Completed
                            </span>
                        </div>
                        <div
                            className="rounded-circle bg-soft-warning d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: '44px', height: '44px' }}
                        >
                            <FaLayerGroup className="text-warning" size={18} />
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default VendorBillSummaryCards;
