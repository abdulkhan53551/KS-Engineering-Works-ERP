import React, { useState, useMemo, useCallback } from 'react';
import { Table, Button, Form, Row, Col, Badge, Spinner, Dropdown, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import {
    FaPlus, FaSearch, FaTimes, FaEdit, FaTrash, FaUndo,
    FaCopy, FaCheck, FaEye, FaSyncAlt, FaUserEdit,
    FaFileInvoiceDollar, FaRegClock, FaFilter, FaMoneyBillWave,
    FaCheckCircle, FaExclamationCircle, FaExchangeAlt, FaBoxes, FaCalendarAlt
} from 'react-icons/fa';
import Card from '../../../components/Card';
import PaginationBar from '../../../components/PaginationBar';
import useBranchAction from '../../../hooks/useBranchAction';
import {
    useProformaInvoices,
    useProformaPagination,
    useDeleteProforma,
    useRestoreProforma,
    useBulkDeleteProformas,
    useBulkRestoreProformas,
    useConvertProformaToInvoice
} from '../hooks/useApi';
import ProformaPdfModal from '../components/ProformaPdfModal';
import './proforma.scss';

const STATUS_TABS = [
    { key: '', label: 'All Proformas' },
    { key: 'DRAFT', label: 'Draft' },
    { key: 'SENT', label: 'Sent' },
    { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { key: 'PAID', label: 'Paid' },
    { key: 'CONVERTED', label: 'Converted' },
    { key: 'CANCELLED', label: 'Cancelled' }
];

const ProformaList = () => {
    const navigate = useNavigate();
    const { navigateWithBranch, BranchModal } = useBranchAction();

    // Tenant / Active Firm & Branch Context
    const { activeFirm, activeBranch } = useSelector((state) => state.firmReducer || {});
    const firmId = (!activeFirm || activeFirm?.id === 'all') ? '' : activeFirm?.id;
    const branchId = (!activeBranch || activeBranch?.id === 'all') ? '' : activeBranch?.id;

    // Filters state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isTrash, setIsTrash] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datePreset, setDatePreset] = useState('all');
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');

    // Selection for bulk actions
    const [selectedIds, setSelectedIds] = useState([]);

    // PDF Preview Modal
    const [pdfModalData, setPdfModalData] = useState({ show: false, proformaId: null, proformaNo: '' });

    // Queries
    const queryParams = useMemo(() => ({
        page,
        pageSize,
        search: searchTerm,
        trash: isTrash,
        status: statusFilter,
        startDate,
        endDate,
        firmId,
        branchId
    }), [page, pageSize, searchTerm, isTrash, statusFilter, startDate, endDate, firmId, branchId]);

    const {
        data: proformas = [],
        isLoading,
        isFetching,
        refetch
    } = useProformaInvoices(queryParams);

    const { data: paginationData } = useProformaPagination(queryParams);

    // Mutations
    const deleteMutation = useDeleteProforma();
    const restoreMutation = useRestoreProforma();
    const bulkDeleteMutation = useBulkDeleteProformas();
    const bulkRestoreMutation = useBulkRestoreProformas();
    const convertMutation = useConvertProformaToInvoice();

    // Pagination & Count Metrics
    const totalItems = paginationData?.total !== undefined ? paginationData.total : proformas.length;
    const totalPages = paginationData?.totalPages || (totalItems > 0 && pageSize ? Math.ceil(totalItems / pageSize) : 1) || 1;
    const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = Math.min(page * pageSize, totalItems);

    // KPI Metrics derived from loaded data
    const kpis = useMemo(() => {
        const total = totalItems;
        const converted = proformas.filter(p => p.status === 'CONVERTED' || p.isConverted || p.is_converted).length;
        const totalAdvanceReq = proformas.reduce((acc, p) => acc + parseFloat(p.advanceAmountRequested || p.advance_amount_requested || 0), 0);
        const totalAmount = proformas.reduce((acc, p) => acc + parseFloat(p.total || 0), 0);

        return {
            total,
            converted,
            totalAdvanceReq,
            totalAmount
        };
    }, [totalItems, proformas]);

    // Date Filter Presets
    const handleDatePresetChange = (preset) => {
        setDatePreset(preset);
        setPage(1);
        setSelectedIds([]);
        const now = moment();

        switch (preset) {
            case 'today':
                setStartDate(now.format('YYYY-MM-DD'));
                setEndDate(now.format('YYYY-MM-DD'));
                break;
            case 'thisMonth':
                setStartDate(now.clone().startOf('month').format('YYYY-MM-DD'));
                setEndDate(now.clone().endOf('month').format('YYYY-MM-DD'));
                break;
            case 'lastMonth':
                setStartDate(now.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'));
                setEndDate(now.clone().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'));
                break;
            case 'thisFY': {
                const currentMonth = now.month(); // 0-indexed, April is 3
                const startYear = currentMonth >= 3 ? now.year() : now.year() - 1;
                setStartDate(`${startYear}-04-01`);
                setEndDate(`${startYear + 1}-03-31`);
                break;
            }
            case 'all':
            default:
                setStartDate('');
                setEndDate('');
                setTempStartDate('');
                setTempEndDate('');
                break;
        }
    };

    const handleApplyCustomDates = () => {
        if (!tempStartDate && !tempEndDate) return;
        setStartDate(tempStartDate || '');
        setEndDate(tempEndDate || '');
        setDatePreset('custom');
        setPage(1);
        setSelectedIds([]);
    };

    const getDateLabel = () => {
        if (datePreset === 'today') return 'Today';
        if (datePreset === 'thisMonth') return 'This Month';
        if (datePreset === 'lastMonth') return 'Last Month';
        if (datePreset === 'thisFY') return 'Current FY';
        if (startDate || endDate) {
            const s = startDate ? moment(startDate).format('DD MMM') : 'Start';
            const e = endDate ? moment(endDate).format('DD MMM') : 'End';
            return `${s} - ${e}`;
        }
        return 'Date Range';
    };

    const hasActiveFilters = Boolean(statusFilter || searchTerm || startDate || endDate || isTrash);

    const handleResetFilters = () => {
        setStatusFilter('');
        setIsTrash(false);
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setTempStartDate('');
        setTempEndDate('');
        setDatePreset('all');
        setPage(1);
        setSelectedIds([]);
    };

    // Handle Checkbox Select All / Single
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(proformas.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`Move ${selectedIds.length} proforma invoice(s) to trash?`)) {
            bulkDeleteMutation.mutate(selectedIds, {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                }
            });
        }
    };

    const handleBulkRestore = () => {
        if (selectedIds.length === 0) return;
        bulkRestoreMutation.mutate(selectedIds, {
            onSuccess: () => {
                setSelectedIds([]);
                refetch();
            }
        });
    };

    const handleOpenPdf = (proforma) => {
        setPdfModalData({
            show: true,
            proformaId: proforma.id,
            proformaNo: proforma.proformaNo || proforma.proforma_no || ''
        });
    };

    const handleConvertToInvoice = (proforma) => {
        const pNo = proforma.proformaNo || proforma.proforma_no || '';
        if (window.confirm(`Create Tax Invoice from Proforma #${pNo}?`)) {
            navigateWithBranch(`/sales/invoice/create?proformaId=${proforma.id}`, 'Select Branch for Tax Invoice');
        }
    };

    return (
        <div className="proforma-list-wrapper">
            <BranchModal />

            {/* Top Bar / Header */}
            <Row className="mb-3 align-items-center">
                <Col md={6}>
                    <div className="d-flex align-items-center gap-2.5">
                        <div className="p-2 rounded bg-crimson-light theme-crimson">
                            <FaFileInvoiceDollar size={20} />
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.01em' }}>Proforma Invoices</h5>
                            <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                Advance commercial bills, customer confirmations & remittance tracking
                            </span>
                        </div>
                    </div>
                </Col>
                <Col md={6} className="d-flex justify-content-md-end gap-2 mt-2 mt-md-0">
                    <Button
                        variant="light"
                        className="border shadow-sm d-flex align-items-center justify-content-center"
                        style={{ width: '34px', height: '34px', padding: 0 }}
                        onClick={() => refetch()}
                        title="Refresh list"
                    >
                        <FaSyncAlt size={12} className={isFetching ? 'fa-spin theme-crimson' : 'text-secondary'} />
                    </Button>
                    <Button
                        variant="danger"
                        className="btn-crimson d-flex align-items-center gap-1.5 shadow-sm px-3"
                        style={{ height: '34px', fontSize: '0.82rem', fontWeight: 600 }}
                        onClick={() => navigateWithBranch('/sales/proforma-invoice/create', 'Select Branch for Proforma Invoice')}
                    >
                        <FaPlus size={11} />
                        <span>Create Proforma Invoice</span>
                    </Button>
                </Col>
            </Row>

            {/* KPI Cards Row (Crisp Executive Styling) */}
            <Row className="g-3 mb-3">
                <Col sm={6} lg={3}>
                    <div className="proforma-kpi-card h-100">
                        <div className="kpi-icon dark">
                            <FaBoxes size={18} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Total Proformas</span>
                            <div className="kpi-value">{paginationData?.total ?? proformas.length}</div>
                            <span className="kpi-subtext">Active proformas</span>
                        </div>
                    </div>
                </Col>

                <Col sm={6} lg={3}>
                    <div className="proforma-kpi-card h-100">
                        <div className="kpi-icon success">
                            <FaCheckCircle size={18} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Converted to Invoices</span>
                            <div className="kpi-value text-success">{kpis.converted}</div>
                            <span className="kpi-subtext">Billed orders</span>
                        </div>
                    </div>
                </Col>

                <Col sm={6} lg={3}>
                    <div className="proforma-kpi-card h-100">
                        <div className="kpi-icon info">
                            <FaMoneyBillWave size={18} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Advance Requested</span>
                            <div className="kpi-value" style={{ color: '#0284c7' }}>
                                ₹{kpis.totalAdvanceReq.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            <span className="kpi-subtext">Expected upfront</span>
                        </div>
                    </div>
                </Col>

                <Col sm={6} lg={3}>
                    <div className="proforma-kpi-card h-100">
                        <div className="kpi-icon primary">
                            <FaFileInvoiceDollar size={18} />
                        </div>
                        <div className="kpi-content">
                            <span className="kpi-label">Total Gross Value</span>
                            <div className="kpi-value theme-crimson">
                                ₹{kpis.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                            <span className="kpi-subtext">Cumulative total</span>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Main Content Card with Filters & Table */}
            <Card className="shadow-sm border-0">
                {/* Tabs & Search Filter Header */}
                <Card.Header className="bg-white border-bottom px-3 py-2.5">
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2.5">
                        {/* Left Side: Status Dropdown & Trash */}
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            {/* Status Filter Dropdown */}
                            <Dropdown>
                                <Dropdown.Toggle
                                    size="sm"
                                    variant="light"
                                    className={`border d-flex align-items-center gap-1.5 shadow-none ${
                                        statusFilter && !isTrash ? 'border-danger text-danger fw-semibold bg-white' : 'text-secondary bg-white'
                                    }`}
                                    style={{
                                        fontSize: '0.78rem',
                                        height: '31px',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                    }}
                                    id="status-filter-dropdown"
                                >
                                    <FaFilter size={10} className={statusFilter && !isTrash ? 'theme-crimson' : 'text-muted'} />
                                    <span>
                                        {statusFilter && !isTrash
                                            ? `Status: ${STATUS_TABS.find(t => t.key === statusFilter)?.label || statusFilter}`
                                            : 'All Statuses'}
                                    </span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-lg border-0 py-1" style={{ minWidth: '185px' }}>
                                    <Dropdown.Header className="text-uppercase fw-bold text-muted py-1" style={{ fontSize: '0.67rem', letterSpacing: '0.04em' }}>
                                        Filter By Status
                                    </Dropdown.Header>
                                    {STATUS_TABS.map(tab => (
                                        <Dropdown.Item
                                            key={tab.key}
                                            active={statusFilter === tab.key && !isTrash}
                                            onClick={() => {
                                                setIsTrash(false);
                                                setStatusFilter(tab.key);
                                                setPage(1);
                                                setSelectedIds([]);
                                            }}
                                            className="d-flex align-items-center justify-content-between py-1.5 px-3"
                                            style={{ fontSize: '0.78rem' }}
                                        >
                                            <span className="d-flex align-items-center gap-2">
                                                <span className={`status-dot ${tab.key ? `status-dot-${tab.key.toLowerCase().replace('_', '-')}` : 'status-dot-all'}`}></span>
                                                <span>{tab.label}</span>
                                            </span>
                                            {statusFilter === tab.key && !isTrash && <FaCheck size={10} className="text-danger ms-2" />}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Trash Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsTrash(!isTrash);
                                    if (!isTrash) setStatusFilter('');
                                    setPage(1);
                                    setSelectedIds([]);
                                }}
                                className={`proforma-tab-btn trash-tab ${isTrash ? 'active' : ''}`}
                                style={{ height: '31px', fontSize: '0.78rem', padding: '4px 10px' }}
                                title={isTrash ? "Exit Trash View" : "View Deleted Proformas"}
                            >
                                <FaTrash size={10} className="me-1.5" />
                                <span>Trash</span>
                            </button>
                        </div>

                        {/* Right side: Date Filter, Search & Reset */}
                        <div className="d-flex align-items-center flex-wrap gap-2">
                            {/* Date Range Dropdown */}
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle
                                    size="sm"
                                    variant="light"
                                    className={`proforma-tab-btn shadow-none d-flex align-items-center gap-1.5 ${datePreset !== 'all' || startDate || endDate ? 'active' : ''}`}
                                >
                                    <FaCalendarAlt size={11} className={datePreset !== 'all' || startDate || endDate ? 'text-white' : 'text-muted'} />
                                    <span style={{ fontSize: '0.75rem' }}>{getDateLabel()}</span>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="shadow-lg border-0 p-3" style={{ minWidth: '290px' }}>
                                    <div className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                        Quick Presets
                                    </div>
                                    <div className="d-flex flex-wrap gap-1.5 mb-2.5">
                                        <Button
                                            variant={datePreset === 'today' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={() => handleDatePresetChange('today')}
                                        >
                                            Today
                                        </Button>
                                        <Button
                                            variant={datePreset === 'thisMonth' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={() => handleDatePresetChange('thisMonth')}
                                        >
                                            This Month
                                        </Button>
                                        <Button
                                            variant={datePreset === 'lastMonth' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={() => handleDatePresetChange('lastMonth')}
                                        >
                                            Last Month
                                        </Button>
                                        <Button
                                            variant={datePreset === 'thisFY' ? 'danger' : 'light'}
                                            size="sm"
                                            className="py-1 px-2.5 border"
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={() => handleDatePresetChange('thisFY')}
                                        >
                                            Current FY
                                        </Button>
                                    </div>

                                    <Dropdown.Divider className="my-2" />

                                    <div className="text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                        Custom Range
                                    </div>
                                    <Row className="g-2 mb-2">
                                        <Col xs={6}>
                                            <Form.Label className="text-muted small mb-0.5" style={{ fontSize: '0.72rem' }}>From</Form.Label>
                                            <Form.Control
                                                type="date"
                                                size="sm"
                                                value={tempStartDate}
                                                onChange={(e) => setTempStartDate(e.target.value)}
                                                style={{ fontSize: '0.78rem' }}
                                            />
                                        </Col>
                                        <Col xs={6}>
                                            <Form.Label className="text-muted small mb-0.5" style={{ fontSize: '0.72rem' }}>To</Form.Label>
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
                                            style={{ fontSize: '0.75rem' }}
                                            onClick={() => handleDatePresetChange('all')}
                                        >
                                            Clear
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            className="btn-crimson py-1 px-3"
                                            style={{ fontSize: '0.75rem' }}
                                            disabled={!tempStartDate && !tempEndDate}
                                            onClick={handleApplyCustomDates}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Search Input */}
                            <InputGroup size="sm" style={{ width: '220px' }}>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <FaSearch size={11} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search Proforma No, buyer..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }}
                                    className="border-start-0"
                                    style={{ fontSize: '0.8rem' }}
                                />
                                {searchTerm && (
                                    <Button variant="light" className="border border-start-0" onClick={() => { setSearchTerm(''); setPage(1); }}>
                                        <FaTimes size={10} className="text-muted" />
                                    </Button>
                                )}
                            </InputGroup>

                            {/* Reset Button */}
                            {hasActiveFilters && (
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="d-flex align-items-center gap-1 px-2.5 shadow-none"
                                    style={{ height: '30px', fontSize: '0.76rem', borderRadius: '6px' }}
                                    title="Reset all filters"
                                >
                                    <FaUndo size={10} />
                                    <span>Reset</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Active Filters Strip */}
                    {hasActiveFilters && (
                        <div className="d-flex align-items-center flex-wrap gap-1.5 pt-2 mt-2 border-top">
                            <span className="text-muted small fw-semibold d-flex align-items-center" style={{ fontSize: '0.72rem' }}>
                                <FaFilter size={9} className="me-1 theme-crimson" /> Active Filters:
                            </span>
                            {statusFilter && (
                                <span className="badge bg-light text-dark border d-flex align-items-center gap-1.5 font-weight-normal py-1 px-2" style={{ fontSize: '0.72rem' }}>
                                    Status: {STATUS_TABS.find(t => t.key === statusFilter)?.label || statusFilter}
                                    <FaTimes size={9} className="cursor-pointer text-muted" onClick={() => { setStatusFilter(''); setPage(1); }} />
                                </span>
                            )}
                            {isTrash && (
                                <span className="badge bg-light text-dark border d-flex align-items-center gap-1.5 font-weight-normal py-1 px-2" style={{ fontSize: '0.72rem' }}>
                                    Trash View
                                    <FaTimes size={9} className="cursor-pointer text-muted" onClick={() => { setIsTrash(false); setPage(1); }} />
                                </span>
                            )}
                            {(startDate || endDate) && (
                                <span className="badge bg-light text-dark border d-flex align-items-center gap-1.5 font-weight-normal py-1 px-2" style={{ fontSize: '0.72rem' }}>
                                    Date: {getDateLabel()}
                                    <FaTimes size={9} className="cursor-pointer text-muted" onClick={() => handleDatePresetChange('all')} />
                                </span>
                            )}
                            {searchTerm && (
                                <span className="badge bg-light text-dark border d-flex align-items-center gap-1.5 font-weight-normal py-1 px-2" style={{ fontSize: '0.72rem' }}>
                                    Search: "{searchTerm}"
                                    <FaTimes size={9} className="cursor-pointer text-muted" onClick={() => { setSearchTerm(''); setPage(1); }} />
                                </span>
                            )}
                            <Button
                                variant="link"
                                size="sm"
                                onClick={handleResetFilters}
                                className="p-0 theme-crimson text-decoration-none small ms-1 fw-semibold"
                                style={{ fontSize: '0.72rem' }}
                            >
                                Clear all
                            </Button>
                        </div>
                    )}
                </Card.Header>

                {/* Dedicated Bulk Selection Bar */}
                {selectedIds.length > 0 && (
                    <div className="px-3 py-2 bg-light border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <Badge bg="dark" className="px-2.5 py-1.5" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                {selectedIds.length} {selectedIds.length === 1 ? 'proforma' : 'proformas'} selected
                            </Badge>
                            <Button
                                variant="link"
                                size="sm"
                                className="text-muted p-0 text-decoration-none ms-1"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => setSelectedIds([])}
                            >
                                Deselect all
                            </Button>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            {isTrash ? (
                                <Button
                                    variant="success"
                                    size="sm"
                                    className="d-flex align-items-center gap-1.5 px-3 shadow-sm"
                                    style={{ fontSize: '0.78rem', fontWeight: 600 }}
                                    onClick={handleBulkRestore}
                                    disabled={bulkRestoreMutation.isLoading}
                                >
                                    <FaUndo size={11} />
                                    <span>{bulkRestoreMutation.isLoading ? 'Restoring...' : 'Restore Selected'}</span>
                                </Button>
                            ) : (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="btn-crimson d-flex align-items-center gap-1.5 px-3 shadow-sm"
                                    style={{ fontSize: '0.78rem', fontWeight: 600 }}
                                    onClick={handleBulkDelete}
                                    disabled={bulkDeleteMutation.isLoading}
                                >
                                    <FaTrash size={11} />
                                    <span>{bulkDeleteMutation.isLoading ? 'Moving...' : 'Move to Trash'}</span>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Table */}
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0 proforma-list-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '36px' }} className="text-center">
                                        <Form.Check
                                            type="checkbox"
                                            checked={proformas.length > 0 && selectedIds.length === proformas.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th style={{ width: '145px' }}>Proforma No & Date</th>
                                    <th style={{ minWidth: '190px' }}>Customer / Buyer</th>
                                    <th style={{ width: '115px' }}>Order Ref / PO</th>
                                    <th style={{ width: '60px' }} className="text-center">Items</th>
                                    <th style={{ width: '110px' }} className="text-end">Taxable (₹)</th>
                                    <th style={{ width: '120px' }} className="text-end">Total Amount (₹)</th>
                                    <th style={{ width: '115px' }} className="text-end">Advance Req (₹)</th>
                                    <th style={{ width: '95px' }} className="text-center">Status</th>
                                    <th style={{ width: '135px' }}>{isTrash ? 'Deleted By' : 'Updated By'}</th>
                                    <th style={{ width: '95px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-5">
                                            <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                                            <span className="text-muted" style={{ fontSize: '0.82rem' }}>Loading Proforma Invoices...</span>
                                        </td>
                                    </tr>
                                ) : proformas.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-5">
                                            <div className="text-muted">
                                                <FaFileInvoiceDollar size={36} className="mb-2 text-secondary opacity-50" />
                                                <div className="fw-semibold">No Proforma Invoices Found</div>
                                                <small className="text-muted">
                                                    {searchTerm || statusFilter
                                                        ? 'Try clearing filters or search criteria'
                                                        : 'Create your first proforma invoice to get started'}
                                                </small>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    proformas.map((p, idx) => {
                                        const isSelected = selectedIds.includes(p.id);
                                        const pNo = p.proformaNo || p.proforma_no || '-';
                                        const rawDate = p.proformaDate || p.proforma_date;
                                        const pDate = rawDate ? moment(rawDate).format('DD MMM YYYY') : '-';
                                        const isConverted = p.status === 'CONVERTED' || p.isConverted || p.is_converted;
                                        const customerName = p.customerName || p.customer_name || '-';
                                        const gstNumber = p.gstNumber || p.gst_number || '';
                                        const orderRefNo = p.orderRefNo || p.order_ref_no || '';
                                        const rawOrderDate = p.orderRefDate || p.order_ref_date;
                                        const itemsCount = p.itemsCount !== undefined ? p.itemsCount : (p.items_count !== undefined ? p.items_count : 1);
                                        const taxableAmount = p.taxableAmount !== undefined ? p.taxableAmount : (p.taxable_amount || 0);
                                        const totalAmount = p.total !== undefined ? p.total : 0;
                                        const advanceReq = p.advanceAmountRequested !== undefined ? p.advanceAmountRequested : (p.advance_amount_requested || 0);

                                        // Robust Audit log extraction (supports both camelCase and snake_case)
                                        const createdByName = p.createdByName || p.created_by_name || 'System';
                                        const updatedByName = p.updatedByName || p.updated_by_name || createdByName;
                                        const deletedByName = p.deletedByName || p.deleted_by_name || 'System';
                                        const rawCreatedAt = p.createdAt || p.created_at;
                                        const rawUpdatedAt = p.updatedAt || p.updated_at;
                                        const rawDeletedAt = p.deletedAt || p.deleted_at;
                                        const createdAtFormatted = rawCreatedAt ? moment(rawCreatedAt).format('DD MMM YYYY, hh:mm A') : '—';
                                        const updatedAtFormatted = rawUpdatedAt ? moment(rawUpdatedAt).format('DD MMM YYYY, hh:mm A') : (rawCreatedAt ? moment(rawCreatedAt).format('DD MMM YYYY, hh:mm A') : '—');
                                        const deletedAtFormatted = rawDeletedAt ? moment(rawDeletedAt).format('DD MMM YYYY, hh:mm A') : '—';

                                        return (
                                            <tr key={p.id} className={isSelected ? 'table-active' : ''}>
                                                <td className="text-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectRow(p.id)}
                                                    />
                                                </td>

                                                {/* Proforma No & Date */}
                                                <td>
                                                    <Link
                                                        to={`/sales/proforma-invoice/${p.id}/edit`}
                                                        className="proforma-number-link fw-bold theme-crimson d-block text-truncate"
                                                        style={{ maxWidth: '140px' }}
                                                        title={pNo}
                                                    >
                                                        {pNo}
                                                    </Link>
                                                    <div className="text-muted d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.72rem' }}>
                                                        <FaRegClock size={9} />
                                                        <span>{pDate}</span>
                                                    </div>
                                                </td>

                                                {/* Buyer */}
                                                <td>
                                                    <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '240px' }} title={customerName}>
                                                        {customerName}
                                                    </div>
                                                    {gstNumber ? (
                                                        <div className="text-muted" style={{ fontSize: '0.71rem' }}>
                                                            GSTIN: <span className="font-monospace text-secondary">{gstNumber}</span>
                                                        </div>
                                                    ) : null}
                                                </td>

                                                {/* Order Ref */}
                                                <td>
                                                    {orderRefNo ? (
                                                        <div>
                                                            <span className="badge-order-ref">{orderRefNo}</span>
                                                            {rawOrderDate && (
                                                                <div className="text-muted mt-0.5" style={{ fontSize: '0.71rem' }}>
                                                                    {moment(rawOrderDate).format('DD/MM/YYYY')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                                    )}
                                                </td>

                                                {/* Items count */}
                                                <td className="text-center fw-semibold text-secondary font-tabular" style={{ fontSize: '0.8rem' }}>
                                                    {itemsCount}
                                                </td>

                                                {/* Taxable */}
                                                <td className="text-end fw-semibold text-secondary font-tabular" style={{ fontSize: '0.8rem' }}>
                                                    ₹{Number(taxableAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>

                                                {/* Grand Total */}
                                                <td className="text-end fw-bold font-tabular" style={{ fontSize: '0.84rem', color: '#0f172a' }}>
                                                    ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>

                                                {/* Advance Amount Requested */}
                                                <td className="text-end fw-semibold font-tabular" style={{ fontSize: '0.8rem', color: Number(advanceReq) > 0 ? '#0284c7' : '#94a3b8' }}>
                                                    ₹{Number(advanceReq).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>

                                                {/* Status */}
                                                <td className="text-center">
                                                    <span className={`status-badge status-${(p.status || 'draft').toLowerCase().replace('_', '-')}`}>
                                                        {p.status || 'DRAFT'}
                                                    </span>
                                                </td>

                                                {/* Audit Log / Updated By */}
                                                <td>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Tooltip id={`tooltip-audit-${p.id}`}>
                                                                <div className="text-start py-1 px-1.5" style={{ fontSize: '0.72rem', lineHeight: '1.45' }}>
                                                                    <div><span className="text-muted">Created By:</span> <strong>{createdByName}</strong></div>
                                                                    <div className="text-secondary small">{createdAtFormatted}</div>
                                                                    {rawUpdatedAt && (
                                                                        <>
                                                                            <hr className="my-1 border-secondary opacity-25" />
                                                                            <div><span className="text-muted">Updated By:</span> <strong>{updatedByName}</strong></div>
                                                                            <div className="text-secondary small">{updatedAtFormatted}</div>
                                                                        </>
                                                                    )}
                                                                    {isTrash && rawDeletedAt && (
                                                                        <>
                                                                            <hr className="my-1 border-danger opacity-25" />
                                                                            <div className="text-danger"><span className="text-muted">Deleted By:</span> <strong>{deletedByName}</strong></div>
                                                                            <div className="text-danger small">{deletedAtFormatted}</div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <div className="cursor-pointer">
                                                            {isTrash ? (
                                                                <>
                                                                    <div className="fw-semibold text-danger text-truncate d-flex align-items-center gap-1" style={{ maxWidth: '130px', fontSize: '0.78rem' }}>
                                                                        <FaTrash size={9} className="text-danger flex-shrink-0" />
                                                                        <span className="text-truncate">{deletedByName}</span>
                                                                    </div>
                                                                    <div className="text-muted small d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.71rem' }}>
                                                                        <FaRegClock size={8} className="text-muted flex-shrink-0" />
                                                                        <span>{deletedAtFormatted}</span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="fw-semibold text-dark text-truncate d-flex align-items-center gap-1" style={{ maxWidth: '130px', fontSize: '0.78rem' }}>
                                                                        <FaUserEdit size={10} className="text-muted flex-shrink-0" />
                                                                        <span className="text-truncate">{updatedByName}</span>
                                                                    </div>
                                                                    <div className="text-muted small d-flex align-items-center gap-1 mt-0.5" style={{ fontSize: '0.71rem' }}>
                                                                        <FaRegClock size={8} className="text-muted flex-shrink-0" />
                                                                        <span>{updatedAtFormatted}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </OverlayTrigger>
                                                </td>

                                                {/* Actions */}
                                                <td className="text-center">
                                                    <div className="proforma-actions-group d-flex align-items-center justify-content-center gap-1">
                                                        {/* View PDF */}
                                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-view-pdf-${p.id}`}>View & Download PDF</Tooltip>}>
                                                            <button
                                                                type="button"
                                                                className="btn-table-action btn-action-pdf"
                                                                onClick={() => handleOpenPdf(p)}
                                                                title="View PDF"
                                                            >
                                                                <FaEye size={12} />
                                                            </button>
                                                        </OverlayTrigger>

                                                        {!isTrash ? (
                                                            <>
                                                                {/* Edit */}
                                                                <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-edit-pi-${p.id}`}>Edit Proforma</Tooltip>}>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-table-action btn-action-edit"
                                                                        onClick={() => navigateWithBranch(`/sales/proforma-invoice/${p.id}/edit`, 'Select Branch for Edit')}
                                                                        title="Edit"
                                                                    >
                                                                        <FaEdit size={12} />
                                                                    </button>
                                                                </OverlayTrigger>

                                                                {/* Dropdown More */}
                                                                <Dropdown align="end" drop={idx > 0 && idx >= proformas.length - 1 ? 'up' : 'down'}>
                                                                    <Dropdown.Toggle as="button" className="btn-table-action btn-action-more" id={`pi-action-${p.id}`}>
                                                                        ⋮
                                                                    </Dropdown.Toggle>
                                                                    <Dropdown.Menu className="shadow-lg border-0 py-1 bg-white" style={{ minWidth: '190px', zIndex: 1080 }}>
                                                                        <Dropdown.Item onClick={() => navigateWithBranch(`/sales/proforma-invoice/${p.id}/duplicate`, 'Select Branch for Duplicate')}>
                                                                            <FaCopy className="me-2 text-primary" size={11} /> Duplicate Proforma
                                                                        </Dropdown.Item>

                                                                        {!isConverted && (
                                                                            <Dropdown.Item onClick={() => handleConvertToInvoice(p)}>
                                                                                <FaExchangeAlt className="me-2 text-success" size={11} /> Convert to Tax Invoice
                                                                            </Dropdown.Item>
                                                                        )}

                                                                        <Dropdown.Divider />

                                                                        <Dropdown.Item
                                                                            className="text-danger"
                                                                            onClick={() => {
                                                                                if (window.confirm(`Move Proforma #${pNo} to trash?`)) {
                                                                                    deleteMutation.mutate(p.id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <FaTrash className="me-2" size={11} /> Move to Trash
                                                                        </Dropdown.Item>
                                                                    </Dropdown.Menu>
                                                                </Dropdown>
                                                            </>
                                                        ) : (
                                                            /* Restore from Trash */
                                                            <OverlayTrigger placement="top" overlay={<Tooltip id={`tooltip-restore-pi-${p.id}`}>Restore Proforma</Tooltip>}>
                                                                <button
                                                                    type="button"
                                                                    className="btn-table-action btn-action-restore"
                                                                    onClick={() => restoreMutation.mutate(p.id)}
                                                                    title="Restore"
                                                                >
                                                                    <FaUndo size={12} />
                                                                </button>
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
                </Card.Body>

                {/* Footer / Pagination */}
                {proformas.length > 0 && (
                    <div className="bg-white border-top px-3 py-2.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <span className="text-muted small" style={{ fontSize: '0.8rem' }}>
                            Showing <b>{pageStart}</b> to <b>{pageEnd}</b> of <b>{totalItems}</b> entries
                        </span>
                        <div className="d-flex align-items-center gap-3">
                            <div className="d-flex align-items-center text-muted small">
                                <span className="me-1.5 text-secondary">Show</span>
                                <Form.Select
                                    size="sm"
                                    className="border shadow-none"
                                    style={{ width: '4.8rem', borderRadius: '6px', fontSize: '0.78rem', height: '31px' }}
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(1);
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
                            <PaginationBar
                                page={page}
                                pageSize={pageSize}
                                total={totalItems}
                                totalPages={totalPages}
                                onPageChange={(newPage) => {
                                    setPage(newPage);
                                    setSelectedIds([]);
                                }}
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* PDF Preview Modal */}
            <ProformaPdfModal
                show={pdfModalData.show}
                onHide={() => setPdfModalData({ show: false, proformaId: null, proformaNo: '' })}
                proformaId={pdfModalData.proformaId}
                proformaNo={pdfModalData.proformaNo}
            />
        </div>
    );
};

export default ProformaList;
