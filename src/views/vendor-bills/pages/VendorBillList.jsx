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
    Pagination
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaPlus,
    FaSearch,
    FaFilter,
    FaUndo,
    FaFileInvoiceDollar,
    FaEye,
    FaEdit,
    FaTrashAlt,
    FaCreditCard,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';
import moment from 'moment';
import VendorBillStatusBadge from '../components/VendorBillStatusBadge';
import VendorBillSummaryCards from '../components/VendorBillSummaryCards';
import useVendorBillList from '../hooks/useVendorBillList';

const VendorBillList = () => {
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
        bills,
        isLoading,
        meta,
        summary,
        totalPages,
        totalRecords,
        isDeleting,
        handleSort,
        handleResetFilters,
        handleDelete
    } = useVendorBillList();

    return (
        <div className="vendor-bills-page vendor-payment-detail-view">
            <Container fluid className="py-3 px-4">
            {/* 1. Header Bar */}
            <Card className="shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px' }}>
                <Card.Body className="py-2.5 px-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '40px', height: '40px', marginRight: '0.85rem' }}
                            >
                                <FaFileInvoiceDollar className="text-primary" size={18} />
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold text-dark">
                                    Vendor Bills (Accounts Payable)
                                </h5>
                                <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                                    Manage supplier invoices, tax breakdowns, due dates, and settlement status.
                                </span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Link
                                to="/purchase/vendor-bills/create"
                                className="btn btn-primary btn-sm px-3.5 py-1.5 d-flex align-items-center shadow-sm"
                                style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '8px' }}
                            >
                                <FaPlus size={12} style={{ marginRight: '0.45rem' }} />
                                <span>Create Bill</span>
                            </Link>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* 2. KPI Summary Cards */}
            <VendorBillSummaryCards summary={summary} isLoading={isLoading} />

            {/* 3. Bills Table Card with Filters */}
            <Card className="border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                {/* Filter Toolbar */}
                <div className="p-3 border-bottom bg-white">
                    <Row className="g-2.5 align-items-center">
                        {/* Search */}
                        <Col lg={4} md={5}>
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-light border-end-0 text-muted ps-2.5">
                                    <FaSearch size={12} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search Bill No, vendor name..."
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
                                <option value="UNPAID">Unpaid</option>
                                <option value="PARTIAL">Partial</option>
                                <option value="PAID">Paid</option>
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
                                    className="d-inline-flex align-items-center px-2.5 py-1 shadow-sm"
                                    style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                                >
                                    <FaUndo size={10} style={{ marginRight: '0.4rem' }} />
                                    <span>Reset</span>
                                </Button>
                            ) : (
                                <div className="text-muted small py-1" style={{ fontSize: '0.76rem' }}>
                                    <FaFilter size={10} className="me-1 opacity-50" />
                                    <span>{totalRecords} records</span>
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
                                <th className="py-2.5 px-3 text-center" style={{ width: '60px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                        <span>#ID</span>
                                        {sortBy === 'id' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('bill_no')}>
                                    <div className="d-flex align-items-center gap-1">
                                        <span>Bill No</span>
                                        {sortBy === 'bill_no' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('bill_date')}>
                                    <div className="d-flex align-items-center gap-1">
                                        <span>Bill Date</span>
                                        {sortBy === 'bill_date' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3">Vendor</th>
                                <th className="py-2.5 px-3">Due Date</th>
                                <th className="py-2.5 px-3 text-end">Taxable</th>
                                <th className="py-2.5 px-3 text-end">GST</th>
                                <th className="py-2.5 px-3 text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('total')}>
                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                        <span>Total Amount</span>
                                        {sortBy === 'total' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-end">Paid</th>
                                <th className="py-2.5 px-3 text-end">Balance Due</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-center" style={{ width: '130px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={12} className="text-center py-5">
                                        <Spinner animation="border" size="sm" variant="primary" className="mb-2" />
                                        <p className="text-muted small mb-0">Loading vendor bills...</p>
                                    </td>
                                </tr>
                            ) : bills.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="text-center py-5 text-muted">
                                        <FaFileInvoiceDollar size={32} className="mb-2 text-secondary opacity-50" />
                                        <p className="fw-semibold mb-1">No vendor bills found</p>
                                        <span className="small">Try adjusting search filters or record a new vendor bill.</span>
                                    </td>
                                </tr>
                            ) : (
                                bills.map((bill) => {
                                    const total = Number(bill.total || 0);
                                    const paid = Number(bill.paidAmount || bill.paid_amount || 0);
                                    const balance = Number(bill.balanceAmount ?? bill.balance_amount ?? (total - paid));
                                    const totalGst = Number(bill.cgst || 0) + Number(bill.sgst || 0) + Number(bill.igst || 0);
                                    const vendorName = bill.partyName || bill.party?.displayName || bill.party?.legalName || 'Vendor';
                                    const isPaid = (bill.paymentStatus || bill.payment_status || bill.status || '').toUpperCase() === 'PAID';

                                    return (
                                        <tr key={bill.id}>
                                            <td className="px-3 py-2.5 text-center text-muted font-monospace" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                #{bill.id}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <Link
                                                    to={`/purchase/vendor-bills/${bill.id}`}
                                                    className="fw-bold font-monospace text-primary text-decoration-none"
                                                >
                                                    {bill.billNo || bill.bill_no}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2.5 text-muted">
                                                {bill.billDate ? moment(bill.billDate).format('DD/MM/YYYY') : '-'}
                                            </td>
                                            <td className="px-3 py-2.5 fw-semibold text-dark">
                                                {vendorName}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted">
                                                {bill.dueDate ? (
                                                    <span className={moment(bill.dueDate).isBefore(moment(), 'day') && !isPaid ? 'text-danger fw-semibold' : ''}>
                                                        {moment(bill.dueDate).format('DD/MM/YYYY')}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace text-muted">
                                                ₹{Number(bill.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace text-muted">
                                                ₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-end fw-bold font-monospace text-dark">
                                                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace text-success">
                                                ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-end font-monospace fw-bold text-danger">
                                                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <VendorBillStatusBadge status={bill.paymentStatus || bill.payment_status || bill.status} />
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                    {/* View */}
                                                    <Link
                                                        to={`/purchase/vendor-bills/${bill.id}`}
                                                        className="btn btn-sm btn-outline-primary p-1 rounded"
                                                        title="View Details"
                                                    >
                                                        <FaEye size={13} />
                                                    </Link>

                                                    {/* Edit */}
                                                    <Link
                                                        to={`/purchase/vendor-bills/${bill.id}/edit`}
                                                        className="btn btn-sm btn-outline-secondary p-1 rounded"
                                                        title="Edit Bill"
                                                    >
                                                        <FaEdit size={13} />
                                                    </Link>

                                                    {/* Pay Now shortcut if unpaid/partial */}
                                                    {balance > 0 && (
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            className="p-1 rounded"
                                                            title="Record Payment"
                                                            onClick={() => navigate(`/payments/vendor-payments/create?partyId=${bill.partyId}&billId=${bill.id}`)}
                                                        >
                                                            <FaCreditCard size={13} />
                                                        </Button>
                                                    )}

                                                    {/* Delete */}
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="p-1 rounded"
                                                        title="Delete Bill"
                                                        disabled={isDeleting}
                                                        onClick={() => handleDelete(bill)}
                                                    >
                                                        <FaTrashAlt size={13} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="text-muted small">
                            Showing page <span className="fw-semibold">{page}</span> of <span className="fw-semibold">{totalPages}</span> ({totalRecords} total bills)
                        </div>
                        <Pagination size="sm" className="mb-0">
                            <Pagination.Prev disabled={page <= 1} onClick={() => setPage(page - 1)} />
                            {[...Array(totalPages)].map((_, idx) => {
                                const p = idx + 1;
                                if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                                    return (
                                        <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
                                            {p}
                                        </Pagination.Item>
                                    );
                                }
                                if (p === page - 3 || p === page + 3) {
                                    return <Pagination.Ellipsis key={p} disabled />;
                                }
                                return null;
                            })}
                            <Pagination.Next disabled={page >= totalPages} onClick={() => setPage(page + 1)} />
                        </Pagination>
                    </div>
                )}
            </Card>
        </Container>
    </div>
    );
};

export default VendorBillList;
