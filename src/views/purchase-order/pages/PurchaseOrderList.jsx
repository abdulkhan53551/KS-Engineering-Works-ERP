import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Table, Button, Form, FormCheck, InputGroup, OverlayTrigger, Tooltip, Badge, Dropdown, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Card from '../../../components/Card';
import {
    FaPen,
    FaTrash,
    FaUndo,
    FaSearch,
    FaTimes,
    FaSyncAlt,
    FaFileContract,
    FaFileInvoice,
    FaPlus,
    FaEllipsisV,
    FaBuilding,
    FaCheckCircle,
    FaClock,
    FaLayerGroup,
    FaCalendarAlt,
    FaFilter,
    FaEye
} from 'react-icons/fa';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import {
    useBulkDeletePurchaseOrders,
    useBulkRestorePurchaseOrders,
    useDeletePurchaseOrder,
    usePurchaseOrder,
    usePurchaseOrderPagination,
    usePurchaseOrderSummary,
    useRestorePurchaseOrder
} from '../hooks/useApi';
import usePurchaseOrderSort from '../hooks/usePurchaseOrderSort';
import usePurchaseOrderFilters from '../hooks/usePurchaseOrderFilters';
import PaginationBar from '../../../components/PaginationBar';
import TrashTabFilter from '../../../components/trash/TrashTabFilter';
import BulkActionBar from '../../../components/trash/BulkActionBar';
import moment from 'moment';
import { useListPagination, useRowSelection, usePageClamping } from '../../../hooks/useListManager';
import useTrashActions from '../../../hooks/useTrashActions';
import useBranchAction from '../../../hooks/useBranchAction';

// Import modern invoice styling system for 100% unified enterprise UI
import '../../invoice/pages/invoice-list-modern.scss';
import '../../invoice/pages/invoice.scss';

