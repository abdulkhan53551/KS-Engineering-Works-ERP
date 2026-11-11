import React, { useState } from 'react';
import { Row, Col, Tab, Nav, Table, Button, Badge, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import {
    usePendingRegistrations,
    useRejectedRegistrations,
    useApproveRegistration,
    useRejectRegistration,
    usePendingPasswordResets,
    useApprovePasswordReset,
    useRejectPasswordReset,
    useRolesList
} from '../../auth/hooks/api.hooks';
import { toast } from 'react-toastify';
import PasswordResetDeliveryModal from '../components/PasswordResetDeliveryModal';

const AdminApprovals = () => {
    const [activeTab, setActiveTab] = useState('registrations');
    const [regFilter, setRegFilter] = useState('pending'); // 'pending' | 'rejected'

    // Registration queries & mutations
    const {
        data: pendingUsers = [],
        isLoading: loadingUsers,
        refetch: refetchUsers
    } = usePendingRegistrations();
    const {
        data: rejectedUsers = [],
        isLoading: loadingRejected,
        refetch: refetchRejected
    } = useRejectedRegistrations();
    const { mutate: approveUser, isPending: isApprovingUser } = useApproveRegistration();
    const { mutate: rejectUser, isPending: isRejectingUser } = useRejectRegistration();

    // Password reset queries & mutations
    const {
        data: pendingResets = [],
        isLoading: loadingResets,
        refetch: refetchResets
    } = usePendingPasswordResets();
    const { mutate: approveReset, isPending: isApprovingReset } = useApprovePasswordReset();
    const { mutate: rejectReset, isPending: isRejectingReset } = useRejectPasswordReset();

    // Roles list query
    const { data: roles = [] } = useRolesList();

    // Modal state for approving user registration
    const [approveUserModal, setApproveUserModal] = useState({
        show: false,
        user: null,
        selectedRoleId: ''
    });

    // Modal state for showing generated reset link
    const [resetLinkModal, setResetLinkModal] = useState({
        show: false,
        user: null,
        resetData: null
    });

    // Handle Open User Approval Modal
    const handleOpenApproveModal = (user) => {
        // Default to 'Employee' role if available, or first available role
        const defaultRole = roles.find((r) => r.slug === 'employee') || roles[0];
        setApproveUserModal({
            show: true,
            user,
            selectedRoleId: defaultRole ? String(defaultRole.id) : ''
        });
    };

    // Confirm User Approval
    const handleConfirmApproveUser = () => {
        if (!approveUserModal.user) return;
        approveUser(
            {
                id: approveUserModal.user.id,
                roleId: approveUserModal.selectedRoleId ? Number(approveUserModal.selectedRoleId) : null
            },
            {
                onSuccess: () => {
                    setApproveUserModal({ show: false, user: null, selectedRoleId: '' });
                }
            }
        );
    };

    // Confirm User Rejection
    const handleRejectUser = (user) => {
        if (window.confirm(`Are you sure you want to reject registration for ${getFullName(user)} (${user.email})?`)) {
            rejectUser(user.id);
        }
    };

    // Approve Password Reset
    const handleApproveReset = (user) => {
        approveReset(user.id, {
            onSuccess: (res) => {
                setResetLinkModal({
                    show: true,
                    user: res.data?.user || user,
                    resetData: res.data
                });
            }
        });
    };

    // Reject Password Reset
    const handleRejectReset = (user) => {
        if (window.confirm(`Are you sure you want to reject password reset request for ${user.email}?`)) {
            rejectReset(user.id);
        }
    };

    // Helpers to handle both camelCase and snake_case properties
    const getUserName = (u) => u?.userName || u?.user_name || '';
    const getFullName = (u) => {
        const first = u?.firstName || u?.first_name || '';
        const last = u?.lastName || u?.last_name || '';
        const full = `${first} ${last}`.trim();
        return full || getUserName(u) || u?.email || 'User';
    };
    const getInitial = (u) => {
        const name = u?.firstName || u?.first_name || u?.userName || u?.user_name || 'U';
        return (name[0] || 'U').toUpperCase();
    };

    // Format date string
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
                <div>
                    <h3 className="mb-1 text-dark font-weight-bold">Super Admin Approvals</h3>
                    <p className="text-muted mb-0">
                        Review, authorize, and manage user registrations and password reset requests.
                    </p>
                </div>
                <div className="d-flex gap-2 mt-2 mt-md-0 flex-wrap">
                    <Link
                        to="/dashboard/app/user-list"
                        className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-none"
                    >
                        <span>👥 All Users Directory</span>
                    </Link>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                            refetchUsers();
                            refetchRejected();
                            refetchResets();
                        }}
                    >
                        ↻ Refresh Requests
                    </Button>
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Card>
                    <Card.Header className="pb-0 border-bottom-0">
                        <Nav variant="tabs" className="card-header-tabs">
                            <Nav.Item>
                                <Nav.Link eventKey="registrations" className="d-flex align-items-center gap-2 py-3 px-4">
                                    <span className="fw-semibold">User Registrations</span>
                                    <Badge bg={pendingUsers.length > 0 ? 'warning' : 'secondary'} pill>
                                        {pendingUsers.length}
                                    </Badge>
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="password-resets" className="d-flex align-items-center gap-2 py-3 px-4">
                                    <span className="fw-semibold">Password Resets</span>
                                    <Badge bg={pendingResets.length > 0 ? 'danger' : 'secondary'} pill>
                                        {pendingResets.length}
                                    </Badge>
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </Card.Header>

                    <Card.Body>
                        <Tab.Content>
                            {/* TAB 1: REGISTRATIONS */}
                            <Tab.Pane eventKey="registrations">
                                {/* Sub-filter: Pending Review vs Rejected Applications */}
                                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant={regFilter === 'pending' ? 'primary' : 'outline-primary'}
                                            size="sm"
                                            className="d-flex align-items-center gap-1.5 shadow-none"
                                            onClick={() => setRegFilter('pending')}
                                        >
                                            <span>Pending Review</span>
                                            <Badge bg={regFilter === 'pending' ? 'white' : 'primary'} className={regFilter === 'pending' ? 'text-primary' : 'text-white'} pill>
                                                {pendingUsers.length}
                                            </Badge>
                                        </Button>
                                        <Button
                                            variant={regFilter === 'rejected' ? 'danger' : 'outline-danger'}
                                            size="sm"
                                            className="d-flex align-items-center gap-1.5 shadow-none"
                                            onClick={() => setRegFilter('rejected')}
                                        >
                                            <span>Rejected Applications</span>
                                            <Badge bg={regFilter === 'rejected' ? 'white' : 'danger'} className={regFilter === 'rejected' ? 'text-danger' : 'text-white'} pill>
                                                {rejectedUsers.length}
                                            </Badge>
                                        </Button>
                                    </div>
                                </div>

                                {regFilter === 'pending' ? (
                                    loadingUsers ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" variant="primary" />
                                            <p className="text-muted mt-2">Loading pending registrations...</p>
                                        </div>
                                    ) : pendingUsers.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar avatar-60 bg-soft-success text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                                                ✓
                                            </div>
                                            <h5 className="text-muted">No Pending Registrations</h5>
                                            <p className="text-muted small">All user registrations have been reviewed.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table hover className="align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>Applicant</th>
                                                        <th>Username</th>
                                                        <th>Email</th>
                                                        <th>Submitted At</th>
                                                        <th>Status</th>
                                                        <th className="text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pendingUsers.map((user) => (
                                                        <tr key={user.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div
                                                                        className="avatar avatar-40 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold"
                                                                        style={{ width: '40px', height: '40px' }}
                                                                    >
                                                                        {getInitial(user)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="fw-bold text-dark">
                                                                            {getFullName(user)}
                                                                        </div>
                                                                        <span className="text-muted small">ID: #{user.id}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="fw-semibold text-secondary">@{getUserName(user)}</td>
                                                            <td>{user.email}</td>
                                                            <td className="text-muted small">{formatDate(user.createdAt || user.created_at)}</td>
                                                            <td>
                                                                <Badge bg="warning" text="dark">
                                                                    Pending Review
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end">
                                                                <div className="d-flex gap-2 justify-content-end">
                                                                    <Button
                                                                        variant="success"
                                                                        size="sm"
                                                                        onClick={() => handleOpenApproveModal(user)}
                                                                        disabled={isApprovingUser || isRejectingUser}
                                                                    >
                                                                        Approve & Assign Role
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        onClick={() => handleRejectUser(user)}
                                                                        disabled={isApprovingUser || isRejectingUser}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )
                                ) : (
                                    /* REJECTED REGISTRATIONS VIEW */
                                    loadingRejected ? (
                                        <div className="text-center py-5">
                                            <Spinner animation="border" variant="danger" />
                                            <p className="text-muted mt-2">Loading rejected applications...</p>
                                        </div>
                                    ) : rejectedUsers.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="avatar avatar-60 bg-soft-secondary text-secondary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                                                —
                                            </div>
                                            <h5 className="text-muted">No Rejected Applications</h5>
                                            <p className="text-muted small">There are currently no rejected user accounts.</p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table hover className="align-middle mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>Applicant</th>
                                                        <th>Username</th>
                                                        <th>Email</th>
                                                        <th>Rejected At</th>
                                                        <th>Status</th>
                                                        <th className="text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rejectedUsers.map((user) => (
                                                        <tr key={user.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <div
                                                                        className="avatar avatar-40 bg-danger text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold"
                                                                        style={{ width: '40px', height: '40px' }}
                                                                    >
                                                                        {getInitial(user)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="fw-bold text-dark">
                                                                            {getFullName(user)}
                                                                        </div>
                                                                        <span className="text-muted small">ID: #{user.id}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="fw-semibold text-secondary">@{getUserName(user)}</td>
                                                            <td>{user.email}</td>
                                                            <td className="text-muted small">{formatDate(user.updatedAt || user.updated_at || user.createdAt)}</td>
                                                            <td>
                                                                <Badge bg="danger">
                                                                    Rejected
                                                                </Badge>
                                                            </td>
                                                            <td className="text-end">
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    onClick={() => handleOpenApproveModal(user)}
                                                                    disabled={isApprovingUser}
                                                                >
                                                                    ✓ Re-Approve & Assign Role
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )
                                )}
                            </Tab.Pane>

                            {/* TAB 2: PASSWORD RESETS */}
                            <Tab.Pane eventKey="password-resets">
                                {loadingResets ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" variant="primary" />
                                        <p className="text-muted mt-2">Loading pending reset requests...</p>
                                    </div>
                                ) : pendingResets.length === 0 ? (
                                    <div className="text-center py-5">
                                        <div className="avatar avatar-60 bg-soft-success text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', fontSize: '24px' }}>
                                            ✓
                                        </div>
                                        <h5 className="text-muted">No Pending Password Resets</h5>
                                        <p className="text-muted small">No active password recovery requests pending approval.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <Table hover className="align-middle mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>User</th>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Requested At</th>
                                                    <th>Status</th>
                                                    <th className="text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingResets.map((user) => (
                                                    <tr key={user.id}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div
                                                                    className="avatar avatar-40 bg-soft-primary text-primary rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold"
                                                                    style={{ width: '40px', height: '40px' }}
                                                                >
                                                                    {getInitial(user)}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark">
                                                                        {getFullName(user)}
                                                                    </div>
                                                                    <span className="text-muted small">ID: #{user.id}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="fw-semibold text-secondary">@{getUserName(user)}</td>
                                                        <td>{user.email}</td>
                                                        <td className="text-muted small">{formatDate(user.requestedAt || user.requested_at)}</td>
                                                        <td>
                                                            <Badge bg="danger">Reset Requested</Badge>
                                                        </td>
                                                        <td className="text-end">
                                                            <div className="d-flex gap-2 justify-content-end">
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => handleApproveReset(user)}
                                                                    disabled={isApprovingReset || isRejectingReset}
                                                                >
                                                                    Approve Reset
                                                                </Button>
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() => handleRejectReset(user)}
                                                                    disabled={isApprovingReset || isRejectingReset}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </Tab.Pane>
                        </Tab.Content>
                    </Card.Body>
                </Card>
            </Tab.Container>

            {/* Modal: Approve User Registration & Assign Role */}
            <Modal
                show={approveUserModal.show}
                onHide={() => setApproveUserModal({ show: false, user: null, selectedRoleId: '' })}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {approveUserModal.user?.approval_status === 'REJECTED' || approveUserModal.user?.approvalStatus === 'REJECTED'
                            ? 'Re-Approve User Registration'
                            : 'Approve User Registration'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {approveUserModal.user && (
                        <div>
                            <Alert variant="info" className="py-2 mb-3">
                                <strong>User:</strong> {getFullName(approveUserModal.user)} ({approveUserModal.user.email})
                                {(approveUserModal.user.approval_status === 'REJECTED' || approveUserModal.user.approvalStatus === 'REJECTED') && (
                                    <div className="text-danger small mt-1 font-weight-bold">
                                        Note: This user account was previously rejected. Approving will re-activate access.
                                    </div>
                                )}
                            </Alert>

                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                    Assign Role <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={approveUserModal.selectedRoleId}
                                    onChange={(e) =>
                                        setApproveUserModal((prev) => ({
                                            ...prev,
                                            selectedRoleId: e.target.value
                                        }))
                                    }
                                >
                                    <option value="">-- Select a Role --</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name} ({role.slug})
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Text className="text-muted">
                                    The user will be granted permissions corresponding to this role.
                                </Form.Text>
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setApproveUserModal({ show: false, user: null, selectedRoleId: '' })}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={handleConfirmApproveUser}
                        disabled={isApprovingUser || !approveUserModal.selectedRoleId}
                    >
                        {isApprovingUser ? (
                            <Spinner size="sm" animation="border" />
                        ) : (
                            approveUserModal.user?.approval_status === 'REJECTED' || approveUserModal.user?.approvalStatus === 'REJECTED'
                                ? 'Confirm & Re-Activate User'
                                : 'Confirm & Activate User'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal: Password Reset Approved - Multi-Channel Delivery */}
            <PasswordResetDeliveryModal
                show={resetLinkModal.show}
                onHide={() => setResetLinkModal({ show: false, user: null, resetData: null })}
                user={resetLinkModal.user}
                resetData={resetLinkModal.resetData}
                title="Password Reset Approved"
            />
        </div>
    );
};

export default AdminApprovals;
