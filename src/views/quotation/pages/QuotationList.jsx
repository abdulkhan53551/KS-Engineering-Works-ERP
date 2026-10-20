import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Button, Form, Row, Col, Badge, Spinner, Dropdown, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import {
    FaPlus, FaSearch, FaTimes, FaEdit, FaTrash, FaUndo,
    FaCopy, FaCheck, FaHistory, FaDownload, FaEye, FaSyncAlt,
    FaClock, FaCheckCircle, FaTimesCircle, FaLayerGroup, FaThList,
    FaUserTie, FaBuilding, FaFileInvoiceDollar, FaLock, FaRegClock,
    FaBoxes, FaArrowRight, FaSort, FaSortAlphaUpAlt, FaSortAlphaDownAlt,
    FaCalendarAlt, FaFilter
} from 'react-icons/fa';
import Card from '../../../components/Card';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import PaginationBar from '../../../components/PaginationBar';
import useBranchAction from '../../../hooks/useBranchAction';
import { useListPagination } from '../../../hooks/useListManager';
import useQuotationFilters from '../hooks/useQuotationFilters';
import './quotation.scss';

import {
    useQuotations,
    useQuotationPagination,
    useDeleteQuotation,
    useRestoreQuotation,
    useBulkDeleteQuotations,
    useBulkRestoreQuotations,
    useCreateQuotationRevision,
    useApproveQuotation,
    useDownloadQuotationPdf
} from '../hooks/useApi';

import QuotationPdfModal from '../components/QuotationPdfModal';

