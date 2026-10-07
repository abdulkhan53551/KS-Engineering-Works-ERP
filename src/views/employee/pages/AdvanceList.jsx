import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Spinner, ProgressBar, Dropdown, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    DollarSign,
    Plus,
    Search,
    RefreshCw,
    MoreVertical,
    Eye,
    CreditCard,
    PauseCircle,
    PlayCircle,
    AlertCircle,
    TrendingDown,
    CheckCircle,
    Clock,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react';
import useDebounce from '../../../hooks/useDebounce';
import { useAdvances, useTogglePauseAdvance } from '../hooks/useEmployeeApi';
import AdvanceDisburseModal from '../components/AdvanceDisburseModal';
import AdvanceRepaymentModal from '../components/AdvanceRepaymentModal';
import AdvanceDetailModal from '../components/AdvanceDetailModal';
import PaginationBar from '../../../components/PaginationBar';
import TableSkeleton from '../components/TableSkeleton';
import '../employee.css';

const AdvanceList = () => {
    const navigate = useNavigate();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [sortBy, setSortBy] = useState('advance_date');
    const [sortOrder, setSortOrder] = useState('desc');

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
        setPage(1);
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <ArrowUpDown size={12} className="ms-1 text-muted opacity-50" />;
        return sortOrder === 'asc'
            ? <ArrowUp size={12} className="ms-1 text-primary" />
            : <ArrowDown size={12} className="ms-1 text-primary" />;
    };

    // Modals state
    const [showDisburseModal, setShowDisburseModal] = useState(false);
    const [selectedAdvanceForDetail, setSelectedAdvanceForDetail] = useState(null);
    const [selectedAdvanceForRepay, setSelectedAdvanceForRepay] = useState(null);

    const { data: advanceData, isLoading, refetch, isFetching } = useAdvances({
        firmId,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        page,
        pageSize,
        sortBy,
        sortOrder
    });

    const { mutateAsync: togglePause, isPending: isTogglingPause } = useTogglePauseAdvance();

    const advances = Array.isArray(advanceData?.advances) ? advanceData.advances : [];
    const summary = advanceData?.summary || {
        totalDisbursed: 0,
        totalRecovered: 0,
        totalOutstanding: 0,
        activeCount: 0,
        pausedCount: 0,
        closedCount: 0
    };
    const pagination = advanceData?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

    const handleTogglePause = async (adv) => {
        try {
            await togglePause({
                id: adv.id,
                isPaused: !adv.isPaused
            });
        } catch (e) {
            // Toast in hook
        }
    };

    return (
        <div className="container-fluid p-3">
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                    <h4 className="fw-bold mb-1">Employee Salary Advances & Loans</h4>
                    <p className="text-muted small mb-0">
                        Disburse advances, configure EMI schedules, track auto-recovery via payroll, and manage cash repayments.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="d-flex align-items-center gap-1"
                    >
                        <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowDisburseModal(true)}
                        className="d-flex align-items-center gap-1"
                    >
                        <Plus size={16} /> Disburse Advance
                    </Button>
                </div>
            </div>

            {/* Stat Cards */}
            <Row className="g-3 mb-4">
                <Col md={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted small fw-semibold">Total Disbursed</span>
                                <div className="p-2 rounded bg-primary-subtle text-primary">
                                    <DollarSign size={18} />
                                </div>
                            </div>
                            <h4 className="fw-bold mb-0 text-dark">
                                ₹{summary.totalDisbursed.toLocaleString('en-IN')}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted small fw-semibold">Total Recovered</span>
                                <div className="p-2 rounded bg-success-subtle text-success">
                                    <CheckCircle size={18} />
                                </div>
                            </div>
                            <h4 className="fw-bold mb-0 text-success">
                                ₹{summary.totalRecovered.toLocaleString('en-IN')}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted small fw-semibold">Outstanding Balance</span>
                                <div className="p-2 rounded bg-danger-subtle text-danger">
                                    <TrendingDown size={18} />
                                </div>
                            </div>
                            <h4 className="fw-bold mb-0 text-danger">
                                ₹{summary.totalOutstanding.toLocaleString('en-IN')}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted small fw-semibold">Active & Paused</span>
                                <div className="p-2 rounded bg-warning-subtle text-warning">
                                    <Clock size={18} />
                                </div>
                            </div>
                            <h4 className="fw-bold mb-0 text-dark">
                                {summary.activeCount} <small className="fs-6 fw-normal text-muted">Active</small>
                                {summary.pausedCount > 0 && (
                                    <span className="fs-6 fw-normal text-warning ms-1">({summary.pausedCount} Paused)</span>
                                )}
                            </h4>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filter Bar */}
            <Card className="border-0 shadow-sm rounded-3 mb-3">
                <Card.Body className="p-3">
                    <Row className="g-2 align-items-center">
                        <Col md={5}>
                            <div className="position-relative">
                                <Search size={16} className="text-muted position-absolute top-50 start-0 translate-middle-y ms-3" />
                                <Form.Control
                                    type="text"
                                    placeholder="Search by employee name, code, remarks..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="ps-5 pe-4"
                                    size="sm"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setPage(1);
                                        }}
                                        className="btn btn-link btn-sm position-absolute top-50 end-0 translate-middle-y text-muted p-1 me-2 text-decoration-none"
                                        title="Clear search"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </Col>

                        <Col md={4}>
                            <Form.Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active (In Recovery)</option>
                                <option value="PAUSED">Paused (No Deductions)</option>
                                <option value="CLOSED">Closed (Fully Settled)</option>
                            </Form.Select>
                        </Col>

                        <Col md={3} className="text-md-end">
                            <Form.Select
                                size="sm"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(parseInt(e.target.value, 10));
                                    setPage(1);
                                }}
                                style={{ width: '130px', display: 'inline-block' }}
                            >
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Advance Table */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-0">
                    {isLoading ? (
                        <TableSkeleton rows={6} cols={7} />
                    ) : advances.length === 0 ? (
                        <div className="text-center py-5">
                            <AlertCircle size={36} className="text-muted mb-2" />
                            <h6 className="fw-semibold text-dark">No Employee Advances Found</h6>
                            <p className="text-muted small mb-3">
                                {searchTerm || statusFilter !== 'ALL'
                                    ? 'Try adjusting your search filters.'
                                    : 'Disburse a new salary advance or loan to get started.'}
                            </p>
                            <Button variant="primary" size="sm" onClick={() => setShowDisburseModal(true)}>
                                <Plus size={15} className="me-1" /> Disburse Advance
                            </Button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Employee</th>
                                        <th
                                            className="user-select-none"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('advance_date')}
                                            title="Sort by Disbursed Date"
                                        >
                                            <div className="d-inline-flex align-items-center">
                                                <span>Disbursed Date</span>
                                                <SortIcon column="advance_date" />
                                            </div>
                                        </th>
                                        <th
                                            className="user-select-none"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('total_amount')}
                                            title="Sort by Total Advance"
                                        >
                                            <div className="d-inline-flex align-items-center">
                                                <span>Total Advance</span>
                                                <SortIcon column="total_amount" />
                                            </div>
                                        </th>
                                        <th>Recovery Plan</th>
                                        <th
                                            className="user-select-none"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('remaining_balance')}
                                            title="Sort by Repaid / Balance"
                                        >
                                            <div className="d-inline-flex align-items-center">
                                                <span>Repaid / Balance</span>
                                                <SortIcon column="remaining_balance" />
                                            </div>
                                        </th>
                                        <th
                                            className="user-select-none"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleSort('status')}
                                            title="Sort by Status"
                                        >
                                            <div className="d-inline-flex align-items-center">
                                                <span>Status</span>
                                                <SortIcon column="status" />
                                            </div>
                                        </th>
                                        <th className="text-end pe-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {advances.map((adv) => {
                                        const totalAmt = parseFloat(adv.totalAmount || 0);
                                        const recoveredAmt = parseFloat(adv.recoveredAmount || 0);
                                        const remainingAmt = parseFloat(adv.remainingBalance || 0);
                                        const pct = totalAmt > 0 ? Math.min(100, Math.round((recoveredAmt / totalAmt) * 100)) : 0;

                                        const isClosed = adv.status === 'CLOSED';
                                        const isPaused = adv.isPaused || adv.status === 'PAUSED';

                                        return (
                                            <tr key={adv.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div
                                                            className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
                                                            style={{ width: '36px', height: '36px', fontSize: '13px' }}
                                                        >
                                                            {adv.firstName?.charAt(0) || 'E'}
                                                        </div>
                                                        <div>
                                                            <div className="fw-semibold text-dark">
                                                                {adv.firstName} {adv.lastName || ''}
                                                            </div>
                                                            <small className="text-muted">
                                                                {adv.empCode ? `[${adv.empCode}] ` : ''}{adv.department || '—'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="small">
                                                    {new Date(adv.advanceDate).toLocaleDateString()}
                                                    {adv.paymentMode && (
                                                        <div className="text-muted" style={{ fontSize: '11px' }}>
                                                            via {adv.paymentMode}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="fw-bold text-dark">
                                                    ₹{totalAmt.toLocaleString('en-IN')}
                                                </td>

                                                <td>
                                                    {adv.recoveryType === 'EMI' ? (
                                                        <div>
                                                            <Badge bg="info" text="dark" className="px-2">
                                                                EMI: ₹{parseFloat(adv.monthlyDeduction || 0).toLocaleString('en-IN')}/mo
                                                            </Badge>
                                                        </div>
                                                    ) : (
                                                        <Badge bg="light" text="dark" className="border px-2">
                                                            Single Deduction (FULL)
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td style={{ minWidth: '180px' }}>
                                                    <div className="d-flex justify-content-between small mb-1">
                                                        <span className="text-success fw-semibold">
                                                            ₹{recoveredAmt.toLocaleString('en-IN')}
                                                        </span>
                                                        <span className="text-danger fw-bold">
                                                            ₹{remainingAmt.toLocaleString('en-IN')}
                                                        </span>
                                                    </div>
                                                    <ProgressBar
                                                        now={pct}
                                                        variant={isClosed ? 'success' : 'primary'}
                                                        style={{ height: '6px' }}
                                                        className="rounded-pill"
                                                    />
                                                </td>

                                                <td>
                                                    {isClosed ? (
                                                        <Badge bg="success" className="px-2 py-1">Settled</Badge>
                                                    ) : isPaused ? (
                                                        <Badge bg="warning" text="dark" className="px-2 py-1">Paused</Badge>
                                                    ) : (
                                                        <Badge bg="primary" className="px-2 py-1">Active</Badge>
                                                    )}
                                                </td>

                                                <td className="text-end text-nowrap pe-3">
                                                    <div className="d-inline-flex align-items-center gap-1">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="py-1 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                                            onClick={() => setSelectedAdvanceForDetail(adv.id)}
                                                            title="View Repayment Ledger & History"
                                                        >
                                                            <Eye size={13} />
                                                            <span>Ledger</span>
                                                        </Button>

                                                        {!isClosed && (
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                className="py-1 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                                                onClick={() => setSelectedAdvanceForRepay(adv)}
                                                                title="Record Direct Cash / Bank Repayment"
                                                            >
                                                                <CreditCard size={13} />
                                                                <span>Repay</span>
                                                            </Button>
                                                        )}

                                                        {!isClosed && (
                                                            <Button
                                                                variant={isPaused ? "outline-success" : "outline-secondary"}
                                                                size="sm"
                                                                className="py-1 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                                                onClick={() => handleTogglePause(adv)}
                                                                title={isPaused ? "Resume Recovery" : "Pause Deductions"}
                                                            >
                                                                {isPaused ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                                                                <span>{isPaused ? "Resume" : "Pause"}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}

                    {pagination.total > 0 && (
                        <div className="p-3 border-top bg-light-subtle d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div className="text-muted small">
                                Showing <span className="fw-semibold text-dark">{(page - 1) * pageSize + 1}</span> to{' '}
                                <span className="fw-semibold text-dark">
                                    {Math.min(page * pageSize, pagination.total)}
                                </span>{' '}
                                of <span className="fw-semibold text-dark">{pagination.total}</span> advances
                            </div>
                            {pagination.totalPages > 1 && (
                                <PaginationBar
                                    page={page}
                                    pageSize={pageSize}
                                    total={pagination.total}
                                    totalPages={pagination.totalPages}
                                    onPageChange={(p) => setPage(p)}
                                />
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Modals */}
            <AdvanceDisburseModal
                show={showDisburseModal}
                onHide={() => setShowDisburseModal(false)}
                firmId={firmId}
            />

            <AdvanceRepaymentModal
                show={Boolean(selectedAdvanceForRepay)}
                onHide={() => setSelectedAdvanceForRepay(null)}
                advance={selectedAdvanceForRepay}
            />

            <AdvanceDetailModal
                show={Boolean(selectedAdvanceForDetail)}
                onHide={() => setSelectedAdvanceForDetail(null)}
                advanceId={selectedAdvanceForDetail}
                onOpenRepayModal={(adv) => setSelectedAdvanceForRepay(adv)}
            />
        </div>
    );
};

export default AdvanceList;
