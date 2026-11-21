import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Row, Col, Table, Button, Form, Spinner, FormCheck, OverlayTrigger, Tooltip, Badge, Dropdown } from 'react-bootstrap';
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
    FaBan,
    FaEye,
    FaFileInvoiceDollar,
    FaCheckCircle,
    FaClock,
    FaLayerGroup,
    FaPlus
} from 'react-icons/fa';
import './invoice-list-modern.scss';
import QuickPaymentModal from '../../payments/components/modals/QuickPaymentModal';
import InvoicePaymentHistoryModal from '../../payments/components/modals/InvoicePaymentHistoryModal';
import CancelInvoiceModal from '../components/CancelInvoiceModal';
import InvoiceFilterPopover from '../components/InvoiceFilterPopover';
import InvoiceActiveFiltersBar from '../components/InvoiceActiveFiltersBar';
import { useInvoiceActiveChips } from '../hooks/useInvoiceActiveChips';
import { useParties } from '../../party/hooks/usePartyApi';
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
import TableActionMenu, { useTableActionMenu } from '../../../components/common/TableActionMenu';

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
        handleTabChange: handlePaginationTabChange
    } = useListPagination({
        initialPageSize: 10
    });

    // Invoice Filters Hook (Synchronized with URL query parameters)
    const {
        statusFilter,
        partyId,
        isOverdue,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        ewayBillFilter,
        datePreset,
        activeFilterCount,
        handleStatusChange,
        handleRemoveFilter,
        handleResetFilters,
        getDateLabel,
        updateFilterParams
    } = useInvoiceFilters({
        clearSearch,
        onFilterChange: () => handleDeselectAll?.()
    });

    // Master-Detail Filter Popover State & Anchor Ref
    const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
    const filterBtnRef = useRef(null);

    // Fetch active parties for active chip display
    const { data: partiesForChips = [] } = useParties({
        page: 1,
        pageSize: 250,
        trash: false
    });

    const activePartyName = useMemo(() => {
        if (!partyId) return '';
        const found = partiesForChips.find((p) => String(p.id) === String(partyId));
        return found ? (found.displayName || found.display_name || found.legalName || found.legal_name) : `Party #${partyId}`;
    }, [partiesForChips, partyId]);

    // Single-instance Action Menu state & handlers (prevents multi-menu stacking & clipping via Portal)
    const {
        activeMenu: activeActionMenu,
        toggleMenu,
        closeMenu,
        isOpen: isActionMenuOpen,
        tableWrapperProps
    } = useTableActionMenu([page, pageSize, debouncedSearch, statusFilter, isTrash]);

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
        hasEwayBill: ewayBillFilter,
        partyId,
        isOverdue,
        minAmount,
        maxAmount
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
        hasEwayBill: ewayBillFilter,
        partyId,
        isOverdue,
        minAmount,
        maxAmount
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
        isLoading: isSummaryLoading,
        isFetching: isSummaryFetching,
        refetch: refetchSummary
    } = useInvoiceSummary({
        search: debouncedSearch,
        trash: isTrash,
        paymentStatus: statusFilter,
        startDate,
        endDate,
        hasEwayBill: ewayBillFilter,
        partyId,
        isOverdue,
        minAmount,
        maxAmount
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

    // Dynamic Active Filter Chips Hook
    const activeFilterChips = useInvoiceActiveChips({
        partyId,
        activePartyName,
        statusFilter,
        isOverdue,
        startDate,
        endDate,
        datePreset,
        minAmount,
        maxAmount,
        ewayBillFilter,
        search,
        getDateLabel,
        handleRemoveFilter,
        clearSearch
    });

    const { pageStart, pageEnd, total: totalItems } = pagination;

    return (
        <>
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
                                    {isSummaryLoading ? (
                                        <>
                                            <div className="sk-kpi-value d-block" />
                                            <div className="sk-kpi-sub d-block" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="kpi-value font-monospace">
                                                ₹{kpiMetrics.totalInvoiced.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="kpi-subtext">
                                                <span>{kpiMetrics.totalCount} Active {kpiMetrics.totalCount === 1 ? 'Invoice' : 'Invoices'}</span>
                                            </div>
                                        </>
                                    )}
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
                                    {isSummaryLoading ? (
                                        <>
                                            <div className="sk-kpi-value d-block" />
                                            <div className="sk-kpi-sub d-block" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="kpi-value font-monospace text-success">
                                                ₹{kpiMetrics.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="kpi-subtext">
                                                <span className="text-success fw-semibold">
                                                    {kpiMetrics.totalInvoiced > 0 ? Math.round((kpiMetrics.totalPaid / kpiMetrics.totalInvoiced) * 100) : 0}%
                                                </span>
                                                <span>Collection Rate</span>
                                            </div>
                                        </>
                                    )}
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
                                    {isSummaryLoading ? (
                                        <>
                                            <div className="sk-kpi-value d-block" />
                                            <div className="sk-kpi-sub d-block" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="kpi-value font-monospace text-warning">
                                                ₹{kpiMetrics.totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="kpi-subtext">
                                                <span>{kpiMetrics.partialCount + kpiMetrics.unpaidCount} Pending Settlement</span>
                                            </div>
                                        </>
                                    )}
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
                                    {isSummaryLoading ? (
                                        <>
                                            <div className="sk-kpi-value d-block" />
                                            <div className="sk-kpi-sub d-block" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="kpi-value font-monospace">
                                                {kpiMetrics.totalCount}
                                            </div>
                                            <div className="kpi-subtext">
                                                <span>{kpiMetrics.fullyPaidCount} Paid · {kpiMetrics.partialCount} Partial · {kpiMetrics.unpaidCount} Due</span>
                                            </div>
                                        </>
                                    )}
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
                                        {/* Unified Search Input (Zero WebKit duplicate 'x', smooth focus ring) */}
                                        <div className="invoice-search-wrapper">
                                            <FaSearch size={11} className="search-leading-icon" />
                                            <input
                                                type="text"
                                                className="invoice-search-input"
                                                placeholder="Search invoice no, party, PO..."
                                                value={search}
                                                onChange={handleSearch}
                                                aria-label="Search invoices"
                                            />
                                            {search && (
                                                <button
                                                    type="button"
                                                    className="search-clear-btn"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        clearSearch();
                                                    }}
                                                    title="Clear search"
                                                    aria-label="Clear search"
                                                >
                                                    <FaTimes size={9} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Master-Detail Filter Button & Floating Overlay */}
                                        <div className="position-relative">
                                            <Button
                                                ref={filterBtnRef}
                                                variant="light"
                                                size="sm"
                                                className={`btn-filter-trigger ${isFilterPopoverOpen || activeFilterCount > 0 ? 'active' : ''}`}
                                                onClick={() => setIsFilterPopoverOpen((prev) => !prev)}
                                                title="Open Advanced Filters"
                                                aria-expanded={isFilterPopoverOpen}
                                            >
                                                <FaFilter size={11} />
                                                <span>Filter</span>
                                                {activeFilterCount > 0 && (
                                                    <span className="filter-count-badge">
                                                        {activeFilterCount}
                                                    </span>
                                                )}
                                            </Button>

                                            {/* Floating Master-Detail Overlay Popover (Zero Table Shift) */}
                                            <InvoiceFilterPopover
                                                isOpen={isFilterPopoverOpen}
                                                onClose={() => setIsFilterPopoverOpen(false)}
                                                anchorRef={filterBtnRef}
                                                filters={{
                                                    statusFilter,
                                                    partyId,
                                                    isOverdue,
                                                    minAmount,
                                                    maxAmount,
                                                    startDate,
                                                    endDate,
                                                    ewayBillFilter,
                                                    datePreset
                                                }}
                                                onApplyFilters={(newFilters) => {
                                                    updateFilterParams(newFilters);
                                                }}
                                                onResetFilters={handleResetFilters}
                                            />
                                        </div>

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
                                                <FaSyncAlt size={13} />
                                            </button>
                                        </OverlayTrigger>
                                    </div>
                                </div>

                                {/* Modern Active Filter Chips Bar (Modular Component) */}
                                <InvoiceActiveFiltersBar
                                    chips={activeFilterChips}
                                    onResetAll={handleResetFilters}
                                />
                            </div>

                            <div
                                className={`invoice-table-wrapper table-responsive ${isFetching && !isLoading ? 'is-fetching-data' : ''}`}
                                {...tableWrapperProps}
                            >
                                {isFetching && !isLoading && (
                                    <div className="table-progress-bar">
                                        <div className="table-progress-line" />
                                    </div>
                                )}
                                <Table id="invoice-list-table" className="invoice-modern-table align-middle mb-0" hover role="grid">
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
                                        {isLoading || (isFetching && invoice.length === 0) ? (
                                            Array.from({ length: 6 }).map((_, sIdx) => (
                                                <tr key={`sk-row-${sIdx}`}>
                                                    <td className="text-center" style={{ padding: '0.65rem 0.4rem' }}>
                                                        <div className="sk-checkbox" />
                                                    </td>
                                                    <td className="text-center" style={{ padding: '0.65rem 0.4rem' }}>
                                                        <div className="sk-id" />
                                                    </td>
                                                    <td style={{ padding: '0.65rem 0.6rem' }}>
                                                        <div className="d-flex align-items-center gap-1.5">
                                                            <div className="sk-inv-no" />
                                                            <div className="sk-branch-tag" />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '0.65rem 0.6rem' }}>
                                                        <div className="sk-date" />
                                                    </td>
                                                    <td style={{ padding: '0.65rem 0.6rem' }}>
                                                        <div className="sk-customer" />
                                                    </td>
                                                    {!isTrash && (
                                                        <>
                                                            <td className="text-end pe-3" style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-amount" />
                                                            </td>
                                                            <td className="text-end pe-3" style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-amount-lg" />
                                                            </td>
                                                            <td className="text-end pe-3" style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-amount" />
                                                            </td>
                                                            <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-pill" />
                                                            </td>
                                                            <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-pill-sm" />
                                                            </td>
                                                        </>
                                                    )}
                                                    <td style={{ padding: '0.65rem 0.6rem' }}>
                                                        <div className="sk-user" />
                                                    </td>
                                                    {isTrash ? (
                                                        <>
                                                            <td style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-date" style={{ width: '85px' }} />
                                                            </td>
                                                            <td style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-user" />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <td style={{ padding: '0.65rem 0.6rem' }}>
                                                            <div className="sk-date" style={{ width: '95px' }} />
                                                        </td>
                                                    )}
                                                    <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                        <div className="d-flex align-items-center justify-content-center gap-1.5">
                                                            <div className="sk-btn-pay" />
                                                            <div className="sk-btn-more" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : sortedList.length > 0 ? (
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

                                                                        {/* Secondary Actions 3-Dots Button */}
                                                                        <TableActionMenu.Trigger
                                                                            isActive={isActionMenuOpen(item.invoiceId)}
                                                                            id={`invoice-actions-${item.invoiceId}`}
                                                                            onClick={(e) => toggleMenu(item.invoiceId, item, e.currentTarget)}
                                                                        />
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

            {/* Single Row Action Dropdown Menu Portal */}
            <TableActionMenu.Overlay
                activeMenu={activeActionMenu}
                onClose={closeMenu}
            >
                {(item) => {
                    const { paid, total } = getFinancials(item);

                    return (
                        <>
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
                        </>
                    );
                }}
            </TableActionMenu.Overlay>

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