import React, { memo, useCallback, useMemo, useState } from 'react';
import { Row, Col, Table, Button, Form, Spinner, Badge, Tooltip, OverlayTrigger, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import {
    FaPlus,
    FaPen,
    FaTrash,
    FaBuilding,
    FaEye,
    FaMapMarkerAlt,
    FaSearch,
    FaTimes,
    FaFileInvoice,
    FaGlobeAmericas,
    FaSort,
    FaSortAlphaUpAlt,
    FaSortAlphaDownAlt,
    FaSortNumericUpAlt,
    FaSortNumericDownAlt,
    FaUndo,
    FaTrashRestore
} from 'react-icons/fa';
import PageLoader from '../../components/PageLoader';
import { useDeleteFirm, useRestoreFirm, useGetFirms, useGetFirmsPagination } from './hooks/api.hooks';
import PaginationBar from '../../components/PaginationBar';
import FirmBranchModal from './components/FirmBranchModal';
import FirmDetailsModal from './components/FirmDetailsModal';
import TrashTabFilter from '../../components/trash/TrashTabFilter';
import useListManager from '../../hooks/useListManager';
import useTrashActions from '../../hooks/useTrashActions';
import './FirmList.css';

const FirmList = () => {
    // 1. Trash Actions Hook
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete
    } = useTrashActions({ entityName: 'Firm', pluralEntityName: 'Firms' });

    // 2. Modals state
    const [detailsModal, setDetailsModal] = useState({ show: false, firm: null });
    const [branchModal, setBranchModal] = useState({ show: false, firm: null });

    // 3. Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'firmId', direction: 'desc' });

    // 4. List Manager Hook
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        search: searchTerm,
        debouncedSearch,
        handleSearch,
        clearSearch,
        isTrash,
        handleTabChange,
        handlePageChange,
        handlePageSizeChange
    } = useListManager({
        items: [],
        idKey: 'firmId',
        initialPageSize: 10
    });

    // 5. Queries & Mutations
    const { data: firms = [], isFetching: isFetchingFirms } = useGetFirms({
        page,
        pageSize,
        search: debouncedSearch,
        isTrash
    });

    const { data: pagination = {}, isFetching: isFetchingPagination } = useGetFirmsPagination({
        page,
        pageSize,
        search: debouncedSearch,
        isTrash
    });

    const { mutate: deleteFirmMutation, isPending: deleteFirmIsPending } = useDeleteFirm();
    const { mutate: restoreFirmMutation, isPending: restoreFirmIsPending } = useRestoreFirm();

    const { pageStart = 1, pageEnd = firms.length, total: totalItems = firms.length } = pagination;

    // Sorting Handlers
    const handleSort = (columnKey) => {
        setSortConfig((prev) => {
            if (prev.key === columnKey) {
                return {
                    key: columnKey,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                };
            }
            return { key: columnKey, direction: 'asc' };
        });
    };

    const renderSortIcon = (columnKey, isNumeric = false) => {
        if (sortConfig.key !== columnKey) {
            return <FaSort className="text-muted ms-1 opacity-50" size={11} />;
        }
        if (isNumeric) {
            return sortConfig.direction === 'asc' ? (
                <FaSortNumericUpAlt className="text-primary ms-1" size={12} />
            ) : (
                <FaSortNumericDownAlt className="text-primary ms-1" size={12} />
            );
        }
        return sortConfig.direction === 'asc' ? (
            <FaSortAlphaUpAlt className="text-primary ms-1" size={12} />
        ) : (
            <FaSortAlphaDownAlt className="text-primary ms-1" size={12} />
        );
    };

    // Client-side search filtering across multiple firm fields
    const filteredFirms = useMemo(() => {
        if (!searchTerm.trim()) return firms;
        const term = searchTerm.toLowerCase().trim();
        return firms.filter((item) => {
            const firmName = (item.firmName || item.firm_name || '').toLowerCase();
            const tradeName = (item.tradeName || item.trade_name || '').toLowerCase();
            const gstin = (item.gstin || '').toLowerCase();
            const city = (item.city || '').toLowerCase();
            const state = (item.state || '').toLowerCase();
            const phone = (item.phoneNumber || item.phone_number || '').toLowerCase();
            const bankName = (item.bankName || item.bank_name || '').toLowerCase();

            return (
                firmName.includes(term) ||
                tradeName.includes(term) ||
                gstin.includes(term) ||
                city.includes(term) ||
                state.includes(term) ||
                phone.includes(term) ||
                bankName.includes(term)
            );
        });
    }, [firms, searchTerm]);

    // Sorted items
    const sortedFirms = useMemo(() => {
        if (!sortConfig.key) return filteredFirms;
        return [...filteredFirms].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'firmId') {
                aVal = Number(a.firmId || a.firm_id || a.id || 0);
                bVal = Number(b.firmId || b.firm_id || b.id || 0);
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            if (sortConfig.key === 'firmName') {
                aVal = (a.firmName || a.firm_name || '').toLowerCase();
                bVal = (b.firmName || b.firm_name || '').toLowerCase();
            } else if (sortConfig.key === 'gstin') {
                aVal = (a.gstin || '').toLowerCase();
                bVal = (b.gstin || '').toLowerCase();
            } else if (sortConfig.key === 'city') {
                aVal = (a.city || '').toLowerCase();
                bVal = (b.city || '').toLowerCase();
            } else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredFirms, sortConfig]);

    // Executive KPIs
    const totalRegisteredFirms = pagination.total || firms.length;
    const gstRegisteredCount = useMemo(() => firms.filter(f => Boolean(f.gstin)).length, [firms]);
    const uniqueStatesCount = useMemo(() => new Set(firms.map(f => f.state).filter(Boolean)).size, [firms]);

    // Action Handlers
    const handleSoftDelete = (firm) => {
        const id = firm.firmId || firm.firm_id || firm.id;
        const name = firm.firmName || firm.firm_name || `Firm #${id}`;
        confirmSoftDelete(name, () => {
            deleteFirmMutation(id);
        });
    };

    const handleRestore = (firm) => {
        const id = firm.firmId || firm.firm_id || firm.id;
        const name = firm.firmName || firm.firm_name || `Firm #${id}`;
        confirmRestore(name, () => {
            restoreFirmMutation(id);
        });
    };

    const handlePermanentDelete = (firm) => {
        const id = firm.firmId || firm.firm_id || firm.id;
        const name = firm.firmName || firm.firm_name || `Firm #${id}`;
        confirmPermanentDelete(name, () => {
            deleteFirmMutation({ id, isPermanentDelete: true });
        });
    };

    // Firm Initials helper for avatar fallback
    const getInitials = (name = '') => {
        return name
            .split(' ')
            .map(n => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'FM';
    };

    return (
        <div className="firm-module-root mb-4">
            {/* 1. Executive KPI Summary Cards */}
            <Row className="g-3 mb-4">
                <Col sm={6} lg={4}>
                    <div className="firm-kpi-card d-flex align-items-center gap-3">
                        <div className="firm-kpi-icon-box firm-kpi-icon-primary">
                            <FaBuilding />
                        </div>
                        <div>
                            <div className="firm-kpi-label">{isTrash ? 'Trashed Firms' : 'Registered Firms'}</div>
                            <div className="firm-kpi-value">{totalRegisteredFirms}</div>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={4}>
                    <div className="firm-kpi-card d-flex align-items-center gap-3">
                        <div className="firm-kpi-icon-box firm-kpi-icon-success">
                            <FaFileInvoice />
                        </div>
                        <div>
                            <div className="firm-kpi-label">GST Registered</div>
                            <div className="firm-kpi-value">{gstRegisteredCount}</div>
                        </div>
                    </div>
                </Col>
                <Col sm={6} lg={4}>
                    <div className="firm-kpi-card d-flex align-items-center gap-3">
                        <div className="firm-kpi-icon-box firm-kpi-icon-info">
                            <FaGlobeAmericas />
                        </div>
                        <div>
                            <div className="firm-kpi-label">States Covered</div>
                            <div className="firm-kpi-value">{uniqueStatesCount}</div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* 2. Main Firm List Table Card */}
            <Row>
                <Col sm="12">
                    <Card className="firm-table-card shadow-sm border-0">
                        {/* Card Header with Title, Tabs, and Add Button */}
                        <Card.Header className="d-flex justify-content-between align-items-center py-3 px-4 border-bottom bg-white flex-wrap gap-2">
                            <div>
                                <h4 className="card-title mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                                    <FaBuilding className="text-primary" size={20} />
                                    Firm Management
                                </h4>
                                <span className="text-muted small">
                                    Manage multi-entity organizations, GST registrations, bank details, and branch networks
                                </span>
                            </div>

                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                {/* Recycle Bin / Active Records Filter */}
                                <TrashTabFilter
                                    isTrash={isTrash}
                                    onTabChange={handleTabChange}
                                    activeLabel="Active Firms"
                                    trashLabel="Recycle Bin"
                                />

                                {!isTrash && (
                                    <Link to="/firms/create">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            className="d-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
                                        >
                                            <FaPlus size={12} />
                                            Add Firm
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </Card.Header>

                        <Card.Body className="p-0">
                            <PageLoader loading={isFetchingFirms && firms.length === 0} />

                            {/* Controls: Page Size & Real-time Search */}
                            <div className="d-flex justify-content-between align-items-center p-3 px-4 border-bottom bg-light flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="small text-muted fw-semibold">Show</span>
                                    <Form.Select
                                        size="sm"
                                        value={pageSize}
                                        onChange={handlePageSizeChange}
                                        style={{ width: '75px' }}
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </Form.Select>
                                    <span className="small text-muted fw-semibold">entries</span>
                                </div>

                                <div className="position-relative" style={{ width: '260px' }}>
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        placeholder="Search firms, GSTIN, city..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        style={{ paddingLeft: '30px', paddingRight: searchTerm ? '30px' : '10px' }}
                                    />
                                    <FaSearch
                                        size={12}
                                        className="text-muted position-absolute"
                                        style={{ left: '10px', top: '10px' }}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            className="btn btn-link p-0 position-absolute text-muted"
                                            style={{ right: '10px', top: '7px', textDecoration: 'none' }}
                                            onClick={clearSearch}
                                            title="Clear search"
                                        >
                                            <FaTimes size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Zebra Striped Table with Interactive Column Sorting */}
                            <div className="table-responsive">
                                <Table className="firm-table mb-0 align-middle" striped hover>
                                    <thead>
                                        <tr>
                                            <th
                                                className="ps-4 sortable-th"
                                                style={{ width: '70px' }}
                                                onClick={() => handleSort('firmId')}
                                                title="Sort by ID"
                                            >
                                                #ID {renderSortIcon('firmId', true)}
                                            </th>
                                            <th
                                                className="sortable-th"
                                                style={{ minWidth: '220px' }}
                                                onClick={() => handleSort('firmName')}
                                                title="Sort by Firm Name"
                                            >
                                                Firm Entity {renderSortIcon('firmName')}
                                            </th>
                                            <th
                                                className="sortable-th"
                                                style={{ width: '130px' }}
                                                onClick={() => handleSort('firmType')}
                                                title="Sort by Entity Type"
                                            >
                                                Firm Type {renderSortIcon('firmType')}
                                            </th>
                                            <th
                                                className="sortable-th"
                                                style={{ minWidth: '160px' }}
                                                onClick={() => handleSort('gstin')}
                                                title="Sort by GSTIN"
                                            >
                                                GSTIN & Tax {renderSortIcon('gstin')}
                                            </th>
                                            <th
                                                className="sortable-th"
                                                style={{ minWidth: '150px' }}
                                                onClick={() => handleSort('city')}
                                                title="Sort by Location"
                                            >
                                                Contact & Location {renderSortIcon('city')}
                                            </th>
                                            <th style={{ width: '140px' }}>Branches</th>
                                            <th style={{ minWidth: '160px' }}>Primary Bank</th>
                                            <th className="text-center pe-4" style={{ width: '140px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '0.86rem' }}>
                                        {sortedFirms.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-5 text-muted">
                                                    {searchTerm ? (
                                                        <div>
                                                            <FaSearch size={24} className="text-muted opacity-50 mb-2" />
                                                            <div className="fw-semibold">No firms matching "{searchTerm}"</div>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                onClick={clearSearch}
                                                                className="mt-1"
                                                            >
                                                                Clear Search
                                                            </Button>
                                                        </div>
                                                    ) : isTrash ? (
                                                        <div>
                                                            <FaTrashRestore size={32} className="text-muted opacity-50 mb-2" />
                                                            <div className="fw-semibold">Recycle Bin is Empty</div>
                                                            <div className="small mt-1 text-muted">
                                                                No soft-deleted firm records found.
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <FaBuilding size={32} className="text-muted opacity-50 mb-2" />
                                                            <div className="fw-semibold">No registered firms found</div>
                                                            <div className="small mt-1">
                                                                Click "+ Add Firm" above to create your first firm entity.
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedFirms.map((item) => {
                                                const fId = item.firmId || item.firm_id || item.id;
                                                const fName = item.firmName || item.firm_name || 'Firm';
                                                const tName = item.tradeName || item.trade_name;
                                                const initials = getInitials(fName);

                                                return (
                                                    <tr key={fId}>
                                                        {/* #ID */}
                                                        <td className="ps-4 font-monospace text-muted small">
                                                            #{fId}
                                                        </td>

                                                        {/* Firm Entity & Logo */}
                                                        <td>
                                                            <div className="d-flex align-items-center gap-2.5">
                                                                <div className="firm-avatar-wrapper">
                                                                    {item.logoUrl ? (
                                                                        <img
                                                                            src={item.logoUrl}
                                                                            alt={fName}
                                                                            className="firm-avatar-img"
                                                                            onError={(e) => {
                                                                                e.currentTarget.style.display = 'none';
                                                                                e.currentTarget.parentElement.innerHTML = `<span class="firm-avatar-initials">${initials}</span>`;
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span className="firm-avatar-initials">{initials}</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="fw-bold text-dark">{fName}</div>
                                                                    {tName && tName !== fName && (
                                                                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                                                            Trade: {tName}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Firm Type */}
                                                        <td>
                                                            <Badge bg="light" text="dark" className="border fw-semibold" style={{ fontSize: '0.74rem' }}>
                                                                {item.firmType || item.firm_type || '—'}
                                                            </Badge>
                                                        </td>

                                                        {/* GSTIN */}
                                                        <td>
                                                            {item.gstin ? (
                                                                <span className="gstin-pill">
                                                                    {item.gstin}
                                                                </span>
                                                            ) : (
                                                                <span className="gstin-pill unregistered">
                                                                    Unregistered
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Contact & Location */}
                                                        <td>
                                                            <div className="d-flex flex-column" style={{ fontSize: '0.8rem' }}>
                                                                {item.phoneNumber || item.phone_number ? (
                                                                    <span className="text-dark">📞 {item.phoneNumber || item.phone_number}</span>
                                                                ) : null}
                                                                <span className="text-muted">
                                                                    📍 {item.city && item.state ? `${item.city}, ${item.state}` : (item.city || item.state || '—')}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Branches View-Only Launcher */}
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="branch-pill-badge"
                                                                onClick={() => setBranchModal({ show: true, firm: item })}
                                                                title="Click to view branch directory for this firm"
                                                            >
                                                                <FaEye size={11} />
                                                                <span>View Branches</span>
                                                            </button>
                                                        </td>

                                                        {/* Primary Bank */}
                                                        <td>
                                                            <div className="d-flex flex-column" style={{ fontSize: '0.78rem' }}>
                                                                {item.bankName || item.bank_name ? (
                                                                    <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '150px' }}>
                                                                        🏦 {item.bankName || item.bank_name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">—</span>
                                                                )}
                                                                {(item.accountNumber || item.account_number) && (
                                                                    <span className="text-muted font-monospace" style={{ fontSize: '0.72rem' }}>
                                                                        A/C: ••••{String(item.accountNumber || item.account_number).slice(-4)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Actions Column */}
                                                        <td className="text-center pe-4">
                                                            {isTrash ? (
                                                                <div className="d-flex align-items-center justify-content-center gap-1.5">
                                                                    {/* Restore Firm */}
                                                                    <OverlayTrigger
                                                                        placement="top"
                                                                        overlay={<Tooltip>Restore Firm to Active</Tooltip>}
                                                                    >
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="firm-action-btn"
                                                                            disabled={restoreFirmIsPending}
                                                                            onClick={() => handleRestore(item)}
                                                                        >
                                                                            <FaUndo size={11} />
                                                                        </Button>
                                                                    </OverlayTrigger>

                                                                    {/* Permanent Delete */}
                                                                    <OverlayTrigger
                                                                        placement="top"
                                                                        overlay={<Tooltip>Permanently Delete Firm</Tooltip>}
                                                                    >
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            className="firm-action-btn"
                                                                            disabled={deleteFirmIsPending}
                                                                            onClick={() => handlePermanentDelete(item)}
                                                                        >
                                                                            <FaTrash size={11} />
                                                                        </Button>
                                                                    </OverlayTrigger>
                                                                </div>
                                                            ) : (
                                                                <div className="d-flex align-items-center justify-content-center gap-1">
                                                                    {/* Quick View Details */}
                                                                    <OverlayTrigger
                                                                        placement="top"
                                                                        overlay={<Tooltip>Quick View Firm Details</Tooltip>}
                                                                    >
                                                                        <Button
                                                                            variant="outline-info"
                                                                            size="sm"
                                                                            className="firm-action-btn"
                                                                            onClick={() => setDetailsModal({ show: true, firm: item })}
                                                                        >
                                                                            <FaEye size={12} />
                                                                        </Button>
                                                                    </OverlayTrigger>

                                                                    {/* Edit Firm */}
                                                                    <OverlayTrigger
                                                                        placement="top"
                                                                        overlay={<Tooltip>Edit Firm Profile</Tooltip>}
                                                                    >
                                                                        <Link to={`/firms/${fId}/edit`}>
                                                                            <Button
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                className="firm-action-btn"
                                                                            >
                                                                                <FaPen size={11} />
                                                                            </Button>
                                                                        </Link>
                                                                    </OverlayTrigger>

                                                                    {/* Soft Delete Firm (Move to Bin) */}
                                                                    <OverlayTrigger
                                                                        placement="top"
                                                                        overlay={<Tooltip>Move to Recycle Bin</Tooltip>}
                                                                    >
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            className="firm-action-btn"
                                                                            disabled={deleteFirmIsPending}
                                                                            onClick={() => handleSoftDelete(item)}
                                                                        >
                                                                            <FaTrash size={11} />
                                                                        </Button>
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
                            <div className="p-3 px-4 border-top">
                                <PaginationBar
                                    page={page}
                                    pageSize={pageSize}
                                    totalItems={totalItems}
                                    pageStart={pageStart}
                                    pageEnd={pageEnd}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modal 1: Quick Branch Directory Modal (View-Only) */}
            {branchModal.show && (
                <FirmBranchModal
                    show={branchModal.show}
                    firm={branchModal.firm}
                    onClose={() => setBranchModal({ show: false, firm: null })}
                />
            )}

            {/* Modal 2: Quick Firm Details Dossier Modal */}
            {detailsModal.show && (
                <FirmDetailsModal
                    show={detailsModal.show}
                    firm={detailsModal.firm}
                    onClose={() => setDetailsModal({ show: false, firm: null })}
                />
            )}
        </div>
    );
};

export default memo(FirmList);