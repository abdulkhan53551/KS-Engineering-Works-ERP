import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Table, Button, Form, InputGroup, OverlayTrigger, Tooltip, Badge, Image, FormCheck } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import { FaPen, FaTrash, FaEye, FaPlus, FaSearch, FaTimes, FaSort, FaSortAlphaUpAlt, FaSortAlphaDownAlt, FaPhoneAlt, FaEnvelope, FaCopy, FaCheck, FaUndo, FaExclamationTriangle } from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import PaginationBar from '../../../components/PaginationBar';
import { useUIManager } from '../../../contexts/UIManagerContext';
import { useDispatch } from 'react-redux';
import { setModalLoading } from '../../../store/uiModal.slice';
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
import defaultLogo from '../../../assets/images/shapes/01.png';
import { toast } from 'react-toastify';
import moment from 'moment';
import useDebounce from '../../../hooks/useDebounce';

/**
 * Format date string safely to DD/MM/YYYY
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-GB');
    } catch {
        return '—';
    }
};

const PartyList = () => {
    const dispatch = useDispatch();
    const { showModal } = useUIManager();

    // Local state for pagination, filters, sorting, and details drawer
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [gstFilter, setGstFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [isTrash, setIsTrash] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const debouncedSearch = useDebounce(searchTerm, 400);

    // Drawer state
    const [selectedParty, setSelectedParty] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Copy indicator state for table row cells
    const [copiedKey, setCopiedKey] = useState(null);

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
        refetch
    } = useParties(queryParams);

    const {
        data: pagination = {},
        isLoading: isPaginationLoading
    } = usePartyPagination(queryParams);

    const { mutate: deleteParty, isPending: isDeleting } = useDeleteParty();
    const { mutate: restoreParty } = useRestoreParty();
    const { mutate: bulkDeleteParties } = useBulkDeleteParties();
    const { mutate: bulkRestoreParties } = useBulkRestoreParties();

    const { total = 0, totalPages = 1, pageStart = 0, pageEnd = 0 } = pagination;

    const handleTabChange = (trashState) => {
        setIsTrash(trashState);
        setPage(1);
        setSelectedIds([]);
    };

    // Multi-selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = parties.map(item => item.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const isAllSelected = parties.length > 0 && selectedIds.length === parties.length;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < parties.length;

    // Action: Move to Trash (Soft Delete)
    const handleDelete = (party) => {
        const name = party.displayName || party.legalName || `Party #${party.id}`;
        showModal('confirm', {
            show: true,
            title: 'Move to Recycle Bin',
            message: `Are you sure you want to move Party "${name}" to the Recycle Bin?`,
            confirmText: 'Move to Bin',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                deleteParty({ id: party.id, isPermanentDelete: false });
            }
        });
    };

    // Action: Restore Single Item
    const handleRestore = (party) => {
        const name = party.displayName || party.legalName || `Party #${party.id}`;
        showModal('confirm', {
            show: true,
            title: 'Restore Party',
            message: `Are you sure you want to restore Party "${name}" back to active parties?`,
            confirmText: 'Restore',
            confirmVariant: 'success',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                restoreParty(party.id);
            }
        });
    };

    // Action: Permanent Delete Single Item
    const handlePermanentDelete = (party) => {
        const name = party.displayName || party.legalName || `Party #${party.id}`;
        showModal('confirm', {
            show: true,
            title: 'Permanently Delete Party',
            message: `Are you sure you want to PERMANENTLY delete Party "${name}"? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                deleteParty({ id: party.id, isPermanentDelete: true });
            }
        });
    };

    // Action: Bulk Move to Trash
    const handleBulkDelete = () => {
        showModal('confirm', {
            show: true,
            title: 'Move Selected to Recycle Bin',
            message: `Are you sure you want to move ${selectedIds.length} selected parties to the Recycle Bin?`,
            confirmText: 'Move to Bin',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                bulkDeleteParties({ ids: selectedIds, isPermanentDelete: false });
                setSelectedIds([]);
            }
        });
    };

    // Action: Bulk Restore
    const handleBulkRestore = () => {
        showModal('confirm', {
            show: true,
            title: 'Restore Selected Parties',
            message: `Are you sure you want to restore ${selectedIds.length} selected parties back to active records?`,
            confirmText: 'Restore All',
            confirmVariant: 'success',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                bulkRestoreParties({ ids: selectedIds });
                setSelectedIds([]);
            }
        });
    };

    // Action: Bulk Permanent Delete
    const handleBulkPermanentDelete = () => {
        showModal('confirm', {
            show: true,
            title: 'Permanently Delete Selected Parties',
            message: `Are you sure you want to PERMANENTLY delete ${selectedIds.length} selected parties? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            confirmVariant: 'danger',
            onConfirm: async () => {
                dispatch(setModalLoading({ key: 'delete', isLoading: true }));
                bulkDeleteParties({ ids: selectedIds, isPermanentDelete: true });
                setSelectedIds([]);
            }
        });
    };

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
        setSearchTerm('');
        setStatusFilter('');
        setGstFilter('');
        setPage(1);
    };

    const hasActiveFilters = Boolean(searchTerm || statusFilter || gstFilter !== '');
    const isLoading = isPartiesLoading || isPaginationLoading;

    return (
        <>
            <Row>
                <Col sm="12">
                    <Card>
                        {/* 1. Header with Title, Count, TrashTabFilter and Add Button */}
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="header-title d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center gap-2">
                                    <h4 className="card-title mb-0">Party List</h4>
                                    {!isLoading && total > 0 && (
                                        <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-1">
                                            {total} Total
                                        </Badge>
                                    )}
                                </div>
                                <TrashTabFilter
                                    isTrash={isTrash}
                                    onTabChange={handleTabChange}
                                    trashLabel="Recycle Bin"
                                />
                            </div>
                            {!isTrash && (
                                <div className="d-flex align-items-center gap-2">
                                    <Link to="/parties/create" className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm">
                                        <FaPlus size={12} />
                                        <span>Add Party</span>
                                    </Link>
                                </div>
                            )}
                        </Card.Header>

                        <Card.Body className="px-0">
                            {/* Loader Indicator for background refetches */}
                            <PageLoader loading={isPartiesFetching && !isLoading} />

                            {/* 2. Controls & Filter Bar */}
                            <Col className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                                {/* Show Entries Selector */}
                                <div className="d-flex align-items-center">
                                    <Form.Label className="mb-0 text-muted small">Show</Form.Label>
                                    <Form.Select
                                        className="form-select-sm"
                                        style={{ marginLeft: '0.5rem', marginRight: '0.5rem', width: '5.8rem', minWidth: '5.8rem' }}
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value));
                                            setPage(1);
                                        }}
                                        aria-label=".form-select-sm example"
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </Form.Select>
                                    <Form.Label className="mb-0 text-muted small">entries</Form.Label>
                                </div>

                                {/* Filters & Search */}
                                <div className="d-flex align-items-center flex-wrap gap-2">
                                    {/* Status Filter */}
                                    <Form.Select
                                        size="sm"
                                        style={{ width: '8.5rem' }}
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <option value="">All Status</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </Form.Select>

                                    {/* GST Status Filter */}
                                    <Form.Select
                                        size="sm"
                                        style={{ width: '8.5rem' }}
                                        value={gstFilter}
                                        onChange={(e) => {
                                            setGstFilter(e.target.value);
                                            setPage(1);
                                        }}
                                    >
                                        <option value="">All GST</option>
                                        <option value="true">Registered</option>
                                        <option value="false">Unregistered</option>
                                    </Form.Select>

                                    {/* Search Input */}
                                    <InputGroup size="sm" style={{ width: '16rem' }}>
                                        <InputGroup.Text className="bg-white border-end-0">
                                            <FaSearch className="text-muted" size={12} />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="search"
                                            placeholder="Search parties..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setPage(1);
                                            }}
                                            className="border-start-0 ps-0"
                                        />
                                        {searchTerm && (
                                            <Button
                                                variant="outline-secondary"
                                                className="bg-white border-start-0"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setPage(1);
                                                }}
                                            >
                                                <FaTimes size={11} className="text-muted" />
                                            </Button>
                                        )}
                                    </InputGroup>

                                    {/* Reset Filters button */}
                                    {hasActiveFilters && (
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={handleClearFilters}
                                            className="d-flex align-items-center gap-1"
                                            style={{ fontSize: '0.78rem' }}
                                        >
                                            <FaTimes size={10} />
                                            <span>Clear</span>
                                        </Button>
                                    )}
                                </div>
                            </Col>

                            {/* Bulk Action Bar */}
                            <div className="px-4">
                                <BulkActionBar
                                    selectedCount={selectedIds.length}
                                    isTrash={isTrash}
                                    onBulkDelete={handleBulkDelete}
                                    onBulkRestore={handleBulkRestore}
                                    onBulkPermanentDelete={handleBulkPermanentDelete}
                                    onClearSelection={() => setSelectedIds([])}
                                />
                            </div>

                            {/* 3. Table Content with Thin Header, Zebra Striping and Bordered Columns */}
                            <div className="table-responsive">
                                <Table className="table-sortable ms-1 me-1 align-middle mb-0" striped bordered hover responsive>
                                    <thead className="light">
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
                                                    style={{ minWidth: '110px', padding: '0.45rem 0.5rem' }}
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
                                                    <Button variant="outline-primary" size="sm" onClick={() => refetch()}>
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

                                                        {/* 2. Logo Column */}
                                                        <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                            <Image
                                                                className="bg-soft-primary rounded img-fluid avatar-35 p-1"
                                                                src={party.logoUrl || party.logo || defaultLogo}
                                                                alt={party.displayName || 'Party Logo'}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = defaultLogo;
                                                                }}
                                                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                            />
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
                                                        <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                            <div className="d-inline-flex align-items-center gap-1">
                                                                {!isTrash ? (
                                                                    <>
                                                                        {/* Quick View Button */}
                                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Quick View</Tooltip>}>
                                                                            <Button
                                                                                variant="outline-info"
                                                                                size="sm"
                                                                                className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                                onClick={() => handleQuickView(party)}
                                                                            >
                                                                                <FaEye size={11} />
                                                                            </Button>
                                                                        </OverlayTrigger>

                                                                        {/* Edit Button */}
                                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Edit Party</Tooltip>}>
                                                                            <Link to={`/parties/${party.id}/edit`}>
                                                                                <Button
                                                                                    variant="outline-success"
                                                                                    size="sm"
                                                                                    className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                                >
                                                                                    <FaPen size={10} />
                                                                                </Button>
                                                                            </Link>
                                                                        </OverlayTrigger>

                                                                        {/* Delete Button */}
                                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Move to Bin</Tooltip>}>
                                                                            <Button
                                                                                variant="outline-danger"
                                                                                size="sm"
                                                                                className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                                disabled={isDeleting}
                                                                                onClick={() => handleDelete(party)}
                                                                            >
                                                                                <FaTrash size={10} />
                                                                            </Button>
                                                                        </OverlayTrigger>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* Restore Button */}
                                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Restore Party</Tooltip>}>
                                                                            <Button
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                                onClick={() => handleRestore(party)}
                                                                            >
                                                                                <FaUndo size={10} />
                                                                            </Button>
                                                                        </OverlayTrigger>

                                                                        {/* Permanent Delete Button */}
                                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Delete Permanently</Tooltip>}>
                                                                            <Button
                                                                                variant="outline-danger"
                                                                                size="sm"
                                                                                className="p-1 px-2 d-inline-flex align-items-center justify-content-center"
                                                                                onClick={() => handlePermanentDelete(party)}
                                                                            >
                                                                                <FaExclamationTriangle size={10} />
                                                                            </Button>
                                                                        </OverlayTrigger>
                                                                    </>
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

                            {/* 4. Pagination Footer */}
                            {!isLoading && total > 0 && (
                                <div className="d-flex justify-content-between align-items-center flex-wrap px-3 py-3 border-top gap-2" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                                    <div className="text-muted small">
                                        Showing {pageStart} to {pageEnd} of {total} entries
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
