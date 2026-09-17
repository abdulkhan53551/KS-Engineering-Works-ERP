import React, { useState, useMemo } from 'react';
import { Dropdown, Badge, Form } from 'react-bootstrap';
import { useSelector, useDispatch, batch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FaBuilding, FaMapMarkerAlt, FaSearch, FaCheck, FaTimes, FaCog } from 'react-icons/fa';
import { setActiveFirm, setActiveBranch } from '../../../../store/firm.slice';
import './EntitySwitcher.css';

const EntitySwitcher = () => {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const { activeFirm, activeBranch, userFirms = [] } = useSelector((state) => state.firmReducer || {});
    const currentUser = useSelector((state) => state.authReducer?.user);
    const isSuperAdmin = currentUser?.role === 'super-admin' || currentUser?.roleId === 1;

    const [firmSearch, setFirmSearch] = useState('');
    const [branchSearch, setBranchSearch] = useState('');

    const handleFirmChange = (firm) => {
        if (firm.id === activeFirm?.id) return;

        // Invalidate and cancel all in-flight queries
        queryClient.cancelQueries();
        queryClient.clear();

        batch(() => {
            dispatch(setActiveFirm(firm));

            if (firm.id === 'all') {
                dispatch(setActiveBranch(null));
            } else {
                // Auto-select head office or first branch of the new firm
                const defaultBranch = firm.branches?.find(b => b.isHeadOffice) || firm.branches?.[0] || null;
                dispatch(setActiveBranch(defaultBranch));
            }
        });
        setFirmSearch('');
    };

    const handleBranchChange = (branch) => {
        const currentBranchId = activeBranch?.id || null;
        const newBranchId = branch?.id || null;
        if (currentBranchId === newBranchId) return;

        queryClient.cancelQueries();
        queryClient.clear();

        dispatch(setActiveBranch(branch));
        setBranchSearch('');
    };

    const isConsolidatedMode = activeFirm?.id === 'all';
    const availableBranches = isConsolidatedMode ? [] : (activeFirm?.branches || []);

    const filteredFirms = useMemo(() => {
        if (!firmSearch.trim()) return userFirms;
        const term = firmSearch.toLowerCase().trim();
        return userFirms.filter(f =>
            (f.firmName && f.firmName.toLowerCase().includes(term)) ||
            (f.tradeName && f.tradeName.toLowerCase().includes(term))
        );
    }, [userFirms, firmSearch]);

    const filteredBranches = useMemo(() => {
        if (!branchSearch.trim()) return availableBranches;
        const term = branchSearch.toLowerCase().trim();
        return availableBranches.filter(b =>
            (b.branchName && b.branchName.toLowerCase().includes(term)) ||
            (b.branchCode && b.branchCode.toLowerCase().includes(term))
        );
    }, [availableBranches, branchSearch]);

    return (
        <div className="d-flex align-items-center gap-2 me-lg-3 my-2 my-lg-0 entity-switcher-container">
            {/* Firm Selector Dropdown */}
            <Dropdown className="firm-dropdown">
                <Dropdown.Toggle
                    id="firm-switcher-toggle"
                    className="entity-switcher-btn firm-toggle d-flex align-items-center gap-2 rounded-pill text-truncate"
                    style={{ maxWidth: '250px' }}
                >
                    <FaBuilding size={13} className="text-primary flex-shrink-0" />
                    <span className="text-truncate">
                        {isConsolidatedMode ? '✦ All Firms (Consolidated)' : (activeFirm?.firmName || 'Select Firm')}
                    </span>
                </Dropdown.Toggle>

                <Dropdown.Menu className="entity-dropdown-menu shadow-lg border-0" style={{ minWidth: '270px' }}>
                    <div className="entity-dropdown-header d-flex justify-content-between align-items-center">
                        <span>Enterprise Firm Scope</span>
                        {userFirms.length > 0 && <span className="text-muted small">{userFirms.length} Total</span>}
                    </div>

                    {/* Consolidated All Firms Mode for Super Admin */}
                    {isSuperAdmin && (
                        <>
                            <Dropdown.Item
                                onClick={() => handleFirmChange({
                                    id: 'all',
                                    firmName: 'All Firms (Consolidated Group)',
                                    code: 'ALL',
                                    branches: []
                                })}
                                className={`entity-dropdown-item d-flex align-items-center justify-content-between ${isConsolidatedMode ? 'active' : ''}`}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <span className={isConsolidatedMode ? 'text-white' : 'text-warning'}>✦</span>
                                    <div>
                                        <div className="fw-semibold">All Firms (Consolidated Group)</div>
                                        <small className={isConsolidatedMode ? 'text-white-50' : 'text-muted'}>
                                            Executive group-wide overview
                                        </small>
                                    </div>
                                </div>
                                {isConsolidatedMode && <FaCheck size={11} className="text-white flex-shrink-0 ms-2" />}
                            </Dropdown.Item>
                            <Dropdown.Divider className="my-1" />
                        </>
                    )}

                    {userFirms.length > 4 && (
                        <div className="px-2 pt-2 pb-1">
                            <div className="position-relative">
                                <FaSearch size={11} className="position-absolute text-muted" style={{ left: '9px', top: '9px' }} />
                                <Form.Control
                                    type="text"
                                    size="sm"
                                    placeholder="Filter firms..."
                                    value={firmSearch}
                                    onChange={(e) => setFirmSearch(e.target.value)}
                                    className="entity-search-input"
                                />
                            </div>
                        </div>
                    )}

                    {filteredFirms.length > 0 ? (
                        filteredFirms.map((f) => {
                            const isSelected = f.id === activeFirm?.id;
                            return (
                                <Dropdown.Item
                                    key={f.id}
                                    onClick={() => handleFirmChange(f)}
                                    className={`entity-dropdown-item d-flex align-items-center justify-content-between ${isSelected ? 'active' : ''}`}
                                >
                                    <div className="text-truncate me-2">
                                        <div className="fw-semibold text-truncate">{f.firmName}</div>
                                        {f.tradeName && f.tradeName !== f.firmName && (
                                            <small className={isSelected ? 'text-white-50' : 'text-muted'}>
                                                {f.tradeName}
                                            </small>
                                        )}
                                    </div>
                                    {isSelected && <FaCheck size={11} className="text-white flex-shrink-0 ms-2" />}
                                </Dropdown.Item>
                            );
                        })
                    ) : (
                        <div className="px-3 py-3 text-muted small text-center">
                            {firmSearch ? 'No matching firms' : 'No firms available'}
                        </div>
                    )}

                    {isSuperAdmin && (
                        <>
                            <Dropdown.Divider className="my-1" />
                            <Dropdown.Item as={Link} to="/firms" className="entity-dropdown-item text-primary fw-semibold small d-flex align-items-center gap-2">
                                <FaCog size={12} />
                                <span>Firm Management Directory</span>
                            </Dropdown.Item>
                        </>
                    )}
                </Dropdown.Menu>
            </Dropdown>

            {/* Branch Selector Dropdown */}
            <Dropdown className="branch-dropdown">
                <Dropdown.Toggle
                    id="branch-switcher-toggle"
                    className="entity-switcher-btn branch-toggle d-flex align-items-center gap-2 rounded-pill text-truncate"
                    style={{ maxWidth: '240px' }}
                >
                    <FaMapMarkerAlt size={13} className="text-danger flex-shrink-0" />
                    <span className="text-truncate">
                        {isConsolidatedMode ? 'All Branches (Across Firms)' : (activeBranch ? activeBranch.branchName : 'All Branches')}
                    </span>
                    {!isConsolidatedMode && activeBranch?.isHeadOffice && (
                        <Badge bg="success" pill style={{ fontSize: '0.62rem', padding: '0.2rem 0.45rem' }}>HO</Badge>
                    )}
                </Dropdown.Toggle>

                <Dropdown.Menu className="entity-dropdown-menu shadow-lg border-0" style={{ minWidth: '260px' }}>
                    <div className="entity-dropdown-header d-flex justify-content-between align-items-center">
                        <span>Facility / Branch Location</span>
                        {!isConsolidatedMode && availableBranches.length > 0 && (
                            <span className="text-muted small">{availableBranches.length} Sites</span>
                        )}
                    </div>

                    {isConsolidatedMode ? (
                        <div className="px-3 py-3 text-muted small text-center">
                            <div className="fw-semibold text-dark mb-1">Group-Wide View Active</div>
                            All branches across all enterprises are included. Select an individual firm to narrow down to a branch.
                        </div>
                    ) : (
                        <>
                            {availableBranches.length > 4 && (
                                <div className="px-2 pt-2 pb-1">
                                    <div className="position-relative">
                                        <FaSearch size={11} className="position-absolute text-muted" style={{ left: '9px', top: '9px' }} />
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            placeholder="Filter branches..."
                                            value={branchSearch}
                                            onChange={(e) => setBranchSearch(e.target.value)}
                                            className="entity-search-input"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* All Branches Option */}
                            <Dropdown.Item
                                onClick={() => handleBranchChange(null)}
                                className={`entity-dropdown-item d-flex align-items-center justify-content-between ${!activeBranch ? 'active' : ''}`}
                            >
                                <div className="d-flex align-items-center gap-2">
                                    <span>✦</span>
                                    <span className="fw-semibold">All Branches (Consolidated)</span>
                                </div>
                                {!activeBranch && <FaCheck size={11} className="text-white flex-shrink-0 ms-2" />}
                            </Dropdown.Item>

                            <Dropdown.Divider className="my-1" />

                            {filteredBranches.length > 0 ? (
                                filteredBranches.map((b) => {
                                    const isSelected = b.id === activeBranch?.id;
                                    return (
                                        <Dropdown.Item
                                            key={b.id}
                                            onClick={() => handleBranchChange(b)}
                                            className={`entity-dropdown-item d-flex align-items-center justify-content-between ${isSelected ? 'active' : ''}`}
                                        >
                                            <div className="text-truncate me-2">
                                                <div className="d-flex align-items-center gap-1.5">
                                                    <span className="fw-semibold text-truncate">{b.branchName}</span>
                                                    {b.isHeadOffice && (
                                                        <Badge bg={isSelected ? 'light' : 'success'} text={isSelected ? 'dark' : 'white'} pill style={{ fontSize: '0.6rem' }}>
                                                            HO
                                                        </Badge>
                                                    )}
                                                </div>
                                                <small className={isSelected ? 'text-white-50' : 'text-muted'}>
                                                    Code: {b.branchCode}
                                                </small>
                                            </div>
                                            {isSelected && <FaCheck size={11} className="text-white flex-shrink-0 ms-2" />}
                                        </Dropdown.Item>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-2 text-muted small text-center">
                                    {availableBranches.length === 0 ? 'No branches registered' : 'No matching branches'}
                                </div>
                            )}
                        </>
                    )}
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default EntitySwitcher;

