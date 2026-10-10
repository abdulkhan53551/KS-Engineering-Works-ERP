import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Badge, OverlayTrigger, Tooltip, Spinner, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    usePayments,
    usePaymentsMeta,
    usePaymentsSummary,
    useDeletePayment,
    useRestorePayment,
    useBulkDeletePayments,
    useBulkRestorePayments
} from '../hooks/usePaymentApi';
import { usePaymentMode } from '../../dashboard/hooks/api.hooks';
import { downloadPaymentPdf } from '../api';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import CancelPaymentModal from '../components/modals/CancelPaymentModal';
import ApplyAdvanceModal from '../components/modals/ApplyAdvanceModal';
import { useRowSelection } from '../../../hooks/useListManager';
import { useTrashActions } from '../../../hooks/useTrashActions';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import {
    FaPlus,
    FaSearch,
    FaFileDownload,
    FaEye,
    FaTimesCircle,
    FaReceipt,
    FaMoneyBillWave,
    FaFilter,
    FaUndo,
    FaArrowUp,
    FaArrowDown,
    FaTimes,
    FaCalendarAlt,
    FaCreditCard,
    FaCheckCircle,
    FaWallet,
    FaBolt,
    FaTrash,
    FaExclamationTriangle
} from 'react-icons/fa';
import moment from 'moment';
import { toast } from 'react-toastify';
import './payment-receipt-form.scss';

/**
 * PaymentReceiptList Component
 * Filterable, searchable, and paginated table of customer payment receipts.
 */
