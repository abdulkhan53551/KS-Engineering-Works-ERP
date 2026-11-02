import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Row, Col, Table, Button, Form, Spinner, FormCheck, InputGroup, OverlayTrigger, Tooltip, Badge, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import {
    FaDownload,
    FaPen,
    FaTrash,
    FaUndo,
    FaExclamationTriangle,
    FaSearch,
    FaTimes,
    FaSyncAlt,
    FaCopy,
    FaMoneyCheckAlt,
    FaHistory,
    FaFilter,
    FaCheck,
    FaCalendarAlt,
    FaBan,
    FaEye,
    FaFileInvoiceDollar,
    FaCheckCircle,
    FaClock,
    FaLayerGroup,
    FaEllipsisV,
    FaPlus
} from 'react-icons/fa';
import './invoice-list-modern.scss';
import PageLoader from '../../../components/PageLoader';
import QuickPaymentModal from '../../payments/components/modals/QuickPaymentModal';
import InvoicePaymentHistoryModal from '../../payments/components/modals/InvoicePaymentHistoryModal';
import CancelInvoiceModal from '../components/CancelInvoiceModal';
import {
    useBulkDeleteInvoices,
    useBulkRestoreInvoices,
    useDeleteInvoice,
    useDownloadInvoice,
    useInvoice,
    useInvoicePagination,
    useInvoiceSummary,
    useRestoreInvoice,
    useCancelInvoice
} from '../hooks/useApi';
import useInvoiceSort from '../hooks/useInvoiceSort';
import useInvoiceFinancials from '../hooks/useInvoiceFinancials';
import PaginationBar from '../../../components/PaginationBar';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import { useListPagination, useRowSelection, usePageClamping } from '../../../hooks/useListManager';
import useInvoiceFilters from '../hooks/useInvoiceFilters';
import useTrashActions from '../../../hooks/useTrashActions';
import useBranchAction from '../../../hooks/useBranchAction';

