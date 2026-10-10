import React, { useCallback } from 'react';
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
    Modal,
    OverlayTrigger,
    Tooltip
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaPlus,
    FaSearch,
    FaUndo,
    FaMoneyBillWave,
    FaCheckCircle,
    FaWallet,
    FaEye,
    FaFilePdf,
    FaBan,
    FaArrowUp,
    FaArrowDown,
    FaTrash,
    FaExclamationTriangle,
    FaCalendarAlt,
    FaTimes
} from 'react-icons/fa';
import moment from 'moment';
import PaymentStatusBadge from '../components/PaymentStatusBadge';
import useVendorPaymentList from '../hooks/useVendorPaymentList';
import { useRowSelection } from '../../../hooks/useListManager';
import { useTrashActions } from '../../../hooks/useTrashActions';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';

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
        handleResetFilters,
        isAllFirms,
        isTrash,
        setIsTrash,
        meta,
        deletePaymentMutation,
        restorePaymentMutation,
        bulkDeleteMutation,
        bulkRestoreMutation
    } = useVendorPaymentList();

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
        items: payments,
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
        entityName: 'Vendor Payment Voucher',
        pluralEntityName: 'Vendor Payment Vouchers'
    });

    // Handle Tab Switch (Active vs Recycle Bin)
    const handleTabChange = useCallback((trash) => {
        setIsTrash(trash);
        handleDeselectAll();
    }, [setIsTrash, handleDeselectAll]);

    // Bulk Action Handlers
    const handleBulkMoveToTrash = () => {
        confirmBulkSoftDelete(selectedCount, () => {
            bulkDeleteMutation.mutate({ ids: selectedIds, isPermanentDelete: false }, {
                onSuccess: () => handleDeselectAll()
            });
        });
    };

    const handleBulkRestore = () => {
        confirmBulkRestore(selectedCount, () => {
            bulkRestoreMutation.mutate({ ids: selectedIds }, {
                onSuccess: () => handleDeselectAll()
            });
        });
    };

    const handleBulkPermanentDelete = () => {
        confirmBulkPermanentDelete(selectedCount, () => {
            bulkDeleteMutation.mutate({ ids: selectedIds, isPermanentDelete: true }, {
                onSuccess: () => handleDeselectAll()
            });
        });
    };

    const activeFilterCount = (search ? 1 : 0) + (statusFilter ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);
    const totalRecords = meta?.totalRecords ?? payments.length ?? 0;
    const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pageSize));

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
                                    {isTrash
                                        ? 'Recycle Bin - Review soft-deleted vendor payment vouchers, restore them, or delete permanently.'
                                        : 'Track supplier disbursements, bill settlements, and retained vendor advances.'}
                                </span>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {/* Active vs Recycle Bin Tab Filter */}
                            <TrashTabFilter
                                activeCount={meta?.activeCount}
                                trashCount={meta?.trashCount}
                                isTrash={isTrash}
                                onTabChange={handleTabChange}
                            />

                            {!isTrash && (
                                <Link
                                    to="/payments/vendor-payments/create"
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

            {/* Floating Bulk Action Bar */}
            <BulkActionBar
                selectedCount={selectedCount}
                isTrash={isTrash}
                onClearSelection={handleDeselectAll}
                onBulkMoveToTrash={handleBulkMoveToTrash}
                onBulkRestore={handleBulkRestore}
                onBulkPermanentDelete={handleBulkPermanentDelete}
                entityName="voucher"
            />

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

            {/* Table Card with Modern Responsive Filter Toolbar */}
            <Card className="border-0 shadow-sm bg-white mb-4" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <div className="p-3 border-bottom bg-white">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2.5">
                        <div className="d-flex flex-wrap align-items-center gap-2" style={{ flex: '1 1 auto' }}>
                            {/* Search Input */}
                            <div style={{ flex: '1 1 240px', minWidth: '200px', maxWidth: '320px' }}>
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0 text-muted ps-2.5">
                                        <FaSearch size={12} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search voucher no, vendor, ref..."
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
                                            <FaTimes size={10} />
                                        </Button>
                                    )}
                                </InputGroup>
                            </div>

                            {/* Status Filter */}
                            <div style={{ minWidth: '135px' }}>
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
                            </div>

                            {/* Date Range Picker with clean inline styling */}
                            <div
                                className="d-flex align-items-center gap-1.5 px-2 py-1 bg-light border rounded"
                                style={{ fontSize: '0.80rem' }}
                            >
                                <FaCalendarAlt size={12} className="text-muted flex-shrink-0" />
                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="border-0 bg-transparent p-0 text-secondary"
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
                                    className="border-0 bg-transparent p-0 text-secondary"
                                    style={{ fontSize: '0.80rem', width: '135px' }}
                                    title="End Date"
                                />
                            </div>

                            {/* Reset Filter Button */}
                            {activeFilterCount > 0 && (
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1"
                                    style={{ fontSize: '0.78rem' }}
                                    title="Reset all filters"
                                >
                                    <FaUndo size={10} />
                                    <span>Reset ({activeFilterCount})</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                    <Table hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.84rem' }}>
                        <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.74rem', letterSpacing: '0.04em' }}>
                            <tr>
                                {/* Multi-check select all */}
                                <th className="py-2.5 px-3 text-center" style={{ width: '40px' }}>
                                    <Form.Check
                                        type="checkbox"
                                        id="select-all-vendor-payments"
                                        checked={isAllSelected}
                                        ref={(input) => {
                                            if (input) input.indeterminate = isIndeterminate;
                                        }}
                                        onChange={handleSelectAll}
                                        aria-label="Select all vendor payment vouchers"
                                    />
                                </th>
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
                                    <td colSpan={11} className="text-center py-5">
                                        <Spinner animation="border" size="sm" variant="primary" className="mb-2" />
                                        <p className="text-muted small mb-0">Loading vendor payments...</p>
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-5 text-muted">
                                        {isTrash ? (
                                            <>
                                                <FaTrash size={28} className="mb-2 text-secondary opacity-50" />
                                                <p className="fw-semibold mb-1">Recycle Bin is empty</p>
                                                <span className="small">No soft-deleted vendor payment vouchers found.</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaMoneyBillWave size={28} className="mb-2 text-secondary opacity-50" />
                                                <p className="fw-semibold mb-1">No outward vendor payments found</p>
                                                <span className="small">Try adjusting search filters or record a new supplier payment.</span>
                                            </>
                                        )}
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
                                            {/* Row Multi Checkbox */}
                                            <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <Form.Check
                                                    type="checkbox"
                                                    id={`select-vendor-payment-${item.id}`}
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => handleSelectRow(item.id)}
                                                    aria-label={`Select voucher ${paymentNo}`}
                                                />
                                            </td>

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

                                            <td className="px-3 py-2.5">
                                                <div className="fw-semibold text-dark">
                                                    {item.vendorName || item.partyName || item.party?.displayName || 'Vendor'}
                                                </div>
                                                {isAllFirms && item.firmName && (
                                                    <Badge bg="soft-secondary" className="text-secondary border small px-1.5 py-0.5 mt-0.5 fw-normal" style={{ fontSize: '0.68rem' }}>
                                                        🏢 {item.firmName}
                                                    </Badge>
                                                )}
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
                                                    <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
                                                        <Link
                                                            to={`/payments/vendor-payments/${item.id}`}
                                                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                                                            style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                            title="View Details"
                                                        >
                                                            <FaEye size={12} />
                                                        </Link>
                                                    </OverlayTrigger>

                                                    {/* PDF Download */}
                                                    <OverlayTrigger overlay={<Tooltip>Download PDF Voucher</Tooltip>}>
                                                        <Button
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            className="d-inline-flex align-items-center justify-content-center"
                                                            style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                            title="Download Voucher PDF"
                                                            onClick={() => handleDownloadPdf(item.id, paymentNo)}
                                                        >
                                                            <FaFilePdf size={12} />
                                                        </Button>
                                                    </OverlayTrigger>

                                                    {!isTrash ? (
                                                        <>
                                                            {/* Cancel Payment Voucher */}
                                                            {!isCancelled && (
                                                                <OverlayTrigger overlay={<Tooltip>Cancel Voucher & Rollback Bills</Tooltip>}>
                                                                    <Button
                                                                        variant="outline-warning"
                                                                        size="sm"
                                                                        className="d-inline-flex align-items-center justify-content-center"
                                                                        style={{ width: '30px', height: '30px', borderRadius: '7px', padding: 0 }}
                                                                        title="Cancel Voucher"
                                                                        onClick={() => {
                                                                            setCancelModalItem(item);
                                                                            setCancelReason('');
                                                                        }}
                                                                    >
                                                                        <FaBan size={12} />
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
                                                                    title="Restore Voucher"
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
                            <span className="text-muted">Showing page {page} of {totalPages} ({totalRecords} vouchers)</span>
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
                                <option value={100}>100</option>
                            </Form.Select>
                        </div>

                        <div className="d-flex align-items-center gap-1">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                style={{ fontSize: '0.78rem' }}
                            >
                                Previous
                            </Button>
                            <span className="px-2 small text-muted">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                style={{ fontSize: '0.78rem' }}
                            >
                                Next
                            </Button>
                        </div>
                    </Card.Footer>
                )}
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
