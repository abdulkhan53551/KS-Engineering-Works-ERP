import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Table, Button, Form, InputGroup, OverlayTrigger, Tooltip, Badge, Image, FormCheck, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import { FaPen, FaTrash, FaEye, FaPlus, FaSearch, FaTimes, FaSort, FaSortAlphaUpAlt, FaSortAlphaDownAlt, FaPhoneAlt, FaEnvelope, FaCopy, FaCheck, FaUndo, FaExclamationTriangle, FaSyncAlt, FaBookOpen, FaUsers } from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import PaginationBar from '../../../components/PaginationBar';
import {
    useBulkDeleteParties,
    useBulkRestoreParties,
    useDeleteParty,
    useParties,
    usePartyPagination,
    useRestoreParty
} from '../hooks/usePartyApi';
import PartyStatusBadge from '../components/PartyStatusBadge';
import GstBadge from '../components/GstBadge';
import PartyDetailsDrawer from '../components/PartyDetailsDrawer';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import { toast } from 'react-toastify';
import moment from 'moment';
import { useListPagination, useRowSelection } from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';
import TableActionMenu, { useTableActionMenu } from '../../../components/common/TableActionMenu';

// Modern unified ERP table styling for 60fps/120fps GPU performance
import '../../invoice/pages/invoice-list-modern.scss';

/**
 * Extract 2-letter initials for lightweight CSS avatar
 */
const getPartyInitials = (party) => {
    const name = party?.displayName || party?.legalName || party?.partyCode || 'P';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
};

