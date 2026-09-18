import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Modal, Button, Table, Form, Spinner, Alert, Badge, Tooltip, OverlayTrigger } from 'react-bootstrap';
import {
    FaPlus,
    FaTrash,
    FaUserShield,
    FaExclamationTriangle,
    FaBuilding,
    FaMapMarkerAlt,
    FaStar,
    FaCheckCircle,
    FaInfoCircle,
    FaSearch,
    FaLayerGroup
} from 'react-icons/fa';
import { useUserAssignments, useUpdateUserAssignments, useRoles } from '../hooks/useUserApi';
import { useGetFirms } from '../../firms/hooks/api.hooks';
import { getFirmBranches } from '../../firms/api';
import './UserAssignmentsModal.css';

const FIRMS_QUERY_PARAMS = { page: 1, pageSize: 100 };

const UserAssignmentsModal = ({ show, onClose, user }) => {
    const userId = user?.id;
    const {
        data: existingAssignments = [],
        isLoading: isLoadingAssignments,
        isSuccess
    } = useUserAssignments(userId, { enabled: Boolean(show && userId) });

    const { data: firmsList = [] } = useGetFirms(FIRMS_QUERY_PARAMS);
    const { data: rolesList = [] } = useRoles();
    const { mutate: updateAssignments, isPending: isSaving } = useUpdateUserAssignments(userId);

    const [rows, setRows] = useState([]);
    const [firmBranchesMap, setFirmBranchesMap] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Tracks if rows have been initialized from the server for this modal session
    const initializedRef = useRef(false);
    // Tracks which firm IDs have branch requests in flight or completed
    const fetchedFirmIdsRef = useRef(new Set());

    // Reset when modal closes or userId changes
    useEffect(() => {
        if (!show) {
            initializedRef.current = false;
            fetchedFirmIdsRef.current.clear();
            setRows([]);
            setSearchTerm('');
        }
    }, [show, userId]);

    // Populate rows from server data once fetched
    useEffect(() => {
        if (show && isSuccess && !initializedRef.current) {
            initializedRef.current = true;
            if (Array.isArray(existingAssignments) && existingAssignments.length > 0) {
                setRows(
                    existingAssignments.map((a, idx) => ({
                        id: a.id ? String(a.id) : `existing-${idx}-${Date.now()}`,
                        firmId: String(a.firmId || ''),
                        firmBranchId: a.firmBranchId ? String(a.firmBranchId) : '',
                        roleId: String(a.roleId || ''),
                        isDefault: Boolean(a.isDefault),
                        isActive: a.isActive !== false
                    }))
                );
            } else {
                setRows([]);
            }
        }
    }, [show, isSuccess, existingAssignments]);

    // Fetch branches for firms present in rows
    useEffect(() => {
        if (!show || !rows.length) return;
        const neededFirmIds = rows
            .map(r => r.firmId)
            .filter(fId => fId && !fetchedFirmIdsRef.current.has(fId));

        if (neededFirmIds.length === 0) return;

        neededFirmIds.forEach(async (fId) => {
            fetchedFirmIdsRef.current.add(fId);
            try {
                const res = await getFirmBranches(fId);
                if (res?.data) {
                    setFirmBranchesMap(prev => ({ ...prev, [fId]: res.data }));
                }
            } catch (err) {
                console.error(`Failed to fetch branches for firm ${fId}:`, err);
                fetchedFirmIdsRef.current.delete(fId);
            }
        });
    }, [show, rows]);

    // Track unsaved changes (dirty state)
    const isDirty = useMemo(() => {
        if (!initializedRef.current) return false;
        const currentClean = rows.map(r => ({
            firmId: String(r.firmId || ''),
            firmBranchId: String(r.firmBranchId || ''),
            roleId: String(r.roleId || ''),
            isDefault: Boolean(r.isDefault),
            isActive: Boolean(r.isActive)
        }));
        const initialClean = (existingAssignments || []).map(a => ({
            firmId: String(a.firmId || ''),
            firmBranchId: String(a.firmBranchId || ''),
            roleId: String(a.roleId || ''),
            isDefault: Boolean(a.isDefault),
            isActive: a.isActive !== false
        }));
        return JSON.stringify(currentClean) !== JSON.stringify(initialClean);
    }, [rows, existingAssignments]);

    // Detect duplicate scopes: (firmId, firmBranchId)
    const duplicateIds = useMemo(() => {
        const seen = new Map();
        const duplicates = new Set();

        rows.forEach((r) => {
            if (!r.firmId) return;
            const scopeKey = `${r.firmId}:${r.firmBranchId || 'all'}`;
            if (seen.has(scopeKey)) {
                duplicates.add(seen.get(scopeKey));
                duplicates.add(r.id);
            } else {
                seen.set(scopeKey, r.id);
            }
        });

        return duplicates;
    }, [rows]);

    const hasDuplicates = duplicateIds.size > 0;

    // Firm change handler for specific row id
    const handleFirmChangeById = async (id, newFirmId) => {
        setRows(prevRows =>
            prevRows.map(r => (r.id === id ? { ...r, firmId: newFirmId, firmBranchId: '' } : r))
        );

        if (newFirmId && !fetchedFirmIdsRef.current.has(newFirmId)) {
            fetchedFirmIdsRef.current.add(newFirmId);
            try {
                const res = await getFirmBranches(newFirmId);
                if (res?.data) {
                    setFirmBranchesMap(prev => ({ ...prev, [newFirmId]: res.data }));
                }
            } catch (err) {
                console.error(`Failed to fetch branches for firm ${newFirmId}:`, err);
                fetchedFirmIdsRef.current.delete(newFirmId);
            }
        }
    };

    // Generic field change handler by row id
    const handleRowChangeById = useCallback((id, field, value) => {
        setRows(prevRows =>
            prevRows.map(r => (r.id === id ? { ...r, [field]: value } : r))
        );
    }, []);

    // Toggle active status
    const handleToggleActiveById = useCallback((id) => {
        setRows(prevRows => {
            const target = prevRows.find(r => r.id === id);
            if (!target) return prevRows;

            const nextActive = !target.isActive;

            // If deactivating the default row, try moving default to another active row
            if (!nextActive && target.isDefault) {
                const otherActive = prevRows.find(r => r.id !== id && r.isActive);
                if (otherActive) {
                    return prevRows.map(r => {
                        if (r.id === id) return { ...r, isActive: false, isDefault: false };
                        if (r.id === otherActive.id) return { ...r, isDefault: true };
                        return r;
                    });
                }
            }

            return prevRows.map(r => (r.id === id ? { ...r, isActive: nextActive } : r));
        });
    }, []);

    // Set default row
    const handleSetDefaultById = useCallback((id) => {
        setRows(prevRows =>
            prevRows.map(r => ({
                ...r,
                isDefault: r.id === id,
                // Ensure default entity is active
                isActive: r.id === id ? true : r.isActive
            }))
        );
    }, []);

    // Add new assignment
    const handleAddRow = useCallback(() => {
        const firstFirm = firmsList[0];
        const defaultFirmId = firstFirm ? String(firstFirm.firmId || firstFirm.id || '') : '';
        const defaultRoleId = rolesList[0]?.id ? String(rolesList[0].id) : '';
        const newId = `new-${Date.now()}-${Math.random().toString(36).substr(2, 7)}`;

        setRows(prevRows => [
            ...prevRows,
            {
                id: newId,
                firmId: defaultFirmId,
                firmBranchId: '',
                roleId: defaultRoleId,
                isDefault: prevRows.length === 0,
                isActive: true
            }
        ]);

        if (defaultFirmId && !fetchedFirmIdsRef.current.has(defaultFirmId)) {
            fetchedFirmIdsRef.current.add(defaultFirmId);
            getFirmBranches(defaultFirmId).then(res => {
                if (res?.data) {
                    setFirmBranchesMap(prev => ({ ...prev, [defaultFirmId]: res.data }));
                }
            }).catch(() => fetchedFirmIdsRef.current.delete(defaultFirmId));
        }
    }, [firmsList, rolesList]);

    // Remove row
    const handleRemoveRowById = useCallback((id) => {
        setRows(prevRows => {
            const updated = prevRows.filter(r => r.id !== id);
            if (updated.length > 0 && !updated.some(r => r.isDefault)) {
                const firstActive = updated.find(r => r.isActive) || updated[0];
                return updated.map(r => ({
                    ...r,
                    isDefault: r.id === firstActive.id
                }));
            }
            return updated;
        });
    }, []);

    // Save assignments to server
    const handleSave = () => {
        if (hasDuplicates) return;

        const validAssignments = rows
            .filter(r => r.firmId && r.roleId)
            .map(r => ({
                firmId: Number(r.firmId),
                firmBranchId: r.firmBranchId ? Number(r.firmBranchId) : null,
                roleId: Number(r.roleId),
                isDefault: Boolean(r.isDefault),
                isActive: Boolean(r.isActive)
            }));

        updateAssignments(
            { assignments: validAssignments },
            {
                onSuccess: () => {
                    onClose();
                }
            }
        );
    };

    // Derived User Header Data
    const displayName = user?.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : (user?.userName || 'User');

    const userInitials = useMemo(() => {
        const first = user?.firstName?.trim() || '';
        const last = user?.lastName?.trim() || '';
        if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
        if (first) return first.slice(0, 2).toUpperCase();
        if (user?.userName) return user.userName.slice(0, 2).toUpperCase();
        return 'U';
    }, [user]);

    // Metrics
    const activeAssignmentsCount = useMemo(() => rows.filter(r => r.isActive).length, [rows]);
    const uniqueFirmsCount = useMemo(() => new Set(rows.map(r => r.firmId).filter(Boolean)).size, [rows]);

    const defaultEntityLabel = useMemo(() => {
        const defRow = rows.find(r => r.isDefault);
        if (!defRow || !defRow.firmId) return 'None set';
        const firm = firmsList.find(f => String(f.firmId || f.id) === String(defRow.firmId));
        const firmName = firm?.firmName || firm?.name || `Firm #${defRow.firmId}`;
        const branches = firmBranchesMap[defRow.firmId] || [];
        const branch = branches.find(b => String(b.id) === String(defRow.firmBranchId));
        const branchLabel = defRow.firmBranchId ? (branch?.branchName || `Branch #${defRow.firmBranchId}`) : 'All Branches';
        return `${firmName} (${branchLabel})`;
    }, [rows, firmsList, firmBranchesMap]);

    // Filtered rows
    const visibleRows = useMemo(() => {
        if (!searchTerm.trim()) return rows;
        const term = searchTerm.toLowerCase().trim();
        return rows.filter(row => {
            const firm = firmsList.find(f => String(f.firmId || f.id) === String(row.firmId));
            const firmName = (firm?.firmName || firm?.name || '').toLowerCase();
            const branches = firmBranchesMap[row.firmId] || [];
            const branch = branches.find(b => String(b.id) === String(row.firmBranchId));
            const branchName = (branch?.branchName || 'all branches').toLowerCase();
            const role = rolesList.find(r => String(r.id) === String(row.roleId));
            const roleName = (role?.name || '').toLowerCase();
            return firmName.includes(term) || branchName.includes(term) || roleName.includes(term);
        });
    }, [rows, searchTerm, firmsList, firmBranchesMap, rolesList]);

    return (
        <Modal
            show={show}
            onHide={onClose}
            size="xl"
            centered
            backdrop="static"
            className="user-assignments-modal"
        >
            {/* Modal Header: User Identity & Profile Banner */}
            <div className="user-assignments-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                    <div className="user-avatar-circle">
                        {userInitials}
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-1.5">
                                <FaUserShield className="text-primary me-1" size={18} />
                                Entity & Role Assignments: {displayName}
                            </h5>
                            {user?.userName && (
                                <span className="user-meta-chip">
                                    @{user.userName}
                                </span>
                            )}
                            {(user?.roleName || user?.role) && (
                                <Badge bg="primary" className="fw-semibold px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                    {user.roleName || user.role}
                                </Badge>
                            )}
                        </div>
                        <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap">
                            {user?.email && <span>✉️ {user.email}</span>}
                            <span>•</span>
                            <span>Configure organizational firm access, branch scopes, and default login context</span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={onClose}
                />
            </div>

            <Modal.Body className="p-3 p-md-4 bg-light-subtle">
                {isLoadingAssignments ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 small text-muted fw-semibold">Loading user entity assignments...</div>
                    </div>
                ) : (
                    <>
                        {/* Duplicate Scope Conflict Alert */}
                        {hasDuplicates && (
                            <Alert
                                variant="danger"
                                className="py-2.5 px-3 mb-3 small d-flex align-items-center gap-2.5 border-danger bg-danger-subtle text-danger-emphasis rounded-3 shadow-sm"
                            >
                                <FaExclamationTriangle className="flex-shrink-0 text-danger" size={18} />
                                <div>
                                    <strong>Duplicate Assignment Conflict:</strong> A user cannot hold multiple roles for the same firm and branch scope. Please remove or reassign the highlighted duplicate rows before saving.
                                </div>
                            </Alert>
                        )}

                        {/* Summary Metrics & Action Bar */}
                        <div className="assignments-summary-bar shadow-sm">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="summary-metric-item">
                                    <FaBuilding className="text-primary" size={14} />
                                    <span className="text-muted">Firms:</span>
                                    <span className="summary-metric-value">{uniqueFirmsCount}</span>
                                </div>
                                <span className="text-muted">|</span>
                                <div className="summary-metric-item">
                                    <FaLayerGroup className="text-info" size={14} />
                                    <span className="text-muted">Total Scopes:</span>
                                    <span className="summary-metric-value">{rows.length}</span>
                                </div>
                                <span className="text-muted">|</span>
                                <div className="summary-metric-item">
                                    <FaCheckCircle className="text-success" size={14} />
                                    <span className="text-muted">Active:</span>
                                    <span className="summary-metric-value">{activeAssignmentsCount}</span>
                                </div>
                                <span className="text-muted">|</span>
                                <div className="summary-metric-item">
                                    <FaStar className="text-warning" size={14} />
                                    <span className="text-muted">Default Context:</span>
                                    <Badge bg="warning" text="dark" className="fw-semibold px-2 py-1 text-truncate" style={{ maxWidth: '280px' }}>
                                        {defaultEntityLabel}
                                    </Badge>
                                </div>
                                {isDirty && (
                                    <Badge bg="secondary" className="bg-opacity-10 text-secondary border border-secondary px-2 py-1 ms-1">
                                        ● Unsaved Changes
                                    </Badge>
                                )}
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                {rows.length >= 3 && (
                                    <div className="position-relative" style={{ width: '180px' }}>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            placeholder="Filter..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ paddingLeft: '26px', fontSize: '0.8rem', borderRadius: '6px' }}
                                        />
                                        <FaSearch
                                            size={11}
                                            className="text-muted position-absolute"
                                            style={{ left: '9px', top: '9px' }}
                                        />
                                    </div>
                                )}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAddRow}
                                    className="d-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold shadow-sm"
                                >
                                    <FaPlus size={11} />
                                    Add Assignment
                                </Button>
                            </div>
                        </div>

                        {/* Assignments Table or Empty State */}
                        {rows.length === 0 ? (
                            <div className="empty-assignments-card">
                                <div className="empty-assignments-icon">
                                    <FaBuilding />
                                </div>
                                <h6 className="fw-bold text-dark mb-1">No Entity & Role Assignments</h6>
                                <p className="text-muted small mb-3" style={{ maxWidth: '420px', margin: '0 auto' }}>
                                    This user currently has no assigned firms or branches. Add an assignment to grant multi-firm access and define their operational role.
                                </p>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAddRow}
                                    className="d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
                                >
                                    <FaPlus size={12} />
                                    Add First Assignment
                                </Button>
                            </div>
                        ) : (
                            <div className="assignments-table-container shadow-sm">
                                <Table className="assignments-table align-middle" hover responsive>
                                    <thead>
                                        <tr>
                                            <th style={{ width: '28%' }} className="ps-3">
                                                <FaBuilding className="me-1 text-primary" /> Firm Entity
                                            </th>
                                            <th style={{ width: '28%' }}>
                                                <span className="d-inline-flex align-items-center gap-1">
                                                    <FaMapMarkerAlt className="me-1 text-danger" /> Branch Scope
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Tooltip>
                                                                "All Branches" grants access across all physical branches of this firm. Select a specific branch to restrict operations to that location.
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <span role="button" className="text-muted" style={{ cursor: 'help' }}>
                                                            <FaInfoCircle size={11} />
                                                        </span>
                                                    </OverlayTrigger>
                                                </span>
                                            </th>
                                            <th style={{ width: '22%' }}>
                                                <FaUserShield className="me-1 text-info" /> Assigned Role
                                            </th>
                                            <th style={{ width: '10%' }} className="text-center">
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            Toggle whether this user's access to this firm/branch is currently active or temporarily suspended.
                                                        </Tooltip>
                                                    }
                                                >
                                                    <span role="button" className="d-inline-flex align-items-center gap-1" style={{ cursor: 'help' }}>
                                                        Status <FaInfoCircle size={10} />
                                                    </span>
                                                </OverlayTrigger>
                                            </th>
                                            <th style={{ width: '12%' }} className="text-center">
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            The default entity loaded upon user sign-in. Exactly one entity assignment must be designated as default.
                                                        </Tooltip>
                                                    }
                                                >
                                                    <span role="button" className="d-inline-flex align-items-center gap-1" style={{ cursor: 'help' }}>
                                                        Default <FaInfoCircle size={10} />
                                                    </span>
                                                </OverlayTrigger>
                                            </th>
                                            <th style={{ width: '70px' }} className="text-center pe-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleRows.map((row) => {
                                            const availableBranches = firmBranchesMap[row.firmId] || [];
                                            const isDuplicate = duplicateIds.has(row.id);
                                            const rowClasses = [
                                                row.isDefault ? 'row-default' : '',
                                                !row.isActive ? 'row-inactive' : '',
                                                isDuplicate ? 'row-duplicate' : ''
                                            ].filter(Boolean).join(' ');

                                            return (
                                                <tr key={row.id} className={rowClasses}>
                                                    {/* Column 1: Firm Entity */}
                                                    <td className="ps-3">
                                                        <Form.Select
                                                            size="sm"
                                                            value={row.firmId}
                                                            onChange={(e) => handleFirmChangeById(row.id, e.target.value)}
                                                            className={`assignment-select fw-semibold ${isDuplicate ? 'border-danger text-danger' : 'text-dark'}`}
                                                        >
                                                            <option value="" disabled>-- Select Firm Entity --</option>
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
                                                    </td>

                                                    {/* Column 2: Branch Scope */}
                                                    <td>
                                                        <Form.Select
                                                            size="sm"
                                                            value={row.firmBranchId}
                                                            onChange={(e) => handleRowChangeById(row.id, 'firmBranchId', e.target.value)}
                                                            disabled={!row.firmId}
                                                            className={`assignment-select ${isDuplicate ? 'border-danger' : ''}`}
                                                        >
                                                            <option value="">✦ All Branches (Firm-Wide Access)</option>
                                                            {availableBranches.map((b) => (
                                                                <option key={b.id} value={b.id}>
                                                                    📍 {b.branchName} ({b.branchCode}) {b.isHeadOffice ? '★ Head Office' : ''}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                        {isDuplicate && (
                                                            <div className="text-danger small mt-1 fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                                                                <FaExclamationTriangle size={10} /> Duplicate firm & branch scope!
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Column 3: Assigned Role */}
                                                    <td>
                                                        <Form.Select
                                                            size="sm"
                                                            value={row.roleId}
                                                            onChange={(e) => handleRowChangeById(row.id, 'roleId', e.target.value)}
                                                            className="assignment-select fw-semibold text-primary"
                                                        >
                                                            <option value="" disabled>-- Select Assigned Role --</option>
                                                            {rolesList.map((r) => (
                                                                <option key={r.id} value={r.id}>
                                                                    🛡️ {r.name}
                                                                </option>
                                                            ))}
                                                        </Form.Select>
                                                    </td>

                                                    {/* Column 4: Status (Active / Inactive) */}
                                                    <td className="text-center">
                                                        <div
                                                            className="status-pill-container"
                                                            onClick={() => handleToggleActiveById(row.id)}
                                                            title={row.isActive ? "Click to deactivate assignment" : "Click to activate assignment"}
                                                        >
                                                            <Form.Check
                                                                type="switch"
                                                                id={`status-switch-${row.id}`}
                                                                checked={Boolean(row.isActive)}
                                                                onChange={() => { }} // Controlled via container click
                                                                className="d-inline-block m-0"
                                                            />
                                                            <span className={`status-badge ${row.isActive ? 'active' : 'inactive'}`}>
                                                                {row.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Column 5: Default Context Star */}
                                                    <td className="text-center">
                                                        <button
                                                            type="button"
                                                            className={`btn-star-default ${row.isDefault ? 'is-default' : ''}`}
                                                            onClick={() => handleSetDefaultById(row.id)}
                                                            title={row.isDefault ? "Current Default Login Entity" : "Set as Default Login Entity"}
                                                        >
                                                            <FaStar size={11} className={row.isDefault ? 'text-warning' : 'text-muted'} />
                                                            <span>{row.isDefault ? 'Default' : 'Set Default'}</span>
                                                        </button>
                                                    </td>

                                                    {/* Column 6: Actions */}
                                                    <td className="text-center pe-3">
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={<Tooltip>Remove this assignment</Tooltip>}
                                                        >
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="btn-action-icon text-danger"
                                                                onClick={() => handleRemoveRowById(row.id)}
                                                            >
                                                                <FaTrash size={11} />
                                                            </Button>
                                                        </OverlayTrigger>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}

                        {/* Informational Guidance Callout */}
                        <div className="alert alert-soft-primary py-2 px-3 mt-3 mb-0 small rounded-3 d-flex align-items-start gap-2 border-primary bg-primary-subtle text-primary-emphasis">
                            <FaInfoCircle size={15} className="mt-0.5 flex-shrink-0 text-primary" />
                            <div>
                                <strong>Enterprise Scope Guidance:</strong> Assigning <strong>"✦ All Branches (Firm-Wide Access)"</strong> allows the user to operate across every branch in that firm with the designated role. Assigning a specific branch restricts their access exclusively to that location.
                            </div>
                        </div>
                    </>
                )}
            </Modal.Body>

            {/* Modal Footer */}
            <div className="user-assignments-footer d-flex align-items-center justify-content-between">
                <div className="text-muted small">
                    {rows.length > 0 ? (
                        <span>
                            {rows.length} assignment{rows.length !== 1 ? 's' : ''} configured ({activeAssignmentsCount} active)
                        </span>
                    ) : (
                        <span>No assignments configured</span>
                    )}
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Button variant="light" onClick={onClose} disabled={isSaving} className="px-3 fw-semibold">
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving || isLoadingAssignments || hasDuplicates}
                        className="px-4 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                        title={hasDuplicates ? "Please resolve duplicate assignments before saving" : ""}
                    >
                        {isSaving ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" />
                                <span>Saving Assignments...</span>
                            </>
                        ) : (
                            <>
                                <FaCheckCircle size={13} />
                                <span>Save Assignments</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default React.memo(UserAssignmentsModal);