const PurchaseOrderList = () => {
    // Multi-branch context modal
    const { navigateWithBranch, BranchModal } = useBranchAction();

    // Trash Action Helpers
    const {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    } = useTrashActions({ entityName: 'Purchase Order' });

    // API Mutations
    const { mutate: deletePurchaseOrder } = useDeletePurchaseOrder();
    const { mutate: restorePurchaseOrder } = useRestorePurchaseOrder();
    const { mutate: bulkDeletePurchaseOrders } = useBulkDeletePurchaseOrders();
    const { mutate: bulkRestorePurchaseOrders } = useBulkRestorePurchaseOrders();

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

    // PO Filters Hook (Synchronized with URL query parameters: status, startDate, endDate, datePreset)
    const {
        statusFilter,
        startDate,
        endDate,
        datePreset,
        hasActiveFilters,
        tempStartDate,
        setTempStartDate,
        tempEndDate,
        setTempEndDate,
        handleStatusChange,
        handleDatePresetChange,
        handleApplyCustomDates,
        handleResetFilters,
        getDateLabel
    } = usePurchaseOrderFilters({
        clearSearch,
        onFilterChange: () => handleDeselectAll?.()
    });

    // Fetch Paginated List Data
    const {
        data: purchaseOrder = [],
        isLoading: isListLoading,
        isFetching: isListFetching,
        refetch: refetchList
    } = usePurchaseOrder({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        trash: isTrash,
        startDate,
        endDate
    });

    // Fetch Meta Pagination
    const {
        data: pagination = {},
        isLoading: isPaginationLoading,
        isFetching: isPaginationFetching,
        refetch: refetchPagination
    } = usePurchaseOrderPagination({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        trash: isTrash,
        startDate,
        endDate
    });

    // Dedicated Financial KPI Summary Query (Database-wide aggregate across all filters)
    const {
        data: kpiMetrics = {
            totalCount: 0,
            totalOrderValue: 0,
            totalBilledValue: 0,
            totalPendingValue: 0,
            openCount: 0,
            partialCount: 0,
            completedCount: 0
        },
        isLoading: isSummaryLoading,
        isFetching: isSummaryFetching,
        refetch: refetchSummary
    } = usePurchaseOrderSummary({
        search: debouncedSearch,
        status: statusFilter,
        trash: isTrash,
        startDate,
        endDate
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
        handleSort,
        renderSortIcon,
        sortedList
    } = usePurchaseOrderSort({ items: purchaseOrder });

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
        idKey: 'poId'
    });

    // Auto-clamping: if current page exceeds totalPages (e.g. data filtering reduction)
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

    const totalItems = pagination.total || sortedList.length;

    // Fulfillment Rate Percentage
    const fulfillmentRate = useMemo(() => {
        if (!kpiMetrics.totalOrderValue || kpiMetrics.totalOrderValue <= 0) return 0;
        return Math.min(100, Math.round((kpiMetrics.totalBilledValue / kpiMetrics.totalOrderValue) * 100));
    }, [kpiMetrics.totalOrderValue, kpiMetrics.totalBilledValue]);

    return (
        <>
            {BranchModal}

            <Row>
                <Col sm="12">
                    {/* Executive Financial KPI Cards */}
                    {!isTrash && (
                        <div className="invoice-kpi-grid">
                            {/* Card 1: Total Contract / Order Value */}
                            <div className="invoice-kpi-card kpi-invoiced">
                                <div className="kpi-content">
                                    <div className="kpi-label">
                                        <FaFileContract size={13} className="text-primary" />
                                        <span>Total Order Value</span>
                                    </div>
                                    {isSummaryLoading ? (
                                        <>
                                            <div className="sk-kpi-value d-block" />
                                            <div className="sk-kpi-sub d-block" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="kpi-value font-monospace">
                                                ₹{kpiMetrics.totalOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="kpi-subtext">
                                                <span>{kpiMetrics.totalCount} Active {kpiMetrics.totalCount === 1 ? 'Purchase Order' : 'Purchase Orders'}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="kpi-icon-pill icon-invoiced">
                                    <FaFileContract size={18} />
                                </div>
                            </div>

                            {/* Card 2: Billed / Invoiced Progress */}
                            <div className="invoice-kpi-card kpi-collected">
                                <div className="kpi-content">
                                    <div className="kpi-label">
                                        <FaCheckCircle size={13} className="text-success" />
                                        <span>Billed / Invoiced</span>
                                    </div>
                                    {isSummaryLoading ? (
                                        <>
                                            <div className="sk-kpi-value d-block" />
                                            <div className="sk-kpi-sub d-block" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="kpi-value font-monospace text-success">
                                                ₹{kpiMetrics.totalBilledValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="kpi-subtext">
                                                <span className="text-success fw-semibold">
                                                    {fulfillmentRate}%
                                                </span>
                                                <span>Order Fulfillment</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="kpi-icon-pill icon-collected">
                                    <FaCheckCircle size={18} />
                                </div>
                            </div>

                            {/* Card 3: Pending Unbilled Balance */}
                            <div className="invoice-kpi-card kpi-outstanding">
                                <div className="kpi-content">
                                    <div className="kpi-label">
                                        <FaClock size={13} className="text-warning" />
                                        <span>Pending / Unbilled</span>
                                    </div>
                                    {isSummaryLoading ? (
                                        <>
                                            <div className="sk-kpi-value d-block" />
                                            <div className="sk-kpi-sub d-block" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="kpi-value font-monospace text-warning">
                                                ₹{kpiMetrics.totalPendingValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            <div className="kpi-subtext">
                                                <span>{kpiMetrics.openCount + kpiMetrics.partialCount} Pending Fulfillment</span>
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
                                        <span>PO Volume</span>
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
                                                <span>{kpiMetrics.completedCount} Completed · {kpiMetrics.partialCount} Partial · {kpiMetrics.openCount} Open</span>
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
                        {/* Executive Header Bar */}
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-3 py-3 px-4 bg-white border-bottom">
                            <div className="header-title d-flex align-items-center gap-3">
                                <div className="invoice-title-icon-pill">
                                    <FaFileContract size={18} />
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h4 className="card-title mb-0 fw-bold text-dark">
                                            Customer Purchase Orders
                                        </h4>
                                        {!isLoading && totalItems > 0 && (
                                            <Badge bg="soft-primary" className="text-primary fw-semibold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.74rem' }}>
                                                {totalItems} Total
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted small mb-0 mt-0.5" style={{ fontSize: '0.78rem' }}>
                                        Client inward work orders, commercial terms, and sales invoice billing progress
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2.5 flex-wrap">
                                <TrashTabFilter
                                    isTrash={isTrash}
                                    onTabChange={handleTabChange}
                                    activeCount={!isTrash ? totalItems : undefined}
                                    trashCount={isTrash ? totalItems : undefined}
                                />
                                {!isTrash && (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        className="d-flex align-items-center gap-1.5 px-3 py-2 shadow-sm fw-semibold"
                                        style={{ borderRadius: '7px', fontSize: '0.82rem' }}
                                        onClick={() => navigateWithBranch('/purchase/purchase-order/create', 'Select Branch for Purchase Order')}
                                    >
                                        <FaPlus size={11} />
                                        <span>New Customer PO</span>
                                    </Button>
                                )}
                            </div>
                        </Card.Header>

                        {/* Bulk Actions Bar */}
                        <BulkActionBar
                            selectedCount={selectedCount}
                            isTrash={isTrash}
                            onBulkDelete={() =>
                                confirmBulkSoftDelete(selectedCount, () => {
                                    bulkDeletePurchaseOrders({ ids: selectedIds, isPermanentDelete: false });
                                    handleDeselectAll();
                                })
                            }
                            onBulkPermanentDelete={() =>
                                confirmBulkPermanentDelete(selectedCount, () => {
                                    bulkDeletePurchaseOrders({ ids: selectedIds, isPermanentDelete: true });
                                    handleDeselectAll();
                                })
                            }
                            onBulkRestore={() =>
                                confirmBulkRestore(selectedCount, () => {
                                    bulkRestorePurchaseOrders({ ids: selectedIds });
                                    handleDeselectAll();
                                })
                            }
                            onDeselectAll={handleDeselectAll}
                        />

                        {/* Controls & Filter Toolbar */}
                        <Card.Body className="px-0">
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
                                                <span>All Orders</span>
                                                <span className="tab-badge">{kpiMetrics.totalCount}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'OPEN' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('OPEN')}
                                            >
                                                <span>Open</span>
                                                <span className="tab-badge tab-badge-warning">{kpiMetrics.openCount}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'PARTIALLY_INVOICED' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('PARTIALLY_INVOICED')}
                                            >
                                                <span>Partially Invoiced</span>
                                                <span className="tab-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                                                    {kpiMetrics.partialCount}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                className={`status-tab-btn ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
                                                onClick={() => handleStatusChange('COMPLETED')}
                                            >
                                                <span>Completed</span>
                                                <span className="tab-badge tab-badge-success">{kpiMetrics.completedCount}</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="d-flex align-items-center gap-2 text-danger small fw-semibold">
                                            <FaTrash size={12} />
                                            <span>Recycle Bin (Deleted Records)</span>
                                        </div>
                                    )}

                                    {/* Right Side: Entries, Search & Date Controls Group */}
                                    <div className="d-flex align-items-center flex-wrap gap-2 ms-auto">
                                        {/* Entries Show Selector */}
                                        <div className="d-flex align-items-center">
                                            <Form.Label className="mb-0 text-muted small me-2" style={{ fontSize: '0.78rem' }}>Show</Form.Label>
                                            <Form.Select
                                                size="sm"
                                                className="form-select-sm"
                                                style={{ width: '5.2rem', fontSize: '0.80rem', height: '33px' }}
                                                value={pageSize}
                                                onChange={handlePageSizeChange}
                                            >
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </Form.Select>
                                        </div>

                                        {/* Search Input */}
                                        <InputGroup size="sm" style={{ width: '250px' }} className="shadow-none">
                                            <InputGroup.Text className="bg-white border-end-0 text-muted ps-2.5 pe-1" style={{ borderTopLeftRadius: '7px', borderBottomLeftRadius: '7px', height: '33px' }}>
                                                <FaSearch size={11} />
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="search"
                                                placeholder="Search PO #, client, party..."
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

                                        {/* Date Range Dropdown with Quick Presets & Custom Pickers */}
                                        <Dropdown align="end" autoClose="outside">
                                            <Dropdown.Toggle
                                                size="sm"
                                                variant="light"
                                                className={`border d-flex align-items-center gap-1.5 shadow-none ${datePreset || startDate || endDate ? 'border-primary text-primary fw-semibold bg-soft-primary' : 'text-secondary bg-white'}`}
                                                style={{ fontSize: '0.82rem', borderRadius: '7px', height: '33px' }}
                                            >
                                                <FaCalendarAlt size={11} className={datePreset || startDate || endDate ? 'text-primary' : 'text-muted'} />
                                                <span className="text-truncate">{getDateLabel()}</span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu align="end" className="shadow-lg border-0 p-3" style={{ width: '340px', zIndex: 1060 }}>
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

                                                <div className="custom-date-range-box rounded-3">
                                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                                        <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                                            Custom Range
                                                        </span>
                                                        {(tempStartDate || tempEndDate) && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                                                                style={{ fontSize: '0.70rem' }}
                                                                onClick={() => {
                                                                    setTempStartDate('');
                                                                    setTempEndDate('');
                                                                }}
                                                            >
                                                                Reset
                                                            </button>
                                                        )}
                                                    </div>
                                                    <Row className="g-2">
                                                        <Col xs={6} className="from-date-col">
                                                            <Form.Label className="text-muted small mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.70rem', fontWeight: 600 }}>
                                                                <FaCalendarAlt size={9} className="text-primary" />
                                                                <span>From Date</span>
                                                            </Form.Label>
                                                            <div className="modern-date-field">
                                                                <Flatpickr
                                                                    value={tempStartDate ? moment(tempStartDate).toDate() : null}
                                                                    onChange={(dates) => {
                                                                        const formatted = dates[0] ? moment(dates[0]).format('YYYY-MM-DD') : '';
                                                                        setTempStartDate(formatted);
                                                                    }}
                                                                    options={{
                                                                        dateFormat: 'Y-m-d',
                                                                        altInput: true,
                                                                        altFormat: 'd/m/Y',
                                                                        altInputClass: 'form-control form-control-sm modern-date-input',
                                                                        allowInput: false,
                                                                        disableMobile: true,
                                                                        static: true
                                                                    }}
                                                                    className="form-control form-control-sm modern-date-input"
                                                                    placeholder="Select date"
                                                                />
                                                                <FaCalendarAlt className="modern-date-icon" size={11} />
                                                            </div>
                                                        </Col>
                                                        <Col xs={6} className="to-date-col">
                                                            <Form.Label className="text-muted small mb-1 d-flex align-items-center gap-1" style={{ fontSize: '0.70rem', fontWeight: 600 }}>
                                                                <FaCalendarAlt size={9} className="text-primary" />
                                                                <span>To Date</span>
                                                            </Form.Label>
                                                            <div className="modern-date-field">
                                                                <Flatpickr
                                                                    value={tempEndDate ? moment(tempEndDate).toDate() : null}
                                                                    onChange={(dates) => {
                                                                        const formatted = dates[0] ? moment(dates[0]).format('YYYY-MM-DD') : '';
                                                                        setTempEndDate(formatted);
                                                                    }}
                                                                    options={{
                                                                        dateFormat: 'Y-m-d',
                                                                        altInput: true,
                                                                        altFormat: 'd/m/Y',
                                                                        altInputClass: 'form-control form-control-sm modern-date-input',
                                                                        allowInput: false,
                                                                        disableMobile: true,
                                                                        static: true,
                                                                        minDate: tempStartDate ? moment(tempStartDate).toDate() : undefined
                                                                    }}
                                                                    className="form-control form-control-sm modern-date-input"
                                                                    placeholder="Select date"
                                                                />
                                                                <FaCalendarAlt className="modern-date-icon" size={11} />
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </div>
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

                                        {/* Refresh Button */}
                                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-refresh-po">Refresh purchase orders</Tooltip>}>
                                            <button
                                                type="button"
                                                className={`btn-filter-refresh ${isFetching ? 'is-refreshing' : ''}`}
                                                onClick={handleRefresh}
                                                disabled={isFetching}
                                                aria-label="Refresh orders"
                                                title="Refresh orders"
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

                                {/* Active Filter Chips Row */}
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
                                                Status: {statusFilter === 'COMPLETED' ? 'Completed' : statusFilter === 'PARTIALLY_INVOICED' ? 'Partially Invoiced' : 'Open'}
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

                            {/* Table Area with Progress Bar */}
                            <div className={`invoice-table-wrapper table-responsive ${isFetching && !isLoading ? 'is-fetching-data' : ''}`}>
                                {isFetching && !isLoading && (
                                    <div className="table-progress-bar">
                                        <div className="table-progress-line" />
                                    </div>
                                )}

                                <Table id="po-list-table" className="invoice-modern-table align-middle mb-0" hover responsive role="grid">
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
                                                    disabled={sortedList.length === 0}
                                                />
                                            </th>
                                            <th
                                                className="text-center cursor-pointer user-select-none"
                                                style={{ width: '55px', minWidth: '55px', padding: '0.65rem 0.4rem' }}
                                                onClick={() => handleSort('poId')}
                                            >
                                                #ID {renderSortIcon('poId')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none"
                                                style={{ minWidth: '135px', padding: '0.65rem 0.6rem' }}
                                                onClick={() => handleSort('poNo')}
                                            >
                                                PO Number {renderSortIcon('poNo')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none"
                                                style={{ minWidth: '115px', padding: '0.65rem 0.6rem' }}
                                                onClick={() => handleSort('poDate')}
                                            >
                                                Date {renderSortIcon('poDate')}
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
                                                        Taxable Amount {renderSortIcon('taxableAmount')}
                                                    </th>
                                                    <th
                                                        className="text-end pe-3 cursor-pointer user-select-none"
                                                        style={{ minWidth: '130px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('totalAmount')}
                                                    >
                                                        Order Value {renderSortIcon('totalAmount')}
                                                    </th>
                                                    <th
                                                        className="text-end pe-3 cursor-pointer user-select-none"
                                                        style={{ minWidth: '135px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('billedAmount')}
                                                    >
                                                        Billed Value {renderSortIcon('billedAmount')}
                                                    </th>
                                                    <th
                                                        className="text-center cursor-pointer user-select-none"
                                                        style={{ minWidth: '130px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('invoicedQuantity')}
                                                    >
                                                        Billed Qty {renderSortIcon('invoicedQuantity')}
                                                    </th>
                                                    <th
                                                        className="text-center cursor-pointer user-select-none"
                                                        style={{ minWidth: '115px', padding: '0.65rem 0.6rem' }}
                                                        onClick={() => handleSort('status')}
                                                    >
                                                        Status {renderSortIcon('status')}
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
                                        {isLoading || (isFetching && purchaseOrder.length === 0) ? (
                                            Array.from({ length: pageSize > 10 ? 8 : 6 }).map((_, sIdx) => (
                                                <tr key={`sk-po-${sIdx}`}>
                                                    <td className="text-center" style={{ padding: '0.65rem 0.4rem' }}>
                                                        <div className="sk-checkbox" />
                                                    </td>
                                                    <td className="text-center" style={{ padding: '0.65rem 0.4rem' }}>
                                                        <div className="sk-id" />
                                                    </td>
                                                    <td style={{ padding: '0.65rem 0.6rem' }}>
                                                        <div className="sk-inv-no" />
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
                                                                <div className="sk-pill-sm mx-auto" style={{ width: '75px' }} />
                                                            </td>
                                                            <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                                <div className="sk-pill" />
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
                                        ) : sortedList.length === 0 ? (
                                            <tr>
                                                <td colSpan={isTrash ? 9 : 13} className="text-center py-5 text-muted">
                                                    <div className="empty-state-wrapper py-3">
                                                        <FaFileContract size={36} className="text-muted mb-2 opacity-50" />
                                                        <h6 className="fw-semibold text-secondary">No Customer Purchase Orders Found</h6>
                                                        <p className="small text-muted mb-3">
                                                            {search ? 'No purchase orders match your search query.' : isTrash ? 'The Recycle Bin is currently empty.' : 'Start by recording customer inward work orders and contracts.'}
                                                        </p>
                                                        {!isTrash && (
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => navigateWithBranch('/purchase/purchase-order/create', 'Select Branch for Purchase Order')}
                                                            >
                                                                Create First Purchase Order
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedList.map((item, index) => {
                                                const isSelected = selectedIds.includes(item.poId);
                                                const isCompleted = item.status === 'COMPLETED';
                                                const isPartial = item.status === 'PARTIALLY_INVOICED';
                                                const billedAmt = Number(item.billedAmount || 0);
                                                const totalAmt = Number(item.totalAmount || 0);
                                                const billedQty = Number(item.invoicedQuantity || 0);
                                                const totalQty = Number(item.totalQuantity || 0);

                                                return (
                                                    <tr key={item.poId || index} className={isSelected ? 'table-active' : ''}>
                                                        {/* Checkbox */}
                                                        <td className="text-center" style={{ padding: '0.65rem 0.4rem' }}>
                                                            <FormCheck
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleSelectRow(item.poId)}
                                                            />
                                                        </td>

                                                        {/* #ID */}
                                                        <td className="text-center text-muted font-monospace small" style={{ padding: '0.65rem 0.4rem' }}>
                                                            {item.poId}
                                                        </td>

                                                        {/* PO Number */}
                                                        <td style={{ padding: '0.65rem 0.6rem' }}>
                                                            <Link
                                                                to={`/purchase/purchase-order/${item.poId}/edit`}
                                                                className="invoice-no-link"
                                                                title="View / Edit Purchase Order"
                                                            >
                                                                #{item.poNo}
                                                            </Link>
                                                        </td>

                                                        {/* Date & Due Date */}
                                                        <td style={{ padding: '0.65rem 0.6rem' }}>
                                                            <div className="fw-medium text-dark">
                                                                {item.poDate ? moment(item.poDate).format('DD MMM YYYY') : '-'}
                                                            </div>
                                                            {item.deliveryDueDate && (
                                                                <div className="text-muted small mt-0.5" style={{ fontSize: '0.72rem' }}>
                                                                    Due: {moment(item.deliveryDueDate).format('DD MMM')}
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* Customer / Party */}
                                                        <td style={{ padding: '0.65rem 0.6rem' }}>
                                                            <span className="fw-semibold text-dark text-truncate d-inline-block" style={{ maxWidth: '220px' }} title={item.partyDisplayName || item.partyLegalName || item.customerName}>
                                                                {item.partyDisplayName || item.partyLegalName || item.customerName || 'N/A'}
                                                            </span>
                                                            <div className="text-muted small d-flex align-items-center gap-1.5 mt-0.5" style={{ fontSize: '0.72rem' }}>
                                                                {item.partyBranchName && item.partyBranchName.toUpperCase() !== 'HO' && (
                                                                    <span className="d-flex align-items-center gap-1 text-secondary">
                                                                        <FaBuilding size={9} /> {item.partyBranchName}
                                                                    </span>
                                                                )}
                                                                {item.partyGstin && (
                                                                    <span className="font-monospace text-muted">
                                                                        • GSTIN: {item.partyGstin}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Active Columns */}
                                                        {!isTrash && (
                                                            <>
                                                                {/* Taxable Amount */}
                                                                <td className="text-end pe-3 font-monospace text-muted" style={{ padding: '0.65rem 0.6rem', fontSize: '0.84rem' }}>
                                                                    ₹{Number(item.taxableAmount || item.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>

                                                                {/* Order Value (Grand Total) */}
                                                                <td className="text-end pe-3" style={{ padding: '0.65rem 0.6rem' }}>
                                                                    <div className="font-monospace fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                                                                        ₹{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                    </div>
                                                                </td>

                                                                {/* Billed Value */}
                                                                <td className="text-end pe-3" style={{ padding: '0.65rem 0.6rem' }}>
                                                                    {billedAmt > 0 ? (
                                                                        <div className="d-flex flex-column align-items-end">
                                                                            <span className="font-monospace fw-bold text-success" style={{ fontSize: '0.86rem' }}>
                                                                                ₹{billedAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                            </span>
                                                                            {item.invoiceNo && (
                                                                                <span className="badge rounded-pill fw-semibold bg-soft-success text-success border border-success border-opacity-25 mt-0.5" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                                                                                    #{item.invoiceNo}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="fintech-pill fintech-pill-unpaid">
                                                                            <span className="status-dot"></span>
                                                                            <span>Unbilled</span>
                                                                        </span>
                                                                    )}
                                                                </td>

                                                                {/* Billed Qty (Fulfilled / Ordered) */}
                                                                <td className="text-center font-monospace" style={{ padding: '0.65rem 0.6rem' }}>
                                                                    <div className="d-flex flex-column align-items-center">
                                                                        <div>
                                                                            <span className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                                                                                {billedQty.toFixed(2)}
                                                                            </span>
                                                                            <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                                                                                {' '}/ {totalQty.toFixed(2)} Qty
                                                                            </span>
                                                                        </div>
                                                                        {totalQty > 0 && (
                                                                            <div className="progress mt-1" style={{ height: '4px', width: '80px', backgroundColor: '#e2e8f0', borderRadius: '2px' }}>
                                                                                <div
                                                                                    className={`progress-bar ${billedQty >= totalQty ? 'bg-success' : billedQty > 0 ? 'bg-primary' : 'bg-secondary'}`}
                                                                                    role="progressbar"
                                                                                    style={{ width: `${Math.min(100, Math.round((billedQty / totalQty) * 100))}%` }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Status */}
                                                                <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                                    {isCompleted ? (
                                                                        <span className="fintech-pill fintech-pill-paid">
                                                                            <span className="status-dot"></span>
                                                                            <span>COMPLETED</span>
                                                                        </span>
                                                                    ) : isPartial ? (
                                                                        <span className="fintech-pill fintech-pill-partial">
                                                                            <span className="status-dot"></span>
                                                                            <span>PARTIAL INVOICE</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="fintech-pill fintech-pill-pending">
                                                                            <span className="status-dot"></span>
                                                                            <span>OPEN ORDER</span>
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </>
                                                        )}

                                                        {/* Created By */}
                                                        <td style={{ padding: '0.65rem 0.6rem', fontSize: '0.82rem' }} className="text-secondary">
                                                            {item.createdBy || '—'}
                                                        </td>

                                                        {/* Trash vs Active Date Column */}
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

                                                        {/* Action Column */}
                                                        <td className="text-center" style={{ padding: '0.65rem 0.6rem' }}>
                                                            {isTrash ? (
                                                                <div className="action-btn-group d-flex justify-content-center align-items-center gap-1">
                                                                    <Button
                                                                        variant="light"
                                                                        size="sm"
                                                                        className="btn-action-restore"
                                                                        title="Restore PO"
                                                                        onClick={() => confirmRestore(`Purchase Order "${item.poNo}"`, () => restorePurchaseOrder(item.poId))}
                                                                    >
                                                                        <FaUndo size={11} className="text-success" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="light"
                                                                        size="sm"
                                                                        className="btn-action-trash"
                                                                        title="Delete Permanently"
                                                                        onClick={() => confirmPermanentDelete(`Purchase Order "${item.poNo}"`, () => deletePurchaseOrder({ id: item.poId, isPermanentDelete: true }))}
                                                                    >
                                                                        <FaTrash size={11} className="text-danger" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="d-flex align-items-center justify-content-center gap-1.5 action-btn-group">
                                                                    {/* Primary Action Button */}
                                                                    {!isCompleted ? (
                                                                        <Button
                                                                            size="sm"
                                                                            className="btn-action-primary-pay d-flex align-items-center gap-1"
                                                                            title="Convert to Sales Invoice"
                                                                            onClick={() => navigateWithBranch(`/sales/invoice/create?fromPoId=${item.poId}`, 'Select Branch for Invoice')}
                                                                        >
                                                                            <FaFileInvoice size={12} />
                                                                            <span>Invoice</span>
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            as={Link}
                                                                            to={`/purchase/purchase-order/${item.poId}/edit`}
                                                                            variant="light"
                                                                            size="sm"
                                                                            className="btn-action-primary-pdf d-flex align-items-center justify-content-center"
                                                                            title="View / Edit Purchase Order"
                                                                        >
                                                                            <FaEye size={11} className="text-secondary" />
                                                                        </Button>
                                                                    )}

                                                                    {/* Secondary Actions 3-Dots Dropdown */}
                                                                    <Dropdown align="end">
                                                                        <Dropdown.Toggle
                                                                            as="button"
                                                                            className="btn-action-more-dots"
                                                                            title="More actions"
                                                                            id={`po-actions-${item.poId}`}
                                                                        >
                                                                            <FaEllipsisV size={13} />
                                                                        </Dropdown.Toggle>

                                                                        <Dropdown.Menu className="action-dropdown-menu shadow">
                                                                            {!isCompleted && (
                                                                                <Dropdown.Item
                                                                                    className="d-flex align-items-center gap-2 text-primary fw-semibold"
                                                                                    onClick={() => navigateWithBranch(`/sales/invoice/create?fromPoId=${item.poId}`, 'Select Branch for Invoice')}
                                                                                >
                                                                                    <FaFileInvoice size={12} className="text-primary" />
                                                                                    <span>Convert to Sales Invoice</span>
                                                                                </Dropdown.Item>
                                                                            )}

                                                                            <Dropdown.Item
                                                                                as={Link}
                                                                                to={`/purchase/purchase-order/${item.poId}/edit`}
                                                                                className="d-flex align-items-center gap-2"
                                                                            >
                                                                                <FaPen size={12} className="text-muted" />
                                                                                <span>Edit Purchase Order</span>
                                                                            </Dropdown.Item>

                                                                            <Dropdown.Divider className="my-1" />

                                                                            <Dropdown.Item
                                                                                className="d-flex align-items-center gap-2 text-danger"
                                                                                onClick={() => confirmSoftDelete(`Purchase Order "${item.poNo}"`, () => deletePurchaseOrder({ id: item.poId, isPermanentDelete: false }))}
                                                                            >
                                                                                <FaTrash size={12} className="text-danger" />
                                                                                <span>Move to Recycle Bin</span>
                                                                            </Dropdown.Item>
                                                                        </Dropdown.Menu>
                                                                    </Dropdown>
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
                        </Card.Body>

                        {/* Pagination Footer */}
                        {!isLoading && sortedList.length > 0 && (
                            <Card.Footer className="bg-white border-top py-3 px-4">
                                <PaginationBar
                                    pagination={pagination}
                                    currentPage={page}
                                    pageSize={pageSize}
                                    onPageChange={handlePageChange}
                                    onPageSizeChange={handlePageSizeChange}
                                    totalCount={pagination.total || sortedList.length}
                                />
                            </Card.Footer>
                        )}
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default PurchaseOrderList;
