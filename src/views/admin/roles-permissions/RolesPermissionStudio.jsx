import React from 'react';
import { Row, Col, Card, Button, Form, Badge, Spinner, Alert, Modal } from 'react-bootstrap';
import { useRolesPermissionStudio } from './hooks';
import './RolesPermissionStudio.css';

const ACTION_LABELS = {
    read: { label: 'View', icon: '👁️' },
    create: { label: 'Create', icon: '➕' },
    update: { label: 'Edit', icon: '✏️' },
    delete: { label: 'Delete', icon: '🗑️' },
    approve: { label: 'Approve', icon: '✅' },
    print: { label: 'Print', icon: '🖨️' }
};

const CATEGORY_ICONS = {
    'Sales Management': '📊',
    'Purchasing & Procurement': '🛒',
    'Finance & Banking': '💳',
    'Inventory & Masters': '📦',
    'Organization': '🏢',
    'General Masters': '🛠️',
    'System & Administration': '⚙️'
};

const getCoverageBarColor = (pct) => {
    if (pct >= 80) return '#10b981'; // Emerald
    if (pct >= 50) return '#0284c7'; // Sky/Blue
    if (pct >= 20) return '#f59e0b'; // Amber
    return '#64748b'; // Slate
};

const RolesPermissionStudio = () => {
    const {
        isLoading,
        isError,
        roles,
        filteredRoles,
        modules,
        groupedModules,
        filteredGroupedModules,
        moduleSearchTerm,
        setModuleSearchTerm,
        collapsedCategories,
        toggleCategoryCollapse,
        expandAllCategories,
        collapseAllCategories,
        coverageStats,
        permissionDiff,
        handleCategoryMasterSwitch,
        allPermissions,
        permMap,
        selectedRoleId,
        setSelectedRoleId,
        selectedRole,
        isSuperAdmin,
        selectedPermIds,
        savedPermIds,
        searchTerm,
        setSearchTerm,
        isDirty,
        showCreateModal,
        setShowCreateModal,
        newRoleName,
        setNewRoleName,
        newRoleDesc,
        setNewRoleDesc,
        newRoleParentId,
        setNewRoleParentId,
        newRoleIsIndependent,
        setNewRoleIsIndependent,

        showRoleSettingsModal,
        setShowRoleSettingsModal,
        editRoleParentId,
        setEditRoleParentId,
        editRoleIsIndependent,
        setEditRoleIsIndependent,
        handleUpdateRoleHierarchy,
        isUpdatingRoleDetails,

        showConfirmSaveModal,
        setShowConfirmSaveModal,
        roleToDelete,
        setRoleToDelete,
        handleToggleAction,
        handleModuleMasterSwitch,
        handleApplyPreset,
        handleConfirmSave,
        handleCreateRole,
        handleDeleteRole,
        handleDiscardChanges,
        isSaving,
        isCreatingRole,
        isDeletingRole,

        // Scoped firm state
        selectedFirmId,
        setSelectedFirmId,
        userFirms,
        activeFirm,
        isAllFirmsMode,
        availableFirms,
        selectedTargetFirmIds,
        toggleTargetFirmId,
        selectAllTargetFirms,
        deselectAllTargetFirms
    } = useRolesPermissionStudio();

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-50 py-5">
                <Spinner animation="border" variant="primary" style={{ width: '2.5rem', height: '2.5rem' }} />
                <span className="ms-3 text-muted" style={{ fontSize: '0.85rem' }}>Loading permissions matrix...</span>
            </div>
        );
    }

    if (isError) {
        return (
            <Alert variant="danger" className="m-4">
                <h6 className="fw-bold mb-1">Failed to load Permissions Matrix</h6>
                <p className="mb-0" style={{ fontSize: '0.82rem' }}>Unable to connect to the authorization service. Please check your network and try again.</p>
            </Alert>
        );
    }

    const allCategoriesCollapsed = Object.keys(groupedModules).length > 0 && 
        Object.keys(groupedModules).every(cat => collapsedCategories.has(cat));

    return (
        <div className="roles-permission-studio pb-5">
            {/* Page Header Card (Clean Solid White Background) */}
            <div className="header-banner-section d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <h4 className="studio-title mb-1 d-flex align-items-center gap-2">
                        <span>🔐</span> Roles & Permissions Studio
                    </h4>
                    <p className="studio-subtitle mb-0">
                        Configure system roles, access rules, and granular module permissions in real time.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    {isAllFirmsMode ? (
                        <div className="d-flex align-items-center gap-2 bg-primary-subtle px-3 py-1.5 rounded-pill border border-primary-subtle shadow-sm">
                            <span style={{ fontSize: '0.85rem' }}>🌐</span>
                            <span className="fw-semibold text-primary" style={{ fontSize: '0.82rem' }}>
                                Group Master Mode <span className="text-muted fw-normal">(✦ All Firms Active)</span>
                            </span>
                        </div>
                    ) : (
                        <div className="d-flex align-items-center gap-2 bg-light px-3 py-1.5 rounded-pill border shadow-sm">
                            <span style={{ fontSize: '0.85rem' }}>🏢</span>
                            <span className="text-muted fw-semibold" style={{ fontSize: '0.82rem' }}>
                                Firm: <strong className="text-dark">{activeFirm?.firmName || 'Active Firm'}</strong>
                            </span>
                        </div>
                    )}

                    <Button 
                        variant="primary"
                        id="btn-create-custom-role"
                        className="btn-create-role d-flex align-items-center gap-2"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCreateModal(true);
                        }}
                    >
                        <span style={{ fontSize: '0.85rem' }}>➕</span>
                        <span>Create Custom Role</span>
                    </Button>
                </div>
            </div>

            {/* Main Master-Detail Layout */}
            <Row>
                {/* Left Column: Roles Navigation (Sticky) */}
                <Col lg="4" xl="3" className="mb-4">
                    <div className="sticky-roles-sidebar">
                        <div className="sidebar-card">
                            <div className="p-3 border-bottom bg-white">
                                <div className="search-input-wrapper">
                                    <span className="search-icon">🔍</span>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search roles..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="role-search-input"
                                    />
                                    {searchTerm && (
                                        <button 
                                            type="button" 
                                            className="search-clear-btn" 
                                            onClick={() => setSearchTerm('')}
                                            title="Clear search"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="roles-list-container">
                                {filteredRoles.map((role) => {
                                    const isSelected = role.id === selectedRoleId;
                                    const isSuper = role.slug === 'super-admin';
                                    const isAdmin = role.slug === 'administrator';

                                    return (
                                        <div
                                            key={role.id}
                                            onClick={() => {
                                                if (isDirty) {
                                                    if (window.confirm("You have unsaved changes for the current role. Discard changes?")) {
                                                        setSelectedRoleId(role.id);
                                                    }
                                                } else {
                                                    setSelectedRoleId(role.id);
                                                }
                                            }}
                                            className={`role-nav-item ${isSelected ? 'is-selected' : ''}`}
                                        >
                                            <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                                                    {isSuper ? '👑' : isAdmin ? '🛡️' : role.slug === 'manager' ? '💼' : role.slug === 'supervisor' ? '👷' : role.slug === 'employee' ? '👨‍🔧' : '👁️'}
                                                </span>
                                                <div className="text-truncate">
                                                    <div className="role-name-text text-truncate">
                                                        {role.name}
                                                    </div>
                                                    <div className="role-meta-text text-truncate">
                                                        {role.userCount} active user{role.userCount === 1 ? '' : 's'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="d-flex align-items-center gap-1 flex-shrink-0">
                                                {role.isSystem ? (
                                                    <span className="badge-system-role">
                                                        System
                                                    </span>
                                                ) : (
                                                    role.userCount === 0 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0 text-danger border-0"
                                                            style={{ fontSize: '0.75rem', lineHeight: 1 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRoleToDelete(role);
                                                            }}
                                                            title="Delete Role"
                                                        >
                                                            🗑️
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredRoles.length === 0 && (
                                    <div className="text-center py-4 text-muted small">
                                        No roles matching "{searchTerm}"
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Col>

                {/* Right Column: Permission Matrix */}
                <Col lg="8" xl="9">
                    {selectedRole ? (
                        <div className="permission-detail-view">
                            {/* Selected Role Hero Card */}
                            <div className="role-hero-card">
                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                                    <div>
                                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                            <h5 className="role-hero-title mb-0">{selectedRole.name}</h5>
                                            <span className="role-slug-chip">{selectedRole.slug}</span>
                                            {isSuperAdmin && (
                                                <Badge bg="warning" text="dark" className="rounded-pill fw-semibold" style={{ fontSize: '0.68rem' }}>
                                                    👑 Root Universal Access
                                                </Badge>
                                            )}
                                            {selectedRole.isSystem && !isSuperAdmin && (
                                                <Badge bg="light" text="primary" className="border" style={{ fontSize: '0.68rem' }}>
                                                    System Protected
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Dynamic Hierarchy Badges */}
                                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                            {selectedRole.parentRoleName ? (
                                                <Badge bg="soft-info" className="text-info border py-1 px-2" style={{ fontSize: '0.72rem' }} title="Reports to this superior in the hierarchy tree">
                                                    ▲ Reports to: <strong>{selectedRole.parentRoleName}</strong>
                                                </Badge>
                                            ) : (
                                                <Badge bg="soft-secondary" className="text-secondary border py-1 px-2" style={{ fontSize: '0.72rem' }}>
                                                    Root Level Hierarchy
                                                </Badge>
                                            )}
                                            {selectedRole.isIndependent && (
                                                <Badge bg="soft-warning" className="text-dark border py-1 px-2" style={{ fontSize: '0.72rem' }} title="Independent Compliance Role">
                                                    🔒 Independent Compliance
                                                </Badge>
                                            )}
                                            {!isSuperAdmin && (
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-outline-secondary py-0.5 px-2 border d-inline-flex align-items-center gap-1"
                                                    style={{ fontSize: '0.72rem', height: '22px' }}
                                                    onClick={() => setShowRoleSettingsModal(true)}
                                                    title="Configure Hierarchy"
                                                >
                                                    ⚙️ Edit Hierarchy
                                                </button>
                                            )}
                                        </div>

                                        <p className="role-hero-desc mb-2">
                                            {selectedRole.description || 'Configuring access rights and permissions for this role.'}
                                        </p>

                                        {/* Coverage Progress Bar */}
                                        <div className="coverage-meter-wrapper">
                                            <span className="coverage-meter-label">
                                                Coverage:
                                            </span>
                                            <div className="coverage-meter-bar">
                                                <div 
                                                    className="coverage-meter-fill" 
                                                    style={{ 
                                                        width: `${coverageStats.percentage}%`,
                                                        backgroundColor: getCoverageBarColor(coverageStats.percentage)
                                                    }} 
                                                />
                                            </div>
                                            <span className="coverage-meter-label text-muted">
                                                {isSuperAdmin 
                                                    ? 'All 100% (Universal)' 
                                                    : `${coverageStats.active} of ${coverageStats.total} active (${coverageStats.percentage}%)`
                                                }
                                            </span>
                                            <span className="text-muted ms-2">•</span>
                                            <span className="coverage-meter-label text-muted ms-2">
                                                👥 {selectedRole.userCount} assigned user(s)
                                            </span>
                                        </div>
                                    </div>

                                    {/* Presets Segmented Group */}
                                    {!isSuperAdmin && (
                                        <div className="preset-btn-group">
                                            <button 
                                                type="button" 
                                                className="preset-btn" 
                                                onClick={() => handleApplyPreset('all')}
                                                title="Grant all module actions"
                                            >
                                                Grant All
                                            </button>
                                            <button 
                                                type="button" 
                                                className="preset-btn" 
                                                onClick={() => handleApplyPreset('readonly')}
                                                title="Set View and Print access only"
                                            >
                                                Read-Only
                                            </button>
                                            <button 
                                                type="button" 
                                                className="preset-btn is-danger" 
                                                onClick={() => handleApplyPreset('clear')}
                                                title="Revoke all actions"
                                            >
                                                Revoke All
                                            </button>
                                            {isDirty && (
                                                <button 
                                                    type="button" 
                                                    className="preset-btn text-danger fw-bold" 
                                                    onClick={() => handleApplyPreset('reset')}
                                                    title="Reset to last saved permissions"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Super Admin Notice */}
                                {isSuperAdmin && (
                                    <Alert variant="warning" className="mt-3 mb-0 d-flex align-items-center gap-2 py-2" style={{ fontSize: '0.78rem' }}>
                                        <span>💡</span>
                                        <div>
                                            <strong>Universal Access:</strong> The Super Admin role maintains permanent wildcard policies (<code>*</code>). 
                                            All permissions are automatically granted and locked in Casbin RAM to prevent accidental lockouts.
                                        </div>
                                    </Alert>
                                )}
                            </div>

                            {/* Matrix Filter & Accordion Toolbar */}
                            <div className="matrix-filter-bar">
                                <div className="search-input-wrapper">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Filter modules or operations..."
                                        value={moduleSearchTerm}
                                        onChange={(e) => setModuleSearchTerm(e.target.value)}
                                        className="matrix-search-input"
                                    />
                                    {moduleSearchTerm && (
                                        <button 
                                            type="button" 
                                            className="search-clear-btn" 
                                            onClick={() => setModuleSearchTerm('')}
                                            title="Clear filter"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary py-1 px-2 border"
                                        style={{ fontSize: '0.72rem', fontWeight: 500 }}
                                        onClick={allCategoriesCollapsed ? expandAllCategories : collapseAllCategories}
                                    >
                                        {allCategoriesCollapsed ? '📂 Expand All' : '📁 Collapse All'}
                                    </button>
                                </div>
                            </div>

                            {/* Categorized Modules List */}
                            {Object.entries(filteredGroupedModules).map(([category, categoryModules]) => {
                                const isCollapsed = collapsedCategories.has(category);

                                return (
                                    <div key={category} className="category-card">
                                        <div className="category-card-header">
                                            <div 
                                                className="d-flex align-items-center gap-2 cursor-pointer user-select-none" 
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleCategoryCollapse(category)}
                                            >
                                                <button 
                                                    type="button" 
                                                    className={`category-collapse-btn ${isCollapsed ? 'is-collapsed' : ''}`}
                                                    aria-label="Toggle Category Collapse"
                                                >
                                                    ▼
                                                </button>
                                                <span className="category-icon-box">
                                                    {CATEGORY_ICONS[category] || '📁'}
                                                </span>
                                                <span className="category-title">{category}</span>
                                                <span className="category-module-count">
                                                    {categoryModules.length} module{categoryModules.length === 1 ? '' : 's'}
                                                </span>
                                            </div>

                                            {/* Category-Level Quick Switch */}
                                            {!isSuperAdmin && (
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="text-muted" style={{ fontSize: '0.67rem' }}>Category:</span>
                                                    <div className="category-quick-switch">
                                                        <button
                                                            type="button"
                                                            className="cat-switch-btn"
                                                            onClick={() => handleCategoryMasterSwitch(category, 'full')}
                                                            title={`Grant full access to all ${category} modules`}
                                                        >
                                                            All
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="cat-switch-btn"
                                                            onClick={() => handleCategoryMasterSwitch(category, 'read')}
                                                            title={`Set read-only for all ${category} modules`}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="cat-switch-btn text-danger"
                                                            onClick={() => handleCategoryMasterSwitch(category, 'none')}
                                                            title={`Revoke all ${category} modules`}
                                                        >
                                                            None
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {!isCollapsed && (
                                            <div className="table-responsive">
                                                <table className="table matrix-table align-middle">
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: '32%' }}>Module</th>
                                                            <th style={{ width: '48%' }}>Allowed Operations</th>
                                                            <th style={{ width: '20%' }} className="text-end pe-3">Quick Toggle</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {categoryModules.map(mod => {
                                                            const hasRead = selectedPermIds.has(permMap[`${mod.slug}:read`]);
                                                            const activeActionsCount = mod.actions.filter(act => 
                                                                selectedPermIds.has(permMap[`${mod.slug}:${act}`])
                                                            ).length;
                                                            const isFull = activeActionsCount === mod.actions.length;

                                                            return (
                                                                <tr key={mod.slug}>
                                                                    <td>
                                                                        <div className="module-name">{mod.name}</div>
                                                                        <div className="module-desc">
                                                                            {mod.description}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <div className="d-flex flex-wrap gap-1">
                                                                            {mod.actions.map(act => {
                                                                                const permId = permMap[`${mod.slug}:${act}`];
                                                                                const isChecked = isSuperAdmin || selectedPermIds.has(permId);
                                                                                const meta = ACTION_LABELS[act] || { label: act, icon: '•' };

                                                                                return (
                                                                                    <button
                                                                                        key={act}
                                                                                        type="button"
                                                                                        disabled={isSuperAdmin}
                                                                                        onClick={() => handleToggleAction(mod.slug, act)}
                                                                                        className={`action-pill ${isChecked ? `is-checked variant-${act}` : ''}`}
                                                                                        title={`${isChecked ? 'Disable' : 'Enable'} ${meta.label} for ${mod.name}`}
                                                                                    >
                                                                                        <span className="pill-indicator">
                                                                                            {isChecked ? '✓' : meta.icon}
                                                                                        </span>
                                                                                        <span>{meta.label}</span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-end pe-3">
                                                                        {!isSuperAdmin && (
                                                                            <div className="module-segmented-switch">
                                                                                <button
                                                                                    type="button"
                                                                                    className={`seg-btn ${isFull ? 'is-active btn-full' : ''}`}
                                                                                    onClick={() => handleModuleMasterSwitch(mod.slug, 'full')}
                                                                                    title="Enable all actions for this module"
                                                                                >
                                                                                    Full
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`seg-btn ${hasRead && !isFull ? 'is-active btn-view' : ''}`}
                                                                                    onClick={() => handleModuleMasterSwitch(mod.slug, 'read')}
                                                                                    title="View-only access"
                                                                                >
                                                                                    View
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`seg-btn ${activeActionsCount === 0 ? 'is-active btn-none' : ''}`}
                                                                                    onClick={() => handleModuleMasterSwitch(mod.slug, 'none')}
                                                                                    title="Revoke all actions for this module"
                                                                                >
                                                                                    None
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {Object.keys(filteredGroupedModules).length === 0 && (
                                <div className="text-center py-5 bg-white rounded border text-muted">
                                    <p className="mb-1 fw-semibold">No modules match "{moduleSearchTerm}"</p>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-link text-decoration-none" 
                                        onClick={() => setModuleSearchTerm('')}
                                    >
                                        Clear search filter
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted bg-white rounded border">
                            <h6 className="fw-semibold">Select a role from the left menu to view and configure its permissions.</h6>
                        </div>
                    )}
                </Col>
            </Row>

            {/* Floating Sticky Bottom Action Bar when there are unsaved changes */}
            {isDirty && (
                <div className="floating-dock-bar">
                    <div className="d-flex align-items-center gap-3">
                        <span className="dock-chip">⚠️ Unsaved Changes</span>
                        <div>
                            <div className="dock-title">
                                Modifying permissions for <strong>{selectedRole?.name}</strong>
                            </div>
                            <div className="dock-subtext">
                                +{permissionDiff.added} granted, -{permissionDiff.removed} revoked ({permissionDiff.totalChanges} changes pending)
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button 
                            type="button"
                            className="btn-dock-discard" 
                            onClick={handleDiscardChanges}
                            disabled={isSaving}
                        >
                            Discard
                        </button>
                        <button 
                            type="button"
                            className="btn-dock-save d-flex align-items-center gap-2"
                            onClick={() => setShowConfirmSaveModal(true)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Blast Radius & Target Firms Confirmation Modal */}
            <Modal show={showConfirmSaveModal} onHide={() => setShowConfirmSaveModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold" style={{ fontSize: '1rem' }}>
                        {isAllFirmsMode ? '🌐 Group Broadcast: Save Role Permissions' : 'Confirm Permission Changes'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ fontSize: '0.85rem' }}>
                    <p className="mb-2">
                        Are you sure you want to update permissions for <strong>{selectedRole?.name}</strong>?
                    </p>
                    <div className="p-2 mb-3 bg-light rounded border small d-flex align-items-center justify-content-between">
                        <span><strong>Change Summary:</strong> +{permissionDiff.added} granted, -{permissionDiff.removed} revoked</span>
                        <Badge bg={permissionDiff.totalChanges > 0 ? 'primary' : 'secondary'}>
                            {permissionDiff.totalChanges} modifications
                        </Badge>
                    </div>

                    {isAllFirmsMode ? (
                        <div className="mb-3">
                            <div className="p-2.5 mb-2 rounded border" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <span style={{ fontSize: '0.9rem' }}>🌐</span>
                                    <strong className="text-success" style={{ fontSize: '0.82rem' }}>
                                        Group Master Mode (✦ All Firms)
                                    </strong>
                                </div>
                                <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
                                    Select which firm(s) should receive this permission profile:
                                </p>
                            </div>

                            <div className="border rounded p-2 bg-white">
                                <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom">
                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.8rem' }}>
                                        Target Firms ({selectedTargetFirmIds.size} of {availableFirms.length} selected)
                                    </span>
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 text-decoration-none"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={selectAllTargetFirms}
                                        >
                                            Select All
                                        </button>
                                        <span className="text-muted small">|</span>
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 text-decoration-none text-muted"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={deselectAllTargetFirms}
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>

                                <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                                    {availableFirms.map((f) => {
                                        const isChecked = selectedTargetFirmIds.has(f.id);
                                        return (
                                            <div 
                                                key={f.id} 
                                                className={`d-flex align-items-center justify-content-between px-2.5 py-1.5 rounded border transition-all ${isChecked ? 'border-primary bg-primary-subtle' : 'border-light bg-light'}`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => toggleTargetFirmId(f.id)}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <Form.Check 
                                                        type="checkbox"
                                                        id={`target-firm-${f.id}`}
                                                        checked={isChecked}
                                                        onChange={() => {}} // Click handled by wrapper div
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <span className="fw-medium text-dark" style={{ fontSize: '0.8rem' }}>
                                                        {f.firmName || f.name}
                                                    </span>
                                                </div>
                                                <Badge bg="secondary" style={{ fontSize: '0.68rem' }}>
                                                    Firm #{f.id}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>

                                {selectedTargetFirmIds.size === 0 && (
                                    <Alert variant="warning" className="mt-2 mb-0 py-1 px-2" style={{ fontSize: '0.78rem' }}>
                                        ⚠️ Please select at least one firm to apply permissions.
                                    </Alert>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-2 mb-3 bg-light rounded border small d-flex align-items-center justify-content-between">
                            <span>
                                <strong>Target Firm:</strong> {activeFirm?.firmName || 'Selected Firm'}
                            </span>
                            <Badge bg="secondary">Firm #{selectedFirmId}</Badge>
                        </div>
                    )}

                    {selectedRole?.userCount > 0 ? (
                        <Alert variant="info" className="mb-0 py-2" style={{ fontSize: '0.8rem' }}>
                            <strong>⚠️ Blast Radius Notice:</strong> This change will immediately affect <strong>{selectedRole.userCount} active employee(s)</strong> currently assigned to this role.
                        </Alert>
                    ) : (
                        <p className="text-muted small mb-0">
                            No active users are currently assigned to this role.
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setShowConfirmSaveModal(false)}>
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleConfirmSave} 
                        disabled={isSaving || (isAllFirmsMode && selectedTargetFirmIds.size === 0)}
                    >
                        {isSaving ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" className="me-1" />
                                <span>Saving...</span>
                            </>
                        ) : isAllFirmsMode ? (
                            `Apply to ${selectedTargetFirmIds.size} Firm(s)`
                        ) : (
                            'Confirm & Save'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Create Custom Role Modal */}
            <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold" style={{ fontSize: '1rem' }}>Create Custom Role</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateRole}>
                    <Modal.Body style={{ fontSize: '0.85rem' }}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ fontSize: '0.8rem' }}>Role Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. Sales Executive, Quality Inspector"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                                autoFocus
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ fontSize: '0.8rem' }}>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Describe the responsibilities of this role..."
                                value={newRoleDesc}
                                onChange={(e) => setNewRoleDesc(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ fontSize: '0.8rem' }}>Superior / Parent Role</Form.Label>
                            <Form.Select
                                value={newRoleParentId}
                                onChange={(e) => setNewRoleParentId(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                            >
                                <option value="">-- No Direct Parent (Root Level) --</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} ({r.slug})
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                                Superiors can oversee, modify, and approve records created by this subordinate role.
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-1">
                            <Form.Check
                                type="checkbox"
                                id="create-role-independent"
                                label="Independent Compliance / Audit Role (Records are tamper-proof)"
                                checked={newRoleIsIndependent}
                                onChange={(e) => setNewRoleIsIndependent(e.target.checked)}
                                style={{ fontSize: '0.8rem' }}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" disabled={isCreatingRole}>
                            {isCreatingRole ? 'Creating...' : 'Create Role'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Edit Role Hierarchy Modal */}
            <Modal show={showRoleSettingsModal} onHide={() => setShowRoleSettingsModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold" style={{ fontSize: '1rem' }}>
                        Configure Hierarchy: {selectedRole?.name}
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpdateRoleHierarchy}>
                    <Modal.Body style={{ fontSize: '0.85rem' }}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold" style={{ fontSize: '0.8rem' }}>Superior / Parent Role in Ladder</Form.Label>
                            <Form.Select
                                value={editRoleParentId}
                                onChange={(e) => setEditRoleParentId(e.target.value)}
                                style={{ fontSize: '0.82rem' }}
                                disabled={selectedRole?.slug === 'super-admin'}
                            >
                                <option value="">-- No Direct Parent (Root Level) --</option>
                                {roles.filter(r => r.id !== selectedRole?.id).map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} ({r.slug})
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Text className="text-muted" style={{ fontSize: '0.72rem' }}>
                                Defines who oversees and approves this role's actions in the company ladder.
                            </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-1">
                            <Form.Check
                                type="checkbox"
                                id="edit-role-independent"
                                label="Independent Compliance / Audit Role (Findings cannot be modified by superiors)"
                                checked={editRoleIsIndependent}
                                onChange={(e) => setEditRoleIsIndependent(e.target.checked)}
                                style={{ fontSize: '0.8rem' }}
                                disabled={selectedRole?.slug === 'super-admin'}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" size="sm" onClick={() => setShowRoleSettingsModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" type="submit" disabled={isUpdatingRoleDetails}>
                            {isUpdatingRoleDetails ? 'Saving...' : 'Update Hierarchy'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Role Confirmation Modal */}
            <Modal show={!!roleToDelete} onHide={() => setRoleToDelete(null)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-danger fw-bold" style={{ fontSize: '1rem' }}>Delete Role</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ fontSize: '0.85rem' }}>
                    <p className="mb-2">
                        Are you sure you want to permanently delete the custom role <strong>{roleToDelete?.name}</strong>?
                    </p>
                    <p className="text-muted small mb-0">
                        This action cannot be undone. All assigned permissions for this role will be removed.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" size="sm" onClick={() => setRoleToDelete(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDeleteRole} disabled={isDeletingRole}>
                        {isDeletingRole ? 'Deleting...' : 'Delete Role'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default RolesPermissionStudio;
