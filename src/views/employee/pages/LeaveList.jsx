import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Spinner, InputGroup } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import {
    Coffee,
    Plus,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Search,
    RefreshCw,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Trash2,
    Calendar as CalendarIcon,
    List
} from 'lucide-react';
import useDebounce from '../../../hooks/useDebounce';
import { useLeaves, useCancelLeave, useReviewLeave } from '../hooks/useEmployeeApi';
import LeaveApplyModal from '../components/LeaveApplyModal';
import LeaveReviewModal from '../components/LeaveReviewModal';
import LeaveCalendar from '../components/LeaveCalendar';
import PaginationBar from '../../../components/PaginationBar';
import TableSkeleton from '../components/TableSkeleton';
import '../employee.css';

const LeaveList = () => {
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Sorting
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState([]);

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    // Reset selection on filter/page change
    useEffect(() => {
        setSelectedIds([]);
    }, [page, pageSize, debouncedSearch, statusFilter, typeFilter]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <ArrowUpDown size={12} className="ms-1 text-muted opacity-50" />;
        return sortOrder === 'asc'
            ? <ArrowUp size={12} className="ms-1 text-primary" />
            : <ArrowDown size={12} className="ms-1 text-primary" />;
    };

    const { data: result, isLoading, refetch } = useLeaves({
        firmId,
        page,
        pageSize,
        status: statusFilter,
        leaveType: typeFilter,
        search: debouncedSearch,
        sortBy,
        sortOrder
    });

    const cancelMutation = useCancelLeave();
    const reviewMutation = useReviewLeave();

    const leaves = Array.isArray(result?.leaves)
        ? result.leaves
        : (Array.isArray(result?.data?.leaves)
            ? result.data.leaves
            : (Array.isArray(result) ? result : []));
    const pagination = result?.pagination || result?.data?.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === leaves.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(leaves.map(l => l.id));
        }
    };

    const handleReview = (leave) => {
        setSelectedLeave(leave);
        setShowReviewModal(true);
    };

    const handleCancel = async (id) => {
        if (window.confirm('Are you sure you want to cancel this leave application?')) {
            await cancelMutation.mutateAsync(id);
        }
    };

    const handleBulkApprove = async () => {
        const pendingSelected = leaves.filter(l => selectedIds.includes(l.id) && l.status === 'PENDING');
        if (pendingSelected.length === 0) {
            alert('No pending leaves among the selected items.');
            return;
        }
        if (!window.confirm(`Approve ${pendingSelected.length} leave application(s)?`)) return;
        try {
            await Promise.all(pendingSelected.map(l => reviewMutation.mutateAsync({ id: l.id, status: 'APPROVED' })));
            setSelectedIds([]);
        } catch (err) {
            console.error('Bulk approve failed:', err);
        }
    };

    const handleBulkReject = async () => {
        const pendingSelected = leaves.filter(l => selectedIds.includes(l.id) && l.status === 'PENDING');
        if (pendingSelected.length === 0) {
            alert('No pending leaves among the selected items.');
            return;
        }
        const reason = window.prompt(`Reject ${pendingSelected.length} leave application(s)? Enter reason:`, 'Administrative decision');
        if (reason === null) return;
        try {
            await Promise.all(pendingSelected.map(l => reviewMutation.mutateAsync({ id: l.id, status: 'REJECTED', rejectionReason: reason })));
            setSelectedIds([]);
        } catch (err) {
            console.error('Bulk reject failed:', err);
        }
    };

    const handleBulkCancel = async () => {
        if (!window.confirm(`Cancel ${selectedIds.length} leave application(s)?`)) return;
        try {
            await Promise.all(selectedIds.map(id => cancelMutation.mutateAsync(id)));
            setSelectedIds([]);
        } catch (err) {
            console.error('Bulk cancel failed:', err);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <Badge bg="success">Approved</Badge>;
            case 'REJECTED':
                return <Badge bg="danger">Rejected</Badge>;
            case 'PENDING':
                return <Badge bg="warning" text="dark">Pending Review</Badge>;
            case 'CANCELLED':
                return <Badge bg="secondary">Cancelled</Badge>;
            default:
                return <Badge bg="light" text="dark">{status}</Badge>;
        }
    };

    return (
        <div className="container-fluid p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Leave Management</h4>
                    <span className="text-muted small">
                        Review leave applications, grant approvals, and monitor employee time-off records.
                    </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="btn-group shadow-sm">
                        <Button
                            variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                        >
                            <List size={16} className="me-1" /> Table View
                        </Button>
                        <Button
                            variant={viewMode === 'calendar' ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon size={16} className="me-1" /> Calendar View
                        </Button>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setShowApplyModal(true)}>
                        <Plus size={16} className="me-1" /> Apply Leave
                    </Button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <LeaveCalendar
                    firmId={firmId}
                    onApplyLeave={() => setShowApplyModal(true)}
                    onReviewLeave={handleReview}
                />
            ) : (
                <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-3">
                    {/* Filters & Search Row */}
                    <div className="row g-2 align-items-center mb-3">
                        <div className="col-md-4">
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-light border-end-0">
                                    <Search size={14} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by name, code, dept..."
                                    className="border-start-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="border-start-0"
                                        onClick={() => { setSearchTerm(''); setPage(1); }}
                                    >
                                        ×
                                    </Button>
                                )}
                            </InputGroup>
                        </div>
                        <div className="col-md-3">
                            <Form.Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All Statuses</option>
                                <option value="PENDING">Pending Only</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="CANCELLED">Cancelled</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-3">
                            <Form.Select
                                size="sm"
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All Leave Types</option>
                                <option value="CASUAL">Casual Leave (CL)</option>
                                <option value="SICK">Sick Leave (SL)</option>
                                <option value="EARNED">Earned Leave (EL)</option>
                                <option value="UNPAID">Unpaid / Loss of Pay</option>
                                <option value="COMP_OFF">Compensatory Off</option>
                            </Form.Select>
                        </div>
                        <div className="col-md-2 d-flex justify-content-end">
                            <Button variant="outline-secondary" size="sm" onClick={() => refetch()} title="Refresh">
                                <RefreshCw size={15} />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions Banner */}
                    {selectedIds.length > 0 && (
                        <div className="alert alert-primary d-flex justify-content-between align-items-center py-2 px-3 mb-3 border-0 rounded-3 shadow-sm">
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold">
                                    {selectedIds.length} application{selectedIds.length > 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Button variant="success" size="sm" onClick={handleBulkApprove}>
                                    <CheckCircle size={14} className="me-1" /> Approve Selected
                                </Button>
                                <Button variant="danger" size="sm" onClick={handleBulkReject}>
                                    <XCircle size={14} className="me-1" /> Reject Selected
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={handleBulkCancel}>
                                    <Trash2 size={14} className="me-1" /> Cancel Selected
                                </Button>
                                <Button variant="light" size="sm" onClick={() => setSelectedIds([])}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <Form.Check
                                            type="checkbox"
                                            checked={leaves.length > 0 && selectedIds.length === leaves.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('first_name')}>
                                        Employee <SortIcon column="first_name" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('leave_type')}>
                                        Leave Type <SortIcon column="leave_type" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('from_date')}>
                                        Period <SortIcon column="from_date" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_days')}>
                                        Total Days <SortIcon column="total_days" />
                                    </th>
                                    <th>Reason</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                                        Status <SortIcon column="status" />
                                    </th>
                                    <th>Approved / Rejected By</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <TableSkeleton rows={pageSize > 10 ? 8 : 5} cols={9} hasCheckbox={true} hasAvatar={false} />
                                ) : leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4 text-muted">
                                            No leave applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    leaves.map(leave => (
                                        <tr key={leave.id} className={selectedIds.includes(leave.id) ? 'table-active' : ''}>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedIds.includes(leave.id)}
                                                    onChange={() => toggleSelect(leave.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="fw-semibold text-dark">{leave.firstName} {leave.lastName || ''}</div>
                                                <span className="text-primary font-monospace small">{leave.empCode}</span>
                                                {leave.department && (
                                                    <span className="text-muted small ms-2">• {leave.department}</span>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg="light" text="dark" className="border">
                                                    {leave.leaveType}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="fw-medium text-dark">
                                                    {new Date(leave.fromDate).toLocaleDateString()} to {new Date(leave.toDate).toLocaleDateString()}
                                                </div>
                                                {leave.halfDayOn && (
                                                    <span className="text-warning small" style={{ fontSize: '0.72rem' }}>
                                                        Half Day ({leave.halfDayOn})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="fw-bold">{leave.totalDays}</td>
                                            <td className="text-muted small" style={{ maxWidth: '200px' }}>
                                                {leave.reason || '—'}
                                            </td>
                                            <td>{getStatusBadge(leave.status)}</td>
                                            <td>
                                                {leave.approvedByUserName ? (
                                                    <span className="small text-dark">{leave.approvedByUserName}</span>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                                {leave.rejectionReason && (
                                                    <div className="text-danger small" style={{ fontSize: '0.72rem' }}>
                                                        {leave.rejectionReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-end">
                                                {leave.status === 'PENDING' && (
                                                    <div className="btn-group">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleReview(leave)}
                                                        >
                                                            Review
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleCancel(leave.id)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {pagination.total > 0 && (
                        <div className="mt-3">
                            <PaginationBar
                                pagination={pagination}
                                onPageChange={(p) => setPage(p)}
                                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>
            )}

            <LeaveApplyModal
                show={showApplyModal}
                onHide={() => setShowApplyModal(false)}
                firmId={firmId}
            />

            <LeaveReviewModal
                show={showReviewModal}
                onHide={() => setShowReviewModal(false)}
                leave={selectedLeave}
            />
        </div>
    );
};

export default LeaveList;
