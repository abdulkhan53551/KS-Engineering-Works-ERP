import React, { useState, useCallback, useEffect } from 'react';
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
    FaCalendarAlt
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import QuickPaymentModal from '../../payments/components/modals/QuickPaymentModal';
import InvoicePaymentHistoryModal from '../../payments/components/modals/InvoicePaymentHistoryModal';
import {
    useBulkDeleteInvoices,
    useBulkRestoreInvoices,
    useDeleteInvoice,
    useDownloadInvoice,
    useInvoice,
    useInvoicePagination,
    useRestoreInvoice
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
    const { mutate: bulkDeleteInvoices } = useBulkDeleteInvoices();
    const { mutate: bulkRestoreInvoices } = useBulkRestoreInvoices();
    const { mutate: downloadInvoice, downloadingInvoiceId } = useDownloadInvoice();

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

    const isFetching = isListFetching || isPaginationFetching;
    const isLoading = isListLoading || isPaginationLoading;

    const handleRefresh = () => {
        refetchList();
        refetchPagination();
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
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <div className="header-title d-flex align-items-center gap-2">
                                <h4 className="card-title mb-0">Invoice</h4>
                                {!isLoading && totalItems > 0 && (
                                    <Badge bg="soft-primary" className="text-primary fw-semibold px-2 py-1">
                                        {totalItems} Total
                                    </Badge>
                                )}
                            </div>
                            <TrashTabFilter isTrash={isTrash} onTabChange={handleTabChange} />
                            <div>
                                {!isTrash && (
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => navigateWithBranch('/sales/invoice/create', 'Select Branch for New Invoice')}
                                    >
                                        + Add Invoice
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
                            <div className="px-4 pt-1 pb-3">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2.5">
                                    {/* Left Side: Show Entries Selector */}
                                    <div className="d-flex align-items-center text-muted small">
                                        <span className="me-1.5 text-secondary">Show</span>
                                        <Form.Select
                                            size="sm"
                                            className="form-select-sm border shadow-none"
                                            style={{ width: '4.8rem', borderRadius: '6px' }}
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
                                        <span className="ms-1.5 text-secondary">entries</span>
                                    </div>

                                    {/* Right Side: Search & Filter Controls Group */}
                                    <div className="d-flex align-items-center flex-wrap gap-2">
                                        {/* Search Input */}
                                        <InputGroup size="sm" style={{ width: '230px' }} className="shadow-none">
                                            <InputGroup.Text className="bg-white border-end-0 text-muted ps-2.5 pe-1">
                                                <FaSearch size={11} />
                                            </InputGroup.Text>
                                            <Form.Control
                                                type="search"
                                                placeholder="Search invoices..."
                                                value={search}
                                                onChange={handleSearch}
                                                className="border-start-0 border-end-0 ps-1"
                                                style={{ fontSize: '0.82rem' }}
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

                                        {/* Payment Status Dropdown */}
                                        <Dropdown>
                                            <Dropdown.Toggle
                                                size="sm"
                                                variant="light"
                                                className={`border d-flex align-items-center gap-1.5 shadow-none ${statusFilter ? 'border-primary text-primary fw-semibold bg-soft-primary' : 'text-secondary bg-white'}`}
                                                style={{ fontSize: '0.82rem', borderRadius: '6px' }}
                                            >
                                                <span className="text-truncate">
                                                    {statusFilter ? `Status: ${statusFilter === 'PAID' ? 'Paid' : statusFilter === 'PARTIAL' ? 'Partially Paid' : 'Pending'}` : 'All Statuses'}
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="shadow-lg border-0 py-1" style={{ minWidth: '175px' }}>
                                                <Dropdown.Item
                                                    active={!statusFilter}
                                                    onClick={() => handleStatusChange('')}
                                                    className="d-flex align-items-center justify-content-between py-1.5"
                                                >
                                                    <span>All Statuses</span>
                                                    {!statusFilter && <FaCheck size={11} className="text-primary" />}
                                                </Dropdown.Item>
                                                <Dropdown.Divider className="my-1" />
                                                <Dropdown.Item
                                                    active={statusFilter === 'PAID'}
                                                    onClick={() => handleStatusChange('PAID')}
                                                    className="d-flex align-items-center justify-content-between py-1.5"
                                                >
                                                    <span className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-success rounded-circle p-1"> </span>
                                                        <span>Paid</span>
                                                    </span>
                                                    {statusFilter === 'PAID' && <FaCheck size={11} className="text-primary" />}
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    active={statusFilter === 'PARTIAL'}
                                                    onClick={() => handleStatusChange('PARTIAL')}
                                                    className="d-flex align-items-center justify-content-between py-1.5"
                                                >
                                                    <span className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-info rounded-circle p-1"> </span>
                                                        <span>Partially Paid</span>
                                                    </span>
                                                    {statusFilter === 'PARTIAL' && <FaCheck size={11} className="text-primary" />}
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    active={statusFilter === 'PENDING'}
                                                    onClick={() => handleStatusChange('PENDING')}
                                                    className="d-flex align-items-center justify-content-between py-1.5"
                                                >
                                                    <span className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-warning rounded-circle p-1"> </span>
                                                        <span>Pending</span>
                                                    </span>
                                                    {statusFilter === 'PENDING' && <FaCheck size={11} className="text-primary" />}
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>

                                        {/* Date Range Dropdown with Presets & Custom Pickers */}
                                        <Dropdown autoClose="outside">
                                            <Dropdown.Toggle
                                                size="sm"
                                                variant="light"
                                                className={`border d-flex align-items-center gap-1.5 shadow-none ${datePreset || startDate || endDate ? 'border-primary text-primary fw-semibold bg-soft-primary' : 'text-secondary bg-white'}`}
                                                style={{ fontSize: '0.82rem', borderRadius: '6px' }}
                                            >
                                                <FaCalendarAlt size={11} className={datePreset || startDate || endDate ? 'text-primary' : 'text-muted'} />
                                                <span className="text-truncate">{getDateLabel()}</span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="shadow-lg border-0 p-3" style={{ minWidth: '295px' }}>
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
                                                style={{ fontSize: '0.82rem', borderRadius: '6px' }}
                                            >
                                                <span className="text-truncate">
                                                    {ewayBillFilter === 'true' ? 'With E-Way' : ewayBillFilter === 'false' ? 'Without E-Way' : 'All E-Way'}
                                                </span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu className="shadow-lg border-0 py-1" style={{ minWidth: '165px' }}>
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
                                        <OverlayTrigger placement="top" overlay={<Tooltip>Refresh list</Tooltip>}>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="border px-2.5 d-flex align-items-center text-muted bg-white shadow-none"
                                                style={{ height: '31px', borderRadius: '6px' }}
                                                onClick={handleRefresh}
                                                disabled={isFetching}
                                            >
                                                <FaSyncAlt size={11} className={isFetching ? 'fa-spin text-primary' : 'text-secondary'} />
                                            </Button>
                                        </OverlayTrigger>

                                        {/* Reset Filters Button */}
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
                                <Table id="invoice-list-table" className="table-sortable ms-1 me-1 align-middle mb-0" striped bordered hover responsive role="grid">
                                    <thead className="light">
                                        <tr style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            <th className="text-center" style={{ width: '40px', minWidth: '40px', padding: '0.45rem 0.3rem' }}>
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
                                                className="text-center cursor-pointer user-select-none py-2"
                                                style={{ width: '55px', minWidth: '55px', padding: '0.45rem 0.3rem' }}
                                                onClick={() => handleSort('invoiceId')}
                                            >
                                                #ID {renderSortIcon('invoiceId')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('invoiceNo')}
                                            >
                                                Invoice No {renderSortIcon('invoiceNo')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('invoiceDate')}
                                            >
                                                Invoice Date {renderSortIcon('invoiceDate')}
                                            </th>
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '200px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('customerName')}
                                            >
                                                Customer Name {renderSortIcon('customerName')}
                                            </th>
                                            {!isTrash && (
                                                <>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('taxableAmount')}
                                                    >
                                                        Total Taxable {renderSortIcon('taxableAmount')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('total')}
                                                    >
                                                        Total Amount {renderSortIcon('total')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('balanceAmount')}
                                                    >
                                                        Balance Due {renderSortIcon('balanceAmount')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('paymentStatusCode')}
                                                    >
                                                        Payment Status {renderSortIcon('paymentStatusCode')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('paymentModeCode')}
                                                    >
                                                        Payment Mode {renderSortIcon('paymentModeCode')}
                                                    </th>
                                                </>
                                            )}
                                            <th
                                                className="cursor-pointer user-select-none py-2"
                                                style={{ minWidth: '120px', padding: '0.45rem 0.5rem' }}
                                                onClick={() => handleSort('createdBy')}
                                            >
                                                Created By {renderSortIcon('createdBy')}
                                            </th>
                                            {isTrash ? (
                                                <>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '150px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('deletedAt')}
                                                    >
                                                        Deleted Date {renderSortIcon('deletedAt')}
                                                    </th>
                                                    <th
                                                        className="cursor-pointer user-select-none py-2"
                                                        style={{ minWidth: '130px', padding: '0.45rem 0.5rem' }}
                                                        onClick={() => handleSort('deletedBy')}
                                                    >
                                                        Deleted By {renderSortIcon('deletedBy')}
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
                                            <th className="text-center py-2" style={{ width: '120px', minWidth: '120px', padding: '0.45rem 0.5rem' }}>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ fontSize: '0.86rem' }}>
                                        {sortedList.length > 0 ? (
                                            sortedList.map((item, idx) => {
                                                const { total, paid, balance, isFullyPaid, hasBalance } = getFinancials(item);
                                                return (
                                                    <tr key={item.invoiceId || idx} className={selectedIds.includes(item.invoiceId) ? 'table-active' : ''}>
                                                        <td className="text-center" style={{ padding: '0.45rem 0.3rem' }}>
                                                            <FormCheck
                                                                type="checkbox"
                                                                checked={selectedIds.includes(item.invoiceId)}
                                                                onChange={() => handleSelectRow(item.invoiceId)}
                                                            />
                                                        </td>
                                                        <td className="text-center text-muted fw-medium" style={{ padding: '0.45rem 0.3rem' }}>{item.invoiceId}</td>
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>
                                                            <div className="d-flex align-items-center gap-1">
                                                                <span className="text-primary font-monospace fw-bold">{item.invoiceNo}</span>
                                                                {item.firmBranchCode && (
                                                                    <Badge bg="soft-secondary" className="text-secondary border small px-1.5 py-0.5" style={{ fontSize: '0.65rem' }} title={`Branch: ${item.firmBranchName || item.firmBranchCode}`}>
                                                                        {item.firmBranchCode}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>{item.invoiceDate ? moment(item.invoiceDate).format('DD/MM/YYYY') : '-'}</td>
                                                        <td style={{ padding: '0.45rem 0.5rem' }}><span className="fw-semibold text-dark">{item.customerName}</span></td>
                                                        {!isTrash && (
                                                            <>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>₹{Number(item.taxableAmount ?? item.totalTaxableAmount ?? item.subTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                                <td style={{ padding: '0.45rem 0.5rem' }} className="fw-semibold">₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                    {isFullyPaid ? (
                                                                        <Badge bg="soft-success" className="text-success font-monospace px-2 py-1">
                                                                            ₹0.00
                                                                        </Badge>
                                                                    ) : (
                                                                        <div>
                                                                            <span className="font-monospace fw-bold text-danger">
                                                                                ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                            </span>
                                                                            {paid > 0 && (
                                                                                <span className="text-muted d-block small" style={{ fontSize: '0.72rem' }}>
                                                                                    Paid: ₹{paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                    <span
                                                                        className={`badge ${item.color || 'bg-secondary'}`}
                                                                        style={{ cursor: 'pointer' }}
                                                                        title="Click to view payment history"
                                                                        onClick={() => setHistoryModalState({
                                                                            show: true,
                                                                            invoiceId: item.invoiceId,
                                                                            invoiceNo: item.invoiceNo
                                                                        })}
                                                                    >
                                                                        {item.paymentStatusCode || '-'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>{item.paymentModeCode || '-'}</td>
                                                            </>
                                                        )}
                                                        <td style={{ padding: '0.45rem 0.5rem' }}>{item.createdBy}</td>
                                                        {isTrash ? (
                                                            <>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                    <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                        {item.deletedAt ? moment(item.deletedAt).format('DD/MM/YYYY, hh:mm A') : '—'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.45rem 0.5rem' }}>{item.deletedBy || '—'}</td>
                                                            </>
                                                        ) : (
                                                            <td style={{ padding: '0.45rem 0.5rem' }}>
                                                                <span className="text-muted small font-monospace" style={{ fontSize: '0.78rem' }}>
                                                                    {item.updatedAt ? moment(item.updatedAt).format('DD/MM/YYYY, hh:mm A') : (item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY, hh:mm A') : '—')}
                                                                </span>
                                                            </td>
                                                        )}
                                                        <td className="text-center" style={{ padding: '0.45rem 0.5rem' }}>
                                                            <div className="flex align-items-center list-user-action">
                                                                {!isTrash ? (
                                                                    <>
                                                                        {hasBalance ? (
                                                                            <Button
                                                                                variant="outline-success"
                                                                                size="sm"
                                                                                className="me-2"
                                                                                title="Record Payment"
                                                                                onClick={() => setQuickPaymentInvoice({
                                                                                    ...item,
                                                                                    partyId: item.partyId || item.party_id,
                                                                                    balanceAmount: balance,
                                                                                    paidAmount: paid
                                                                                })}
                                                                            >
                                                                                <FaMoneyCheckAlt />
                                                                            </Button>
                                                                        ) : null}
                                                                        <Button
                                                                            variant="outline-secondary"
                                                                            size="sm"
                                                                            className="me-2"
                                                                            title="Payment History"
                                                                            onClick={() => setHistoryModalState({
                                                                                show: true,
                                                                                invoiceId: item.invoiceId,
                                                                                invoiceNo: item.invoiceNo
                                                                            })}
                                                                        >
                                                                            <FaHistory />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline-primary"
                                                                            size="sm"
                                                                            className="me-2"
                                                                            title="Download PDF"
                                                                            disabled={downloadingInvoiceId === item.invoiceId}
                                                                            onClick={() => downloadInvoice({ invoiceId: item.invoiceId, invoiceNo: item.invoiceNo })}
                                                                        >
                                                                            {downloadingInvoiceId === item.invoiceId ? (
                                                                                <Spinner animation="border" size="sm" />
                                                                            ) : (
                                                                                <FaDownload />
                                                                            )}
                                                                        </Button>
                                                                        <Link className="me-2" to={`/sales/invoice/${item.invoiceId}/edit`}>
                                                                            <Button variant="outline-success" size='sm' title="Edit">
                                                                                <FaPen />
                                                                            </Button>
                                                                        </Link>
                                                                        <Link className="me-2" to={`/sales/invoice/${item.invoiceId}/duplicate`}>
                                                                            <Button variant="outline-info" size='sm' title="Duplicate / Clone Invoice">
                                                                                <FaCopy />
                                                                            </Button>
                                                                        </Link>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size='sm'
                                                                            title="Move to Bin"
                                                                            onClick={() => confirmSoftDelete(`Invoice "${item.invoiceNo}"`, () => deleteInvoice({ id: item.invoiceId, isPermanentDelete: false }))}
                                                                        >
                                                                            <FaTrash />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size='sm'
                                                                            className="me-2"
                                                                            title="Restore"
                                                                            onClick={() => confirmRestore(`Invoice "${item.invoiceNo}"`, () => restoreInvoice(item.invoiceId))}
                                                                        >
                                                                            <FaUndo />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline-danger"
                                                                            size='sm'
                                                                            title="Delete Permanently"
                                                                            onClick={() => confirmPermanentDelete(`Invoice "${item.invoiceNo}"`, () => deleteInvoice({ id: item.invoiceId, isPermanentDelete: true }))}
                                                                        >
                                                                            <FaExclamationTriangle />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={isTrash ? 8 : 12} className="text-center py-4 text-muted">
                                                    {isTrash
                                                        ? (debouncedSearch ? `No deleted invoices matching "${debouncedSearch}"` : 'Recycle Bin is empty.')
                                                        : (debouncedSearch ? `No invoices matching "${debouncedSearch}"` : 'No invoices found.')
                                                    }
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            {invoice.length > 0 && (
                                <div className="d-flex justify-content-between align-items-center mt-3" style={{ marginLeft: '1rem', marginRight: '1rem' }}>
                                    <div className="text-muted small">
                                        Showing {pageStart} to {pageEnd} of {totalItems} entries
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

            {/* Branch Selection Modal for Consolidated Mode */}
            <BranchModal />
        </>
    );
};

export default InvoiceList;