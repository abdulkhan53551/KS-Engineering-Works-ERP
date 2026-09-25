import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Coffee, Plus, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useLeaves, useCancelLeave } from '../hooks/useEmployeeApi';
import LeaveApplyModal from '../components/LeaveApplyModal';
import LeaveReviewModal from '../components/LeaveReviewModal';
import PaginationBar from '../../../components/PaginationBar';
import '../employee.css';

const LeaveList = () => {
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    const { data: result, isLoading } = useLeaves({
        firmId,
        page,
        pageSize,
        status: statusFilter,
        leaveType: typeFilter
    });

    const cancelMutation = useCancelLeave();
    const leaves = Array.isArray(result?.leaves)
        ? result.leaves
        : (Array.isArray(result?.data?.leaves)
            ? result.data.leaves
            : (Array.isArray(result) ? result : []));
    const pagination = result?.pagination || result?.data?.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

    const handleReview = (leave) => {
        setSelectedLeave(leave);
        setShowReviewModal(true);
    };

    const handleCancel = async (id) => {
        if (window.confirm('Are you sure you want to cancel this leave application?')) {
            await cancelMutation.mutateAsync(id);
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
                <div>
                    <Button variant="primary" size="sm" onClick={() => setShowApplyModal(true)}>
                        <Plus size={16} className="me-1" /> Apply Leave
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-3">
                    {/* Filters */}
                    <div className="row g-2 align-items-center mb-3">
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
                    </div>

                    {/* Table */}
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Employee</th>
                                    <th>Leave Type</th>
                                    <th>Period</th>
                                    <th>Total Days</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Approved / Rejected By</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            <Spinner size="sm" className="me-2" /> Loading leave records...
                                        </td>
                                    </tr>
                                ) : leaves.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No leave applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    leaves.map(leave => (
                                        <tr key={leave.id}>
                                            <td>
                                                <div className="fw-semibold text-dark">{leave.firstName} {leave.lastName || ''}</div>
                                                <span className="text-primary font-monospace small">{leave.empCode}</span>
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
