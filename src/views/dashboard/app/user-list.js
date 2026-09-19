import React, { useState, useMemo } from 'react';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    Form,
    Badge,
    Modal,
    Spinner,
    InputGroup,
    OverlayTrigger,
    Tooltip,
    Alert,
    Popover
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FaSearch,
    FaTimes,
    FaTrash,
    FaUndo,
    FaExclamationTriangle,
    FaKey,
    FaUserShield,
    FaBuilding,
    FaCopy,
    FaCheck,
    FaUserCheck,
    FaUserTimes,
    FaSyncAlt,
    FaSort,
    FaSortAlphaUpAlt,
    FaSortAlphaDownAlt
} from 'react-icons/fa';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import PaginationBar from '../../../components/PaginationBar';
import useListManager from '../../../hooks/useListManager';
import useDebounce from '../../../hooks/useDebounce';
import {
    useUsers,
    useUsersPagination,
    useDeleteUser,
    useRestoreUser,
    useBulkDeleteUsers,
    useBulkRestoreUsers,
    useToggleUserStatus,
    useAdminGenerateResetLink,
    useRoles
} from '../../users/hooks/useUserApi';
import {
    useApproveRegistration,
    useRejectRegistration
} from '../../auth/hooks/api.hooks';
import { useGetFirms } from '../../firms/hooks/api.hooks';
import { toast } from 'react-toastify';
import PasswordResetDeliveryModal from '../../admin/components/PasswordResetDeliveryModal';
import UserAssignmentsModal from '../../users/components/UserAssignmentsModal';

const FIRMS_DROPDOWN_PARAMS = { page: 1, pageSize: 100 };