const PaymentReceiptList = () => {
    const navigate = useNavigate();

    // Tenant / Firm Context
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? '' : activeFirm?.id;

    // Active vs Recycle Bin Tab State
    const [isTrash, setIsTrash] = useState(false);

    // Filters & Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentModeFilter, setPaymentModeFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('payment_date');
    const [sortOrder, setSortOrder] = useState('desc');

    // Reset pagination to page 1 when firm changes
    useEffect(() => {
        setPage(1);
    }, [firmId]);

    // Cancel modal state
    const [cancelModalState, setCancelModalState] = useState({ show: false, payment: null });

    // Apply Advance modal state
    const [applyAdvanceReceipt, setApplyAdvanceReceipt] = useState(null);

    // Payment Modes master
    const { data: paymentModes = [] } = usePaymentMode();

    // Query Filters payload for Table
    const queryParams = useMemo(() => ({
        page,
        pageSize,
        search: search.trim(),
        status: statusFilter,
        paymentModeId: paymentModeFilter,
        firmId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        trash: isTrash
    }), [page, pageSize, search, statusFilter, paymentModeFilter, firmId, startDate, endDate, sortBy, sortOrder, isTrash]);

    // Fetch Receipts & Meta for Table
    const { data: receipts = [], isLoading, isFetching } = usePayments(queryParams);
    const { data: meta = {} } = usePaymentsMeta(queryParams);

    // Mutation Hooks for Trash & Delete Actions
    const deletePaymentMutation = useDeletePayment();
    const restorePaymentMutation = useRestorePayment();
    const bulkDeleteMutation = useBulkDeletePayments();
    const bulkRestoreMutation = useBulkRestorePayments();

    // Row Multi-Check Selection
    const {
        selectedIds,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount
    } = useRowSelection({
        items: receipts,
        idKey: 'id'
    });

    // Confirmation Modals for Trash Actions
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    } = useTrashActions({
        entityName: 'Payment Receipt',
        pluralEntityName: 'Payment Receipts'
    });

    // Handle Tab Switch (Active vs Recycle Bin)
    const handleTabChange = useCallback((trashState) => {
        setIsTrash(trashState);
        setPage(1);
        handleDeselectAll();
    }, [handleDeselectAll]);

    // Fetch Overall Aggregate Summary Metrics (independent of page/pageSize)
    const { data: summary = {}, isLoading: isSummaryLoading } = usePaymentsSummary({
        startDate,
        endDate,
        firmId,
        paymentModeId: paymentModeFilter,
        status: statusFilter,
        search: search.trim()
    });

    const totalRecords = meta.total || 0;
    const totalPages = meta.totalPages || Math.ceil(totalRecords / pageSize) || 1;

    // Active filters count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (search.trim()) count++;
        if (statusFilter) count++;
        if (paymentModeFilter) count++;
        if (startDate) count++;
        if (endDate) count++;
        return count;
    }, [search, statusFilter, paymentModeFilter, startDate, endDate]);

    // Handle Sorting Toggle
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Handle PDF Download
    const handleDownloadPdf = async (id, paymentNo) => {
        try {
            await downloadPaymentPdf(id, paymentNo);
            toast.success(`Receipt ${paymentNo} downloaded successfully.`);
        } catch (err) {
            toast.error(err?.message || 'Failed to download receipt PDF.');
        }
    };

    // Reset filters
    const handleResetFilters = () => {
        setSearch('');
        setStatusFilter('');
        setPaymentModeFilter('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    return (
        <Container fluid className="py-3 px-4">
            {/* 1. White Background Header Section (Reverted to Top) */}
            <Card className="shadow-sm border-0 mb-3 bg-white" style={{ borderRadius: '12px' }}>
                <Card.Body className="py-2.5 px-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '40px', height: '40px', marginRight: '0.85rem' }}
                            >
                                <FaReceipt className="text-primary" size={18} />
                            </div>
                            <div>
                                <h5 className="mb-0 fw-bold text-dark">
                                    Customer Payment Receipts
                                </h5>
                                <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                                    Track collections, invoice settlements, and advance balances.
                                </span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <TrashTabFilter
                                isTrash={isTrash}
                                onTabChange={handleTabChange}
                                activeCount={meta?.activeCount}
                                trashCount={meta?.trashCount}
                            />
                            {!isTrash && (
                                <Link
                                    to="/payments/receipts/create"
                                    className="btn btn-primary btn-sm px-3.5 py-1.5 d-flex align-items-center shadow-sm"
                                    style={{ fontSize: '0.84rem', fontWeight: 600, borderRadius: '8px' }}
                                >
                                    <FaPlus size={12} style={{ marginRight: '0.45rem' }} />
                                    <span>Record Payment</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* 2. Clean Executive Metric Stat Cards (Overall Filter-Scoped Totals) */}
            <Row className="g-3 mb-3">
                {/* Total Collections Card */}
                <Col lg={4} md={6}>
                    <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                    Total Collections
                                </span>
                                <h4 className="fw-bold text-dark font-monospace mb-0 mt-1">
                                    ₹{(summary.totalCollections ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
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

                {/* Invoices Settled Card */}
                <Col lg={4} md={6}>
                    <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                    Invoices Settled
                                </span>
                                <h4 className="fw-bold text-success font-monospace mb-0 mt-1">
                                    ₹{(summary.totalAllocated ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
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

                {/* Customer Advance Retained Card */}
                <Col lg={4} md={12}>
                    <Card className="border-0 shadow-sm bg-white h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body className="p-3 d-flex align-items-center justify-content-between">
                            <div>
                                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                                    Advance Retained
                                </span>
                                <h4 className="fw-bold text-info font-monospace mb-0 mt-1">
                                    ₹{(summary.totalUnallocated ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h4>
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

            {/* 3. Receipts Table Card with Integrated Filter Header */}
            <Card className="border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                {/* Clean, Integrated Filter Header Toolbar */}
                <div className="p-3 border-bottom bg-white">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5">
                        <div className="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
                            {/* Search Input */}
                            <div style={{ minWidth: '220px', maxWidth: '320px', flex: '1 1 220px' }}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0 text-muted ps-2.5">
                                        <FaSearch size={12} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search receipt no, customer, UTR..."
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
                                            size="sm"
                                            className="bg-light border-start-0 text-muted px-2"
                                            onClick={() => {
                                                setSearch('');
                                                setPage(1);
                                            }}
                                            title="Clear search"
                                        >
                                            <FaTimes size={11} />
                                        </Button>
                                    )}
                                </InputGroup>
                            </div>

                            {/* Status Filter */}
                            <div style={{ minWidth: '135px', flex: '0 0 auto' }}>
                                <Form.Select
                                    size="sm"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="bg-light"
                                    style={{ fontSize: '0.82rem' }}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </Form.Select>
                            </div>

                            {/* Payment Mode Filter - sufficient width so 'All Payment Modes' is never truncated */}
                            <div style={{ minWidth: '175px', flex: '0 0 auto' }}>
                                <Form.Select
                                    size="sm"
                                    value={paymentModeFilter}
                                    onChange={(e) => {
                                        setPaymentModeFilter(e.target.value);
                                        setPage(1);
                                    }}
                                    className="bg-light"
                                    style={{ fontSize: '0.82rem' }}
                                >
                                    <option value="">All Payment Modes</option>
                                    {paymentModes.map((m) => (
                                        <option key={m.id || m.value} value={m.id || m.value}>
                                            {m.label || m.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>

                            {/* Date Range: From & To - clean fixed widths without overflow */}
                            <div className="d-flex align-items-center gap-1.5" style={{ flex: '0 0 auto' }}>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="bg-light"
                                    style={{ fontSize: '0.80rem', width: '135px' }}
                                    title="Start Date"
                                />
                                <span className="text-muted small px-0.5">to</span>
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="bg-light"
                                    style={{ fontSize: '0.80rem', width: '135px' }}
                                    title="End Date"
                                />
                            </div>
                        </div>

                        {/* Reset Action (only shown when filters active, avoiding collision) */}
                        {activeFilterCount > 0 && (
                            <div className="ms-auto" style={{ flex: '0 0 auto' }}>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="d-flex align-items-center gap-1 py-1 px-2.5"
                                    style={{ fontSize: '0.78rem', borderRadius: '6px' }}
                                    title="Clear all filters"
                                >
                                    <FaUndo size={10} />
                                    <span>Reset ({activeFilterCount})</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bulk Actions Floating Bar */}
                <div className="px-3">
                    <BulkActionBar
                        selectedCount={selectedCount}
                        isTrash={isTrash}
                        onBulkDelete={() => confirmBulkSoftDelete(selectedCount, () => {
                            bulkDeleteMutation.mutate({ ids: selectedIds, isPermanentDelete: false });
                            handleDeselectAll();
                        })}
                        onBulkRestore={() => confirmBulkRestore(selectedCount, () => {
                            bulkRestoreMutation.mutate({ ids: selectedIds });
                            handleDeselectAll();
                        })}
                        onBulkPermanentDelete={() => confirmBulkPermanentDelete(selectedCount, () => {
                            bulkDeleteMutation.mutate({ ids: selectedIds, isPermanentDelete: true });
                            handleDeselectAll();
                        })}
                        onClearSelection={handleDeselectAll}
                        isLoading={bulkDeleteMutation.isPending || bulkRestoreMutation.isPending}
                    />
                </div>

                <div className="table-responsive">
                    <Table hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.84rem' }}>
                        <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                            <tr>
                                {/* Select All Checkbox Column */}
                                <th className="py-2.5 px-3 text-center" style={{ width: '40px', minWidth: '40px' }}>
                                    <Form.Check
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = isIndeterminate;
                                        }}
                                        onChange={handleSelectAll}
                                        aria-label="Select all receipts"
                                    />
                                </th>
                                {/* ID Column */}
                                <th className="py-2.5 px-3 text-center" style={{ width: '65px', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                    <div className="d-flex align-items-center justify-content-center gap-1">
                                        <span>#ID</span>
                                        {sortBy === 'id' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('payment_no')}>
                                    <div className="d-flex align-items-center gap-1">
                                        <span>Receipt No</span>
                                        {sortBy === 'payment_no' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3" style={{ cursor: 'pointer' }} onClick={() => handleSort('payment_date')}>
                                    <div className="d-flex align-items-center gap-1">
                                        <span>Date</span>
                                        {sortBy === 'payment_date' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3">Customer</th>
                                <th className="py-2.5 px-3">Payment Mode & Ref</th>
                                <th className="py-2.5 px-3 text-end" style={{ cursor: 'pointer' }} onClick={() => handleSort('total_amount')}>
                                    <div className="d-flex align-items-center justify-content-end gap-1">
                                        <span>Total Received</span>
                                        {sortBy === 'total_amount' && (sortOrder === 'asc' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />)}
                                    </div>
                                </th>
                                <th className="py-2.5 px-3 text-end">Allocated Cash</th>
                                <th className="py-2.5 px-3 text-end">Advance Retained</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-center" style={{ width: '150px', minWidth: '150px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-5">
                                        <Spinner animation="border" size="sm" variant="primary" className="mb-2" />
                                        <p className="text-muted small mb-0">Loading payment receipts...</p>
                                    </td>
                                </tr>
                            ) : receipts.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-5 text-muted">
                                        <FaReceipt size={28} className="mb-2 text-secondary opacity-50" />
                                        <p className="fw-semibold mb-1">
                                            {isTrash ? 'Recycle Bin is empty' : 'No payment receipts found'}
                                        </p>
                                        <span className="small">
                                            {isTrash
                                                ? 'Deleted payment receipts will appear here.'
                                                : 'Try adjusting search filters or record a new customer payment.'}
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                receipts.map((item) => {
                                    const paymentNo = item.paymentNo || item.payment_no || `REC-${item.id}`;
                                    const total = Number(item.totalAmount || item.total_amount || 0);
                                    const allocated = Number(item.allocatedAmount || item.allocated_amount || 0);
                                    const advance = Number(item.unallocatedAmount || item.unallocated_amount || 0);
                                    const isCancelled = (item.status || '').toUpperCase() === 'CANCELLED';

                                    return (
                                        <tr key={item.id} className={isCancelled ? 'table-light opacity-75' : ''}>
                                            {/* Row Selection Checkbox */}
                                            <td className="px-3 py-2.5 text-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => handleSelectRow(item.id)}
                                                    aria-label={`Select receipt ${paymentNo}`}
                                                />
                                            </td>

                                            {/* ID Column */}
                                            <td className="px-3 py-2.5 text-center text-muted font-monospace" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                #{item.id}
                                            </td>

                                            {/* Receipt No */}
                                            <td className="px-3 py-2.5">
                                                <Link
                                                    to={`/payments/receipts/${item.id}`}
                                                    className="fw-bold font-monospace text-primary text-decoration-none"
                                                >
                                                    {paymentNo}
                                                </Link>
                                            </td>

                                            {/* Date */}
                                            <td className="px-3 py-2.5 text-muted">
                                                {item.paymentDate ? moment(item.paymentDate).format('DD/MM/YYYY') : '-'}
                                            </td>

                                            {/* Customer Name */}
                                            <td className="px-3 py-2.5">
                                                <div className="fw-semibold text-dark">
                                                    {item.customerName || item.partyName || 'Customer'}
                                                </div>
                                                {isAllFirms && item.firmName && (
                                                    <Badge bg="soft-secondary" className="text-secondary border small px-1.5 py-0.5 mt-0.5 fw-normal" style={{ fontSize: '0.68rem' }}>
                                                        🏢 {item.firmName}
                                                    </Badge>
                                                )}
                                            </td>

                                            {/* Mode & Ref */}
                                            <td className="px-3 py-2.5">
                                                <span className="d-block">{item.paymentMode || '-'}</span>
                                                {item.referenceNo && (
                                                    <span className="text-muted small font-monospace" style={{ fontSize: '0.72rem' }}>
                                                        Ref: {item.referenceNo}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Total Received */}
                                            <td className="px-3 py-2.5 text-end font-monospace fw-bold text-dark">
                                                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>

                                            {/* Allocated Cash */}
                                            <td className="px-3 py-2.5 text-end font-monospace text-muted">
                                                ₹{allocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>

                                            {/* Advance Retained */}
                                            <td className="px-3 py-2.5 text-end">
                                                {advance > 0 ? (
                                                    <Badge
                                                        bg="soft-success"
                                                        className="text-success font-monospace px-2 py-0.5 cursor-pointer"
                                                        style={{ fontSize: '0.78rem', cursor: 'pointer' }}
                                                        title="Click to apply advance to invoices"
                                                        onClick={() => !isCancelled && !isTrash && setApplyAdvanceReceipt(item)}
                                                    >
                                                        +₹{advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted font-monospace" style={{ fontSize: '0.80rem' }}>—</span>
                                                )}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-3 py-2.5 text-center">
                                                <PaymentStatusBadge status={item.status} />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-3 py-2.5 text-center" style={{ width: '150px', minWidth: '150px' }}>
                                                <div className="d-flex align-items-center justify-content-center" style={{ gap: '6px' }}>
                                                    {/* View Details */}
                                                    <OverlayTrigger overlay={<Tooltip>View Receipt Breakdown</Tooltip>}>
                                                        <Link
                                                            to={`/payments/receipts/${item.id}`}
                                                            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center justify-content-center"
                                                            style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                            title="View Receipt"
                                                        >
                                                            <FaEye size={12} />
                                                        </Link>
                                                    </OverlayTrigger>

                                                    {!isTrash ? (
                                                        <>
                                                            {/* Apply Advance Action (if unallocated funds exist) */}
                                                            {advance > 0 && !isCancelled && (
                                                                <OverlayTrigger overlay={<Tooltip>Apply Advance to Invoices</Tooltip>}>
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        className="d-inline-flex align-items-center justify-content-center"
                                                                        style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                                        onClick={() => setApplyAdvanceReceipt(item)}
                                                                        title="Apply Advance"
                                                                    >
                                                                        <FaBolt size={11} />
                                                                    </Button>
                                                                </OverlayTrigger>
                                                            )}

                                                            {/* Download PDF */}
                                                            <OverlayTrigger overlay={<Tooltip>Download PDF Voucher</Tooltip>}>
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="d-inline-flex align-items-center justify-content-center"
                                                                    style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                                    onClick={() => handleDownloadPdf(item.id, paymentNo)}
                                                                    title="Download PDF"
                                                                >
                                                                    <FaFileDownload size={12} />
                                                                </Button>
                                                            </OverlayTrigger>

                                                            {/* Cancel Action (only for active receipts) */}
                                                            {!isCancelled && (
                                                                <OverlayTrigger overlay={<Tooltip>Cancel & Rollback Invoices</Tooltip>}>
                                                                    <Button
                                                                        variant="outline-warning"
                                                                        size="sm"
                                                                        className="d-inline-flex align-items-center justify-content-center"
                                                                        style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                                        onClick={() => setCancelModalState({ show: true, payment: item })}
                                                                        title="Cancel Receipt"
                                                                    >
                                                                        <FaTimesCircle size={12} />
                                                                    </Button>
                                                                </OverlayTrigger>
                                                            )}

                                                            {/* Move to Recycle Bin (Trash) */}
                                                            <OverlayTrigger overlay={<Tooltip>Move to Recycle Bin</Tooltip>}>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    className="d-inline-flex align-items-center justify-content-center"
                                                                    style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                                    onClick={() => confirmSoftDelete(paymentNo, () => deletePaymentMutation.mutate({ id: item.id, isPermanentDelete: false }))}
                                                                    title="Move to Trash"
                                                                >
                                                                    <FaTrash size={11} />
                                                                </Button>
                                                            </OverlayTrigger>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Restore from Recycle Bin */}
                                                            <OverlayTrigger overlay={<Tooltip>Restore from Recycle Bin</Tooltip>}>
                                                                <Button
                                                                    variant="outline-success"
                                                                    size="sm"
                                                                    className="d-inline-flex align-items-center justify-content-center"
                                                                    style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                                    onClick={() => confirmRestore(paymentNo, () => restorePaymentMutation.mutate(item.id))}
                                                                    title="Restore Receipt"
                                                                >
                                                                    <FaUndo size={11} />
                                                                </Button>
                                                            </OverlayTrigger>

                                                            {/* Permanently Delete */}
                                                            <OverlayTrigger overlay={<Tooltip>Delete Permanently</Tooltip>}>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    className="d-inline-flex align-items-center justify-content-center"
                                                                    style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                                    onClick={() => confirmPermanentDelete(paymentNo, () => deletePaymentMutation.mutate({ id: item.id, isPermanentDelete: true }))}
                                                                    title="Delete Permanently"
                                                                >
                                                                    <FaExclamationTriangle size={11} />
                                                                </Button>
                                                            </OverlayTrigger>
                                                        </>
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

                {/* Pagination Footer */}
                {totalRecords > 0 && (
                    <Card.Footer className="bg-transparent py-2.5 px-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.80rem' }}>
                            <span className="text-muted">Showing page {page} of {totalPages} ({totalRecords} receipts)</span>
                            <Form.Select
                                size="sm"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setPage(1);
                                }}
                                style={{ width: '80px', fontSize: '0.80rem' }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </Form.Select>
                        </div>

                        <div className="d-flex align-items-center gap-1">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{ fontSize: '0.80rem' }}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                style={{ fontSize: '0.80rem' }}
                            >
                                Next
                            </Button>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            {/* Cancel Modal */}
            <CancelPaymentModal
                show={cancelModalState.show}
                onHide={() => setCancelModalState({ show: false, payment: null })}
                payment={cancelModalState.payment}
            />

            {/* Apply Advance Modal */}
            {applyAdvanceReceipt && (
                <ApplyAdvanceModal
                    show={Boolean(applyAdvanceReceipt)}
                    onHide={() => setApplyAdvanceReceipt(null)}
                    receipt={applyAdvanceReceipt}
                />
            )}
        </Container>
    );
};

export default PaymentReceiptList;
