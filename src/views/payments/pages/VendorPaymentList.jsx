import React from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    Table,
    Button,
    InputGroup,
    Form,
    Spinner,
    Badge,
    Modal
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaPlus,
    FaSearch,
    FaFilter,
    FaUndo,
    FaMoneyBillWave,
    FaCheckCircle,
    FaWallet,
    FaEye,
    FaFilePdf,
    FaBan,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';
import moment from 'moment';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import useVendorPaymentList from '../hooks/useVendorPaymentList';

const VendorPaymentList = () => {
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        sortBy,
        sortOrder,
        cancelModalItem,
        setCancelModalItem,
        cancelReason,
        setCancelReason,
        payments,
        isLoading,
        summary,
        isCancelling,
        handleSort,
        handleDownloadPdf,
        handleConfirmCancel,
        handleResetFilters
    } = useVendorPaymentList();

    return (
        <Container fluid className="py-3 px-4">
            {/* Header Bar */}
            <Card className="shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px' }}>
                <Card.Body className="py-2.5 px-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '40px', height: '40px', marginRight: '0.85rem' }}
                            >
                                <FaMoneyBillWave className="text-primary" size={18} />
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold text-dark">
                                    Outward Vendor Payments
                                </h5>
                                <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                                    Track supplier disbursements, bill settlements, and retained vendor advances.
                                </span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Link
                                to="/payments/vendor-payments/create"
                                className="btn btn-primary btn-sm px-3.5 py-1.5 d-flex align-items-center shadow-sm"
                                style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '8px' }}
                            >
                                <FaPlus size={12} style={{ marginRight: '0.45rem' }} />
                                <span>Record Payment</span>
                            </Link>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* KPI Summary Cards */}
            <Row className="g-3 mb-3">
                {/* Total Disbursed */}
                <Col lg={4} md={6}>
                    <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                    Total Disbursed
                                </span>
                                <h4 className="fw-bold text-primary font-monospace mb-0 mt-1">
                                    ₹{(summary.totalDisbursements ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                    {summary.totalCount || 0} Vouchers Recorded
                                </span>
                            </div>
                            <div
                                className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <FaMoneyBillWave className="text-primary" size={18} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Total Bills Settled */}
                <Col lg={4} md={6}>
                    <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                    Bills Settled
                                </span>
                                <h4 className="fw-bold text-success font-monospace mb-0 mt-1">
                                    ₹{(summary.totalAllocated ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                    {summary.completedCount || 0} Completed Payments
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

                {/* Vendor Advance Retained */}
                <Col lg={4} md={12}>
                    <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                    Vendor Advance Retained
                                </span>
                                <h4 className="fw-bold text-info font-monospace mb-0 mt-1">
                                    ₹{(summary.totalUnallocated ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
                                <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                    Available for Future Bills
                                </span>
                            </div>
                            <div
                                className="rounded-circle bg-soft-info d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <FaWallet className="text-info" size={18} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Table Card with Filter Toolbar */}
            <Card className="border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <div className="p-3 border-bottom bg-white">
                    <Row className="g-2.5 align-items-center">
                        {/* Search Input */}
                        <Col lg={4} md={5}>
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-light border-end-0 text-muted ps-2.5">
                                    <FaSearch size={12} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search voucher no, vendor, UTR..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="bg-light border-start-0 border-end-0 ps-1"
                                    style={{ fontSize: '0.82rem' }}
                                />
                                {search && (
                                    <Button
                                        variant="light"
                                        className="border-start-0 text-muted px-2"
                                        onClick={() => {
                                            setSearch('');
                                            setPage(1);
                                        }}
                                    >
                                        &times;
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>

                        {/* Status Filter */}
                        <Col lg={2} md={3} sm={6}>
                            <Form.Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="bg-light border-1 text-secondary"
                                style={{ fontSize: '0.82rem' }}
                            >
                                <option value="">All Statuses</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </Form.Select>
                        </Col>

                        {/* Start Date */}
                        <Col lg={2} md={2} sm={6}>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                                className="bg-light border-1 text-secondary"
                                style={{ fontSize: '0.82rem' }}
                            />
                        </Col>

                        {/* End Date */}
                        <Col lg={2} md={2} sm={6}>
                            <Form.Control
                                type="date"
                                size="sm"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                                className="bg-light border-1 text-secondary"
                                style={{ fontSize: '0.82rem' }}
                            />
                        </Col>

                        {/* Reset Filter Button */}
                        <Col lg={2} md={12} className="text-end">
                            {(search || statusFilter || startDate || endDate) ? (
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                                    style={{ fontSize: '0.78rem' }}
                                >
                                    <FaUndo size={10} />
                                    <span>Reset</span>
                                </Button>
                            ) : (
                                <div className="text-muted small py-1" style={{ fontSize: '0.76rem' }}>
                                    <FaFilter size={10} className="me-1 opacity-50" />
                                    <span>Filter</span>
                                </div>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <Table hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.84rem' }}>
                        <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                            <tr>
                                <th className="py-2.5 px-3 text-center" style={{ width: '65px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                        <span>#ID</span>
                                        {sortBy === 'id' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('payment_no')}>
                                    <div className="d-flex align-items-center gap-1">
                                        <span>Voucher No</span>
                                        {sortBy === 'payment_no' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('payment_date')}>
                                    <div className="d-flex align-items-center gap-1">
                                        <span>Date</span>
                                        {sortBy === 'payment_date' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3">Vendor</th>
                                <th className="py-2.5 px-3">Payment Mode & Ref</th>
                                <th className="py-2.5 px-3 text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_amount')}>
                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                        <span>Total Disbursed</span>
                                        {sortBy === 'total_amount' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-end">Allocated to Bills</th>
                                <th className="py-2.5 px-3 text-end">Advance Retained</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-center" style={{ width: '130px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-5">
                                        <Spinner animation="border" size="sm" variant="primary" className="mb-2" />
                                        <p className="text-muted small mb-0">Loading vendor payments...</p>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-5 text-muted">
                                        <FaMoneyBillWave size={28} className="mb-2 text-secondary opacity-50" />
                                        <p className="fw-semibold mb-1">No outward vendor payments found</p>
                                        <span className="small">Try adjusting search filters or record a new supplier payment.</span>
                                    </td>
                                </tr>
                            ) : (
                                payments.map((item) => {
                                    const paymentNo = item.paymentNo || item.payment_no || `PAY-${item.id}`;
                                    const total = Number(item.totalAmount || item.total_amount || 0);
                                    const allocated = Number(item.allocatedAmount || item.allocated_amount || 0);
                                    const advance = Number(item.unallocatedAmount || item.unallocated_amount || 0);
                                    const isCancelled = (item.status || '').toUpperCase() === 'CANCELLED';

                                    return (
                                        <tr key={item.id} className={isCancelled ? 'table-light opacity-75' : ''}>
                                            <td className="px-3 py-2.5 text-center text-muted font-monospace" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                #{item.id}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <Link
                                                    to={`/payments/vendor-payments/${item.id}`}
                                                    className="fw-bold font-monospace text-primary text-decoration-none"
                                                >
                                                    {paymentNo}
                                                </Link>
                                            </td>

                                            <td className="px-3 py-2.5 text-muted">
                                                {item.paymentDate ? moment(item.paymentDate).format('DD/MM/YYYY') : '-'}
                                            </td>

                                            <td className="px-3 py-2.5 fw-semibold text-dark">
                                                {item.vendorName || item.partyName || item.party?.displayName || 'Vendor'}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <span className="fw-semibold text-dark">{item.paymentModeName || item.paymentMode || 'Bank'}</span>
                                                {item.referenceNo && (
                                                    <span className="d-block font-monospace text-muted" style={{ fontSize: '0.74rem' }}>
                                                        Ref: {item.referenceNo}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2.5 text-end font-monospace fw-bold text-dark">
                                                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-3 py-2.5 text-end font-monospace text-success">
                                                ₹{allocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>

                                            <td className="px-3 py-2.5 text-end font-monospace">
                                                {advance > 0 ? (
                                                    <span className="fw-bold text-info">
                                                        ₹{advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">₹0.00</span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2.5 text-center">
                                                <PaymentStatusBadge status={item.status} />
                                            </td>

                                            <td className="px-3 py-2.5 text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                    {/* View Details */}
                                                    <Link
                                                        to={`/payments/vendor-payments/${item.id}`}
                                                        className="btn btn-sm btn-outline-primary p-1 rounded"
                                                        title="View Details"
                                                    >
                                                        <FaEye size={13} />
                                                    </Link>

                                                    {/* PDF Download */}
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="p-1 rounded"
                                                        title="Download Voucher PDF"
                                                        onClick={() => handleDownloadPdf(item.id, paymentNo)}
                                                    >
                                                        <FaFilePdf size={13} />
                                                    </Button>

                                                    {/* Cancel Payment */}
                                                    {!isCancelled && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            className="p-1 rounded"
                                                            title="Cancel Voucher"
                                                            onClick={() => {
                                                                setCancelModalItem(item);
                                                                setCancelReason('');
                                                            }}
                                                        >
                                                            <FaBan size={13} />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card>

            {/* Cancel Payment Modal */}
            <Modal show={Boolean(cancelModalItem)} onHide={() => setCancelModalItem(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2 text-danger" style={{ fontSize: '1rem' }}>
                        <FaBan size={16} />
                        <span>Cancel Outward Payment Voucher</span>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted small mb-3">
                        Are you sure you want to cancel payment voucher{' '}
                        <strong>{cancelModalItem?.paymentNo || `PAY-${cancelModalItem?.id}`}</strong>?
                        All allocated amounts will be automatically returned to the corresponding vendor bills and their balances will be restored.
                    </p>
                    <Form.Group>
                        <Form.Label className="small fw-semibold text-secondary">
                            Cancellation Reason (Optional)
                        </Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            placeholder="Enter reason for cancelling this voucher..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => setCancelModalItem(null)} disabled={isCancelling}>
                        Close
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleConfirmCancel} disabled={isCancelling}>
                        {isCancelling ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                        Confirm Cancellation
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default VendorPaymentList;