const UserList = () => {
    // Current logged-in user from Redux
    const currentUser = useSelector((state) => state.authReducer?.user);
    const currentUserId = currentUser?.id;

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [firmFilter, setFirmFilter] = useState('');

    // Search input with debounce
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Query params for fetching
    const [tabIsTrash, setTabIsTrash] = useState(false);
    const [pageState, setPageState] = useState(1);
    const [pageSizeState, setPageSizeState] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? (
                <FaSortAlphaUpAlt className="text-primary ms-1" size={11} />
            ) : (
                <FaSortAlphaDownAlt className="text-primary ms-1" size={11} />
            );
        }
        return <FaSort className="text-muted ms-1 opacity-25" size={11} />;
    };

    const queryParams = useMemo(() => ({
        page: pageState,
        pageSize: pageSizeState,
        search: debouncedSearch,
        status: tabIsTrash ? '' : statusFilter,
        roleId: roleFilter ? Number(roleFilter) : null,
        firmId: firmFilter ? Number(firmFilter) : null,
        trash: tabIsTrash,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
    }), [pageState, pageSizeState, debouncedSearch, statusFilter, roleFilter, firmFilter, tabIsTrash, sortConfig]);

    // TanStack Queries
    const {
        data: users = [],
        isLoading: loadingUsers,
        refetch: refetchUsers
    } = useUsers(queryParams);

    // Client-side sorting for instant reordering
    const sortedUsers = useMemo(() => {
        if (!sortConfig.key) return users;
        return [...users].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'role') {
                aVal = a.role?.name || a.role_name || '';
                bVal = b.role?.name || b.role_name || '';
            } else if (sortConfig.key === 'userName') {
                aVal = `${a.firstName || ''} ${a.lastName || ''} ${a.userName || ''}`.trim().toLowerCase();
                bVal = `${b.firstName || ''} ${b.lastName || ''} ${b.userName || ''}`.trim().toLowerCase();
            } else if (sortConfig.key === 'email') {
                aVal = (a.email || '').toLowerCase();
                bVal = (b.email || '').toLowerCase();
            } else if (sortConfig.key === 'createdAt' || sortConfig.key === 'deletedAt') {
                aVal = new Date(aVal || 0).getTime();
                bVal = new Date(bVal || 0).getTime();
            }

            if (aVal == null) aVal = '';
            if (bVal == null) bVal = '';

            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [users, sortConfig]);

    const {
        data: pagination = {},
        isLoading: loadingPagination,
        refetch: refetchPagination
    } = useUsersPagination(queryParams);

    const { data: roles = [] } = useRoles();
    const { data: firmsList = [] } = useGetFirms(FIRMS_DROPDOWN_PARAMS);

    // List manager for row selection
    const {
        selectedIds,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount
    } = useListManager({
        items: sortedUsers,
        idKey: 'id'
    });

    // Mutations
    const { mutate: deleteUserMutate, isPending: isDeletingUser } = useDeleteUser();
    const { mutate: restoreUserMutate, isPending: isRestoringUser } = useRestoreUser();
    const { mutate: bulkDeleteMutate, isPending: isBulkDeleting } = useBulkDeleteUsers();
    const { mutate: bulkRestoreMutate, isPending: isBulkRestoring } = useBulkRestoreUsers();
    const { mutate: toggleStatusMutate, isPending: isTogglingStatus } = useToggleUserStatus();
    const { mutate: generateResetMutate, isPending: isGeneratingReset } = useAdminGenerateResetLink();
    const { mutate: approveUser, isPending: isApprovingUser } = useApproveRegistration();
    const { mutate: rejectUser, isPending: isRejectingUser } = useRejectRegistration();

    // Modals
    const [approveModal, setApproveModal] = useState({ show: false, user: null, roleId: '' });
    const [resetLinkModal, setResetLinkModal] = useState({
        show: false,
        user: null,
        resetData: null
    });
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        variant: 'danger',
        confirmText: 'Confirm',
        onConfirm: null
    });

    // Handlers
    const handleTabChange = (trashState) => {
        setTabIsTrash(trashState);
        setPageState(1);
        handleDeselectAll();
    };

    const handlePageChange = (newPage) => {
        setPageState(newPage);
        handleDeselectAll();
    };

    const handlePageSizeChange = (newSize) => {
        setPageSizeState(Number(newSize));
        setPageState(1);
        handleDeselectAll();
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPageState(1);
        handleDeselectAll();
    };

    const clearSearch = () => {
        setSearchTerm('');
        setPageState(1);
        handleDeselectAll();
    };

    const handleRefresh = () => {
        refetchUsers();
        refetchPagination();
        toast.info('User directory refreshed');
    };



    // Scoped Entity & Branch Assignments Modal
    const [assignmentsModal, setAssignmentsModal] = useState({ show: false, user: null });
    const handleOpenAssignmentsModal = (user) => setAssignmentsModal({ show: true, user });
    const handleCloseAssignmentsModal = () => setAssignmentsModal({ show: false, user: null });

    // Approval & Re-Approval
    const handleOpenApproveModal = (user) => {
        const defaultRole = roles.find(r => r.id === user.roleId) || roles.find(r => r.slug === 'employee') || roles[0];
        setApproveModal({
            show: true,
            user,
            roleId: defaultRole ? String(defaultRole.id) : ''
        });
    };

    const handleConfirmApproveUser = () => {
        if (!approveModal.user || !approveModal.roleId) return;
        approveUser(
            { id: approveModal.user.id, roleId: Number(approveModal.roleId) },
            {
                onSuccess: () => {
                    setApproveModal({ show: false, user: null, roleId: '' });
                    refetchUsers();
                    refetchPagination();
                }
            }
        );
    };

    const handleRejectUser = (user) => {
        setConfirmModal({
            show: true,
            title: 'Reject / Revoke User Access',
            message: `Are you sure you want to reject/revoke access for ${getFullName(user)} (@${user.userName})? The account will be deactivated and unable to sign in.`,
            variant: 'danger',
            confirmText: 'Reject Account',
            onConfirm: () => {
                rejectUser(user.id, {
                    onSuccess: () => {
                        setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null });
                        refetchUsers();
                        refetchPagination();
                    }
                });
            }
        });
    };

    // Active Toggle
    const handleToggleStatus = (user) => {
        const nextStatus = !user.isActive;
        if (!nextStatus) {
            setConfirmModal({
                show: true,
                title: 'Deactivate User Account',
                message: `Deactivating ${getFullName(user)} (@${user.userName}) will immediately revoke active sessions and prevent login until reactivated. Proceed?`,
                variant: 'warning',
                confirmText: 'Deactivate Account',
                onConfirm: () => {
                    toggleStatusMutate({ id: user.id, isActive: false });
                    setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null });
                }
            });
        } else {
            toggleStatusMutate({ id: user.id, isActive: true });
        }
    };

    // Password Reset
    const handleGenerateReset = (user) => {
        generateResetMutate(user.id, {
            onSuccess: (res) => {
                setResetLinkModal({
                    show: true,
                    user: res?.data?.user || user,
                    resetData: res?.data
                });
            }
        });
    };

    // Delete / Trash
    const handleSingleDelete = (user) => {
        setConfirmModal({
            show: true,
            title: 'Move User to Recycle Bin',
            message: `Are you sure you want to move ${getFullName(user)} (@${user.userName}) to the Recycle Bin? The user will be deactivated and unable to log in.`,
            variant: 'warning',
            confirmText: 'Move to Trash',
            onConfirm: () => {
                deleteUserMutate(
                    { id: user.id, permanent: false },
                    {
                        onSuccess: () => {
                            setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null });
                            handleDeselectAll();
                        }
                    }
                );
            }
        });
    };

    const handleRestore = (user) => {
        restoreUserMutate(user.id, {
            onSuccess: () => {
                handleDeselectAll();
            }
        });
    };

    const handlePermanentDelete = (user) => {
        setConfirmModal({
            show: true,
            title: 'Permanently Purge User',
            message: `CRITICAL: You are about to permanently delete ${getFullName(user)} (@${user.userName}). This user record and credentials will be permanently erased from the database. This action CANNOT be undone.`,
            variant: 'danger',
            confirmText: 'Delete Permanently',
            onConfirm: () => {
                deleteUserMutate(
                    { id: user.id, permanent: true },
                    {
                        onSuccess: () => {
                            setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null });
                            handleDeselectAll();
                        }
                    }
                );
            }
        });
    };

    // Bulk actions
    const handleBulkDelete = () => {
        setConfirmModal({
            show: true,
            title: 'Move Selected to Recycle Bin',
            message: `Are you sure you want to move ${selectedCount} selected user(s) to the Recycle Bin? Any Super Admin account in the selection will be protected.`,
            variant: 'warning',
            confirmText: 'Move to Trash',
            onConfirm: () => {
                bulkDeleteMutate(
                    { ids: selectedIds, permanent: false },
                    {
                        onSuccess: () => {
                            setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null });
                            handleDeselectAll();
                        }
                    }
                );
            }
        });
    };

    const handleBulkRestore = () => {
        bulkRestoreMutate(
            { ids: selectedIds },
            {
                onSuccess: () => {
                    handleDeselectAll();
                }
            }
        );
    };

    const handleBulkPermanentDelete = () => {
        setConfirmModal({
            show: true,
            title: 'Permanently Delete Selected Users',
            message: `DANGER: You are about to permanently purge ${selectedCount} selected user(s). All credentials and records will be deleted forever. Proceed?`,
            variant: 'danger',
            confirmText: 'Purge Selected',
            onConfirm: () => {
                bulkDeleteMutate(
                    { ids: selectedIds, permanent: true },
                    {
                        onSuccess: () => {
                            setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null });
                            handleDeselectAll();
                        }
                    }
                );
            }
        });
    };

    // Formatters & UI helpers
    const getFullName = (u) => {
        const full = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
        return full || u?.userName || u?.email || 'User';
    };

    const getInitial = (u) => {
        const initial = u?.firstName?.[0] || u?.userName?.[0] || 'U';
        return initial.toUpperCase();
    };


    const getApprovalBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <Badge bg="soft-success" className="text-success border border-success-subtle px-2 py-1">Approved</Badge>;
            case 'PENDING':
                return <Badge bg="soft-warning" className="text-warning border border-warning-subtle px-2 py-1">Pending</Badge>;
            case 'REJECTED':
                return <Badge bg="soft-danger" className="text-danger border border-danger-subtle px-2 py-1">Rejected</Badge>;
            default:
                return <Badge bg="light" className="text-muted border px-2 py-1">{status || 'Unknown'}</Badge>;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const totalRecords = Number(pagination?.total) || users.length || 0;
    const totalPages = Number(pagination?.totalPages) || (totalRecords && pageSizeState ? Math.ceil(totalRecords / pageSizeState) : 1) || 1;
    const activeCount = pagination?.activeCount !== undefined ? Number(pagination.activeCount) : (tabIsTrash ? 0 : users.length);
    const trashCount = pagination?.trashCount !== undefined ? Number(pagination.trashCount) : (tabIsTrash ? users.length : 0);

    return (
        <div className="container-fluid py-4">
            {/* Page Header (with crisp white background) */}
            <div className="bg-white p-3 p-md-4 rounded shadow-sm mb-3 border d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <h4 className="mb-1 text-dark font-weight-bold d-flex align-items-center gap-2">
                        <FaUserShield className="text-primary" size={22} />
                        User Directory & Management
                    </h4>
                    <p className="text-muted mb-0 small">
                        Administer user accounts, assign authorization roles, manage passwords, and oversee the recycle bin.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Link
                        to="/dashboard/admin/approvals"
                        className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 shadow-none fw-semibold"
                    >
                        <FaUserCheck size={13} />
                        <span>Pending Approvals</span>
                    </Link>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleRefresh}
                        className="d-flex align-items-center gap-1 shadow-none"
                    >
                        <FaSyncAlt size={12} className={loadingUsers ? 'fa-spin' : ''} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Filter & Tabs Bar */}
            <Card className="mb-3 border-0 shadow-sm">
                <Card.Body className="p-3">
                    <Row className="g-3 align-items-center">
                        {/* Tab Filter: Active vs Recycle Bin */}
                        <Col xs={12} lg={4} className="d-flex align-items-center">
                            <TrashTabFilter
                                isTrash={tabIsTrash}
                                onTabChange={handleTabChange}
                                activeCount={activeCount}
                                trashCount={trashCount}
                                activeLabel="Active Users"
                                trashLabel="Recycle Bin"
                            />
                        </Col>

                        {/* Search & Select Filters */}
                        <Col xs={12} lg={8}>
                            <div className="d-flex align-items-center gap-2 flex-wrap justify-content-lg-end">
                                {/* Search Input with Debounce */}
                                <div style={{ minWidth: '220px', flex: '1 1 200px' }}>
                                    <InputGroup size="sm">
                                        <InputGroup.Text className="bg-white border-end-0">
                                            <FaSearch className="text-muted" size={12} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Search by name, @username, email..."
                                            value={searchTerm}
                                            onChange={handleSearchChange}
                                            className="border-start-0 ps-0"
                                        />
                                        {searchTerm && (
                                            <Button
                                                variant="outline-secondary"
                                                className="border-start-0 border"
                                                onClick={clearSearch}
                                            >
                                                <FaTimes size={10} />
                                            </Button>
                                        )}
                                    </InputGroup>
                                </div>

                                {/* Status Filter (Only in Active tab) */}
                                {!tabIsTrash && (
                                    <Form.Select
                                        size="sm"
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setPageState(1);
                                        }}
                                        style={{ width: 'auto', minWidth: '140px' }}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="APPROVED">Approved (Active)</option>
                                        <option value="PENDING">Pending Approval</option>
                                        <option value="REJECTED">Rejected</option>
                                        <option value="INACTIVE">Deactivated</option>
                                    </Form.Select>
                                )}

                                {/* Firm Filter */}
                                <Form.Select
                                    size="sm"
                                    value={firmFilter}
                                    onChange={(e) => {
                                        setFirmFilter(e.target.value);
                                        setPageState(1);
                                    }}
                                    style={{ width: 'auto', minWidth: '160px' }}
                                >
                                    <option value="">All Firms</option>
                                    {firmsList.map((f) => {
                                        const fId = f.firmId || f.id;
                                        const fName = f.firmName || f.name;
                                        return (
                                            <option key={fId} value={fId}>
                                                🏢 {fName}
                                            </option>
                                        );
                                    })}
                                </Form.Select>

                                {/* Role Filter */}
                                <Form.Select
                                    size="sm"
                                    value={roleFilter}
                                    onChange={(e) => {
                                        setRoleFilter(e.target.value);
                                        setPageState(1);
                                    }}
                                    style={{ width: 'auto', minWidth: '140px' }}
                                >
                                    <option value="">All Roles</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </div>
                        </Col>
                    </Row>

                    {/* Bulk Action Bar */}
                    <BulkActionBar
                        selectedCount={selectedCount}
                        isTrash={tabIsTrash}
                        onBulkDelete={handleBulkDelete}
                        onBulkRestore={handleBulkRestore}
                        onBulkPermanentDelete={handleBulkPermanentDelete}
                        onClearSelection={handleDeselectAll}
                        isLoading={isBulkDeleting || isBulkRestoring}
                    />
                </Card.Body>
            </Card>

            {/* Main Table Card */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0 position-relative">
                    <div
                        className="no-scrollbar"
                        style={{
                            overflowX: 'auto',
                            overflowY: 'visible',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        <Table hover className="table-sortable align-middle mb-0 w-100" style={{ minWidth: '1050px', tableLayout: 'auto' }}>
                            {/* Table Header with pristine white background */}
                            <thead
                                className="bg-white text-secondary border-bottom"
                                style={{
                                    backgroundColor: '#ffffff',
                                    fontSize: '0.82rem'
                                }}
                            >
                                <tr>
                                    <th style={{ width: '40px' }} className="text-center px-2 bg-white">
                                        <Form.Check
                                            type="checkbox"
                                            checked={isAllSelected}
                                            ref={(el) => el && (el.indeterminate = isIndeterminate)}
                                            onChange={handleSelectAll}
                                            disabled={loadingUsers || sortedUsers.length === 0}
                                        />
                                    </th>
                                    <th style={{ width: '55px', cursor: 'pointer' }} className="text-center px-2 bg-white user-select-none" onClick={() => handleSort('id')}>
                                        #ID {renderSortIcon('id')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} className="bg-white user-select-none" onClick={() => handleSort('userName')}>
                                        User {renderSortIcon('userName')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} className="bg-white user-select-none" onClick={() => handleSort('email')}>
                                        Email {renderSortIcon('email')}
                                    </th>
                                    <th style={{ minWidth: '180px' }} className="bg-white user-select-none">
                                        <FaBuilding className="me-1 text-primary" size={11} />
                                        Access & Roles
                                    </th>
                                    <th style={{ width: '105px', cursor: 'pointer' }} className="bg-white user-select-none" onClick={() => handleSort('approvalStatus')}>
                                        Approval {renderSortIcon('approvalStatus')}
                                    </th>
                                    {!tabIsTrash ? (
                                        <th style={{ width: '90px', cursor: 'pointer' }} className="bg-white user-select-none" onClick={() => handleSort('isActive')}>
                                            Active {renderSortIcon('isActive')}
                                        </th>
                                    ) : (
                                        <th style={{ width: '140px', cursor: 'pointer' }} className="bg-white user-select-none" onClick={() => handleSort('deletedAt')}>
                                            Deleted Detail {renderSortIcon('deletedAt')}
                                        </th>
                                    )}
                                    <th style={{ width: '95px', cursor: 'pointer' }} className="bg-white user-select-none" onClick={() => handleSort('createdAt')}>
                                        Joined {renderSortIcon('createdAt')}
                                    </th>
                                    <th className="text-end px-3 bg-white" style={{ width: '160px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ fontSize: '0.88rem' }}>
                                {loadingUsers ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                                            <span className="text-muted">Loading users directory...</span>
                                        </td>
                                    </tr>
                                ) : sortedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5">
                                            <div className="text-muted">
                                                <FaUserTimes size={36} className="text-secondary opacity-50 mb-2" />
                                                <p className="mb-0 fw-medium">
                                                    {tabIsTrash
                                                        ? 'Recycle Bin is empty. No deleted users found.'
                                                        : 'No users found matching the selected filters.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedUsers.map((u) => {
                                        const isSelf = u.id === currentUserId;
                                        const isChecked = selectedIds.includes(u.id);

                                        return (
                                            <tr key={u.id} className={isChecked ? 'table-active' : ''}>
                                                {/* Select Checkbox */}
                                                <td className="text-center px-2" style={{ width: '40px' }}>
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleSelectRow(u.id)}
                                                        disabled={isSelf && !tabIsTrash}
                                                    />
                                                </td>

                                                {/* User ID */}
                                                <td className="text-center px-2 text-muted fw-semibold" style={{ width: '55px', fontSize: '0.82rem' }}>
                                                    #{u.id}
                                                </td>

                                                {/* User Info */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div
                                                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                                                            style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                backgroundColor: isSelf ? '#0d6efd' : '#6c757d',
                                                                fontSize: '0.85rem'
                                                            }}
                                                        >
                                                            {getInitial(u)}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="d-flex align-items-center gap-1">
                                                                <span className="fw-semibold text-dark text-truncate d-inline-block" style={{ maxWidth: '170px' }} title={getFullName(u)}>
                                                                    {getFullName(u)}
                                                                </span>
                                                                {isSelf && (
                                                                    <Badge bg="primary" className="ms-1 flex-shrink-0" style={{ fontSize: '0.65rem' }}>
                                                                        You
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-muted text-truncate" style={{ fontSize: '0.75rem', maxWidth: '170px' }}>
                                                                @{u.userName || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email */}
                                                <td>
                                                    <span className="text-dark text-break" style={{ fontSize: '0.85rem' }}>{u.email}</span>
                                                </td>

                                                {/* Access & Roles */}
                                                <td>
                                                    {u.isSuperAdmin || (u.roleSlug || '').toLowerCase() === 'super-admin' ? (
                                                        <Badge bg="danger" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                                                            <span>🌐</span> Super Admin (All Firms)
                                                        </Badge>
                                                    ) : !u.assignments || u.assignments.length === 0 ? (
                                                        <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1 px-2 py-1">
                                                            <span>⚠️</span> No Firm / Role Assigned
                                                        </Badge>
                                                    ) : u.assignments.length === 1 ? (
                                                        <div className="d-flex flex-column">
                                                            <Badge bg="primary" className="text-truncate px-2 py-1 text-start" style={{ maxWidth: '200px' }} title={u.assignments[0].firmName}>
                                                                🏢 {u.assignments[0].firmName}
                                                            </Badge>
                                                            <span className="text-muted mt-0.5 d-flex align-items-center flex-wrap gap-1" style={{ fontSize: '0.74rem' }}>
                                                                <span>📍 {u.assignments[0].branchName || 'All Branches'}</span>
                                                                <span>•</span>
                                                                <span className="text-primary fw-semibold">{u.assignments[0].roleName}</span>
                                                                {(u.assignments[0].dataScope || u.assignments[0].data_scope) && (
                                                                    <Badge bg="light" text="secondary" className="border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                                                        {(u.assignments[0].dataScope || u.assignments[0].data_scope) === 'FIRM' ? 'Firm-Wide' : (u.assignments[0].dataScope || u.assignments[0].data_scope) === 'BRANCH' ? 'Branch' : (u.assignments[0].dataScope || u.assignments[0].data_scope) === 'DESCENDANTS' ? 'Team' : 'Own'}
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex flex-column">
                                                            <div className="d-flex align-items-center gap-1 flex-wrap">
                                                                <Badge bg="primary" className="text-truncate px-2 py-1" style={{ maxWidth: '140px' }} title={u.assignments[0].firmName}>
                                                                    🏢 {u.assignments[0].firmName}
                                                                </Badge>
                                                                <OverlayTrigger
                                                                    trigger="click"
                                                                    rootClose
                                                                    placement="bottom"
                                                                    overlay={
                                                                        <Popover id={`firm-popover-${u.id}`} style={{ maxWidth: '340px' }} className="shadow-lg border-0">
                                                                            <Popover.Header as="h6" className="py-2 px-3 bg-light fw-bold text-dark d-flex align-items-center justify-content-between">
                                                                                <span>Entity & Role Scopes ({u.assignments.length})</span>
                                                                            </Popover.Header>
                                                                            <Popover.Body className="p-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                                                                <div className="d-flex flex-column gap-2">
                                                                                    {u.assignments.map((a, idx) => (
                                                                                        <div
                                                                                            key={a.id || idx}
                                                                                            className={`p-2 rounded border small ${a.isDefault ? 'border-warning bg-warning bg-opacity-10' : 'bg-light'}`}
                                                                                        >
                                                                                            <div className="d-flex align-items-center justify-content-between">
                                                                                                <span className="fw-bold text-dark text-truncate" style={{ maxWidth: '200px' }}>
                                                                                                    🏢 {a.firmName}
                                                                                                </span>
                                                                                                {a.isDefault && (
                                                                                                    <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem' }}>
                                                                                                        Default
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="text-muted d-flex align-items-center gap-1 mt-1 flex-wrap" style={{ fontSize: '0.72rem' }}>
                                                                                                <span>📍 {a.branchName || 'All Branches'}</span>
                                                                                                <span>•</span>
                                                                                                <span className="text-primary fw-semibold">{a.roleName}</span>
                                                                                                {(a.dataScope || a.data_scope) && (
                                                                                                    <>
                                                                                                        <span>•</span>
                                                                                                        <Badge bg="light" text="secondary" className="border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                                                                                            {(a.dataScope || a.data_scope) === 'FIRM' ? 'Firm-Wide' : (a.dataScope || a.data_scope) === 'BRANCH' ? 'Branch' : (a.dataScope || a.data_scope) === 'DESCENDANTS' ? 'Team' : 'Own'}
                                                                                                        </Badge>
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </Popover.Body>
                                                                        </Popover>
                                                                    }
                                                                >
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        className="py-0 px-1.5 fw-semibold"
                                                                        style={{ fontSize: '0.72rem', height: '22px' }}
                                                                    >
                                                                        +{u.assignments.length - 1} more
                                                                    </Button>
                                                                </OverlayTrigger>
                                                            </div>
                                                            <span className="text-muted mt-0.5 d-flex align-items-center flex-wrap gap-1" style={{ fontSize: '0.74rem' }}>
                                                                <span>📍 {u.assignments[0].branchName || 'All Branches'}</span>
                                                                <span>•</span>
                                                                <span className="text-primary fw-semibold">{u.assignments[0].roleName}</span>
                                                                {(u.assignments[0].dataScope || u.assignments[0].data_scope) && (
                                                                    <Badge bg="light" text="secondary" className="border px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                                                        {(u.assignments[0].dataScope || u.assignments[0].data_scope) === 'FIRM' ? 'Firm-Wide' : (u.assignments[0].dataScope || u.assignments[0].data_scope) === 'BRANCH' ? 'Branch' : (u.assignments[0].dataScope || u.assignments[0].data_scope) === 'DESCENDANTS' ? 'Team' : 'Own'}
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Approval Status */}
                                                <td>
                                                    {getApprovalBadge(u.approvalStatus)}
                                                </td>

                                                {/* Active Switch (Active Tab) or Deleted Detail (Trash Tab) */}
                                                {!tabIsTrash ? (
                                                    <td>
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={
                                                                <Tooltip>
                                                                    {isSelf
                                                                        ? 'You cannot deactivate your own account'
                                                                        : u.isActive
                                                                            ? 'Click to deactivate account'
                                                                            : 'Click to activate account'}
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <div className="d-inline-block">
                                                                <Form.Check
                                                                    type="switch"
                                                                    id={`user-status-${u.id}`}
                                                                    checked={Boolean(u.isActive)}
                                                                    onChange={() => handleToggleStatus(u)}
                                                                    disabled={isSelf || isTogglingStatus}
                                                                    label={
                                                                        <span
                                                                            style={{ fontSize: '0.78rem' }}
                                                                            className={u.isActive ? 'text-success fw-medium' : 'text-muted'}
                                                                        >
                                                                            {u.isActive ? 'Active' : 'Inactive'}
                                                                        </span>
                                                                    }
                                                                />
                                                            </div>
                                                        </OverlayTrigger>
                                                    </td>
                                                ) : (
                                                    <td>
                                                        <div className="text-danger fw-medium" style={{ fontSize: '0.78rem' }}>
                                                            Deleted {formatDateTime(u.deletedAt)}
                                                        </div>
                                                        {u.deletedByName && (
                                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                                by {u.deletedByName}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}

                                                {/* Joined Date */}
                                                <td>
                                                    <span className="text-muted text-nowrap" style={{ fontSize: '0.82rem' }}>
                                                        {formatDate(u.createdAt)}
                                                    </span>
                                                </td>

                                                {/* Actions Column (Guaranteed Single-Line flex-nowrap) */}
                                                <td className="text-end px-3" style={{ width: '160px', whiteSpace: 'nowrap' }}>
                                                    {!tabIsTrash ? (
                                                        <div className="d-inline-flex align-items-center justify-content-end gap-1 flex-nowrap" style={{ whiteSpace: 'nowrap' }}>
                                                            {/* Re-Approve button if REJECTED */}
                                                            {u.approvalStatus === 'REJECTED' && (
                                                                <OverlayTrigger
                                                                    placement="top"
                                                                    overlay={<Tooltip>Re-Approve User Account & Assign Role</Tooltip>}
                                                                >
                                                                    <span>
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                                                            className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                            onClick={() => handleOpenApproveModal(u)}
                                                                            disabled={isApprovingUser}
                                                                        >
                                                                            <FaUserCheck size={13} />
                                                                        </Button>
                                                                    </span>
                                                                </OverlayTrigger>
                                                            )}

                                                            {/* Approve button if PENDING */}
                                                            {u.approvalStatus === 'PENDING' && (
                                                                <OverlayTrigger
                                                                    placement="top"
                                                                    overlay={<Tooltip>Approve Registration & Assign Role</Tooltip>}
                                                                >
                                                                    <span>
                                                                        <Button
                                                                            variant="success"
                                                                            size="sm"
                                                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                                                            className="d-inline-flex align-items-center justify-content-center shadow-none text-white"
                                                                            onClick={() => handleOpenApproveModal(u)}
                                                                            disabled={isApprovingUser}
                                                                        >
                                                                            <FaUserCheck size={13} />
                                                                        </Button>
                                                                    </span>
                                                                </OverlayTrigger>
                                                            )}

                                                            {/* Revoke/Reject button if APPROVED */}
                                                            {u.approvalStatus === 'APPROVED' && !isSelf && (
                                                                <OverlayTrigger
                                                                    placement="top"
                                                                    overlay={<Tooltip>Reject / Revoke Account Access</Tooltip>}
                                                                >
                                                                    <span>
                                                                        <Button
                                                                            variant="outline-warning"
                                                                            size="sm"
                                                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                                                            className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                            onClick={() => handleRejectUser(u)}
                                                                            disabled={isRejectingUser}
                                                                        >
                                                                            <FaUserTimes size={13} />
                                                                        </Button>
                                                                    </span>
                                                                </OverlayTrigger>
                                                            )}

                                                            {/* Manage User Access & Roles */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Manage User Access & Roles</Tooltip>}
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handleOpenAssignmentsModal(u)}
                                                                        title="Manage User Access & Roles"
                                                                    >
                                                                        <FaUserShield size={13} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>

                                                            {/* Generate Password Reset Link */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Generate Password Reset Link</Tooltip>}
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-info"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handleGenerateReset(u)}
                                                                        disabled={isGeneratingReset}
                                                                    >
                                                                        <FaKey size={13} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>

                                                            {/* Move to Trash */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {isSelf ? 'Cannot trash own account' : 'Move to Recycle Bin'}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handleSingleDelete(u)}
                                                                        disabled={isSelf || isDeletingUser}
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </div>
                                                    ) : (
                                                        <div className="d-inline-flex align-items-center justify-content-end gap-1 flex-nowrap" style={{ whiteSpace: 'nowrap' }}>
                                                            {/* Restore */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Restore to Active Directory</Tooltip>}
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handleRestore(u)}
                                                                        disabled={isRestoringUser}
                                                                    >
                                                                        <FaUndo size={12} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>

                                                            {/* Delete Permanently */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={<Tooltip>Permanently Purge Record</Tooltip>}
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handlePermanentDelete(u)}
                                                                        disabled={isDeletingUser}
                                                                    >
                                                                        <FaExclamationTriangle size={12} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Table Footer with PaginationBar and Page Size Selector */}
                    {(totalRecords > 0 || users.length > 0) && (
                        <div className="d-flex align-items-center justify-content-between p-3 border-top flex-wrap gap-2 bg-white">
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted" style={{ fontSize: '0.84rem' }}>
                                    Showing {pagination.pageStart || (totalRecords > 0 ? (pageState - 1) * pageSizeState + 1 : 0)} - {pagination.pageEnd || Math.min(pageState * pageSizeState, totalRecords)} of {totalRecords} users
                                </span>
                                <Form.Select
                                    size="sm"
                                    value={pageSizeState}
                                    onChange={(e) => handlePageSizeChange(e.target.value)}
                                    style={{ width: 'auto', fontSize: '0.82rem' }}
                                >
                                    <option value={10}>10 / page</option>
                                    <option value={25}>25 / page</option>
                                    <option value={50}>50 / page</option>
                                    <option value={100}>100 / page</option>
                                </Form.Select>
                            </div>

                            <PaginationBar
                                page={pageState}
                                pageSize={pageSizeState}
                                total={totalRecords}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>



            {/* Modal: Approve / Re-Approve User */}
            <Modal
                show={approveModal.show}
                onHide={() => setApproveModal({ show: false, user: null, roleId: '' })}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="h6 d-flex align-items-center gap-2">
                        <FaUserCheck className="text-success" />
                        {approveModal.user?.approvalStatus === 'REJECTED'
                            ? 'Re-Approve User Registration'
                            : 'Approve User Registration'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {approveModal.user && (
                        <div>
                            <Alert variant={approveModal.user.approvalStatus === 'REJECTED' ? 'warning' : 'info'} className="py-2 mb-3 small">
                                <strong>User:</strong> {getFullName(approveModal.user)} ({approveModal.user.email})
                                {approveModal.user.approvalStatus === 'REJECTED' && (
                                    <div className="mt-1 font-weight-bold">
                                        Re-approving will activate this account and grant system access.
                                    </div>
                                )}
                            </Alert>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold" style={{ fontSize: '0.84rem' }}>
                                    Assign Authorization Role <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Select
                                    value={approveModal.roleId}
                                    onChange={(e) =>
                                        setApproveModal((prev) => ({ ...prev, roleId: e.target.value }))
                                    }
                                >
                                    <option value="">-- Select a Role --</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name} {r.slug === 'super-admin' ? '(Super Admin)' : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setApproveModal({ show: false, user: null, roleId: '' })}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        size="sm"
                        onClick={handleConfirmApproveUser}
                        disabled={isApprovingUser || !approveModal.roleId}
                    >
                        {isApprovingUser ? <Spinner animation="border" size="sm" /> : 'Confirm & Activate'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal: Generated Password Reset Link & Multi-Channel Delivery */}
            <PasswordResetDeliveryModal
                show={resetLinkModal.show}
                onHide={() => setResetLinkModal({ show: false, user: null, resetData: null })}
                user={resetLinkModal.user}
                resetData={resetLinkModal.resetData}
                title="User Password Reset"
            />

            {/* Modal: Generic Confirmation (Trash, Permanent Purge, Deactivate) */}
            <Modal
                show={confirmModal.show}
                onHide={() => setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null })}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title className="h6 d-flex align-items-center gap-2">
                        <FaExclamationTriangle className={`text-${confirmModal.variant}`} />
                        {confirmModal.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-secondary mb-0" style={{ fontSize: '0.9rem' }}>
                        {confirmModal.message}
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                            setConfirmModal({ show: false, title: '', message: '', variant: 'danger', onConfirm: null })
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={confirmModal.variant}
                        size="sm"
                        onClick={confirmModal.onConfirm}
                    >
                        {confirmModal.confirmText}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal: Multi-Firm and Branch Role Assignments */}
            {assignmentsModal.show && (
                <UserAssignmentsModal
                    show={assignmentsModal.show}
                    user={assignmentsModal.user}
                    onClose={handleCloseAssignmentsModal}
                />
            )}
        </div>
    );
};

export default UserList;