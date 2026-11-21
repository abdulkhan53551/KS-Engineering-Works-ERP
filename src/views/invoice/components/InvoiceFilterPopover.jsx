import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FormCheck } from 'react-bootstrap';
import {
    FaFilter,
    FaTimes,
    FaCheck,
    FaBuilding,
    FaCalendarAlt,
    FaClock,
    FaRupeeSign,
    FaTruck,
    FaUndo,
    FaSearch,
    FaMoneyBillWave
} from 'react-icons/fa';
import Flatpickr from 'react-flatpickr';
import moment from 'moment';
import { useParties } from '../../party/hooks/usePartyApi';
import './InvoiceFilterPopover.scss';

/**
 * InvoiceFilterPopover Component (Compact Professional Master-Detail Overlay)
 * Compact popover anchored directly below the "Filter" button with 0 table shifting.
 * Width: 460px | Body Height: 220px | High-density enterprise styling.
 */
const InvoiceFilterPopover = ({
    isOpen,
    onClose,
    anchorRef,
    filters = {},
    onApplyFilters,
    onResetFilters
}) => {
    const popoverRef = useRef(null);

    // Fetch active parties for client filter
    const { data: partiesList = [], isLoading: isPartiesLoading } = useParties({
        page: 1,
        pageSize: 250,
        trash: false
    });

    // Active Category in Master Nav
    const [activeCategory, setActiveCategory] = useState('dates');

    // Search filter for customer list inside the popover
    const [partySearchTerm, setPartySearchTerm] = useState('');

    // Internal Draft Filter States (Only committed to URL when "Apply" is clicked)
    const [draftPartyId, setDraftPartyId] = useState(filters.partyId || '');
    const [draftStatus, setDraftStatus] = useState(filters.statusFilter || '');
    const [draftIsOverdue, setDraftIsOverdue] = useState(filters.isOverdue === 'true');
    const [draftDatePreset, setDraftDatePreset] = useState(filters.datePreset || '');
    const [draftStartDate, setDraftStartDate] = useState(filters.startDate || '');
    const [draftEndDate, setDraftEndDate] = useState(filters.endDate || '');
    const [draftMinAmount, setDraftMinAmount] = useState(filters.minAmount || '');
    const [draftMaxAmount, setDraftMaxAmount] = useState(filters.maxAmount || '');
    const [draftEwayBill, setDraftEwayBill] = useState(filters.ewayBillFilter || '');

    // Synchronize draft state whenever popover opens or parent filters change
    useEffect(() => {
        if (isOpen) {
            setDraftPartyId(filters.partyId || '');
            setDraftStatus(filters.statusFilter || '');
            setDraftIsOverdue(filters.isOverdue === 'true');
            setDraftDatePreset(filters.datePreset || '');
            setDraftStartDate(filters.startDate || '');
            setDraftEndDate(filters.endDate || '');
            setDraftMinAmount(filters.minAmount || '');
            setDraftMaxAmount(filters.maxAmount || '');
            setDraftEwayBill(filters.ewayBillFilter || '');
            setPartySearchTerm('');
        }
    }, [isOpen, filters]);

    // Handle outside click & Esc key to dismiss popover
    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (e) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target) &&
                anchorRef?.current &&
                !anchorRef.current.contains(e.target)
            ) {
                onClose();
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, anchorRef]);

    // Calculate total active filters count in draft mode
    const draftActiveCount = useMemo(() => {
        let count = 0;
        if (draftPartyId) count += 1;
        if (draftStatus) count += 1;
        if (draftIsOverdue) count += 1;
        if (draftDatePreset || draftStartDate || draftEndDate) count += 1;
        if (draftMinAmount || draftMaxAmount) count += 1;
        if (draftEwayBill !== '') count += 1;
        return count;
    }, [draftPartyId, draftStatus, draftIsOverdue, draftDatePreset, draftStartDate, draftEndDate, draftMinAmount, draftMaxAmount, draftEwayBill]);

    // Filter parties matching partySearchTerm
    const filteredParties = useMemo(() => {
        if (!partySearchTerm.trim()) return partiesList;
        const term = partySearchTerm.toLowerCase();
        return partiesList.filter((p) => {
            const name = (p.displayName || p.display_name || p.legalName || p.legal_name || '').toLowerCase();
            const gstin = (p.gstin || '').toLowerCase();
            const code = (p.partyCode || p.party_code || '').toLowerCase();
            return name.includes(term) || gstin.includes(term) || code.includes(term);
        });
    }, [partiesList, partySearchTerm]);

    // Handle Preset Dates Selection
    const handleSetDatePreset = (preset) => {
        if (preset === 'today') {
            const today = moment().format('YYYY-MM-DD');
            setDraftDatePreset('today');
            setDraftStartDate(today);
            setDraftEndDate(today);
        } else if (preset === 'thisMonth') {
            const start = moment().startOf('month').format('YYYY-MM-DD');
            const end = moment().endOf('month').format('YYYY-MM-DD');
            setDraftDatePreset('thisMonth');
            setDraftStartDate(start);
            setDraftEndDate(end);
        } else if (preset === 'lastMonth') {
            const start = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
            const end = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
            setDraftDatePreset('lastMonth');
            setDraftStartDate(start);
            setDraftEndDate(end);
        } else if (preset === 'thisFY') {
            const currentMonth = moment().month();
            const startYear = currentMonth >= 3 ? moment().year() : moment().year() - 1;
            const start = moment(`${startYear}-04-01`).format('YYYY-MM-DD');
            const end = moment(`${startYear + 1}-03-31`).format('YYYY-MM-DD');
            setDraftDatePreset('thisFY');
            setDraftStartDate(start);
            setDraftEndDate(end);
        } else if (preset === 'all') {
            setDraftDatePreset('');
            setDraftStartDate('');
            setDraftEndDate('');
        }
    };

    // Quick Amount Slices
    const handleSetAmountSlice = (min, max) => {
        setDraftMinAmount(min !== null && min !== undefined ? String(min) : '');
        setDraftMaxAmount(max !== null && max !== undefined ? String(max) : '');
    };

    // Apply Filters Handler
    const handleApply = () => {
        onApplyFilters({
            partyId: draftPartyId,
            status: draftStatus,
            isOverdue: draftIsOverdue ? 'true' : '',
            datePreset: draftDatePreset,
            startDate: draftStartDate,
            endDate: draftEndDate,
            minAmount: draftMinAmount,
            maxAmount: draftMaxAmount,
            ewayBill: draftEwayBill
        });
        onClose();
    };

    // Reset All Handler
    const handleReset = () => {
        setDraftPartyId('');
        setDraftStatus('');
        setDraftIsOverdue(false);
        setDraftDatePreset('');
        setDraftStartDate('');
        setDraftEndDate('');
        setDraftMinAmount('');
        setDraftMaxAmount('');
        setDraftEwayBill('');
        setPartySearchTerm('');
        if (typeof onResetFilters === 'function') {
            onResetFilters();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className="invoice-filter-popover"
            role="dialog"
            aria-label="Filter Invoices"
        >
            {/* 1. Header (Compact, Single-Line, Clean) */}
            <div className="filter-popover-header d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
                <div className="d-flex align-items-center gap-1.5">
                    <FaFilter size={10} className="text-primary" />
                    <span className="fw-bold text-dark" style={{ fontSize: '0.78rem' }}>Filter Records</span>
                    {draftActiveCount > 0 && (
                        <span className="badge bg-soft-primary text-primary font-monospace rounded-pill ms-1 px-1.5 py-0.2" style={{ fontSize: '0.65rem' }}>
                            {draftActiveCount} Active
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-icon-round text-muted"
                    onClick={onClose}
                    title="Close (Esc)"
                >
                    <FaTimes size={10} />
                </button>
            </div>

            {/* 2. Master-Detail Body (Height 220px) */}
            <div className="filter-popover-body d-flex">
                {/* Left Column: Categories Navigation (Width 135px) */}
                <div className="filter-categories-nav">
                    {/* Customer */}
                    <button
                        type="button"
                        className={`filter-category-btn ${activeCategory === 'party' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('party')}
                    >
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="cat-icon-badge cat-purple">
                                <FaBuilding size={9} />
                            </span>
                            <span>Customer</span>
                        </div>
                        {draftPartyId && <span className="cat-active-dot bg-purple" />}
                    </button>

                    {/* Status */}
                    <button
                        type="button"
                        className={`filter-category-btn ${activeCategory === 'status' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('status')}
                    >
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="cat-icon-badge cat-blue">
                                <FaMoneyBillWave size={9} />
                            </span>
                            <span>Status</span>
                        </div>
                        {draftStatus && <span className="cat-active-dot bg-primary" />}
                    </button>

                    {/* Overdue */}
                    <button
                        type="button"
                        className={`filter-category-btn ${activeCategory === 'overdue' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('overdue')}
                    >
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="cat-icon-badge cat-red">
                                <FaClock size={9} />
                            </span>
                            <span>Overdue</span>
                        </div>
                        {draftIsOverdue && <span className="cat-active-dot bg-danger" />}
                    </button>

                    {/* Dates */}
                    <button
                        type="button"
                        className={`filter-category-btn ${activeCategory === 'dates' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('dates')}
                    >
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="cat-icon-badge cat-emerald">
                                <FaCalendarAlt size={9} />
                            </span>
                            <span>Date / FY</span>
                        </div>
                        {(draftDatePreset || draftStartDate || draftEndDate) && (
                            <span className="cat-active-dot bg-success" />
                        )}
                    </button>

                    {/* Amount */}
                    <button
                        type="button"
                        className={`filter-category-btn ${activeCategory === 'amount' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('amount')}
                    >
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="cat-icon-badge cat-amber">
                                <FaRupeeSign size={9} />
                            </span>
                            <span>Amount</span>
                        </div>
                        {(draftMinAmount || draftMaxAmount) && (
                            <span className="cat-active-dot bg-warning" />
                        )}
                    </button>

                    {/* E-Way Bill */}
                    <button
                        type="button"
                        className={`filter-category-btn ${activeCategory === 'eway' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('eway')}
                    >
                        <div className="d-flex align-items-center gap-1.5">
                            <span className="cat-icon-badge cat-cyan">
                                <FaTruck size={9} />
                            </span>
                            <span>E-Way Bill</span>
                        </div>
                        {draftEwayBill !== '' && <span className="cat-active-dot bg-info" />}
                    </button>
                </div>

                {/* Right Column: Category Details Panel */}
                <div className="filter-options-panel">
                    {/* Panel 1: Customer / Party */}
                    {activeCategory === 'party' && (
                        <div className="filter-panel-section">
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="panel-micro-title">Select Customer</span>
                                {draftPartyId && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                                        style={{ fontSize: '0.68rem' }}
                                        onClick={() => setDraftPartyId('')}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Search Party Input */}
                            <div className="position-relative mb-1.5">
                                <FaSearch size={10} className="position-absolute text-muted" style={{ left: '8px', top: '7px' }} />
                                <input
                                    type="text"
                                    className="form-control form-control-sm ps-4 py-0"
                                    placeholder="Search party or GSTIN..."
                                    value={partySearchTerm}
                                    onChange={(e) => setPartySearchTerm(e.target.value)}
                                    style={{ fontSize: '0.72rem', height: '26px' }}
                                />
                                {partySearchTerm && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm position-absolute text-muted p-0"
                                        style={{ right: '6px', top: '5px' }}
                                        onClick={() => setPartySearchTerm('')}
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>

                            {/* Parties Scroll List */}
                            <div className="parties-scroll-list">
                                <div
                                    className={`party-option-item ${!draftPartyId ? 'selected' : ''}`}
                                    onClick={() => setDraftPartyId('')}
                                >
                                    <span className="party-name text-truncate">All Customers</span>
                                    {!draftPartyId && <FaCheck size={9} className="text-primary ms-auto" />}
                                </div>

                                {isPartiesLoading ? (
                                    <div className="text-center py-2 text-muted" style={{ fontSize: '0.7rem' }}>Loading...</div>
                                ) : filteredParties.length === 0 ? (
                                    <div className="text-center py-2 text-muted" style={{ fontSize: '0.7rem' }}>No party found</div>
                                ) : (
                                    filteredParties.map((p) => {
                                        const pName = p.displayName || p.display_name || p.legalName || p.legal_name || 'Party';
                                        const isSelected = String(draftPartyId) === String(p.id);

                                        return (
                                            <div
                                                key={p.id}
                                                className={`party-option-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => setDraftPartyId(String(p.id))}
                                            >
                                                <div className="text-truncate" style={{ maxWidth: '240px' }}>
                                                    <span className="party-name d-block text-truncate">{pName}</span>
                                                    {p.gstin && (
                                                        <span className="party-sub font-monospace d-block text-truncate">
                                                            {p.gstin}
                                                        </span>
                                                    )}
                                                </div>
                                                {isSelected && <FaCheck size={9} className="text-primary ms-auto flex-shrink-0" />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Panel 2: Status */}
                    {activeCategory === 'status' && (
                        <div className="filter-panel-section">
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="panel-micro-title">Settlement Status</span>
                                {draftStatus && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-danger text-decoration-none fw-semibold"
                                        style={{ fontSize: '0.68rem' }}
                                        onClick={() => setDraftStatus('')}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="d-flex flex-column gap-1">
                                <div
                                    className={`compact-radio-row ${!draftStatus ? 'selected' : ''}`}
                                    onClick={() => setDraftStatus('')}
                                >
                                    <span className="status-name">All Invoices</span>
                                    {!draftStatus && <FaCheck size={9} className="text-primary" />}
                                </div>

                                <div
                                    className={`compact-radio-row ${draftStatus === 'UNPAID' ? 'selected' : ''}`}
                                    onClick={() => setDraftStatus('UNPAID')}
                                >
                                    <div className="d-flex align-items-center gap-1.5">
                                        <span className="micro-dot bg-danger" />
                                        <span className="status-name">Unpaid / Pending</span>
                                    </div>
                                    {draftStatus === 'UNPAID' && <FaCheck size={9} className="text-primary" />}
                                </div>

                                <div
                                    className={`compact-radio-row ${draftStatus === 'PARTIAL' ? 'selected' : ''}`}
                                    onClick={() => setDraftStatus('PARTIAL')}
                                >
                                    <div className="d-flex align-items-center gap-1.5">
                                        <span className="micro-dot bg-warning" />
                                        <span className="status-name">Partially Paid</span>
                                    </div>
                                    {draftStatus === 'PARTIAL' && <FaCheck size={9} className="text-primary" />}
                                </div>

                                <div
                                    className={`compact-radio-row ${draftStatus === 'PAID' ? 'selected' : ''}`}
                                    onClick={() => setDraftStatus('PAID')}
                                >
                                    <div className="d-flex align-items-center gap-1.5">
                                        <span className="micro-dot bg-success" />
                                        <span className="status-name">Fully Settled</span>
                                    </div>
                                    {draftStatus === 'PAID' && <FaCheck size={9} className="text-primary" />}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Panel 3: Overdue & Aging */}
                    {activeCategory === 'overdue' && (
                        <div className="filter-panel-section">
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="panel-micro-title">Payment Aging</span>
                                {draftIsOverdue && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-danger text-decoration-none fw-semibold"
                                        style={{ fontSize: '0.68rem' }}
                                        onClick={() => setDraftIsOverdue(false)}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <label className="compact-alert-card d-flex align-items-center gap-2 cursor-pointer mb-2">
                                <FormCheck
                                    type="checkbox"
                                    checked={draftIsOverdue}
                                    onChange={(e) => setDraftIsOverdue(e.target.checked)}
                                    className="m-0"
                                />
                                <div>
                                    <span className="fw-bold text-danger d-block" style={{ fontSize: '0.74rem' }}>
                                        Overdue Invoices Only
                                    </span>
                                    <span className="text-muted d-block" style={{ fontSize: '0.67rem' }}>
                                        Pending balance &gt; 0 with past due date.
                                    </span>
                                </div>
                            </label>

                            <div className="p-2 bg-light rounded text-muted" style={{ fontSize: '0.67rem' }}>
                                Highlights accounts with expired credit period for priority collection.
                            </div>
                        </div>
                    )}

                    {/* Panel 4: Dates & Fiscal Year (Refined & Professional) */}
                    {activeCategory === 'dates' && (
                        <div className="filter-panel-section">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                                <span className="panel-micro-title">Issue Date Preset</span>
                                {(draftDatePreset || draftStartDate || draftEndDate) && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-danger text-decoration-none fw-semibold"
                                        style={{ fontSize: '0.68rem' }}
                                        onClick={() => handleSetDatePreset('all')}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {/* Sleek Segmented Pill Cluster */}
                            <div className="preset-pill-cluster mb-2.5">
                                <button
                                    type="button"
                                    className={`preset-pill ${draftDatePreset === 'today' ? 'active' : ''}`}
                                    onClick={() => handleSetDatePreset('today')}
                                >
                                    Today
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${draftDatePreset === 'thisMonth' ? 'active' : ''}`}
                                    onClick={() => handleSetDatePreset('thisMonth')}
                                >
                                    This Month
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${draftDatePreset === 'lastMonth' ? 'active' : ''}`}
                                    onClick={() => handleSetDatePreset('lastMonth')}
                                >
                                    Last Month
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${draftDatePreset === 'thisFY' ? 'active' : ''}`}
                                    onClick={() => handleSetDatePreset('thisFY')}
                                >
                                    Current FY
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${!draftDatePreset && !draftStartDate && !draftEndDate ? 'active' : ''}`}
                                    onClick={() => handleSetDatePreset('all')}
                                >
                                    All
                                </button>
                            </div>

                            <span className="panel-micro-title d-block mb-1">Custom Range</span>
                            <div className="d-grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <label className="input-micro-label">START DATE</label>
                                    <Flatpickr
                                        value={draftStartDate}
                                        onChange={([d]) => {
                                            setDraftStartDate(d ? moment(d).format('YYYY-MM-DD') : '');
                                            setDraftDatePreset('custom');
                                        }}
                                        options={{ dateFormat: 'Y-m-d', altInput: true, altFormat: 'd M Y' }}
                                        className="form-control form-control-sm flatpickr-compact w-100"
                                        placeholder="From"
                                    />
                                </div>
                                <div>
                                    <label className="input-micro-label">END DATE</label>
                                    <Flatpickr
                                        value={draftEndDate}
                                        onChange={([d]) => {
                                            setDraftEndDate(d ? moment(d).format('YYYY-MM-DD') : '');
                                            setDraftDatePreset('custom');
                                        }}
                                        options={{ dateFormat: 'Y-m-d', altInput: true, altFormat: 'd M Y' }}
                                        className="form-control form-control-sm flatpickr-compact w-100"
                                        placeholder="To"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Panel 5: Amount Range */}
                    {activeCategory === 'amount' && (
                        <div className="filter-panel-section">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                                <span className="panel-micro-title">Invoice Value (₹)</span>
                                {(draftMinAmount || draftMaxAmount) && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-danger text-decoration-none"
                                        style={{ fontSize: '0.68rem' }}
                                        onClick={() => {
                                            setDraftMinAmount('');
                                            setDraftMaxAmount('');
                                        }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="d-grid gap-2 mb-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                <div>
                                    <label className="input-micro-label">MIN (₹)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm compact-input font-monospace w-100"
                                        placeholder="0"
                                        value={draftMinAmount}
                                        onChange={(e) => setDraftMinAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="input-micro-label">MAX (₹)</label>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm compact-input font-monospace w-100"
                                        placeholder="Any"
                                        value={draftMaxAmount}
                                        onChange={(e) => setDraftMaxAmount(e.target.value)}
                                    />
                                </div>
                            </div>

                            <span className="panel-micro-title d-block mb-1">Quick Slices</span>
                            <div className="preset-pill-cluster">
                                <button
                                    type="button"
                                    className={`preset-pill ${!draftMinAmount && !draftMaxAmount ? 'active' : ''}`}
                                    onClick={() => handleSetAmountSlice('', '')}
                                >
                                    All
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${draftMinAmount === '0' && draftMaxAmount === '50000' ? 'active' : ''}`}
                                    onClick={() => handleSetAmountSlice(0, 50000)}
                                >
                                    &lt; 50k
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${draftMinAmount === '50000' && draftMaxAmount === '200000' ? 'active' : ''}`}
                                    onClick={() => handleSetAmountSlice(50000, 200000)}
                                >
                                    50k - 2L
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${draftMinAmount === '200000' && draftMaxAmount === '1000000' ? 'active' : ''}`}
                                    onClick={() => handleSetAmountSlice(200000, 1000000)}
                                >
                                    2L - 10L
                                </button>
                                <button
                                    type="button"
                                    className={`preset-pill ${draftMinAmount === '1000000' && !draftMaxAmount ? 'active' : ''}`}
                                    onClick={() => handleSetAmountSlice(1000000, null)}
                                >
                                    &gt; 10L
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Panel 6: E-Way Bill */}
                    {activeCategory === 'eway' && (
                        <div className="filter-panel-section">
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                                <span className="panel-micro-title">E-Way Bill Status</span>
                                {draftEwayBill !== '' && (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm p-0 text-danger text-decoration-none fw-semibold"
                                        style={{ fontSize: '0.68rem' }}
                                        onClick={() => setDraftEwayBill('')}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="d-flex flex-column gap-1">
                                <div
                                    className={`compact-radio-row ${draftEwayBill === '' ? 'selected' : ''}`}
                                    onClick={() => setDraftEwayBill('')}
                                >
                                    <span className="status-name">All Invoices</span>
                                    {draftEwayBill === '' && <FaCheck size={9} className="text-primary" />}
                                </div>

                                <div
                                    className={`compact-radio-row ${draftEwayBill === 'true' ? 'selected' : ''}`}
                                    onClick={() => setDraftEwayBill('true')}
                                >
                                    <span className="status-name">With E-Way Bill</span>
                                    {draftEwayBill === 'true' && <FaCheck size={9} className="text-primary" />}
                                </div>

                                <div
                                    className={`compact-radio-row ${draftEwayBill === 'false' ? 'selected' : ''}`}
                                    onClick={() => setDraftEwayBill('false')}
                                >
                                    <span className="status-name">Without E-Way Bill</span>
                                    {draftEwayBill === 'false' && <FaCheck size={9} className="text-primary" />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Footer (Ultra Compact, Clean) */}
            <div className="filter-popover-footer d-flex align-items-center justify-content-between px-3 py-1.5 border-top bg-light">
                <button
                    type="button"
                    className="btn btn-sm btn-link text-muted text-decoration-none p-0 d-flex align-items-center gap-1"
                    onClick={handleReset}
                    style={{ fontSize: '0.72rem' }}
                >
                    <FaUndo size={9} /> Reset
                </button>
                <div className="d-flex align-items-center gap-1.5">
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary px-2.5 py-0.5"
                        onClick={onClose}
                        style={{ fontSize: '0.72rem', height: '26px' }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-primary px-3 py-0.5 fw-semibold shadow-xs d-flex align-items-center gap-1"
                        onClick={handleApply}
                        style={{ fontSize: '0.72rem', height: '26px' }}
                    >
                        <FaCheck size={9} />
                        <span>Apply{draftActiveCount > 0 ? ` (${draftActiveCount})` : ''}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

InvoiceFilterPopover.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    anchorRef: PropTypes.object,
    filters: PropTypes.object,
    onApplyFilters: PropTypes.func.isRequired,
    onResetFilters: PropTypes.func
};

export default InvoiceFilterPopover;