/**
 * Format date string safely to DD/MM/YYYY, hh:mm A
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const m = moment(dateStr);
        if (!m.isValid()) return '—';
        return m.format('DD/MM/YYYY, hh:mm A');
    } catch {
        return '—';
    }
};

const PartyList = () => {
    // 1. Trash Actions Hook
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    } = useTrashActions({ entityName: 'Party', pluralEntityName: 'Parties' });

    // 2. Extra Filters & Sort State
    const [statusFilter, setStatusFilter] = useState('');
    const [gstFilter, setGstFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

    // Drawer state
    const [selectedParty, setSelectedParty] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Copy indicator state for table row cells
    const [copiedKey, setCopiedKey] = useState(null);

    // 3. Pagination & Search Hook
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        search: searchTerm,
        debouncedSearch,
        handleSearch,
        clearSearch: handleClearSearch,
        isTrash,
        handlePageChange,
        handlePageSizeChange,
        handleTabChange: handlePaginationTabChange
    } = useListPagination({
        initialPageSize: 10
    });

    // Single-instance Action Menu state & handlers (prevents multi-menu stacking & clipping via Portal)
    const {
        activeMenu: activeActionMenu,
        toggleMenu,
        closeMenu,
        isOpen: isActionMenuOpen,
        tableWrapperProps
    } = useTableActionMenu([page, pageSize, debouncedSearch, statusFilter, gstFilter, isTrash]);

    // Queries & Mutations
    const queryParams = {
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        gstRegistered: gstFilter,
        trash: isTrash
    };

    const {
        data: parties = [],
        isLoading: isPartiesLoading,
        isFetching: isPartiesFetching,
        isError,
        refetch: refetchParties
    } = useParties(queryParams);

    const {
        data: pagination = {},
        isLoading: isPaginationLoading,
        isFetching: isPaginationFetching,
        refetch: refetchPagination
    } = usePartyPagination(queryParams);

    const isFetching = isPartiesFetching || isPaginationFetching;
    const isLoading = isPartiesLoading || isPaginationLoading;

    const handleRefresh = () => {
        refetchParties();
        refetchPagination();
    };

    const { mutate: deleteParty, isPending: isDeleting } = useDeleteParty();
    const { mutate: restoreParty } = useRestoreParty();
    const { mutate: bulkDeleteParties } = useBulkDeleteParties();
    const { mutate: bulkRestoreParties } = useBulkRestoreParties();

    const { total = 0, totalPages = 1, pageStart = 0, pageEnd = 0 } = pagination;

    // Handle column sorting
    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? (
                <FaSortAlphaUpAlt className="text-primary ms-1" size={10} />
            ) : (
                <FaSortAlphaDownAlt className="text-primary ms-1" size={10} />
            );
        }
        return <FaSort className="text-muted ms-1 opacity-25" size={10} />;
    };

    // Client-side sorted and filtered data fallback
    const displayData = useMemo(() => {
        let items = [...parties];

        // Search filtering
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            items = items.filter((p) => {
                const idStr = String(p.id || '');
                const partyCode = (p.partyCode || '').toLowerCase();
                const legalName = (p.legalName || '').toLowerCase();
                const displayName = (p.displayName || '').toLowerCase();
                const gstin = (p.gstin || '').toLowerCase();
                const pan = (p.panNumber || '').toLowerCase();
                const mobile = (p.mobile || '').toLowerCase();
                const email = (p.email || '').toLowerCase();
                const createdBy = (p.createdBy || '').toLowerCase();

                return (
                    idStr.includes(term) ||
                    partyCode.includes(term) ||
                    legalName.includes(term) ||
                    displayName.includes(term) ||
                    gstin.includes(term) ||
                    pan.includes(term) ||
                    mobile.includes(term) ||
                    email.includes(term) ||
                    createdBy.includes(term)
                );
            });
        }

        // Status filter
        if (statusFilter) {
            items = items.filter((p) => (p.status || '').toUpperCase() === statusFilter.toUpperCase());
        }

        // GST filter
        if (gstFilter !== '') {
            const isGst = gstFilter === 'true';
            items = items.filter((p) => Boolean(p.gstRegistered) === isGst);
        }

        // Sorting
        if (sortConfig.key) {
            items.sort((a, b) => {
                let aVal = a[sortConfig.key] ?? '';
                let bVal = b[sortConfig.key] ?? '';

                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }

                if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
                    const dateA = new Date(aVal).getTime() || 0;
                    const dateB = new Date(bVal).getTime() || 0;
                    return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
                }

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [parties, searchTerm, statusFilter, gstFilter, sortConfig]);

    // Row Selection Hook directly operates on displayData
    const {
        selectedIds,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount
    } = useRowSelection({
        items: displayData,
        idKey: 'id'
    });

    const handleTabChange = useCallback((trashState) => {
        handlePaginationTabChange(trashState);
        handleDeselectAll();
    }, [handlePaginationTabChange, handleDeselectAll]);

    // Handle Quick View Drawer
    const handleQuickView = (party) => {
        setSelectedParty(party);
        setDrawerOpen(true);
    };



    // Copy to clipboard helper for table cells
    const handleCopy = (text, keyName, label) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(keyName);
        toast.info(`${label} copied!`, { autoClose: 1500 });
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Clear all filters
    const handleClearFilters = () => {
        handleClearSearch();
        setStatusFilter('');
        setGstFilter('');
        setPage(1);
    };

    const hasActiveFilters = Boolean(searchTerm || statusFilter || gstFilter !== '');

    return (
        <>
            <Row>
                <Col sm="12">
                    <Card className="shadow-sm border-0">
                        {/* 1. Header with Title Icon, Subtitle, TrashTabFilter and Add Button */}
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-3 px-4 bg-white border-bottom">
                            <div className="header-title d-flex align-items-center gap-3">
                                <div className="invoice-title-icon-pill">
                                    <FaUsers size={18} />
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h4 className="card-title mb-0 fw-bold text-dark">Party Directory</h4>
                                        {!isLoading && total > 0 && (
                                            <Badge bg="soft-primary" className="text-primary fw-semibold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
                                                {total} Total
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                                        Customer & vendor master records, GST compliance, contacts & account ledgers
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2.5 flex-wrap">
                                <TrashTabFilter
                                    isTrash={isTrash}
                                    onTabChange={handleTabChange}
                                    trashLabel="Recycle Bin"
                                />
                                {!isTrash && (
                                    <Button
                                        as={Link}
                                        to="/parties/create"
                                        variant="primary"
                                        className="d-flex align-items-center gap-1.5 px-3 py-2 shadow-sm fw-semibold"
                                        style={{ borderRadius: '7px', fontSize: '0.82rem' }}
                                    >
                                        <FaPlus size={11} />
                                        <span>Add Party</span>
                                    </Button>
                                )}
                            </div>
                        </Card.Header>

                        {/* Bulk Action Bar */}
                        <BulkActionBar
                            selectedCount={selectedCount}
                            isTrash={isTrash}
                            onBulkDelete={() => confirmBulkSoftDelete(selectedCount, () => {
                                bulkDeleteParties({ ids: selectedIds, isPermanentDelete: false });
                                handleDeselectAll();
                            })}
                            onBulkRestore={() => confirmBulkRestore(selectedCount, () => {
                                bulkRestoreParties({ ids: selectedIds });
                                handleDeselectAll();
                            })}
                            onBulkPermanentDelete={() => confirmBulkPermanentDelete(selectedCount, () => {
                                bulkDeleteParties({ ids: selectedIds, isPermanentDelete: true });
                                handleDeselectAll();
                            })}
                            onDeselectAll={handleDeselectAll}
                        />

                        <Card.Body className="px-0">
                            {/* Loader Indicator for background refetches */}
                            <PageLoader loading={isPartiesFetching && !isLoading} />

                            {/* 2. Modern Filter Ribbon */}
                            <div className="px-4 py-3 bg-white border-bottom">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2.5">
                                    {/* Left Side: Modern Segmented Status Tabs */}
                                    {!isTrash ? (
                                        <div className="segmented-status-tabs">
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${!statusFilter ? 'active' : ''}`}
                                                onClick={() => { setStatusFilter(''); setPage(1); }}
                                            >
                                                All
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
                                                onClick={() => { setStatusFilter('ACTIVE'); setPage(1); }}
                                            >
                                                Active
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
                                                onClick={() => { setStatusFilter('INACTIVE'); setPage(1); }}
                                            >
                                                Inactive
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="d-flex align-items-center gap-2 text-danger small fw-semibold">
                                            <FaTrash size={12} />
                                            <span>Recycle Bin (Deleted Records)</span>
                                        </div>
                                    )}

                                    {/* Right Side: Search & Filter Controls Group */}
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        {/* Search Input */}
                                        <InputGroup size="sm" style={{ width: '250px' }} className="shadow-none">
                                            <InputGroup.Text className="bg-white border-end-0 text-muted ps-2.5 pe-1" style={{ borderTopLeftRadius: '7px', borderBottomLeftRadius: '7px', height: '33px' }}>
                                                <FaSearch size={11} />
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Search parties..."
                                                value={searchTerm}
                                                onChange={handleSearch}
                                                className="border-start-0 ps-1"
                                                style={{ borderTopRightRadius: searchTerm ? '0' : '7px', borderBottomRightRadius: searchTerm ? '0' : '7px', height: '33px', fontSize: '0.82rem' }}
                                            />
                                            {searchTerm && (
                                                <Button
                                                    variant="outline-secondary"
                                                    className="border-start-0 bg-white text-muted px-2"
                                                    style={{ borderTopRightRadius: '7px', borderBottomRightRadius: '7px', height: '33px' }}
                                                    onClick={handleClearSearch}
                                                >
                                                    <FaTimes size={10} />
                                                </Button>
                                            )}
                                        </InputGroup>

                                        {/* GST Filter */}
                                        <Dropdown>
                                            <Dropdown.Toggle
                                                size="sm"
                                                variant="light"
                                                className={`border d-flex align-items-center gap-1.5 shadow-none ${gstFilter !== '' ? 'border-primary text-primary fw-semibold bg-soft-primary' : 'text-secondary bg-white'}`}
                                                style={{ fontSize: '0.82rem', borderRadius: '7px', height: '33px' }}
                                            >
                                                <span>{gstFilter === 'true' ? 'GST Registered' : gstFilter === 'false' ? 'Unregistered' : 'All GST'}</span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="shadow-lg border-0 py-1" style={{ minWidth: '160px', zIndex: 1060 }}>
                                                <Dropdown.Item active={gstFilter === ''} onClick={() => { setGstFilter(''); setPage(1); }}>
                                                    All GST
                                                </Dropdown.Item>
                                                <Dropdown.Item active={gstFilter === 'true'} onClick={() => { setGstFilter('true'); setPage(1); }}>
                                                    Registered
                                                </Dropdown.Item>
                                                <Dropdown.Item active={gstFilter === 'false'} onClick={() => { setGstFilter('false'); setPage(1); }}>
                                                    Unregistered
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>

                                        {/* Refresh Button */}
                                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-refresh-parties">Refresh parties</Tooltip>}>
                                            <button
                                                type="button"
                                                className={`btn-filter-refresh ${isFetching ? 'is-refreshing' : ''}`}
                                                onClick={handleRefresh}
                                                disabled={isFetching}
                                                aria-label="Refresh parties"
                                                title="Refresh parties"
                                            >
                                                <FaSyncAlt size={14} />
                                            </button>
                                        </OverlayTrigger>

                                        {/* Reset Filters */}
                                        {hasActiveFilters && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={handleClearFilters}
                                                className="d-flex align-items-center gap-1.5 px-2.5 shadow-none"
                                                style={{ height: '33px', borderRadius: '7px', fontSize: '0.8rem' }}
                                                title="Reset all filters"
                                            >
                                                <FaUndo size={10} />
                                                <span>Reset</span>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Table Content with Modern Isolated-Row GPU Styling (Zero CPU spike on hover) */}
                            <div
                                className={`invoice-table-wrapper table-responsive position-relative ${isFetching && !isLoading ? 'is-fetching-data' : ''}`}
                                {...tableWrapperProps}
                            >
                                {isFetching && !isLoading && (
                                    <div className="table-progress-bar">
                                        <div className="table-progress-line" />
                                    </div>
                                )}
                                <Table id="party-list-table" className="invoice-modern-table align-middle mb-0" hover role="grid">
                                    <thead>
                                        <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            <th style={{ width: '40px' }} className="text-center">
                                                <FormCheck
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(input) => {
                                                        if (input) input.indeterminate = isIndeterminate;
                                                    }}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th
                                                className="text-center cursor-pointer user-select-none py-2"
                                                style={{ width: '48px', minWidth: '48px', maxWidth: '52px', padding: '0.45rem 0.3rem' }}
                                                onClick={() => handleSort('id')}
                                            >
                                                #ID {renderSortIcon('id')}
                                            </th>
                                            <th
                                                className="text-center user-select-none py-2"
                                                style={{ width: '55px', minWidth: '55px', padding: '0.45rem 0.3rem' }}
                                            >
                                                Logo
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ width: '100px', minWidth: '100px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('partyCode')}
                                            >
                                                Party Code {renderSortIcon('partyCode')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '190px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('displayName')}
                                            >
                                                Party Name {renderSortIcon('displayName')}
                                            </th>
                                            <th className="py-2" style={{ minWidth: '150px', padding: '0.45rem 0.5rem' }}>
                                                Contact
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '140px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('gstin')}
                                            >
                                                GST No. {renderSortIcon('gstin')}
                                            </th>
                                            <th className="py-2" style={{ minWidth: '110px', padding: '0.45rem 0.5rem' }}>
                                                PAN
                                            </th>
                                            <th
                                                className="text-center cursor-pointer user-select-none py-2"
                                                style={{ width: '90px', minWidth: '90px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('status')}
                                            >
                                                Status {renderSortIcon('status')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('createdBy')}
                                            >
                                                Added By {renderSortIcon('createdBy')}
                                            </th>
                                            {isTrash ? (
                                                <>
                                                    <th className="py-2" style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}>
                                                        Deleted Date
                                                    </th>
                                                    <th className="py-2" style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}>
                                                        Deleted By
                                                    </th>
                                                </>
                                            ) : (
                                                <th
                                                    className="cursor-pointer user-select-none py-2"
                                                    style={{ minWidth: '165px', padding: '0.45rem 0.5rem' }}
                                                    onClick={() => handleSort('updatedAt')}
                                                >
                                                    Last Modified {renderSortIcon('updatedAt')}
                                                </th>
                                            )}
                                            <th className="text-center py-2" style={{ width: '115px', minWidth: '115px', padding: '0.45rem 0.5rem' }}>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '0.86rem' }}>
                                        {/* Loading Skeleton */}
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, idx) => (
                                                <tr key={`skeleton-${idx}`}>
                                                    <td className="text-center py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-6 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-6 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder rounded-circle" style={{ width: '32px', height: '32px', display: 'inline-block' }} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-8 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-10 mb-1 rounded d-block" />
                                                            <span className="placeholder col-6 rounded d-block" style={{ height: '8px' }} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-9 rounded d-block mb-1" />
                                                            <span className="placeholder col-7 rounded d-block" style={{ height: '8px' }} />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-8 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-7 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-6 rounded-pill" />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-8 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-7 rounded" />
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-2">
                                                        <div className="placeholder-glow">
                                                            <span className="placeholder col-8 rounded" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : isError ? (
                                            /* Error State */
                                            <tr>
                                                <td colSpan={isTrash ? 13 : 12} className="text-center py-5">
                                                    <div className="text-danger mb-2">
                                                        Failed to load parties. Please try again.
                                                    </div>
                                                    <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
                                                        Retry
                                                    </Button>
                                                </td>
                                            </tr>
                                        ) : displayData.length === 0 ? (
                                            /* Empty State */
                                            <tr>
                                                <td colSpan={isTrash ? 13 : 12} className="text-center py-5">
                                                    <div className="my-3 text-muted">
                                                        <div className="mb-2" style={{ fontSize: '2rem' }}>📋</div>
                                                        <h6 className="fw-semibold text-dark">
                                                            {isTrash ? 'Recycle Bin is Empty' : 'No Parties Found'}
                                                        </h6>
                                                        <p className="text-muted small mb-3">
                                                            {isTrash
                                                                ? 'There are no deleted parties in the recycle bin.'
                                                                : hasActiveFilters
                                                                    ? 'No parties match your search or filter criteria.'
                                                                    : 'Get started by creating your first party profile.'}
                                                        </p>
                                                        {!isTrash && (
                                                            hasActiveFilters ? (
                                                                <Button variant="outline-primary" size="sm" onClick={handleClearFilters}>
                                                                    Clear Filters
                                                                </Button>
                                                            ) : (
                                                                <Link to="/parties/create" className="btn btn-primary btn-sm">
                                                                    Add New Party
                                                                </Link>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            /* Data Rows */
                                            displayData.map((party) => {
                                                const hasDifferentLegalName =
                                                    party.legalName &&
                                                    party.displayName &&
                                                    party.legalName.trim().toLowerCase() !== party.displayName.trim().toLowerCase();

                                                return (
                                                    <tr key={party.id} className={selectedIds.includes(party.id) ? 'table-active' : ''}>
                                                        {/* Checkbox Column */}
                                                        <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                            <FormCheck
                                                                type="checkbox"
                                                                checked={selectedIds.includes(party.id)}
                                                                onChange={() => handleSelectRow(party.id)}
                                                            />
                                                        </td>

                                                        {/* 1. #ID Column (Lesser width) */}
                                                        <td className="text-center fw-medium text-muted" style={{ padding: '0.45rem 0.3rem' }}>
                                                            {party.id}
                                                        </td>

                                                        {/* 2. Logo / Avatar Column (High-Performance CSS Initials) */}
                                                        <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                            <div
                                                                className="rounded d-inline-flex align-items-center justify-content-center overflow-hidden bg-soft-primary"
                                                                style={{
                                                                    width: '32px',
                                                                    height: '32px',
                                                                    border: '1px solid rgba(58, 87, 232, 0.2)',
                                                                    flexShrink: 0
                                                                }}
                                                            >
                                                                {party.logoUrl || party.logo ? (
                                                                    <img
                                                                        src={party.logoUrl || party.logo}
                                                                        alt={party.displayName || 'Party Logo'}
                                                                        loading="lazy"
                                                                        decoding="async"
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            if (e.currentTarget.nextElementSibling) {
                                                                                e.currentTarget.nextElementSibling.style.display = 'flex';
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <span
                                                                    className="fw-bold text-primary"
                                                                    style={{
                                                                        display: (party.logoUrl || party.logo) ? 'none' : 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '0.74rem',
                                                                        letterSpacing: '0.02em',
                                                                        lineHeight: 1
                                                                    }}
                                                                >
                                                                    {getPartyInitials(party)}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* 3. Party Code */}
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            <Badge
                                                                bg="soft-primary"
                                                                className="text-primary font-monospace fw-semibold px-2 py-1"
                                                                style={{ fontSize: '0.78rem' }}
                                                            >
                                                                {party.partyCode || '—'}
                                                            </Badge>
                                                        </td>

                                                        {/* 4. Party Name (Display & Legal) */}
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            <div className="d-flex flex-column">
                                                                <span className="fw-semibold text-dark">
                                                                    {party.displayName || party.legalName || '—'}
                                                                </span>
                                                                {hasDifferentLegalName && (
                                                                    <span
                                                                        className="text-muted small text-truncate"
                                                                        style={{ maxWidth: '240px', fontSize: '0.76rem' }}
                                                                        title={party.legalName}
                                                                    >
                                                                        {party.legalName}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* 5. Contact (Mobile & Email) */}
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            <div className="d-flex flex-column gap-1">
                                                                {party.mobile ? (
                                                                    <div className="d-flex align-items-center gap-1.5">
                                                                        <FaPhoneAlt size={10} className="text-muted" />
                                                                        <a
                                                                            href={`tel:${party.mobile}`}
                                                                            className="text-dark text-decoration-none hover-primary small font-monospace"
                                                                        >
                                                                            {party.mobile}
                                                                        </a>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleCopy(party.mobile, `phone-${party.id}`, 'Mobile')}
                                                                            className="btn btn-xs btn-link p-0 text-muted hover-primary ms-1"
                                                                            style={{ border: 'none', background: 'transparent' }}
                                                                        >
                                                                            {copiedKey === `phone-${party.id}` ? (
                                                                                <FaCheck size={10} className="text-success" />
                                                                            ) : (
                                                                                <FaCopy size={10} />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted small">—</span>
                                                                )}

                                                                {party.email && (
                                                                    <div className="d-flex align-items-center gap-1.5">
                                                                        <FaEnvelope size={10} className="text-muted" />
                                                                        <a
                                                                            href={`mailto:${party.email}`}
                                                                            className="text-muted text-decoration-none hover-primary small text-truncate"
                                                                            style={{ maxWidth: '160px', fontSize: '0.78rem' }}
                                                                            title={party.email}
                                                                        >
                                                                            {party.email}
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* 6. GSTIN & Status */}
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            <GstBadge
                                                                gstRegistered={party.gstRegistered}
                                                                gstin={party.gstin}
                                                            />
                                                        </td>

                                                        {/* 7. PAN */}
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            {party.panNumber ? (
                                                                <div className="d-inline-flex align-items-center gap-1">
                                                                    <span className="font-monospace fw-medium text-dark small">
                                                                        {party.panNumber}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopy(party.panNumber, `pan-${party.id}`, 'PAN')}
                                                                        className="btn btn-xs btn-link p-0 text-muted hover-primary"
                                                                        style={{ border: 'none', background: 'transparent' }}
                                                                    >
                                                                        {copiedKey === `pan-${party.id}` ? (
                                                                            <FaCheck size={10} className="text-success" />
                                                                        ) : (
                                                                            <FaCopy size={10} />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted small">—</span>
                                                            )}
                                                        </td>

                                                        {/* 8. Status */}
                                                        <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                            <PartyStatusBadge status={party.status} />
                                                        </td>

                                                        {/* 9. Added By */}
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            <span className="text-dark small">
                                                                {party.createdBy || '—'}
                                                            </span>
                                                        </td>

                                                        {/* 10. Last Modified or Deleted Info */}
                                                        {isTrash ? (
                                                            <>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                    <span className="text-muted small font-monospace">
                                                                        {party.deletedAt ? moment(party.deletedAt).format('DD/MM/YYYY hh:mm A') : '—'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                    <span className="text-dark small">
                                                                        {party.deletedBy || '—'}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                <span className="text-muted small font-monospace">
                                                                    {formatDate(party.updatedAt || party.createdAt)}
                                                                </span>
                                                            </td>
                                                        )}

                                                        {/* 11. Action Buttons */}
                                                        <td className="text-center" style={{ padding: '0.65rem 0.5rem' }}>
                                                            <div className="action-btn-group">
                                                                {!isTrash ? (
                                                                    <>
                                                                        {/* Primary Action: Quick View */}
                                                                        <Button
                                                                            variant="light"
                                                                            size="sm"
                                                                            className="btn-action-primary-pdf"
                                                                            onClick={() => handleQuickView(party)}
                                                                            title="Quick View Party Details"
                                                                        >
                                                                            <FaEye size={11} className="text-secondary" />
                                                                        </Button>

                                                                        {/* Secondary Actions 3-Dots Menu */}
                                                                        <TableActionMenu.Trigger
                                                                            isActive={isActionMenuOpen(party.id)}
                                                                            id={`party-actions-${party.id}`}
                                                                            onClick={(e) => toggleMenu(party.id, party, e.currentTarget)}
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <div className="d-flex align-items-center gap-1">
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="btn-action-trash text-success"
                                                                            onClick={() => confirmRestore(party.displayName || party.legalName || party.partyCode, () => restoreParty(party.id))}
                                                                            title="Restore Party"
                                                                        >
                                                                            <FaUndo size={10} />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            className="btn-action-trash text-danger"
                                                                            onClick={() => confirmPermanentDelete(party.displayName || party.legalName || party.partyCode, () => deleteParty({ id: party.id, isPermanentDelete: true }))}
                                                                            title="Delete Permanently"
                                                                        >
                                                                            <FaExclamationTriangle size={10} />
                                                                        </Button>
                                                                    </div>
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

                            {/* 4. Modern Pagination Footer with Rows Per Page */}
                            {!isLoading && total > 0 && (
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 py-3 px-4 border-top">
                                    <div className="d-flex align-items-center gap-3 text-muted small">
                                        <span>
                                            Showing <strong className="text-dark">{pageStart}</strong> to <strong className="text-dark">{pageEnd}</strong> of <strong className="text-dark">{total}</strong> entries
                                        </span>
                                        <div className="d-flex align-items-center gap-1.5 ms-2 ps-3 border-start">
                                            <span className="text-secondary" style={{ fontSize: '0.78rem' }}>Rows per page:</span>
                                            <Form.Select
                                                size="sm"
                                                className="form-select-sm border shadow-none"
                                                style={{ width: '4.5rem', borderRadius: '6px', fontSize: '0.8rem', padding: '0.2rem 1.5rem 0.2rem 0.5rem' }}
                                                value={pageSize}
                                                onChange={(e) => {
                                                    setPageSize(Number(e.target.value));
                                                    setPage(1);
                                                    handleDeselectAll();
                                                }}
                                            >
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </Form.Select>
                                        </div>
                                    </div>

                                    <PaginationBar
                                        page={page}
                                        pageSize={pageSize}
                                        total={total}
                                        totalPages={totalPages}
                                        onPageChange={(newPage) => setPage(newPage)}
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Single Table-Level Action Menu Overlay */}
            <TableActionMenu.Overlay
                activeMenu={activeActionMenu}
                onClose={closeMenu}
            >
                {(party) => (
                    <>
                        <Dropdown.Item
                            as={Link}
                            to={`/parties/${party.id}/ledger`}
                            className="d-flex align-items-center gap-2"
                        >
                            <FaBookOpen size={12} className="text-muted" />
                            <span>View Account Ledger</span>
                        </Dropdown.Item>

                        <Dropdown.Item
                            as={Link}
                            to={`/parties/${party.id}/edit`}
                            className="d-flex align-items-center gap-2"
                        >
                            <FaPen size={12} className="text-muted" />
                            <span>Edit Party</span>
                        </Dropdown.Item>

                        <Dropdown.Divider className="my-1" />

                        <Dropdown.Item
                            className="d-flex align-items-center gap-2 text-danger"
                            disabled={isDeleting}
                            onClick={() => confirmSoftDelete(party.displayName || party.legalName || party.partyCode, () => deleteParty({ id: party.id, isPermanentDelete: false }))}
                        >
                            <FaTrash size={12} />
                            <span>Move to Bin</span>
                        </Dropdown.Item>
                    </>
                )}
            </TableActionMenu.Overlay>

            {/* Quick View Details Offcanvas Drawer */}
            <PartyDetailsDrawer
                show={drawerOpen}
                onHide={() => {
                    setDrawerOpen(false);
                    setSelectedParty(null);
                }}
                party={selectedParty}
            />
        </>
    );
};

export default PartyList;