const InvoiceList = () => {
    // Trash Action Helpers
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    } = useTrashActions({ entityName: 'Invoice' });

    // Branch check for multi-branch awareness
    const { navigateWithBranch, BranchModal } = useBranchAction();

    // API Mutations
    const { mutate: deleteInvoice } = useDeleteInvoice();
    const { mutate: restoreInvoice } = useRestoreInvoice();
    const { mutate: cancelInvoiceMutation, isPending: cancelIsPending } = useCancelInvoice();
    const { mutate: bulkDeleteInvoices } = useBulkDeleteInvoices();
    const { mutate: bulkRestoreInvoices } = useBulkRestoreInvoices();
    const { mutate: downloadInvoice, downloadingInvoiceId } = useDownloadInvoice();

    // Cancellation Modal State
    const [cancelModalInvoice, setCancelModalInvoice] = useState(null);

    const handleConfirmCancel = (id, cancelReason = '') => {
        cancelInvoiceMutation({ id, cancelReason }, {
            onSuccess: () => setCancelModalInvoice(null)
        });
    };

    // Payment Modals State
    const [quickPaymentInvoice, setQuickPaymentInvoice] = useState(null);
    const [historyModalState, setHistoryModalState] = useState({ show: false, invoiceId: null, invoiceNo: '' });

    // Financial calculations hook
    const { getFinancials } = useInvoiceFinancials();

    // Pagination & Search Manager Hook (Synchronized with URL query string)
    const {
        page,
        setPage,
        pageSize,
        setPageSize,
        search,
        debouncedSearch,
        isTrash,
        handleSearch,
        clearSearch,
        handlePageChange,
        handlePageSizeChange,
        handleTabChange: handlePaginationTabChange
    } = useListPagination({
        initialPageSize: 10
    });

    // Invoice Filters Hook (Synchronized with URL query parameters)
    const {
        statusFilter,
        startDate,
        endDate,
        ewayBillFilter,
        datePreset,
        hasActiveFilters,
        tempStartDate,
        setTempStartDate,
        tempEndDate,
        setTempEndDate,
        handleStatusChange,
        handleEwayBillChange,
        handleDatePresetChange,
        handleApplyCustomDates,
        handleResetFilters,
        getDateLabel
    } = useInvoiceFilters({
        clearSearch,
        onFilterChange: () => handleDeselectAll?.()
    });

    // Fetch data with all filters
    const {
        data: invoice = [],
        isLoading: isListLoading,
        isFetching: isListFetching,
        refetch: refetchList
    } = useInvoice({
        page,
        pageSize,
        search: debouncedSearch,
        trash: isTrash,
        paymentStatus: statusFilter,
        startDate,
        endDate,
        hasEwayBill: ewayBillFilter
    });

    const {
        data: pagination = {},
        isLoading: isPaginationLoading,
        isFetching: isPaginationFetching,
        refetch: refetchPagination
    } = useInvoicePagination({
        page,
        pageSize,
        search: debouncedSearch,
        trash: isTrash,
        paymentStatus: statusFilter,
        startDate,
        endDate,
        hasEwayBill: ewayBillFilter
    });

    // Dedicated Financial KPI Summary Query (Independent of page/pageSize, 100% reactive to all filters)
    const {
        data: kpiMetrics = {
            totalInvoiced: 0,
            totalPaid: 0,
            totalBalance: 0,
            fullyPaidCount: 0,
            partialCount: 0,
            unpaidCount: 0,
            totalCount: 0
        },
        isFetching: isSummaryFetching,
        refetch: refetchSummary
    } = useInvoiceSummary({
        search: debouncedSearch,
        trash: isTrash,
        paymentStatus: statusFilter,
        startDate,
        endDate,
        hasEwayBill: ewayBillFilter
    });

    const isFetching = isListFetching || isPaginationFetching || isSummaryFetching;
    const isLoading = isListLoading || isPaginationLoading;

    const handleRefresh = () => {
        refetchList();
        refetchPagination();
        refetchSummary();
    };

    // Column Sorting Custom Hook
    const {
        sortConfig,
        setSortConfig,
        handleSort,
        renderSortIcon,
        sortedList
    } = useInvoiceSort({ items: invoice });

    // Row Selection Hook directly operates on sortedList
    const {
        selectedIds,
        handleSelectAll,
        handleSelectRow,
        handleDeselectAll,
        isAllSelected,
        isIndeterminate,
        selectedCount
    } = useRowSelection({
        items: sortedList,
        idKey: 'invoiceId'
    });

    // Auto-clamping: if current page exceeds totalPages (e.g. data reduction)
    usePageClamping({
        page,
        setPage,
        totalPages: pagination.totalPages,
        isLoading: isPaginationLoading
    });

    const handleTabChange = useCallback((trashState) => {
        handlePaginationTabChange(trashState);
        handleDeselectAll();
    }, [handlePaginationTabChange, handleDeselectAll]);

    const { pageStart, pageEnd, total: totalItems } = pagination;

    return (
        <>
            <PageLoader loading={isFetching && !isLoading} />
            <Row>
                <Col sm="12">
                    {/* Executive Financial KPI Cards */}
                    {!isTrash && (
                        <div className="invoice-kpi-grid">
                            {/* Card 1: Total Invoiced */}
                            <div className="invoice-kpi-card kpi-invoiced">
                                <div className="kpi-content">
                                    <div className="kpi-label">
                                        <FaFileInvoiceDollar size={13} className="text-primary" />
                                        <span>Total Invoiced</span>
                                    </div>
                                    <div className="kpi-value font-monospace">
                                        ₹{kpiMetrics.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="kpi-subtext">
                                        <span>{kpiMetrics.totalCount} Active {kpiMetrics.totalCount === 1 ? 'Invoice' : 'Invoices'}</span>
                                    </div>
                                </div>
                                <div className="kpi-icon-pill icon-invoiced">
                                    <FaFileInvoiceDollar size={18} />
                                </div>
                            </div>

                            {/* Card 2: Total Received */}
                            <div className="invoice-kpi-card kpi-collected">
                                <div className="kpi-content">
                                    <div className="kpi-label">
                                        <FaCheckCircle size={13} className="text-success" />
                                        <span>Total Received</span>
                                    </div>
                                    <div className="kpi-value font-monospace text-success">
                                        ₹{kpiMetrics.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="kpi-subtext">
                                        <span className="text-success fw-semibold">
                                            {kpiMetrics.totalInvoiced > 0 ? Math.round((kpiMetrics.totalPaid / kpiMetrics.totalInvoiced) * 100) : 0}%
                                        </span>
                                        <span>Collection Rate</span>
                                    </div>
                                </div>
                                <div className="kpi-icon-pill icon-collected">
                                    <FaCheckCircle size={18} />
                                </div>
                            </div>

                            {/* Card 3: Outstanding Due */}
                            <div className="invoice-kpi-card kpi-outstanding">
                                <div className="kpi-content">
                                    <div className="kpi-label">
                                        <FaClock size={13} className="text-warning" />
                                        <span>Outstanding Due</span>
                                    </div>
                                    <div className="kpi-value font-monospace text-warning">
                                        ₹{kpiMetrics.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <div className="kpi-subtext">
                                        <span>{kpiMetrics.partialCount + kpiMetrics.unpaidCount} Pending Settlement</span>
                                    </div>
                                </div>
                                <div className="kpi-icon-pill icon-outstanding">
                                    <FaClock size={18} />
                                </div>
                            </div>

                            {/* Card 4: Volume & Mix */}
                            <div className="invoice-kpi-card kpi-volume">
                                <div className="kpi-content">
                                    <div className="kpi-label">
                                        <FaLayerGroup size={13} style={{ color: '#8b5cf6' }} />
                                        <span>Invoice Volume</span>
                                    </div>
                                    <div className="kpi-value font-monospace">
                                        {kpiMetrics.totalCount}
                                    </div>
                                    <div className="kpi-subtext">
                                        <span>{kpiMetrics.fullyPaidCount} Paid · {kpiMetrics.partialCount} Partial · {kpiMetrics.unpaidCount} Due</span>
                                    </div>
                                </div>
                                <div className="kpi-icon-pill icon-volume">
                                    <FaLayerGroup size={18} />
                                </div>
                            </div>
                        </div>
                    )}

                    <Card className="shadow-sm border-0">
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-3 px-4 bg-white border-bottom">
                            <div className="header-title d-flex align-items-center gap-3">
                                <div className="invoice-title-icon-pill">
                                    <FaFileInvoiceDollar size={18} />
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h4 className="card-title mb-0 fw-bold text-dark">Tax Invoices</h4>
                                        {!isLoading && totalItems > 0 && (
                                            <Badge bg="soft-primary" className="text-primary fw-semibold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
                                                {totalItems} Total
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                                        Sales invoices, GST tax breakdowns, collections & PDF records
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2.5 flex-wrap">
                                <TrashTabFilter
                                    isTrash={isTrash}
                                    onTabChange={handleTabChange}
                                />
                                {!isTrash && (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        className="d-flex align-items-center gap-1.5 px-3 py-2 shadow-sm fw-semibold"
                                        style={{ borderRadius: '7px', fontSize: '0.82rem' }}
                                        onClick={() => navigateWithBranch('/sales/invoice/create', 'Select Branch for New Invoice')}
                                    >
                                        <FaPlus size={11} />
                                        <span>Add Invoice</span>
                                    </Button>
                                )}
                            </div>
                        </Card.Header>

                        <BulkActionBar
                            selectedCount={selectedCount}
                            isTrash={isTrash}
                            onBulkDelete={() => confirmBulkSoftDelete(selectedCount, () => {
                                bulkDeleteInvoices({ ids: selectedIds, isPermanentDelete: false });
                                handleDeselectAll();
                            })}
                            onBulkRestore={() => confirmBulkRestore(selectedCount, () => {
                                bulkRestoreInvoices({ ids: selectedIds });
                                handleDeselectAll();
                            })}
                            onBulkPermanentDelete={() => confirmBulkPermanentDelete(selectedCount, () => {
                                bulkDeleteInvoices({ ids: selectedIds, isPermanentDelete: true });
                                handleDeselectAll();
                            })}
                            onDeselectAll={handleDeselectAll}
                        />

                        <Card.Body className="px-0">
                            {/* Professional Controls & Filter Toolbar */}
                            <div className="px-4 py-3 bg-white border-bottom">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2.5">
                                    {/* Left Side: Modern Segmented Status Tabs */}
                                    {!isTrash ? (
                                        <div className="segmented-status-tabs">
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${!statusFilter ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('')}
                                            >
                                                All
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('PENDING')}
                                            >
                                                Unpaid
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'PARTIAL' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('PARTIAL')}
                                            >
                                                Partial
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'PAID' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('PAID')}
                                            >
                                                Paid
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
                                                type="search"
                                                placeholder="Search invoice no, party..."
                                                value={search}
                                                onChange={handleSearch}
                                                className="border-start-0 border-end-0 ps-1"
                                                style={{ fontSize: '0.82rem', height: '33px' }}
                                            />
                                            {search && (
                                                <Button
                                                    variant="white"
                                                    className="bg-white border border-start-0 text-muted px-2"
                                                    onClick={clearSearch}
                                                    title="Clear search"
                                                    style={{ height: '33px', borderTopRightRadius: '7px', borderBottomRightRadius: '7px' }}
                                                >
                                                    <FaTimes size={10} />
                                                </Button>
                                            )}
                                        </InputGroup>

                                        {/* Date Range Dropdown with Presets & Custom Pickers */}
                                        <Dropdown autoClose="outside">
                                            <Dropdown.Toggle
                                                size="sm"
                                                variant="light"
                                                className={`border d-flex align-items-center gap-1.5 shadow-none ${datePreset || startDate || endDate ? 'border-primary text-primary fw-semibold bg-soft-primary' : 'text-secondary bg-white'}`}
                                                style={{ fontSize: '0.82rem', borderRadius: '7px', height: '33px' }}
                                            >
                                                <FaCalendarAlt size={11} className={datePreset || startDate || endDate ? 'text-primary' : 'text-muted'} />
                                                <span className="text-truncate">{getDateLabel()}</span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="shadow-lg border-0 p-3" style={{ minWidth: '295px', zIndex: 1060 }}>
                                                <div className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                                    Quick Presets
                                                </div>
                                                <div className="d-flex flex-wrap gap-1.5 mb-3">
                                                    <Button
                                                        variant={datePreset === 'today' ? 'primary' : 'light'}
                                                        size="sm"
                                                        className="py-1 px-2.5 border"
                                                        style={{ fontSize: '0.76rem' }}
                                                        onClick={() => handleDatePresetChange('today')}
                                                    >
                                                        Today
                                                    </Button>
                                                    <Button
                                                        variant={datePreset === 'thisMonth' ? 'primary' : 'light'}
                                                        size="sm"
                                                        className="py-1 px-2.5 border"
                                                        style={{ fontSize: '0.76rem' }}
                                                        onClick={() => handleDatePresetChange('thisMonth')}
                                                    >
                                                        This Month
                                                    </Button>
                                                    <Button
                                                        variant={datePreset === 'lastMonth' ? 'primary' : 'light'}
                                                        size="sm"
                                                        className="py-1 px-2.5 border"
                                                        style={{ fontSize: '0.76rem' }}
                                                        onClick={() => handleDatePresetChange('lastMonth')}
                                                    >
                                                        Last Month
                                                    </Button>
                                                    <Button
                                                        variant={datePreset === 'thisFY' ? 'primary' : 'light'}
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
                                                <div className="d-flex justify-content-between align-items-center pt-2">
                                                    {(startDate || endDate || datePreset) ? (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="p-0 text-danger text-decoration-none"
                                                            style={{ fontSize: '0.76rem' }}
                                                            onClick={() => {
                                                                handleDatePresetChange('all');
                                                                setTempStartDate('');
                                                                setTempEndDate('');
                                                            }}
                                                        >
                                                            Clear Date
                                                        </Button>
                                                    ) : <span />}
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        className="px-3 py-1"
                                                        style={{ fontSize: '0.78rem' }}
                                                        onClick={handleApplyCustomDates}
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                            </Dropdown.Menu>
                                        </Dropdown>

                                        {/* E-Way Bill Filter */}
                                        <Dropdown>
                                            <Dropdown.Toggle
                                                size="sm"
                                                variant="light"
                                                className={`border d-flex align-items-center gap-1.5 shadow-none ${ewayBillFilter ? 'border-primary text-primary fw-semibold bg-soft-primary' : 'text-secondary bg-white'}`}
                                                style={{ fontSize: '0.82rem', borderRadius: '7px', height: '33px' }}
                                            >
                                                <span className="text-truncate">
                                                    {ewayBillFilter === 'true' ? 'With E-Way' : ewayBillFilter === 'false' ? 'Without E-Way' : 'All E-Way'}
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="shadow-lg border-0 py-1" style={{ minWidth: '165px', zIndex: 1060 }}>
                                                <Dropdown.Item
                                                    active={!ewayBillFilter}
                                                    onClick={() => handleEwayBillChange('')}
                                                    className="d-flex align-items-center justify-content-between py-1.5"
                                                >
                                                    <span>All E-Way Bills</span>
                                                    {!ewayBillFilter && <FaCheck size={11} className="text-primary" />}
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    active={ewayBillFilter === 'true'}
                                                    onClick={() => handleEwayBillChange('true')}
                                                    className="d-flex align-items-center justify-content-between py-1.5"
                                                >
                                                    <span>With E-Way Bill</span>
                                                    {ewayBillFilter === 'true' && <FaCheck size={11} className="text-primary" />}
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    active={ewayBillFilter === 'false'}
                                                    onClick={() => handleEwayBillChange('false')}
                                                    className="d-flex align-items-center justify-content-between py-1.5"
                                                >
                                                    <span>Without E-Way Bill</span>
                                                    {ewayBillFilter === 'false' && <FaCheck size={11} className="text-primary" />}
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>

                                        {/* Refresh Button */}
                                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-refresh-invoices">Refresh invoices</Tooltip>}>
                                            <button
                                                type="button"
                                                className={`btn-filter-refresh ${isFetching ? 'is-refreshing' : ''}`}
                                                onClick={handleRefresh}
                                                disabled={isFetching}
                                                aria-label="Refresh invoices"
                                                title="Refresh invoices"
                                            >
                                                <FaSyncAlt size={14} />
                                            </button>
                                        </OverlayTrigger>

                                        {/* Reset Filters Button */}
                                        {hasActiveFilters && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={handleResetFilters}
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

                                {/* Active Filter Chips / Badges Row */}
                                {hasActiveFilters && (
                                    <div className="d-flex align-items-center gap-2 flex-wrap pt-2.5 mt-2.5 border-top">
                                        <span className="text-muted small fw-semibold" style={{ fontSize: '0.74rem' }}>
                                            <FaFilter size={10} className="me-1 text-primary" /> Active Filters:
                                        </span>
                                        {statusFilter && (
                                            <Badge
                                                bg="soft-primary"
                                                text="primary"
                                                className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 fw-medium border border-primary border-opacity-25 rounded-pill"
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                Status: {statusFilter === 'PAID' ? 'Paid' : statusFilter === 'PARTIAL' ? 'Partially Paid' : 'Pending'}
                                                <FaTimes
                                                    className="cursor-pointer ms-1 hover-opacity"
                                                    size={9}
                                                    onClick={() => handleStatusChange('')}
                                                />
                                            </Badge>
                                        )}
                                        {(startDate || endDate || datePreset) && (
                                            <Badge
                                                bg="soft-warning"
                                                text="dark"
                                                className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 fw-medium border border-warning border-opacity-25 rounded-pill"
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                Date: {getDateLabel()}
                                                <FaTimes
                                                    className="cursor-pointer ms-1 hover-opacity"
                                                    size={9}
                                                    onClick={() => handleDatePresetChange('all')}
                                                />
                                            </Badge>
                                        )}
                                        {ewayBillFilter && (
                                            <Badge
                                                bg="soft-info"
                                                text="dark"
                                                className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 fw-medium border border-info border-opacity-25 rounded-pill"
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                E-Way: {ewayBillFilter === 'true' ? 'With E-Way' : 'No E-Way'}
                                                <FaTimes
                                                    className="cursor-pointer ms-1 hover-opacity"
                                                    size={9}
                                                    onClick={() => handleEwayBillChange('')}
                                                />
                                            </Badge>
                                        )}
                                        {search && (
                                            <Badge
                                                bg="soft-secondary"
                                                text="dark"
                                                className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 fw-medium border rounded-pill"
                                                style={{ fontSize: '0.75rem' }}
                                            >
                                                Search: "{search}"
                                                <FaTimes
                                                    className="cursor-pointer ms-1 hover-opacity"
                                                    size={9}
                                                    onClick={clearSearch}
                                                />
                                            </Badge>
                                        )}
                                        <Button
                                            variant="link"
                                            size="sm"
                                            onClick={handleResetFilters}
                                            className="p-0 text-danger text-decoration-none small ms-1"
                                            style={{ fontSize: '0.74rem' }}
                                        >
                                            Clear all
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="table-responsive">
                                <Table id="invoice-list-table" className="invoice-modern-table align-middle mb-0" hover responsive role="grid">
                                    <thead>
                                        <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            <th className="text-center" style={{ width: '40px', minWidth: '40px', padding: '0.65rem 0.4rem' }}>
                                                <FormCheck
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    ref={(el) => {
                                                        if (el) el.indeterminate = isIndeterminate;
                                                    }}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th
                                                className="text-center cursor-pointer user-select-none"
                                                style={{ width: '55px', minWidth: '55px', padding: '0.65rem 0.4rem' }}
                                                onClick={() => handleSort('invoiceId')}
                                            >
                                                #ID {renderSortIcon('invoiceId')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none"
                                                style={{ minWidth: '135px', padding: '0.65rem 0.6rem' }}
                                                onClick={() => handleSort('invoiceNo')}
                                            >
                                                Invoice No {renderSortIcon('invoiceNo')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none"
                                                style={{ minWidth: '115px', padding: '0.65rem 0.6rem' }}
                                                onClick={() => handleSort('invoiceDate')}
                                            >
                                                Date {renderSortIcon('invoiceDate')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none"
                                                style={{ minWidth: '180px', padding: '0.65rem 0.6rem' }}
                                                onClick={() => handleSort('customerName')}
                                            >
                                                Customer Name {renderSortIcon('customerName')}
                                            </th>
                                            {!isTrash && (
                                                <>
                                                    <th
                                                        className="text-end pe-3 cursor-pointer user-select-none"
                                                        style={{ minWidth: '120px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('taxableAmount')}
                                                    >
                                                        Total Taxable {renderSortIcon('taxableAmount')}
                                                    </th>
                                                    <th
                                                        className="text-end pe-3 cursor-pointer user-select-none"
                                                        style={{ minWidth: '125px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('total')}
                                                    >
                                                        Total Amount {renderSortIcon('total')}
                                                    </th>
                                                    <th
                                                        className="text-end pe-3 cursor-pointer user-select-none"
                                                        style={{ minWidth: '130px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('balanceAmount')}
                                                    >
                                                        Balance Due {renderSortIcon('balanceAmount')}
                                                    </th>
                                                    <th
                                                        className="text-center cursor-pointer user-select-none"
                                                        style={{ minWidth: '115px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('paymentStatusCode')}
                                                    >
                                                        Status {renderSortIcon('paymentStatusCode')}
                                                    </th>
                                                    <th
                                                        className="text-center cursor-pointer user-select-none"
                                                        style={{ minWidth: '100px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('paymentModeCode')}
                                                    >
                                                        Mode {renderSortIcon('paymentModeCode')}
                                                    </th>
                                                </>
                                            )}
                                            <th
                                                className="cursor-pointer user-select-none"
                                                style={{ minWidth: '110px', padding: '0.65rem 0.6rem' }}
                                                onClick={() => handleSort('createdBy')}
                                            >
                                                Created By {renderSortIcon('createdBy')}
                                            </th>
                                            {isTrash ? (
                                                <>
                                                    <th
                                                        className="cursor-pointer user-select-none"
                                                        style={{ minWidth: '140px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('deletedAt')}
                                                    >
                                                        Deleted Date {renderSortIcon('deletedAt')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none"
                                                        style={{ minWidth: '120px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('deletedBy')}
                                                    >
                                                        Deleted By {renderSortIcon('deletedBy')}
                                                    </th>
                                                </>
                                            ) : (
                                                <th
                                                    className="cursor-pointer user-select-none"
                                                    style={{ minWidth: '140px', padding: '0.65rem 0.6rem' }}
                                                    onClick={() => handleSort('updatedAt')}
                                                >
                                                    Last Modified {renderSortIcon('updatedAt')}
                                                </th>
                                            )}
                                            <th className="text-center" style={{ width: '95px', minWidth: '95px', padding: '0.65rem 0.6rem' }}>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '0.85rem' }}>
                                        {sortedList.length > 0 ? (
                                            sortedList.map((item, idx) => {
                                                const { total, paid, balance, isFullyPaid, hasBalance } = getFinancials(item);
                                                return (
                                                    <tr key={item.invoiceId || idx} className={selectedIds.includes(item.invoiceId) ? 'table-active' : ''}>
                                                        <td className="text-center" style={{ padding: '0.65rem 0.4rem' }}>
                                                            <FormCheck
                                                                type="checkbox"
                                                                checked={selectedIds.includes(item.invoiceId)}
                                                                onChange={() => handleSelectRow(item.invoiceId)}
                                                            />
                                                        </td>
                                                        <td className="text-center text-muted font-monospace small" style={{ padding: '0.65rem 0.4rem' }}>
                                                            {item.invoiceId}
                                                        </td>
                                                        <td style={{ padding: '0.65rem 0.6rem' }}>
                                                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                                                <Link
                                                                    to={`/sales/invoice/${item.invoiceId}/edit`}
                                                                    className="invoice-no-link"
                                                                    title="View / Edit Invoice"
                                                                >
                                                                    {item.invoiceNo}
                                                                </Link>
                                                                {item.firmBranchCode && (
                                                                    <Badge bg="soft-secondary" className="text-secondary border small px-1.5 py-0.5" style={{ fontSize: '0.62rem' }} title={`Branch: ${item.firmBranchName || item.firmBranchCode}`}>
                                                                        {item.firmBranchCode}
                                                                    </Badge>
                                                                )}
                                                                {item.status === 'Cancelled' && (
                                                                    <span
                                                                        className="badge rounded-pill fw-semibold font-monospace"
                                                                        style={{
                                                                            backgroundColor: '#fee2e2',
                                                                            color: '#b91c1c',
                                                                            border: '1px solid #fecaca',
                                                                            fontSize: '0.62rem',
                                                                            letterSpacing: '0.04em',
                                                                            padding: '2px 6px'
                                                                        }}
                                                                    >
                                                                        CANCELLED
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.65rem 0.6rem' }}>
                                                            {item.invoiceDate ? moment(item.invoiceDate).format('DD MMM YYYY') : '-'}
                                                        </td>
                                                        <td style={{ padding: '0.65rem 0.6rem' }}>
                                                            <span className="fw-semibold text-dark text-truncate d-inline-block" style={{ maxWidth: '200px' }} title={item.customerName}>
                                                                {item.customerName}
                                                            </span>
                                                        </td>
                                                        {!isTrash && (
                                                            <>
                                                                <td className="text-end pe-3 font-monospace text-muted" style={{ padding: '0.65rem 0.6rem', fontSize: '0.84rem' }}>
                                                                    ₹{Number(item.taxableAmount ?? item.totalTaxableAmount ?? item.subTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="text-end pe-3 font-monospace fw-bold text-dark" style={{ padding: '0.65rem 0.6rem', fontSize: '0.86rem' }}>
                                                                    ₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="text-end pe-3" style={{ padding: '0.65rem 0.6rem' }}>
                                                                    {isFullyPaid ? (
                                                                        <span className="fintech-pill fintech-pill-paid">
                                                                            <span className="status-dot"></span>
                                                                            <span>₹0.00</span>
                                                                        </span>
                                                                    ) : (
                                                                        <div className="d-flex flex-column align-items-end">
                                                                            <span className="font-monospace fw-bold text-danger" style={{ fontSize: '0.86rem' }}>
                                                                                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                            {paid > 0 && (
                                                                                <span className="text-muted small font-monospace" style={{ fontSize: '0.70rem' }}>
                                                                                    Paid: ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                                    {item.status === 'Cancelled' ? (
                                                                        <span className="fintech-pill fintech-pill-cancelled">
                                                                            <span className="status-dot"></span>
                                                                            <span>Cancelled</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span
                                                                            className={`fintech-pill fintech-pill-${(item.paymentStatusCode || 'pending').toLowerCase()} cursor-pointer`}
                                                                            title="Click to view payment history"
                                                                            onClick={() => setHistoryModalState({
                                                                                show: true,
                                                                                invoiceId: item.invoiceId,
                                                                                invoiceNo: item.invoiceNo
                                                                            })}
                                                                        >
                                                                            <span className="status-dot"></span>
                                                                            <span>{item.paymentStatusCode || 'PENDING'}</span>
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                                    {item.paymentModeCode ? (
                                                                        <span className="fintech-mode-pill">{item.paymentModeCode}</span>
                                                                    ) : (
                                                                        <span className="text-muted">—</span>
                                                                    )}
                                                                </td>
                                                            </>
                                                        )}
                                                        <td style={{ padding: '0.65rem 0.6rem', fontSize: '0.82rem' }} className="text-secondary">
                                                            {item.createdBy || '—'}
                                                        </td>
                                                        {isTrash ? (
                                                            <>
                                                                <td style={{ padding: '0.65rem 0.6rem' }}>
                                                                    <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                        {item.deletedAt ? moment(item.deletedAt).format('DD MMM YYYY, hh:mm A') : '—'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.65rem 0.6rem', fontSize: '0.82rem' }}>
                                                                    {item.deletedBy || '—'}
                                                                </td>
                                                            </>
                                                        ) : (
                                                            <td style={{ padding: '0.65rem 0.6rem' }}>
                                                                <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                    {item.updatedAt ? moment(item.updatedAt).format('DD MMM YYYY, hh:mm A') : (item.createdAt ? moment(item.createdAt).format('DD MMM YYYY, hh:mm A') : '—')}
                                                                </span>
                                                            </td>
                                                        )}
                                                        <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                            <div className="d-flex align-items-center justify-content-center gap-1.5 action-btn-group">
                                                                {!isTrash ? (
                                                                    <>
                                                                        {/* Primary Action Button */}
                                                                        {item.status !== 'Cancelled' && hasBalance ? (
                                                                            <Button
                                                                                size="sm"
                                                                                className="btn-action-primary-pay d-flex align-items-center gap-1"
                                                                                title="Record Payment"
                                                                                onClick={() => setQuickPaymentInvoice({
                                                                                    ...item,
                                                                                    partyId: item.partyId || item.party_id,
                                                                                    balanceAmount: balance,
                                                                                    paidAmount: paid
                                                                                })}
                                                                            >
                                                                                <FaMoneyCheckAlt size={12} />
                                                                                <span>Pay</span>
                                                                            </Button>
                                                                        ) : (
                                                                            <Button
                                                                                variant="light"
                                                                                size="sm"
                                                                                className="btn-action-primary-pdf d-flex align-items-center justify-content-center"
                                                                                title="Download PDF"
                                                                                disabled={downloadingInvoiceId === item.invoiceId}
                                                                                onClick={() => downloadInvoice({ invoiceId: item.invoiceId, invoiceNo: item.invoiceNo })}
                                                                            >
                                                                                {downloadingInvoiceId === item.invoiceId ? (
                                                                                    <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
                                                                                ) : (
                                                                                    <FaDownload size={11} className="text-secondary" />
                                                                                )}
                                                                            </Button>
                                                                        )}

                                                                        {/* Secondary Actions 3-Dots Dropdown */}
                                                                        <Dropdown align="end">
                                                                            <Dropdown.Toggle
                                                                                as="button"
                                                                                className="btn-action-more-dots"
                                                                                title="More actions"
                                                                                id={`invoice-actions-${item.invoiceId}`}
                                                                            >
                                                                                <FaEllipsisV size={13} />
                                                                            </Dropdown.Toggle>

                                                                            <Dropdown.Menu className="action-dropdown-menu shadow">
                                                                                <Dropdown.Item
                                                                                    className="d-flex align-items-center gap-2"
                                                                                    onClick={() => setHistoryModalState({
                                                                                        show: true,
                                                                                        invoiceId: item.invoiceId,
                                                                                        invoiceNo: item.invoiceNo
                                                                                    })}
                                                                                >
                                                                                    <FaHistory size={12} className="text-muted" />
                                                                                    <span>Payment History</span>
                                                                                </Dropdown.Item>

                                                                                <Dropdown.Item
                                                                                    className="d-flex align-items-center gap-2"
                                                                                    disabled={downloadingInvoiceId === item.invoiceId}
                                                                                    onClick={() => downloadInvoice({ invoiceId: item.invoiceId, invoiceNo: item.invoiceNo })}
                                                                                >
                                                                                    <FaDownload size={12} className="text-muted" />
                                                                                    <span>Download PDF</span>
                                                                                </Dropdown.Item>

                                                                                <Dropdown.Item
                                                                                    as={Link}
                                                                                    to={`/sales/invoice/${item.invoiceId}/edit`}
                                                                                    className="d-flex align-items-center gap-2"
                                                                                >
                                                                                    {item.status === 'Cancelled' ? (
                                                                                        <>
                                                                                            <FaEye size={12} className="text-muted" />
                                                                                            <span>View Details</span>
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <FaPen size={12} className="text-muted" />
                                                                                            <span>Edit Invoice</span>
                                                                                        </>
                                                                                    )}
                                                                                </Dropdown.Item>

                                                                                <Dropdown.Item
                                                                                    as={Link}
                                                                                    to={`/sales/invoice/${item.invoiceId}/duplicate`}
                                                                                    className="d-flex align-items-center gap-2"
                                                                                >
                                                                                    <FaCopy size={12} className="text-muted" />
                                                                                    <span>Duplicate / Clone</span>
                                                                                </Dropdown.Item>

                                                                                <Dropdown.Divider className="my-1" />

                                                                                {item.status !== 'Cancelled' && (
                                                                                    <Dropdown.Item
                                                                                        className="d-flex align-items-center gap-2 text-danger"
                                                                                        disabled={paid > 0}
                                                                                        title={paid > 0 ? `Cannot cancel: ₹${paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })} payment recorded` : "Cancel Invoice"}
                                                                                        onClick={() => setCancelModalInvoice({ ...item, total, paidAmount: paid })}
                                                                                    >
                                                                                        <FaBan size={12} />
                                                                                        <span>Cancel Invoice</span>
                                                                                    </Dropdown.Item>
                                                                                )}

                                                                                <Dropdown.Item
                                                                                    className="d-flex align-items-center gap-2 text-danger"
                                                                                    onClick={() => confirmSoftDelete(`Invoice "${item.invoiceNo}"`, () => deleteInvoice({ id: item.invoiceId, isPermanentDelete: false }))}
                                                                                >
                                                                                    <FaTrash size={12} />
                                                                                    <span>Move to Bin</span>
                                                                                </Dropdown.Item>
                                                                            </Dropdown.Menu>
                                                                        </Dropdown>
                                                                    </>
                                                                ) : (
                                                                    <div className="d-flex align-items-center gap-1.5">
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="btn-action-trash"
                                                                            title="Restore"
                                                                            onClick={() => confirmRestore(`Invoice "${item.invoiceNo}"`, () => restoreInvoice(item.invoiceId))}
                                                                        >
                                                                            <FaUndo size={11} />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size="sm"
                                                                            className="btn-action-trash"
                                                                            title="Delete Permanently"
                                                                            onClick={() => confirmPermanentDelete(`Invoice "${item.invoiceNo}"`, () => deleteInvoice({ id: item.invoiceId, isPermanentDelete: true }))}
                                                                        >
                                                                            <FaExclamationTriangle size={11} />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={isTrash ? 8 : 12} className="text-center py-5 text-muted">
                                                    <div className="py-3">
                                                        <p className="mb-0 fs-6">
                                                            {isTrash
                                                                ? (debouncedSearch ? `No deleted invoices matching "${debouncedSearch}"` : 'Recycle Bin is empty.')
                                                                : (debouncedSearch ? `No invoices matching "${debouncedSearch}"` : 'No invoices found.')
                                                            }
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {invoice.length > 0 && (
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 py-3 px-4 border-top">
                                    <div className="d-flex align-items-center gap-3 text-muted small">
                                        <span>
                                            Showing <strong className="text-dark">{pageStart}</strong> to <strong className="text-dark">{pageEnd}</strong> of <strong className="text-dark">{totalItems}</strong> entries
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
                                        total={totalItems}
                                        totalPages={pagination.totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Quick Payment Settlement Modal */}
            {quickPaymentInvoice && (
                <QuickPaymentModal
                    show={!!quickPaymentInvoice}
                    invoice={quickPaymentInvoice}
                    onHide={() => {
                        setQuickPaymentInvoice(null);
                        refetchList();
                        refetchPagination();
                    }}
                />
            )}

            {/* Payment History Audit Modal */}
            <InvoicePaymentHistoryModal
                show={historyModalState.show}
                invoiceId={historyModalState.invoiceId}
                invoiceNo={historyModalState.invoiceNo}
                onHide={() => setHistoryModalState({ show: false, invoiceId: null, invoiceNo: '' })}
            />

            {/* Cancel Invoice Confirmation Modal */}
            <CancelInvoiceModal
                show={!!cancelModalInvoice}
                onHide={() => setCancelModalInvoice(null)}
                invoice={cancelModalInvoice}
                onConfirm={handleConfirmCancel}
                isLoading={cancelIsPending}
                onOpenPaymentHistory={(invoiceId, invoiceNo) => {
                    setCancelModalInvoice(null);
                    setHistoryModalState({ show: true, invoiceId, invoiceNo });
                }}
            />

            {/* Branch Selection Modal for Consolidated Mode */}
            <BranchModal />
        </>
    );
};

export default InvoiceList;