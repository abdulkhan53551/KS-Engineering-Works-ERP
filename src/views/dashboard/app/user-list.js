import React, { useState, useMemo, useCallback } from 'react';
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
import {
    Building2,
    MapPin,
    Globe,
    AlertTriangle,
    Layers,
    ShieldCheck,
    Users,
    UserCheck2,
    Clock,
    Filter,
    X,
    Trash2,
    RefreshCw,
    UserX,
    Inbox,
    XCircle
} from 'lucide-react';
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
import './user-list.css';

const FIRMS_DROPDOWN_PARAMS = { page: 1, pageSize: 100 };

// Standard role hierarchy fallback for strict subordination checks
const ROLE_HIERARCHY_FALLBACK = {
    'super-admin': ['administrator', 'admin', 'manager', 'supervisor', 'employee', 'auditor', 'viewer'],
    'administrator': ['manager', 'supervisor', 'employee', 'auditor', 'viewer'],
    'admin': ['manager', 'supervisor', 'employee', 'auditor', 'viewer'],
    'manager': ['supervisor', 'employee'],
    'supervisor': ['employee'],
    'auditor': [],
    'viewer': [],
    'employee': []
};

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
            } else if (sortConfig.key === 'status') {
                const getStatusWeight = (item) => {
                    if (item.approvalStatus === 'PENDING') return 1;
                    if (item.approvalStatus === 'APPROVED') return item.isActive ? 2 : 3;
                    if (item.approvalStatus === 'REJECTED') return 4;
                    return 5;
                };
                aVal = getStatusWeight(a);
                bVal = getStatusWeight(b);
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

    const isCallerSuperAdmin = Boolean(
        currentUser?.isSuperAdmin ||
        (currentUser?.role || '').toLowerCase() === 'super-admin'
    );

    // Build role hierarchy map for transitive subordinates
    const roleDescendantsMap = useMemo(() => {
        const map = new Map();
        if (!roles || roles.length === 0) return map;

        const childrenMap = new Map();
        roles.forEach(r => childrenMap.set(Number(r.id), []));
        roles.forEach(r => {
            const pId = Number(r.parent_role_id || r.parentRoleId);
            if (pId && childrenMap.has(pId)) {
                childrenMap.get(pId).push(Number(r.id));
            }
        });

        roles.forEach(r => {
            const numId = Number(r.id);
            const visited = new Set();
            const queue = [...(childrenMap.get(numId) || [])];
            while (queue.length > 0) {
                const cur = queue.shift();
                if (!visited.has(cur)) {
                    visited.add(cur);
                    (childrenMap.get(cur) || []).forEach(child => {
                        if (!visited.has(child)) queue.push(child);
                    });
                }
            }

            // Fallback enrichment using static role hierarchy
            const slug = (r.slug || '').toLowerCase();
            const fallbackSlugs = ROLE_HIERARCHY_FALLBACK[slug] || [];
            fallbackSlugs.forEach(targetSlug => {
                const targetRole = roles.find(tr => (tr.slug || '').toLowerCase() === targetSlug);
                if (targetRole && Number(targetRole.id) !== numId) {
                    visited.add(Number(targetRole.id));
                }
            });

            map.set(numId, visited);
        });
        return map;
    }, [roles]);

    const canManageUser = useCallback((targetUser) => {
        if (!targetUser) return false;
        if (targetUser.id === currentUserId) return false;
        if (isCallerSuperAdmin) return true;

        const targetIsSuperAdmin = Boolean(
            targetUser.isSuperAdmin ||
            targetUser.is_super_admin ||
            (targetUser.roleSlug || targetUser.role_slug || '').toLowerCase() === 'super-admin'
        );
        if (targetIsSuperAdmin) return false;

        // Resolve caller role ID & slug
        const callerRoleId = Number(
            currentUser?.roleId ||
            currentUser?.role_id ||
            roles.find(r => (r.slug || '').toLowerCase() === (currentUser?.role || currentUser?.roleSlug || '').toLowerCase())?.id
        );
        const callerRoleSlug = (currentUser?.role || currentUser?.roleSlug || roles.find(r => Number(r.id) === callerRoleId)?.slug || '').toLowerCase();

        // Resolve target role ID & slug
        const targetRoleId = Number(
            targetUser?.roleId ||
            targetUser?.role_id ||
            roles.find(r => (r.slug || '').toLowerCase() === (targetUser?.roleSlug || targetUser?.role_slug || '').toLowerCase() || r.name === (targetUser?.roleName || targetUser?.role_name))?.id
        );
        const targetRoleSlug = (targetUser?.roleSlug || targetUser?.role_slug || roles.find(r => Number(r.id) === targetRoleId)?.slug || '').toLowerCase();

        // If target has no assigned role yet (fresh registration / unassigned), firm admins can manage
        if (!targetRoleId || isNaN(targetRoleId)) {
            return true;
        }

        // Peers cannot manage peers
        if (callerRoleId && targetRoleId && callerRoleId === targetRoleId) return false;
        if (callerRoleSlug && targetRoleSlug && callerRoleSlug === targetRoleSlug) return false;

        // Check descendant map
        if (callerRoleId && roleDescendantsMap.has(callerRoleId)) {
            if (roleDescendantsMap.get(callerRoleId).has(targetRoleId)) {
                return true;
            }
        }

        // Check fallback slug hierarchy
        if (callerRoleSlug && targetRoleSlug) {
            const allowedDescendants = ROLE_HIERARCHY_FALLBACK[callerRoleSlug] || [];
            if (allowedDescendants.includes(targetRoleSlug)) {
                return true;
            }
        }

        return false;
    }, [currentUserId, isCallerSuperAdmin, currentUser, roles, roleDescendantsMap]);

    const isSelectableUser = useCallback((u) => {
        if (!u) return false;
        if (u.id === currentUserId) return false;
        return canManageUser(u);
    }, [currentUserId, canManageUser]);

    // List manager for row selection
    const {
        selectedIds,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount,
        selectableCount
    } = useListManager({
        items: sortedUsers,
        idKey: 'id',
        isSelectable: isSelectableUser
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

    // Filtered roles available for registration approval based on caller rank
    const availableApproveRoles = useMemo(() => {
        if (isCallerSuperAdmin) return roles;

        const callerRoleId = Number(
            currentUser?.roleId ||
            currentUser?.role_id ||
            roles.find(r => (r.slug || '').toLowerCase() === (currentUser?.role || currentUser?.roleSlug || '').toLowerCase())?.id
        );
        const callerRoleSlug = (currentUser?.role || currentUser?.roleSlug || roles.find(r => Number(r.id) === callerRoleId)?.slug || '').toLowerCase();

        return (roles || []).filter(r => {
            const targetId = Number(r.id);
            const targetSlug = (r.slug || '').toLowerCase();
            if (targetSlug === 'super-admin' || targetId === callerRoleId || targetSlug === callerRoleSlug) return false;

            if (callerRoleId && roleDescendantsMap.has(callerRoleId)) {
                if (roleDescendantsMap.get(callerRoleId).has(targetId)) return true;
            }

            const allowed = ROLE_HIERARCHY_FALLBACK[callerRoleSlug] || [];
            return allowed.includes(targetSlug);
        });
    }, [isCallerSuperAdmin, roles, currentUser, roleDescendantsMap]);

    // Approval & Re-Approval
    const handleOpenApproveModal = (user) => {
        const targetRoleId = Number(user.roleId || user.role_id);
        const defaultRole = availableApproveRoles.find(r => Number(r.id) === targetRoleId) ||
            availableApproveRoles.find(r => r.slug === 'employee') ||
            availableApproveRoles[0];
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


    const renderSmartStatus = (u, isSelf, canManage) => {
        if (u.approvalStatus === 'PENDING') {
            return (
                <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Registration is awaiting administrator approval & role assignment</Tooltip>}
                >
                    <span className="badge bg-soft-warning text-warning border border-warning-subtle d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                        <Clock size={11} className="flex-shrink-0" />
                        Pending
                    </span>
                </OverlayTrigger>
            );
        }

        if (u.approvalStatus === 'REJECTED') {
            return (
                <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Registration was rejected. Use action button to Re-Approve.</Tooltip>}
                >
                    <span className="badge bg-soft-danger text-danger border border-danger-subtle d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill" style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                        <XCircle size={11} className="flex-shrink-0" />
                        Rejected
                    </span>
                </OverlayTrigger>
            );
        }

        // Operational user (approvalStatus === 'APPROVED') -> Show Active/Inactive Switch
        return (
            <OverlayTrigger
                placement="top"
                overlay={
                    <Tooltip>
                        {isSelf
                            ? 'You cannot deactivate your own account'
                            : !canManage
                                ? 'Requires higher administrator rank to toggle status'
                                : u.isActive
                                    ? 'Click to deactivate account'
                                    : 'Click to activate account'}
                    </Tooltip>
                }
            >
                <div className="d-inline-flex align-items-center">
                    <Form.Check
                        type="switch"
                        id={`user-status-${u.id}`}
                        checked={Boolean(u.isActive)}
                        onChange={() => handleToggleStatus(u)}
                        disabled={isSelf || !canManage || isTogglingStatus}
                        label={
                            <span className={`ul-active-label ${u.isActive ? 'ul-active-label--on' : 'ul-active-label--off'}`}>
                                {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                        }
                    />
                </div>
            </OverlayTrigger>
        );
    };

    const renderDataScopeBadge = (rawScope) => {
        if (!rawScope) return null;
        const scope = String(rawScope).toUpperCase();

        let label = scope;
        let style = {
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0'
        };

        switch (scope) {
            case 'GLOBAL':
            case 'ALL':
                label = 'Global';
                style = {
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca'
                };
                break;
            case 'FIRM':
                label = 'Firm-Wide';
                style = {
                    backgroundColor: '#f5f3ff',
                    color: '#6d28d9',
                    border: '1px solid #ddd6fe'
                };
                break;
            case 'BRANCH':
                label = 'Branch';
                style = {
                    backgroundColor: '#f0f9ff',
                    color: '#0369a1',
                    border: '1px solid #bae6fd'
                };
                break;
            case 'DESCENDANTS':
                label = 'Team';
                style = {
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0'
                };
                break;
            case 'OWN':
            case 'SELF':
                label = 'Own';
                style = {
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0'
                };
                break;
            default:
                label = scope;
                break;
        }

        return (
            <span
                className="badge rounded-pill px-1.5 py-0.5 fw-semibold"
                style={{
                    ...style,
                    fontSize: '0.66rem',
                    letterSpacing: '0.01em',
                    lineHeight: 1.2
                }}
            >
                {label}
            </span>
        );
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

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const d = new Date(dateStr);
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 1) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    const totalRecords = Number(pagination?.total) || users.length || 0;
    const totalPages = Number(pagination?.totalPages) || (totalRecords && pageSizeState ? Math.ceil(totalRecords / pageSizeState) : 1) || 1;
    const activeCount = pagination?.activeCount !== undefined ? Number(pagination.activeCount) : (tabIsTrash ? 0 : users.length);
    const trashCount = pagination?.trashCount !== undefined ? Number(pagination.trashCount) : (tabIsTrash ? users.length : 0);
    const pendingCount = pagination?.pendingCount !== undefined ? Number(pagination.pendingCount) : 0;

    // Active filter tracking
    const activeFiltersList = useMemo(() => {
        const filters = [];
        if (debouncedSearch) filters.push({ key: 'search', label: `Search: "${debouncedSearch}"`, onClear: clearSearch });
        if (statusFilter) {
            const statusLabels = { APPROVED: 'Approved', PENDING: 'Pending', REJECTED: 'Rejected', INACTIVE: 'Deactivated' };
            filters.push({ key: 'status', label: `Status: ${statusLabels[statusFilter] || statusFilter}`, onClear: () => { setStatusFilter(''); setPageState(1); } });
        }
        if (firmFilter) {
            const firm = firmsList.find(f => String(f.firmId || f.id) === String(firmFilter));
            filters.push({ key: 'firm', label: `Firm: ${firm?.firmName || firm?.name || firmFilter}`, onClear: () => { setFirmFilter(''); setPageState(1); } });
        }
        if (roleFilter) {
            const role = roles.find(r => String(r.id) === String(roleFilter));
            filters.push({ key: 'role', label: `Role: ${role?.name || roleFilter}`, onClear: () => { setRoleFilter(''); setPageState(1); } });
        }
        return filters;
    }, [debouncedSearch, statusFilter, firmFilter, roleFilter, firmsList, roles]);

    const hasActiveFilters = activeFiltersList.length > 0;

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setFirmFilter('');
        setRoleFilter('');
        setPageState(1);
        handleDeselectAll();
    };

    return (
        <div className="container-fluid py-4">
            {/* Page Header */}
            <div className="ul-page-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <h5 className="ul-page-title d-flex align-items-center gap-2">
                        <Users size={20} className="text-primary" />
                        User Directory
                    </h5>
                    <p className="ul-page-subtitle">
                        Manage accounts, roles, permissions, and access across your organization.
                    </p>
                </div>
                <div className="ul-header-actions">
                    <button
                        type="button"
                        onClick={() => {
                            if (tabIsTrash) setTabIsTrash(false);
                            setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING');
                            setPageState(1);
                        }}
                        className={`btn btn-sm ul-header-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                        style={
                            statusFilter === 'PENDING'
                                ? { borderColor: '#d97706', background: '#fef3c7', color: '#92400e', fontWeight: 600 }
                                : { borderColor: '#f59e0b', color: '#b45309', background: '#fffbeb' }
                        }
                        title={statusFilter === 'PENDING' ? 'Showing Pending Registrations (click to view all)' : 'Filter by Pending Registration Approvals'}
                    >
                        <UserCheck2 size={14} />
                        <span>{statusFilter === 'PENDING' ? 'Showing Pending' : 'Pending Approvals'}</span>
                        {pendingCount > 0 && (
                            <Badge bg={statusFilter === 'PENDING' ? 'dark' : 'warning'} text={statusFilter === 'PENDING' ? 'white' : 'dark'} pill style={{ fontSize: '0.65rem' }}>
                                {pendingCount}
                            </Badge>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="btn btn-sm ul-header-btn"
                        style={{ borderColor: '#e2e8f0', color: '#475569', background: '#ffffff' }}
                    >
                        <RefreshCw size={13} className={loadingUsers ? 'fa-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="ul-kpi-row">
                <div className="ul-kpi-chip">
                    <div className="ul-kpi-icon ul-kpi-icon--total">
                        <Users size={17} />
                    </div>
                    <div>
                        <div className="ul-kpi-value">{totalRecords || 0}</div>
                        <div className="ul-kpi-label">Total Users</div>
                    </div>
                </div>
                <div className="ul-kpi-chip">
                    <div className="ul-kpi-icon ul-kpi-icon--active">
                        <UserCheck2 size={17} />
                    </div>
                    <div>
                        <div className="ul-kpi-value">{activeCount}</div>
                        <div className="ul-kpi-label">Active</div>
                    </div>
                </div>
                <div className="ul-kpi-chip">
                    <div className="ul-kpi-icon ul-kpi-icon--pending">
                        <Clock size={17} />
                    </div>
                    <div>
                        <div className="ul-kpi-value">{pendingCount}</div>
                        <div className="ul-kpi-label">Pending</div>
                    </div>
                </div>
                <div className="ul-kpi-chip">
                    <div className="ul-kpi-icon ul-kpi-icon--trash">
                        <Trash2 size={17} />
                    </div>
                    <div>
                        <div className="ul-kpi-value">{trashCount}</div>
                        <div className="ul-kpi-label">Trashed</div>
                    </div>
                </div>
            </div>

            {/* Filter & Tabs Bar */}
            <Card className="ul-filter-card shadow-sm">
                <Card.Body>
                    <Row className="g-2 align-items-center">
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
                                {/* Search Input */}
                                <div style={{ minWidth: '220px', flex: '1 1 200px' }}>
                                    <InputGroup size="sm" className="ul-search-input">
                                        <InputGroup.Text className="bg-white border-end-0">
                                            <FaSearch className="text-muted" size={12} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Search name, username, email..."
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
                                                <X size={12} />
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
                                        className="ul-filter-select"
                                        style={{ width: 'auto', minWidth: '140px' }}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="PENDING">Pending</option>
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
                                    className="ul-filter-select"
                                    style={{ width: 'auto', minWidth: '150px' }}
                                >
                                    <option value="">All Firms</option>
                                    {firmsList.map((f) => {
                                        const fId = f.firmId || f.id;
                                        const fName = f.firmName || f.name;
                                        return (
                                            <option key={fId} value={fId}>
                                                {fName}
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
                                    className="ul-filter-select"
                                    style={{ width: 'auto', minWidth: '130px' }}
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

                    {/* Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="ul-active-filters">
                            <span className="ul-active-filters__label">
                                <Filter size={10} className="me-1" />
                                Filters:
                            </span>
                            {activeFiltersList.map((f) => (
                                <span key={f.key} className="ul-filter-chip" onClick={f.onClear} title="Click to remove">
                                    {f.label}
                                    <span className="ul-filter-chip__close">✕</span>
                                </span>
                            ))}
                            <button type="button" className="ul-clear-all-btn" onClick={clearAllFilters}>
                                Clear All
                            </button>
                        </div>
                    )}

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
            <Card className="ul-table-card shadow-sm">
                <Card.Body className="p-0 position-relative">
                    <div className="ul-table-scroll">

                        <Table hover className="ul-table align-middle w-100">
                            {/* Table Header */}
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }} className="text-center px-2">
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip>
                                                    {loadingUsers
                                                        ? 'Loading users...'
                                                        : selectableCount === 0
                                                            ? 'No selectable users on this page'
                                                            : isAllSelected
                                                                ? 'Deselect all manageable users'
                                                                : 'Select all manageable users'}
                                                </Tooltip>
                                            }
                                        >
                                            <div className="d-inline-block">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(el) => el && (el.indeterminate = isIndeterminate)}
                                                    onChange={handleSelectAll}
                                                    disabled={loadingUsers || selectableCount === 0}
                                                />
                                            </div>
                                        </OverlayTrigger>
                                    </th>
                                    <th style={{ width: '50px' }} className="ul-th-sortable text-center px-2" onClick={() => handleSort('id')}>
                                        ID {renderSortIcon('id')}
                                    </th>
                                    <th className="ul-th-sortable" onClick={() => handleSort('userName')}>
                                        User {renderSortIcon('userName')}
                                    </th>
                                    <th className="ul-th-sortable" onClick={() => handleSort('email')}>
                                        Email {renderSortIcon('email')}
                                    </th>
                                    <th style={{ minWidth: '220px' }}>
                                        Access & Roles
                                    </th>
                                    {!tabIsTrash ? (
                                        <th style={{ width: '135px' }} className="ul-th-sortable" onClick={() => handleSort('status')}>
                                            Status {renderSortIcon('status')}
                                        </th>
                                    ) : (
                                        <th style={{ width: '140px' }} className="ul-th-sortable" onClick={() => handleSort('deletedAt')}>
                                            Deleted {renderSortIcon('deletedAt')}
                                        </th>
                                    )}
                                    <th style={{ width: '95px' }} className="ul-th-sortable" onClick={() => handleSort('createdAt')}>
                                        Joined {renderSortIcon('createdAt')}
                                    </th>
                                    <th className="text-end px-3" style={{ width: '150px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingUsers ? (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="ul-loading-state">
                                                <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                                                <span className="ul-loading-text">Loading user directory...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : sortedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="8">
                                            <div className="ul-empty-state">
                                                <div className="ul-empty-icon">
                                                    {tabIsTrash ? <Inbox size={26} /> : <UserX size={26} />}
                                                </div>
                                                <div className="ul-empty-title">
                                                    {tabIsTrash ? 'Recycle Bin is empty' : 'No users found'}
                                                </div>
                                                <p className="ul-empty-text">
                                                    {tabIsTrash
                                                        ? 'No deleted users in the recycle bin. Deleted users will appear here.'
                                                        : hasActiveFilters
                                                            ? 'No users match the current filters. Try adjusting or clearing filters.'
                                                            : 'No users have been added yet. Users will appear here once registered.'}
                                                </p>
                                                {hasActiveFilters && !tabIsTrash && (
                                                    <button type="button" className="btn btn-sm btn-outline-primary mt-2" onClick={clearAllFilters} style={{ fontSize: '0.78rem', borderRadius: '8px' }}>
                                                        Clear All Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedUsers.map((u) => {
                                        const isSelf = u.id === currentUserId;
                                        const canManage = canManageUser(u);
                                        const isChecked = selectedIds.includes(u.id);
                                        const isSelectable = !isSelf && canManage;

                                        return (
                                            <tr key={u.id} className={isChecked ? 'ul-row-selected' : ''}>
                                                {/* Select Checkbox */}
                                                <td className="text-center px-2" style={{ width: '40px' }}>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Tooltip>
                                                                {isSelf
                                                                    ? 'Security Policy: Cannot perform bulk actions on your own account'
                                                                    : !canManage
                                                                        ? 'Requires higher administrator rank to select this user'
                                                                        : isChecked
                                                                            ? 'Click to deselect user'
                                                                            : 'Click to select user'}
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <div className="d-inline-block">
                                                            <Form.Check
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleSelectRow(u.id)}
                                                                disabled={!isSelectable}
                                                            />
                                                        </div>
                                                    </OverlayTrigger>
                                                </td>

                                                {/* User ID */}
                                                <td className="text-center px-2" style={{ width: '50px', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
                                                    {u.id}
                                                </td>

                                                {/* User Info */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className={`ul-avatar ${isSelf ? 'ul-avatar--self' : 'ul-avatar--other'}`}>
                                                            {getInitial(u)}
                                                            <span className={`ul-avatar__status-dot ${u.isActive ? 'ul-avatar__status-dot--active' : 'ul-avatar__status-dot--inactive'}`} />
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div className="ul-user-name text-truncate" style={{ maxWidth: '170px' }}>
                                                                {getFullName(u)}
                                                                {isSelf && (
                                                                    <span className="badge rounded-pill ms-1.5" style={{ fontSize: '0.58rem', background: '#eef2ff', color: '#3a57e8', fontWeight: 600, verticalAlign: 'middle' }}>You</span>
                                                                )}
                                                            </div>
                                                            <div className="ul-user-handle text-truncate" style={{ maxWidth: '170px' }}>
                                                                @{u.userName || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Email */}
                                                <td>
                                                    <span className="ul-email">{u.email}</span>
                                                </td>


                                                {/* Access & Roles */}
                                                <td>
                                                    {u.isSuperAdmin || (u.roleSlug || '').toLowerCase() === 'super-admin' ? (
                                                        <div className="ul-access-badge ul-access-badge--super">
                                                            <ShieldCheck size={13} className="flex-shrink-0" />
                                                            <span>Super Admin</span>
                                                            <span className="ul-access-badge__sub">(All Firms)</span>
                                                        </div>
                                                    ) : !u.assignments || u.assignments.length === 0 ? (
                                                        <div className="ul-access-badge ul-access-badge--warn">
                                                            <AlertTriangle size={12} className="flex-shrink-0" />
                                                            <span>Unassigned</span>
                                                        </div>
                                                    ) : (
                                                        <div className="ul-access-cell">
                                                            {/* Primary: Firm name */}
                                                            <div className="ul-access-firm-row">
                                                                <div className="ul-access-firm" title={u.assignments[0].firmName}>
                                                                    <Building2 size={11} className="flex-shrink-0" />
                                                                    <span className="text-truncate">{u.assignments[0].firmName}</span>
                                                                </div>
                                                                {u.assignments.length > 1 && (
                                                                    <OverlayTrigger
                                                                        trigger="click"
                                                                        rootClose
                                                                        placement="bottom"
                                                                        overlay={
                                                                            <Popover id={`firm-popover-${u.id}`} className="ul-access-popover shadow-lg border-0 rounded-3 overflow-hidden">
                                                                                <Popover.Header as="div" className="ul-access-popover__header">
                                                                                    <div className="d-flex align-items-center gap-2">
                                                                                        <div className="ul-access-popover__icon">
                                                                                            <Layers size={14} />
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="ul-access-popover__title">Role & Access Scopes</div>
                                                                                            <div className="ul-access-popover__sub">{u.assignments.length} firms · {getFullName(u)}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                </Popover.Header>
                                                                                <Popover.Body className="ul-access-popover__body">
                                                                                    <div className="d-flex flex-column gap-2">
                                                                                        {u.assignments.map((a, idx) => {
                                                                                            const scope = a.dataScope || a.data_scope;
                                                                                            return (
                                                                                                <div key={a.id || idx} className={`ul-access-popover__card ${a.isDefault ? 'ul-access-popover__card--default' : ''}`}>
                                                                                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                                                                                        <div className="d-flex align-items-center gap-1.5 text-truncate me-2">
                                                                                                            <Building2 size={12} className={a.isDefault ? 'text-primary' : 'text-secondary'} />
                                                                                                            <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.78rem' }} title={a.firmName}>
                                                                                                                {a.firmName}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        {a.isDefault && (
                                                                                                            <span className="ul-access-default-badge">Default ★</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <div className="ul-access-popover__meta">
                                                                                                        <MapPin size={10} className="flex-shrink-0 opacity-50" />
                                                                                                        <span>{a.branchName || 'All Branches'}</span>
                                                                                                        <span className="ul-access-dot" />
                                                                                                        <span className="fw-semibold text-dark">{a.roleName}</span>
                                                                                                        {scope && (
                                                                                                            <>
                                                                                                                <span className="ul-access-dot" />
                                                                                                                {renderDataScopeBadge(scope)}
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </Popover.Body>
                                                                            </Popover>
                                                                        }
                                                                    >
                                                                        <button type="button" className="ul-access-more-btn" title={`View all ${u.assignments.length} assignments`}>
                                                                            +{u.assignments.length - 1}
                                                                        </button>
                                                                    </OverlayTrigger>
                                                                )}
                                                            </div>
                                                            {/* Secondary: Role · Scope */}
                                                            <div className="ul-access-meta">
                                                                <span className="ul-access-role">{u.assignments[0].roleName}</span>
                                                                {(u.assignments[0].dataScope || u.assignments[0].data_scope) && (
                                                                    <>
                                                                        <span className="ul-access-dot" />
                                                                        {renderDataScopeBadge(u.assignments[0].dataScope || u.assignments[0].data_scope)}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {/* Tertiary: Branch (subtle) */}
                                                            <div className="ul-access-branch">
                                                                <MapPin size={9} className="flex-shrink-0" />
                                                                <span>{u.assignments[0].branchName || 'All Branches'}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Smart Status (Active Tab) or Deleted Detail (Trash Tab) */}
                                                {!tabIsTrash ? (
                                                    <td>
                                                        {renderSmartStatus(u, isSelf, canManage)}
                                                    </td>
                                                ) : (
                                                    <td>
                                                        <div className="ul-deleted-info">
                                                            {formatDateTime(u.deletedAt)}
                                                        </div>
                                                        {u.deletedByName && (
                                                            <div className="ul-deleted-by">
                                                                by {u.deletedByName}
                                                            </div>
                                                        )}
                                                    </td>
                                                )}

                                                {/* Joined Date */}
                                                <td>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>{timeAgo(u.createdAt)}</Tooltip>}
                                                    >
                                                        <span className="ul-date">
                                                            {formatDate(u.createdAt)}
                                                        </span>
                                                    </OverlayTrigger>
                                                </td>

                                                {/* Actions */}
                                                <td className="text-end px-3" style={{ width: '150px' }}>
                                                    {!tabIsTrash ? (
                                                        <div className="ul-actions">
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
                                                                    overlay={<Tooltip>{!canManage ? 'Requires higher administrator rank' : 'Reject / Revoke Account Access'}</Tooltip>}
                                                                >
                                                                    <span>
                                                                        <Button
                                                                            variant="outline-warning"
                                                                            size="sm"
                                                                            style={{ width: '32px', height: '32px', padding: 0 }}
                                                                            className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                            onClick={() => handleRejectUser(u)}
                                                                            disabled={!canManage || isRejectingUser}
                                                                        >
                                                                            <FaUserTimes size={13} />
                                                                        </Button>
                                                                    </span>
                                                                </OverlayTrigger>
                                                            )}

                                                            {/* Manage User Access & Roles */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {isSelf
                                                                            ? 'Security Policy: Cannot modify own role assignments'
                                                                            : !canManage
                                                                                ? 'Requires higher administrator rank to manage this user'
                                                                                : 'Manage User Access & Roles'}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handleOpenAssignmentsModal(u)}
                                                                        disabled={isSelf || !canManage}
                                                                        title="Manage User Access & Roles"
                                                                    >
                                                                        <FaUserShield size={13} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>

                                                            {/* Generate Password Reset Link */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {isSelf
                                                                            ? 'Use Profile to change your own password'
                                                                            : !canManage
                                                                                ? 'Requires higher administrator rank to reset password'
                                                                                : 'Generate Password Reset Link'}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-info"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handleGenerateReset(u)}
                                                                        disabled={isSelf || !canManage || isGeneratingReset}
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
                                                                        {isSelf
                                                                            ? 'Cannot trash own account'
                                                                            : !canManage
                                                                                ? 'Requires higher administrator rank to delete this user'
                                                                                : 'Move to Recycle Bin'}
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
                                                                        disabled={isSelf || !canManage || isDeletingUser}
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>
                                                        </div>
                                                    ) : (
                                                        <div className="ul-actions">
                                                            {/* Restore */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {isSelf
                                                                            ? 'Cannot restore own account'
                                                                            : !canManage
                                                                                ? 'Requires higher administrator rank to restore this user'
                                                                                : 'Restore to Active Directory'}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-success"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handleRestore(u)}
                                                                        disabled={isSelf || !canManage || isRestoringUser}
                                                                    >
                                                                        <FaUndo size={12} />
                                                                    </Button>
                                                                </span>
                                                            </OverlayTrigger>

                                                            {/* Delete Permanently */}
                                                            <OverlayTrigger
                                                                placement="top"
                                                                overlay={
                                                                    <Tooltip>
                                                                        {!isCallerSuperAdmin
                                                                            ? 'Permanent deletion requires Super Administrator rank'
                                                                            : 'Permanently Purge Record'}
                                                                    </Tooltip>
                                                                }
                                                            >
                                                                <span>
                                                                    <Button
                                                                        variant="outline-danger"
                                                                        size="sm"
                                                                        style={{ width: '32px', height: '32px', padding: 0 }}
                                                                        className="d-inline-flex align-items-center justify-content-center shadow-none"
                                                                        onClick={() => handlePermanentDelete(u)}
                                                                        disabled={!isCallerSuperAdmin || isDeletingUser}
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

                    {/* Pagination Footer */}
                    {(totalRecords > 0 || users.length > 0) && (
                        <div className="ul-pagination-footer">
                            <div className="ul-pagination-info">
                                <span className="ul-pagination-text">
                                    Showing <strong>{pagination.pageStart || (totalRecords > 0 ? (pageState - 1) * pageSizeState + 1 : 0)}</strong> – <strong>{pagination.pageEnd || Math.min(pageState * pageSizeState, totalRecords)}</strong> of <strong>{totalRecords}</strong> users
                                </span>
                                <Form.Select
                                    size="sm"
                                    value={pageSizeState}
                                    onChange={(e) => handlePageSizeChange(e.target.value)}
                                    className="ul-page-size-select"
                                    style={{ width: 'auto' }}
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
                                    {availableApproveRoles.map((r) => (
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