const QuotationList = () => {
    const navigate = useNavigate();
    const { navigateWithBranch, BranchModal } = useBranchAction();

    // Tenant / Active Firm & Branch Context
    const { activeFirm, activeBranch } = useSelector((state) => state.firmReducer || {});
    const firmId = (!activeFirm || activeFirm?.id === 'all') ? '' : activeFirm?.id;
    const branchId = (!activeBranch || activeBranch?.id === 'all') ? '' : activeBranch?.id;

    // List Pagination, Search & Trash Manager (URL query params synchronized)
    const {
        page,
        setPage,
        pageSize,
        debouncedSearch,
        search,
        isTrash,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePageSizeChange,
        handleTabChange: handlePaginationTabChange
    } = useListPagination({
        initialPageSize: 10
    });

    // Quotation Filters Hook (URL query params synchronized)
    const {
        statusFilter,
        approvalStatusFilter,
        startDate,
        endDate,
        datePreset,
        hasActiveFilters,
        tempStartDate,
        setTempStartDate,
        tempEndDate,
        setTempEndDate,
        handleStatusChange,
        handleApprovalStatusChange,
        handleDatePresetChange,
        handleApplyCustomDates,
        handleResetFilters,
        getDateLabel
    } = useQuotationFilters({
        clearSearch,
        onFilterChange: () => setSelectedIds([])
    });

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

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
                <FaSortAlphaUpAlt className="text-danger ms-1" size={11} />
            ) : (
                <FaSortAlphaDownAlt className="text-danger ms-1" size={11} />
            );
        }
        return <FaSort className="text-muted ms-1 opacity-40" size={10} />;
    };

    // Reset page to 1 when firm or branch changes
    useEffect(() => {
        setPage(1);
    }, [firmId, branchId, setPage]);

    // Selected Rows for Bulk Actions
    const [selectedIds, setSelectedIds] = useState([]);

    // PDF Preview Modal
    const [previewQuotation, setPreviewQuotation] = useState(null);

    // Queries
    const queryParams = {
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        approvalStatus: approvalStatusFilter,
        startDate,
        endDate,
        trash: isTrash,
        firmId,
        branchId
    };
    const { data: quotations = [], isLoading, isFetching, refetch: refetchQuotations } = useQuotations(queryParams);
    const { data: pagination = {}, refetch: refetchPagination } = useQuotationPagination(queryParams);

    // Client-side Sort memo
    const sortedQuotations = useMemo(() => {
        if (!sortConfig.key) return quotations;
        return [...quotations].sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];

            if (sortConfig.key === 'id') {
                aVal = Number(a.id || a.quotation_id || 0);
                bVal = Number(b.id || b.quotation_id || 0);
            } else if (sortConfig.key === 'quotationNo') {
                aVal = (a.quotationNo || a.quotation_no || '').toLowerCase();
                bVal = (b.quotationNo || b.quotation_no || '').toLowerCase();
            } else if (sortConfig.key === 'quotationDate') {
                aVal = new Date(a.quotationDate || a.quotation_date || 0).getTime();
                bVal = new Date(b.quotationDate || b.quotation_date || 0).getTime();
            } else if (sortConfig.key === 'customerName') {
                aVal = (a.customerName || a.customer_name || '').toLowerCase();
                bVal = (b.customerName || b.customer_name || '').toLowerCase();
            } else if (sortConfig.key === 'templateType') {
                aVal = (a.templateType || a.template_type || '').toLowerCase();
                bVal = (b.templateType || b.template_type || '').toLowerCase();
            } else if (sortConfig.key === 'taxableAmount') {
                aVal = Number(a.taxableAmount !== undefined ? a.taxableAmount : (a.taxable_amount || 0));
                bVal = Number(b.taxableAmount !== undefined ? b.taxableAmount : (b.taxable_amount || 0));
            } else if (sortConfig.key === 'total') {
                aVal = Number(a.total || 0);
                bVal = Number(b.total || 0);
            } else if (sortConfig.key === 'approvalStatus') {
                aVal = (a.approvalStatus || a.approval_status || '').toLowerCase();
                bVal = (b.approvalStatus || b.approval_status || '').toLowerCase();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [quotations, sortConfig]);

    // Pagination metrics
    const totalItems = pagination.total !== undefined ? pagination.total : quotations.length;
    const totalPages = pagination.totalPages || (totalItems > 0 && pageSize ? Math.ceil(totalItems / pageSize) : 1) || 1;
    const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = Math.min(page * pageSize, totalItems);

    // Mutations
    const deleteMutation = useDeleteQuotation();
    const restoreMutation = useRestoreQuotation();
    const bulkDeleteMutation = useBulkDeleteQuotations();
    const bulkRestoreMutation = useBulkRestoreQuotations();
    const approveMutation = useApproveQuotation();
    const downloadPdfMutation = useDownloadQuotationPdf();
    const revisionMutation = useCreateQuotationRevision();

    // KPI Metrics derived from current view / data
    const totalRecords = totalItems;
    const totalValue = useMemo(() => {
        return quotations.reduce((acc, q) => acc + (Number(q.total) || 0), 0);
    }, [quotations]);
    const approvedCount = useMemo(() => {
        return quotations.filter(q => (q.approvalStatus || q.approval_status) === 'APPROVED').length;
    }, [quotations]);
    const pendingCount = useMemo(() => {
        return quotations.filter(q => (q.approvalStatus || q.approval_status || 'PENDING') === 'PENDING').length;
    }, [quotations]);

    // Select All
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(quotations.map(q => q.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Bulk Delete / Restore
    const handleBulkAction = () => {
        if (selectedIds.length === 0) return;
        if (isTrash) {
            bulkRestoreMutation.mutate(selectedIds, {
                onSuccess: () => setSelectedIds([])
            });
        } else {
            if (window.confirm(`Are you sure you want to move ${selectedIds.length} quotation(s) to trash?`)) {
                bulkDeleteMutation.mutate(selectedIds, {
                    onSuccess: () => setSelectedIds([])
                });
            }
        }
    };

    const handleRefresh = () => {
        refetchQuotations();
        refetchPagination();
    };

    return (
        <div className="quotation-module container-fluid py-3">
            {/* KPI Summary Cards */}
            <Row className="g-3 mb-3">
                <Col xl={3} sm={6}>
                    <div className="quotation-kpi-card">
                        <div className="kpi-icon primary">
                            <FaFileInvoiceDollar />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Total Quotations</span>
                            <h5 className="kpi-value">{totalRecords}</h5>
                            <span className="kpi-subtext text-muted">{isTrash ? 'In Recycle Bin' : 'Active Commercial Offers'}</span>
                        </div>
                    </div>
                </Col>
                <Col xl={3} sm={6}>
                    <div className="quotation-kpi-card">
                        <div className="kpi-icon success">
                            <FaCheckCircle />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Approved Offers</span>
                            <h5 className="kpi-value text-success">{approvedCount}</h5>
                            <span className="kpi-subtext text-muted">Signed off & Locked</span>
                        </div>
                    </div>
                </Col>
                <Col xl={3} sm={6}>
                    <div className="quotation-kpi-card">
                        <div className="kpi-icon warning">
                            <FaClock />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Pending Approval</span>
                            <h5 className="kpi-value text-warning">{pendingCount}</h5>
                            <span className="kpi-subtext text-muted">Awaiting Admin Sign-off</span>
                        </div>
                    </div>
                </Col>
                <Col xl={3} sm={6}>
                    <div className="quotation-kpi-card">
                        <div className="kpi-icon dark">
                            <FaBoxes />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Page Pipeline Value</span>
                            <h5 className="kpi-value text-dark">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h5>
                            <span className="kpi-subtext text-muted">Cumulative Page Value</span>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Main Listing Card */}
            <Card className="quotation-main-card shadow-sm border-0">
                {/* Header */}
                <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2 py-3 px-4 bg-white border-bottom">
                    <div className="header-title d-flex align-items-center gap-2">
                        <div>
                            <h4 className="card-title mb-0 fw-bold theme-crimson">Commercial Quotations & Estimates</h4>
                            <p className="text-muted small mb-0 mt-0.5">
                                Engineering offers, dual presentation layouts, approval workflows & PDF generation
                            </p>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <TrashTabFilter
                            isTrash={isTrash}
                            onTabChange={(trashState) => {
                                handlePaginationTabChange(trashState);
                                setSelectedIds([]);
                            }}
                        />
                        {!isTrash && (
                            <Button
                                variant="danger"
                                size="sm"
                                className="d-flex align-items-center gap-1.5 btn-action-primary"
                                onClick={() => navigateWithBranch('/sales/quotation/create', 'Select Branch for New Quotation')}
                            >
                                <FaPlus size={11} />
                                <span>Create Quotation</span>
                            </Button>
                        )}
                    </div>
                </Card.Header>

                {/* Bulk Actions Banner */}
                <BulkActionBar
                    selectedCount={selectedIds.length}
                    isTrash={isTrash}
                    onBulkDelete={handleBulkAction}
                    onBulkRestore={handleBulkAction}
                    onClearSelection={() => setSelectedIds([])}
                    isLoading={bulkDeleteMutation.isPending || bulkRestoreMutation.isPending}
                />

                {/* Professional Enterprise Filter Toolbar */}
                <div className="quotation-toolbar px-4 py-3 bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2.5">
                        {/* Left Side: Search Bar & Smart Filter Dropdowns */}
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            {/* Search Input */}
                            <InputGroup size="sm" className="quotation-search-group shadow-none" style={{ width: '250px' }}>
                                <InputGroup.Text className="bg-white border-end-0 text-muted ps-2.5 pe-1">
                                    <FaSearch size={11} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search Quotation, Buyer..."
                                    value={search}
                                    onChange={handleSearch}
                                    className="border-start-0 border-end-0 ps-1 shadow-none"
                                />
                                {search && (
                                    <Button
                                        variant="white"
                                        className="bg-white border border-start-0 border-end-0 text-muted px-2"
                                        onClick={clearSearch}
                                        title="Clear search"
                                    >
                                        <FaTimes size={10} />
                                    </Button>
                                )}
                            </InputGroup>

                            {/* Approval Status Filter Dropdown */}
                            <Dropdown>
                                <Dropdown.Toggle
                                    size="sm"
                                    variant="light"
                                    className={`filter-dropdown-toggle shadow-none ${approvalStatusFilter ? 'active-filter' : ''}`}
                                >
                                    <span className="text-truncate">
                                        {approvalStatusFilter === 'APPROVED' ? 'Approval: Approved' :
                                         approvalStatusFilter === 'PENDING' ? 'Approval: Pending' :
                                         approvalStatusFilter === 'REJECTED' ? 'Approval: Rejected' : 'All Approvals'}
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-lg border-0 py-1" style={{ minWidth: '175px' }}>
                                    <Dropdown.Item
                                        active={!approvalStatusFilter}
                                        onClick={() => handleApprovalStatusChange('')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span>All Approvals</span>
                                        {!approvalStatusFilter && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Divider className="my-1" />
                                    <Dropdown.Item
                                        active={approvalStatusFilter === 'PENDING'}
                                        onClick={() => handleApprovalStatusChange('PENDING')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span className="d-flex align-items-center gap-2">
                                            <span className="badge bg-warning rounded-circle p-1"> </span>
                                            <span>Pending Approval</span>
                                        </span>
                                        {approvalStatusFilter === 'PENDING' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        active={approvalStatusFilter === 'APPROVED'}
                                        onClick={() => handleApprovalStatusChange('APPROVED')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span className="d-flex align-items-center gap-2">
                                            <span className="badge bg-success rounded-circle p-1"> </span>
                                            <span>Approved</span>
                                        </span>
                                        {approvalStatusFilter === 'APPROVED' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        active={approvalStatusFilter === 'REJECTED'}
                                        onClick={() => handleApprovalStatusChange('REJECTED')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span className="d-flex align-items-center gap-2">
                                            <span className="badge bg-danger rounded-circle p-1"> </span>
                                            <span>Rejected</span>
                                        </span>
                                        {approvalStatusFilter === 'REJECTED' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Lifecycle Stage Filter Dropdown */}
                            <Dropdown>
                                <Dropdown.Toggle
                                    size="sm"
                                    variant="light"
                                    className={`filter-dropdown-toggle shadow-none ${statusFilter ? 'active-filter' : ''}`}
                                >
                                    <span className="text-truncate">
                                        {statusFilter ? `Stage: ${statusFilter.replace('_', ' ')}` : 'All Stages'}
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-lg border-0 py-1" style={{ minWidth: '175px' }}>
                                    <Dropdown.Item
                                        active={!statusFilter}
                                        onClick={() => handleStatusChange('')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span>All Stages</span>
                                        {!statusFilter && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Divider className="my-1" />
                                    <Dropdown.Item
                                        active={statusFilter === 'DRAFT'}
                                        onClick={() => handleStatusChange('DRAFT')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span>Draft</span>
                                        {statusFilter === 'DRAFT' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        active={statusFilter === 'PENDING_APPROVAL'}
                                        onClick={() => handleStatusChange('PENDING_APPROVAL')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span>Pending Approval</span>
                                        {statusFilter === 'PENDING_APPROVAL' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        active={statusFilter === 'APPROVED'}
                                        onClick={() => handleStatusChange('APPROVED')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span>Approved</span>
                                        {statusFilter === 'APPROVED' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        active={statusFilter === 'SENT'}
                                        onClick={() => handleStatusChange('SENT')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span>Sent to Buyer</span>
                                        {statusFilter === 'SENT' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        active={statusFilter === 'PO_CONVERTED'}
                                        onClick={() => handleStatusChange('PO_CONVERTED')}
                                        className="d-flex align-items-center justify-content-between py-1.5"
                                    >
                                        <span>PO Converted</span>
                                        {statusFilter === 'PO_CONVERTED' && <FaCheck size={11} className="theme-crimson" />}
                                    </Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Date Range Dropdown with Presets & Pickers */}
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle
                                    size="sm"
                                    variant="light"
                                    className={`filter-dropdown-toggle shadow-none ${datePreset || startDate || endDate ? 'active-filter' : ''}`}
                                >
                                    <FaCalendarAlt size={11} className={datePreset || startDate || endDate ? 'theme-crimson' : 'text-muted'} />
                                    <span className="text-truncate">{getDateLabel()}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-lg border-0 p-3" style={{ minWidth: '295px' }}>
                                    <div className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                        Quick Presets
                                    </div>
                                    <div className="d-flex flex-wrap gap-1.5 mb-3">
                                        <Button
                                            variant={datePreset === 'today' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.76rem' }}
                                            onClick={() => handleDatePresetChange('today')}
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            variant={datePreset === 'thisMonth' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.76rem' }}
                                            onClick={() => handleDatePresetChange('thisMonth')}
                                        >
                                            This Month
                                        </Button>
                                        <Button
                                            variant={datePreset === 'lastMonth' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.76rem' }}
                                            onClick={() => handleDatePresetChange('lastMonth')}
                                        >
                                            Last Month
                                        </Button>
                                        <Button
                                            variant={datePreset === 'thisFY' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.76rem' }}
                                            onClick={() => handleDatePresetChange('thisFY')}
                                        >
                                            Current FY
                                        </Button>
                                    </div>

                                    <Dropdown.Divider className="my-2" />

                                    <div className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                        Custom Range
                                    </div>
                                    <Row className="g-2 mb-2">
                                        <Col xs={6}>
                                            <Form.Label className="text-muted small mb-1" style={{ fontSize: '0.72rem' }}>From</Form.Label>
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={tempStartDate}
                                                onChange={(e) => setTempStartDate(e.target.value)}
                                                style={{ fontSize: '0.78rem' }}
                                            />
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Label className="text-muted small mb-1" style={{ fontSize: '0.72rem' }}>To</Form.Label>
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={tempEndDate}
                                                onChange={(e) => setTempEndDate(e.target.value)}
                                                style={{ fontSize: '0.78rem' }}
                                            />
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-end gap-1.5 mt-2">
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="border py-1 px-2.5"
                                            style={{ fontSize: '0.76rem' }}
                                            onClick={() => handleDatePresetChange('all')}
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="py-1 px-3"
                                            style={{ fontSize: '0.76rem' }}
                                            disabled={!tempStartDate && !tempEndDate}
                                            onClick={handleApplyCustomDates}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Reset Button (shows when any filter is active) */}
                            {hasActiveFilters && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="d-flex align-items-center gap-1.5 px-2.5 shadow-none"
                                    style={{ height: '31px', borderRadius: '6px', fontSize: '0.8rem' }}
                                    title="Reset all filters"
                                >
                                    <FaUndo size={10} />
                                    <span>Reset</span>
                                </Button>
                            )}
                        </div>

                        {/* Right Side: Entries Selector & Refresh Button */}
                        <div className="d-flex align-items-center gap-2.5">
                            <div className="d-flex align-items-center text-muted small">
                                <span className="me-1.5 text-secondary">Show</span>
                                <Form.Select
                                    size="sm"
                                    className="border shadow-none"
                                    style={{ width: '4.8rem', borderRadius: '6px' }}
                                    value={pageSize}
                                    onChange={(e) => {
                                        handlePageSizeChange(Number(e.target.value));
                                        setSelectedIds([]);
                                    }}
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </Form.Select>
                                <span className="ms-1.5 text-secondary">entries</span>
                            </div>

                            <Button
                                variant="light"
                                size="sm"
                                className="border text-secondary px-2"
                                title="Refresh Quotations"
                                onClick={handleRefresh}
                            >
                                <FaSyncAlt size={11} className={isFetching ? 'fa-spin text-danger' : ''} />
                            </Button>
                        </div>
                    </div>

                    {/* Active Filter Chips / Badges Row */}
                    {hasActiveFilters && (
                        <div className="active-filters-strip">
                            <span className="text-muted small fw-semibold" style={{ fontSize: '0.74rem' }}>
                                <FaFilter size={10} className="me-1 theme-crimson" /> Active Filters:
                            </span>

                            {approvalStatusFilter && (
                                <span className="active-filter-badge badge-approval">
                                    Approval: {approvalStatusFilter === 'APPROVED' ? 'Approved' : approvalStatusFilter === 'PENDING' ? 'Pending' : 'Rejected'}
                                    <FaTimes
                                        className="badge-close-btn"
                                        size={9}
                                        onClick={() => handleApprovalStatusChange('')}
                                    />
                                </span>
                            )}

                            {statusFilter && (
                                <span className="active-filter-badge badge-stage">
                                    Stage: {statusFilter.replace('_', ' ')}
                                    <FaTimes
                                        className="badge-close-btn"
                                        size={9}
                                        onClick={() => handleStatusChange('')}
                                    />
                                </span>
                            )}

                            {(startDate || endDate || datePreset) && (
                                <span className="active-filter-badge badge-date">
                                    Date: {getDateLabel()}
                                    <FaTimes
                                        className="badge-close-btn"
                                        size={9}
                                        onClick={() => handleDatePresetChange('all')}
                                    />
                                </span>
                            )}

                            {search && (
                                <span className="active-filter-badge badge-search">
                                    Search: "{search}"
                                    <FaTimes
                                        className="badge-close-btn"
                                        size={9}
                                        onClick={clearSearch}
                                    />
                                </span>
                            )}

                            <Button
                                variant="link"
                                size="sm"
                                onClick={handleResetFilters}
                                className="p-0 theme-crimson text-decoration-none small ms-1 fw-semibold"
                                style={{ fontSize: '0.74rem' }}
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table Content */}
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="align-middle quotation-list-table mb-0" style={{ fontSize: '13px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }} className="text-center">
                                        <Form.Check
                                            type="checkbox"
                                            checked={quotations.length > 0 && selectedIds.length === quotations.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th
                                        style={{ width: '55px', cursor: 'pointer' }}
                                        className="text-center user-select-none"
                                        onClick={() => handleSort('id')}
                                        title="Sort by ID"
                                    >
                                        #ID {renderSortIcon('id')}
                                    </th>
                                    <th
                                        style={{ width: '16%', cursor: 'pointer' }}
                                        className="user-select-none"
                                        onClick={() => handleSort('quotationNo')}
                                        title="Sort by Quotation Ref"
                                    >
                                        Quotation Ref {renderSortIcon('quotationNo')}
                                    </th>
                                    <th
                                        style={{ width: '14%', cursor: 'pointer' }}
                                        className="user-select-none"
                                        onClick={() => handleSort('quotationDate')}
                                        title="Sort by Date"
                                    >
                                        Date & Validity {renderSortIcon('quotationDate')}
                                    </th>
                                    <th
                                        style={{ width: '23%', cursor: 'pointer' }}
                                        className="user-select-none"
                                        onClick={() => handleSort('customerName')}
                                        title="Sort by Customer Name"
                                    >
                                        Customer / Buyer {renderSortIcon('customerName')}
                                    </th>
                                    <th
                                        style={{ width: '12%', cursor: 'pointer' }}
                                        className="text-center user-select-none"
                                        onClick={() => handleSort('templateType')}
                                        title="Sort by Template"
                                    >
                                        Template {renderSortIcon('templateType')}
                                    </th>
                                    <th
                                        style={{ width: '10%', cursor: 'pointer' }}
                                        className="text-end user-select-none"
                                        onClick={() => handleSort('taxableAmount')}
                                        title="Sort by Taxable Amount"
                                    >
                                        Taxable (₹) {renderSortIcon('taxableAmount')}
                                    </th>
                                    <th
                                        style={{ width: '11%', cursor: 'pointer' }}
                                        className="text-end user-select-none"
                                        onClick={() => handleSort('total')}
                                        title="Sort by Total Amount"
                                    >
                                        Total (₹) {renderSortIcon('total')}
                                    </th>
                                    <th
                                        style={{ width: '10%', cursor: 'pointer' }}
                                        className="text-center user-select-none"
                                        onClick={() => handleSort('approvalStatus')}
                                        title="Sort by Approval Status"
                                    >
                                        Approval {renderSortIcon('approvalStatus')}
                                    </th>
                                    <th style={{ width: '12%' }} className="text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-5">
                                            <Spinner animation="border" variant="danger" size="sm" />
                                            <span className="ms-2 text-muted">Loading commercial quotations...</span>
                                        </td>
                                    </tr>
                                ) : sortedQuotations.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="text-center py-5">
                                            <div className="py-4">
                                                <FaFileInvoiceDollar size={36} className="text-muted mb-2 opacity-50" />
                                                <h6 className="text-dark fw-bold mb-1">No Quotations Found</h6>
                                                <p className="text-muted small mb-3">
                                                    {hasActiveFilters
                                                        ? 'No quotations match your active search or filters.'
                                                        : 'Get started by creating your first commercial offer.'}
                                                </p>
                                                {hasActiveFilters ? (
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="d-inline-flex align-items-center gap-1.5"
                                                        onClick={handleResetFilters}
                                                    >
                                                        <FaUndo size={11} />
                                                        <span>Clear Filters</span>
                                                    </Button>
                                                ) : !isTrash ? (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="d-inline-flex align-items-center gap-1.5 btn-action-primary"
                                                        onClick={() => navigateWithBranch('/sales/quotation/create', 'Select Branch for New Quotation')}
                                                    >
                                                        <FaPlus size={11} />
                                                        <span>Create First Quotation</span>
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedQuotations.map((q) => {
                                        const isApproved = (q.approvalStatus || q.approval_status) === 'APPROVED';
                                        const qNo = q.quotationNo || q.quotation_no;
                                        const qRevNo = q.revisionNo !== undefined ? q.revisionNo : (q.revision_no || 0);
                                        const itemsCount = q.itemsCount || q.items_count || 1;
                                        const qDate = q.quotationDate || q.quotation_date;
                                        const vDays = q.validityDays || q.validity_days || 30;
                                        const custName = q.customerName || q.customer_name;
                                        const cPerson = q.contactPerson || q.contact_person;
                                        const gNum = q.gstNumber || q.gst_number;
                                        const tType = q.templateType || q.template_type;
                                        const taxAmt = q.taxableAmount !== undefined ? q.taxableAmount : (q.taxable_amount || 0);
                                        const totalAmt = q.total || 0;
                                        const appStatus = q.approvalStatus || q.approval_status || 'PENDING';

                                        return (
                                            <tr key={q.id}>
                                                <td className="text-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedIds.includes(q.id)}
                                                        onChange={() => handleSelectRow(q.id)}
                                                    />
                                                </td>
                                                <td className="text-center text-muted fw-bold font-monospace" style={{ fontSize: '11px' }}>
                                                    #{q.id}
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1.5">
                                                        <Link
                                                            to={isApproved ? '#' : `/sales/quotation/${q.id}/edit`}
                                                            onClick={(e) => {
                                                                if (isApproved) {
                                                                    e.preventDefault();
                                                                    setPreviewQuotation(q);
                                                                }
                                                            }}
                                                            className="quote-number-link fw-bold theme-crimson"
                                                            title={isApproved ? 'Approved & Locked - Click to Preview PDF' : 'Click to Edit Quotation'}
                                                        >
                                                            {qNo}
                                                        </Link>
                                                    </div>
                                                    <div className="d-flex align-items-center gap-1.5 mt-1">
                                                        <span className="badge-rev">
                                                            REV-{String(qRevNo).padStart(2, '0')}
                                                        </span>
                                                        <span className="text-muted small" style={{ fontSize: '11px' }}>
                                                            ({itemsCount} {itemsCount === 1 ? 'Item' : 'Items'})
                                                        </span>
                                                        {isApproved && (
                                                            <FaLock size={10} className="text-muted ms-0.5" title="Quotation Approved & Locked" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fw-semibold text-dark">
                                                        {qDate ? new Date(qDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </div>
                                                    <div className="text-muted small d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '11px' }}>
                                                        <FaRegClock size={10} className="text-muted flex-shrink-0" />
                                                        <span>Valid: {vDays} Days</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '280px' }} title={custName}>
                                                        {custName}
                                                    </div>
                                                    {cPerson ? (
                                                        <div className="text-muted small d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '11px' }}>
                                                            <FaUserTie size={10} className="text-muted flex-shrink-0" />
                                                            <span className="text-truncate" style={{ maxWidth: '260px' }}>Attn: {cPerson}</span>
                                                        </div>
                                                    ) : gNum ? (
                                                        <div className="text-muted small d-flex align-items-center gap-1 mt-0.5 font-monospace" style={{ fontSize: '11px' }}>
                                                            <FaBuilding size={10} className="text-muted flex-shrink-0" />
                                                            <span>{gNum}</span>
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="text-center">
                                                    {tType === 'MATRIX' ? (
                                                        <span className="badge-template matrix">
                                                            <FaThList size={10} className="me-1" /> 8-Col Matrix
                                                        </span>
                                                    ) : (
                                                        <span className="badge-template cards">
                                                            <FaLayerGroup size={10} className="me-1" /> Dynamic Cards
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-end fw-semibold text-secondary">
                                                    ₹{Number(taxAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="text-end">
                                                    <div className="fw-bold" style={{ color: '#047857' }}>
                                                        ₹{Number(totalAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: '10.5px' }}>
                                                        (Tax: ₹{Number(totalAmt - taxAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`status-pill status-${appStatus.toLowerCase()}`}>
                                                        {appStatus === 'APPROVED' && <FaCheckCircle size={10} />}
                                                        {appStatus === 'PENDING' && <FaClock size={10} />}
                                                        {appStatus === 'REJECTED' && <FaTimesCircle size={10} />}
                                                        <span>{appStatus}</span>
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="btn-group btn-group-sm quotation-actions-group">
                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Live PDF Preview</Tooltip>}>
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="btn-action-preview"
                                                                onClick={() => setPreviewQuotation(q)}
                                                            >
                                                                <FaEye size={12} className="theme-crimson" />
                                                            </Button>
                                                        </OverlayTrigger>

                                                        <OverlayTrigger placement="top" overlay={<Tooltip>Download PDF</Tooltip>}>
                                                            <Button
                                                                variant="light"
                                                                size="sm"
                                                                className="btn-action-download"
                                                                onClick={() => downloadPdfMutation.mutate(q.id)}
                                                                disabled={downloadPdfMutation.isPending}
                                                            >
                                                                <FaDownload size={11} className="text-secondary" />
                                                            </Button>
                                                        </OverlayTrigger>

                                                        {!isTrash ? (
                                                            <>
                                                                <OverlayTrigger
                                                                    placement="top"
                                                                    overlay={<Tooltip>{isApproved ? 'Quotation Locked (Create Revision)' : 'Edit Quotation'}</Tooltip>}
                                                                >
                                                                    <Link
                                                                        to={`/sales/quotation/${q.id}/edit`}
                                                                        className="btn btn-light btn-sm btn-action-edit d-flex align-items-center"
                                                                    >
                                                                        <FaEdit size={11} className="text-primary" />
                                                                    </Link>
                                                                </OverlayTrigger>

                                                                <Dropdown align="end">
                                                                    <Dropdown.Toggle variant="light" size="sm" className="btn-action-more" id={`action-dropdown-${q.id}`}>
                                                                        ⋮
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu className="shadow-sm border-0 py-1" style={{ minWidth: '185px' }}>
                                                                        <Dropdown.Item onClick={() => navigateWithBranch(`/sales/quotation/${q.id}/duplicate`, 'Select Branch for Duplicate Offer')}>
                                                                            <FaCopy className="me-2 text-primary" size={12} /> Duplicate Offer
                                                                        </Dropdown.Item>

                                                                        {isApproved ? (
                                                                            <Dropdown.Item
                                                                                onClick={() => {
                                                                                    if (window.confirm(`Create formal revision REV-${String(qRevNo + 1).padStart(2, '0')} for Quotation #${qNo}?`)) {
                                                                                        revisionMutation.mutate({ id: q.id });
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <FaHistory className="me-2 text-danger" size={12} /> Create Revision (REV-{String(qRevNo + 1).padStart(2, '0')})
                                                                            </Dropdown.Item>
                                                                        ) : (
                                                                            <Dropdown.Item onClick={() => approveMutation.mutate({ id: q.id, approvalStatus: 'APPROVED' })}>
                                                                                <FaCheck className="me-2 text-success" size={12} /> Admin Approve
                                                                            </Dropdown.Item>
                                                                        )}

                                                                        <Dropdown.Divider />

                                                                        <Dropdown.Item
                                                                            className="text-danger"
                                                                            onClick={() => {
                                                                                if (window.confirm('Move quotation to trash?')) {
                                                                                    deleteMutation.mutate(q.id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <FaTrash className="me-2" size={12} /> Move to Trash
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </>
                                                        ) : (
                                                            <OverlayTrigger placement="top" overlay={<Tooltip>Restore from Recycle Bin</Tooltip>}>
                                                                <Button
                                                                    variant="light"
                                                                    size="sm"
                                                                    className="btn-action-restore"
                                                                    onClick={() => restoreMutation.mutate(q.id)}
                                                                >
                                                                    <FaUndo size={11} className="text-success" />
                                                                </Button>
                                                            </OverlayTrigger>
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

                    {/* Pagination Footer */}
                    {quotations.length > 0 && (
                        <div className="p-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-top bg-light-subtle">
                            <span className="text-muted small">
                                Showing <b>{pageStart}</b> to <b>{pageEnd}</b> of <b>{totalItems}</b> entries
                            </span>
                            <PaginationBar
                                page={page}
                                pageSize={pageSize}
                                total={totalItems}
                                totalPages={totalPages}
                                onPageChange={(newPage) => {
                                    handlePageChange(newPage);
                                    setSelectedIds([]);
                                }}
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Embedded Live PDF Modal */}
            <QuotationPdfModal
                show={Boolean(previewQuotation)}
                onHide={() => setPreviewQuotation(null)}
                quotationId={previewQuotation?.id}
                quotationNo={previewQuotation?.quotationNo || previewQuotation?.quotation_no}
                revisionNo={previewQuotation?.revisionNo !== undefined ? previewQuotation?.revisionNo : (previewQuotation?.revision_no || 0)}
                initialIncludeAnnexure={previewQuotation?.includeAnnexure !== false}
            />

            {/* Multi-Branch Selector Modal */}
            {BranchModal}
        </div>
    );
};

export default QuotationList;
