import React, { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  InputGroup,
  Badge,
  Spinner,
  Alert,
} from 'react-bootstrap';
import {
  FaArrowLeft,
  FaPrint,
  FaFileExcel,
  FaDownload,
  FaSearch,
  FaTimes,
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaBalanceScale,
  FaBuilding,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSyncAlt,
} from 'react-icons/fa';
import moment from 'moment';
import { usePartyLedger } from '../hooks/usePartyApi';
import { useExportTask } from '../../../lib/export-engine';
import { formatPartyLedgerToExportSchema } from '../utils/ledgerExportAdapter';
import './PartyLedgerPage.css';

/**
 * Calculates start and end dates for Indian Financial Year (01-Apr to 31-Mar)
 */
const getFinancialYearDates = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = Jan, 3 = Apr
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const startDate = `${startYear}-04-01`;

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const endDate = `${yyyy}-${mm}-${dd}`;

  return { startDate, endDate };
};

/**
 * Calculates start and end dates for the current calendar month
 */
const getThisMonthDates = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const today = String(now.getDate()).padStart(2, '0');
  return {
    startDate: `${y}-${m}-01`,
    endDate: `${y}-${m}-${today}`,
  };
};

/**
 * Calculates start and end dates for the previous financial quarter
 */
const getLastQuarterDates = () => {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const quarterIndex = Math.floor(currentMonth / 3);
  const lastQuarterIndex = (quarterIndex + 3) % 4;
  const year = quarterIndex === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const startMonth = lastQuarterIndex * 3;
  const endMonth = startMonth + 2;
  const lastDay = new Date(year, endMonth + 1, 0).getDate();

  return {
    startDate: `${year}-${String(startMonth + 1).padStart(2, '0')}-01`,
    endDate: `${year}-${String(endMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
};

/**
 * Formats numbers into standard Indian Currency representation (₹ 1,50,000.00)
 */
const formatCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const m = moment(dateStr);
    return m.isValid() ? m.format('DD/MM/YYYY') : dateStr;
  } catch {
    return dateStr;
  }
};

const PartyLedgerPage = () => {
  const { id: partyId } = useParams();
  const activeFirm = useSelector((state) => state.firmReducer?.activeFirm || state.firm?.activeFirm);

  // Date Filter State
  const defaultFY = useMemo(() => getFinancialYearDates(), []);
  const [activePreset, setActivePreset] = useState('current-fy');
  const [startDate, setStartDate] = useState(defaultFY.startDate);
  const [endDate, setEndDate] = useState(defaultFY.endDate);

  // In-table Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVchType, setSelectedVchType] = useState('ALL');

  // Query Backend Ledger Data
  const {
    data: ledgerData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = usePartyLedger({
    partyId,
    startDate,
    endDate,
    enabled: Boolean(partyId),
  });

  // Global Universal Export Engine Hook
  const { isExporting, activeFormat, executeExport } = useExportTask();

  // Download PDF Handler (Captured in browser download history)
  const handleDownloadPdf = useCallback(() => {
    if (!ledgerData) return;
    const config = formatPartyLedgerToExportSchema(ledgerData, activeFirm);
    const partyNameSafe = (ledgerData.party?.legalName || 'Ledger')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = `${partyNameSafe}_Ledger_${startDate}_to_${endDate}`;

    executeExport({
      config,
      format: 'pdf',
      fileName,
    });
  }, [ledgerData, activeFirm, startDate, endDate, executeExport]);

  // Preset Handler
  const handlePresetSelect = useCallback((preset) => {
    setActivePreset(preset);
    if (preset === 'current-fy') {
      const dates = getFinancialYearDates();
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    } else if (preset === 'this-month') {
      const dates = getThisMonthDates();
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    } else if (preset === 'last-quarter') {
      const dates = getLastQuarterDates();
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }
  }, []);

  // Filter transactions in memory by search query and voucher type
  const filteredTransactions = useMemo(() => {
    if (!ledgerData?.transactions) return [];
    let list = ledgerData.transactions;

    if (selectedVchType !== 'ALL') {
      list = list.filter((tx) =>
        String(tx.voucherType || '').toUpperCase().includes(selectedVchType)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (tx) =>
          (tx.voucherNo && tx.voucherNo.toLowerCase().includes(q)) ||
          (tx.particulars && tx.particulars.toLowerCase().includes(q)) ||
          (tx.voucherType && tx.voucherType.toLowerCase().includes(q))
      );
    }

    return list;
  }, [ledgerData?.transactions, selectedVchType, searchQuery]);

  // Export to Excel Handler (Background Web Worker)
  const handleExportExcel = useCallback(() => {
    if (!ledgerData) return;
    const config = formatPartyLedgerToExportSchema(ledgerData, activeFirm);
    const partyNameSafe = (ledgerData.party?.legalName || 'Ledger')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const fileName = `${partyNameSafe}_Ledger_${startDate}_to_${endDate}`;

    executeExport({
      config,
      format: 'excel',
      fileName,
    });
  }, [ledgerData, activeFirm, startDate, endDate, executeExport]);

  // Print / PDF Handler (A4 Corporate Print Driver)
  const handleExportPrint = useCallback(() => {
    if (!ledgerData) return;
    const config = formatPartyLedgerToExportSchema(ledgerData, activeFirm);
    executeExport({
      config,
      format: 'print',
    });
  }, [ledgerData, activeFirm, executeExport]);

  // Voucher Badge Variant Mapper
  const renderVoucherBadge = (type) => {
    const t = String(type || '').toLowerCase();
    let badgeClass = 'vch-badge';
    if (t.includes('invoice')) badgeClass += ' invoice';
    else if (t.includes('receipt')) badgeClass += ' receipt';
    else if (t.includes('bill')) badgeClass += ' bill';
    else if (t.includes('payment')) badgeClass += ' payment';
    else badgeClass += ' opening';

    return <span className={badgeClass}>{type || 'Voucher'}</span>;
  };

  const party = ledgerData?.party;
  const summary = ledgerData?.summary;
  const openingBalance = ledgerData?.openingBalance || 0;
  const openingBalanceType = ledgerData?.openingBalanceType || 'Dr';

  return (
    <div className="party-ledger-container container-fluid px-3 py-3">
      {/* 1. Header & Navigation */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/parties" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 shadow-sm">
            <FaArrowLeft size={12} />
            <span>Back to Parties</span>
          </Link>
          <div className="vr d-none d-md-block mx-1" style={{ height: '24px' }}></div>
          <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <span>Statement of Account</span>
            <span className="text-muted fw-normal fs-6 d-none d-sm-inline">(Party Ledger)</span>
          </h4>
        </div>

        {/* Action Buttons */}
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="d-flex align-items-center gap-1 shadow-sm"
            onClick={() => refetch()}
            disabled={isFetching || isLoading}
            title="Refresh Ledger Data"
          >
            <FaSyncAlt size={12} className={isFetching ? 'fa-spin' : ''} />
            <span className="d-none d-md-inline">Refresh</span>
          </Button>

          {/* Export to Excel */}
          <Button
            variant="outline-success"
            size="sm"
            className="d-flex align-items-center gap-2 shadow-sm fw-semibold"
            onClick={handleExportExcel}
            disabled={isLoading || isExporting || !ledgerData}
            title="Download formatted Excel spreadsheet"
          >
            {isExporting && activeFormat === 'excel' ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FaFileExcel size={14} className="text-success" />
                <span>Export Excel</span>
              </>
            )}
          </Button>

          {/* Download PDF (Triggers Browser File Download History) */}
          <Button
            variant="outline-danger"
            size="sm"
            className="d-flex align-items-center gap-2 shadow-sm fw-semibold"
            onClick={handleDownloadPdf}
            disabled={isLoading || isExporting || !ledgerData}
            title="Download PDF statement file directly to your downloads"
          >
            {isExporting && activeFormat === 'pdf' ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>Compiling PDF...</span>
              </>
            ) : (
              <>
                <FaDownload size={13} className="text-danger" />
                <span>Download PDF</span>
              </>
            )}
          </Button>

          {/* Print */}
          <Button
            variant="primary"
            size="sm"
            className="d-flex align-items-center gap-2 shadow-sm fw-semibold"
            onClick={handleExportPrint}
            disabled={isLoading || isExporting || !ledgerData}
            title="Open browser print preview dialog"
          >
            {isExporting && activeFormat === 'print' ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>Preparing...</span>
              </>
            ) : (
              <>
                <FaPrint size={14} />
                <span>Print</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 2. Party Master Header Card */}
      <Card className="ledger-header-card mb-3 p-3">
        <Row className="align-items-center g-3">
          <Col xs="auto">
            <div className="party-avatar-badge">
              {party?.legalName ? party.legalName.slice(0, 2).toUpperCase() : 'PL'}
            </div>
          </Col>
          <Col>
            <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h5 className="fw-bold text-dark mb-0">
                {party?.legalName || party?.displayName || (isLoading ? 'Loading Party...' : 'Party Account')}
              </h5>
              {party?.partyCode && (
                <Badge bg="soft-primary" className="text-primary font-monospace px-2 py-1">
                  {party.partyCode}
                </Badge>
              )}
              {party?.gstin ? (
                <Badge bg="soft-success" className="text-success font-monospace px-2 py-1">
                  GST: {party.gstin}
                </Badge>
              ) : (
                <Badge bg="light" className="text-muted px-2 py-1">
                  Unregistered
                </Badge>
              )}
            </div>

            <div className="d-flex flex-wrap align-items-center gap-3 text-muted small">
              {party?.mobile && (
                <span className="d-flex align-items-center gap-1">
                  <FaPhoneAlt size={10} />
                  <span>{party.mobile}</span>
                </span>
              )}
              {party?.email && (
                <span className="d-flex align-items-center gap-1">
                  <FaEnvelope size={10} />
                  <span>{party.email}</span>
                </span>
              )}
              {party?.address && (
                <span className="d-flex align-items-center gap-1">
                  <FaMapMarkerAlt size={10} />
                  <span>{party.address}</span>
                </span>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* 3. Period Filter Bar */}
      <Card className="border-0 shadow-sm mb-3">
        <Card.Body className="p-3">
          <Row className="align-items-center g-3">
            <Col xs={12} lg="auto">
              <div className="d-flex align-items-center gap-1 flex-wrap">
                <span className="text-muted small fw-semibold me-1">Period:</span>
                <Button
                  variant={activePreset === 'current-fy' ? 'primary' : 'outline-light'}
                  size="sm"
                  className={`date-preset-pill text-dark ${activePreset === 'current-fy' ? 'active text-white' : ''}`}
                  onClick={() => handlePresetSelect('current-fy')}
                >
                  Current FY
                </Button>
                <Button
                  variant={activePreset === 'last-quarter' ? 'primary' : 'outline-light'}
                  size="sm"
                  className={`date-preset-pill text-dark ${activePreset === 'last-quarter' ? 'active text-white' : ''}`}
                  onClick={() => handlePresetSelect('last-quarter')}
                >
                  Last Quarter
                </Button>
                <Button
                  variant={activePreset === 'this-month' ? 'primary' : 'outline-light'}
                  size="sm"
                  className={`date-preset-pill text-dark ${activePreset === 'this-month' ? 'active text-white' : ''}`}
                  onClick={() => handlePresetSelect('this-month')}
                >
                  This Month
                </Button>
                <Button
                  variant={activePreset === 'custom' ? 'primary' : 'outline-light'}
                  size="sm"
                  className={`date-preset-pill text-dark ${activePreset === 'custom' ? 'active text-white' : ''}`}
                  onClick={() => setActivePreset('custom')}
                >
                  Custom
                </Button>
              </div>
            </Col>

            {/* Date Pickers */}
            <Col xs={12} sm={6} lg="auto" className="ms-lg-auto">
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light text-muted">
                  <FaCalendarAlt size={12} />
                  <span className="ms-1 small">From</span>
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setStartDate(e.target.value);
                  }}
                />
              </InputGroup>
            </Col>

            <Col xs={12} sm={6} lg="auto">
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light text-muted">
                  <FaCalendarAlt size={12} />
                  <span className="ms-1 small">To</span>
                </InputGroup.Text>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setActivePreset('custom');
                    setEndDate(e.target.value);
                  }}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 4. Financial Summary KPI Cards (4 Cards Grid) */}
      <Row className="g-3 mb-3">
        {/* Card 1: Opening Balance */}
        <Col xs={12} sm={6} xl={3}>
          <div className="ledger-stat-card card-opening p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Opening Balance</span>
              <div className="stat-icon-wrapper icon-opening">
                <FaWallet />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h4 className="fw-bold text-dark mb-0">
                {isLoading ? <Spinner animation="border" size="sm" /> : formatCurrency(openingBalance)}
              </h4>
              <Badge bg={openingBalanceType === 'Dr' ? 'primary' : 'danger'} className="text-uppercase">
                {openingBalanceType}
              </Badge>
            </div>
            <div className="text-muted small mt-1">
              As on {formatDate(startDate)}
            </div>
          </div>
        </Col>

        {/* Card 2: Total Debits */}
        <Col xs={12} sm={6} xl={3}>
          <div className="ledger-stat-card card-debit p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Total Debits (+)</span>
              <div className="stat-icon-wrapper icon-debit">
                <FaArrowUp />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h4 className="fw-bold text-success mb-0">
                {isLoading ? <Spinner animation="border" size="sm" /> : formatCurrency(summary?.totalDebit || 0)}
              </h4>
            </div>
            <div className="text-muted small mt-1">
              Sales Invoices / Outward
            </div>
          </div>
        </Col>

        {/* Card 3: Total Credits */}
        <Col xs={12} sm={6} xl={3}>
          <div className="ledger-stat-card card-credit p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Total Credits (-)</span>
              <div className="stat-icon-wrapper icon-credit">
                <FaArrowDown />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h4 className="fw-bold text-warning mb-0">
                {isLoading ? <Spinner animation="border" size="sm" /> : formatCurrency(summary?.totalCredit || 0)}
              </h4>
            </div>
            <div className="text-muted small mt-1">
              Receipts / Vendor Bills
            </div>
          </div>
        </Col>

        {/* Card 4: Net Closing Balance */}
        <Col xs={12} sm={6} xl={3}>
          <div className="ledger-stat-card card-closing p-3 h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-primary small fw-bold text-uppercase">Net Closing Balance</span>
              <div className="stat-icon-wrapper icon-closing">
                <FaBalanceScale />
              </div>
            </div>
            <div className="d-flex align-items-baseline gap-2">
              <h4 className="fw-bold text-primary mb-0">
                {isLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  formatCurrency(summary?.netClosingBalance || 0)
                )}
              </h4>
              <Badge
                bg={summary?.closingBalanceType === 'Dr' ? 'primary' : 'danger'}
                className="text-uppercase"
              >
                {summary?.closingBalanceType || 'Dr'}
              </Badge>
            </div>
            <div className="text-muted small mt-1">
              {summary?.closingBalanceType === 'Dr'
                ? 'Receivable from Party (लेणदार)'
                : 'Payable to Party (देणदार)'}
            </div>
          </div>
        </Col>
      </Row>

      {/* 5. Error State */}
      {isError && (
        <Alert variant="danger" className="d-flex align-items-center justify-content-between">
          <div>
            <strong>Error loading ledger statement:</strong>{' '}
            {error?.response?.data?.message || error?.message || 'Failed to fetch party transactions.'}
          </div>
          <Button variant="outline-danger" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </Alert>
      )}

      {/* 6. Transactions Table Card */}
      <Card className="ledger-table-card border-0 shadow-sm">
        {/* Table Filters Toolbar */}
        <Card.Header className="bg-white py-3 border-bottom">
          <Row className="align-items-center g-2">
            <Col xs={12} md={4}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-light border-end-0">
                  <FaSearch size={12} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search voucher no, particulars..."
                  className="border-start-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="outline-secondary"
                    className="border-start-0"
                    onClick={() => setSearchQuery('')}
                  >
                    <FaTimes size={10} />
                  </Button>
                )}
              </InputGroup>
            </Col>

            <Col xs="auto" className="ms-md-auto">
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted small">Filter Type:</span>
                <Form.Select
                  size="sm"
                  style={{ width: '150px' }}
                  value={selectedVchType}
                  onChange={(e) => setSelectedVchType(e.target.value)}
                >
                  <option value="ALL">All Types</option>
                  <option value="INVOICE">Invoices</option>
                  <option value="RECEIPT">Receipts</option>
                  <option value="BILL">Vendor Bills</option>
                  <option value="PAYMENT">Payments</option>
                </Form.Select>
              </div>
            </Col>
          </Row>
        </Card.Header>

        {/* Transactions Table Body */}
        <div className="table-responsive">
          <Table hover className="ledger-table align-middle">
            <thead>
              <tr>
                <th style={{ width: '40px' }} className="text-center">#</th>
                <th style={{ width: '110px' }}>Date</th>
                <th style={{ width: '130px' }}>Voucher Type</th>
                <th style={{ width: '150px' }}>Voucher No</th>
                <th>Particulars</th>
                <th style={{ width: '140px' }} className="text-end">Debit (₹)</th>
                <th style={{ width: '140px' }} className="text-end">Credit (₹)</th>
                <th style={{ width: '160px' }} className="text-end">Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 0: Opening Balance Row */}
              <tr className="opening-bal-row">
                <td className="text-center text-muted">—</td>
                <td className="text-muted">{formatDate(startDate)}</td>
                <td>{renderVoucherBadge('Opening Balance')}</td>
                <td className="text-muted font-monospace">—</td>
                <td className="fw-semibold text-secondary">
                  Opening Balance brought forward
                </td>
                <td className="text-end debit-amount">
                  {openingBalanceType === 'Dr' && openingBalance > 0 ? formatCurrency(openingBalance) : '—'}
                </td>
                <td className="text-end credit-amount">
                  {openingBalanceType === 'Cr' && openingBalance > 0 ? formatCurrency(openingBalance) : '—'}
                </td>
                <td className="text-end">
                  <span className="balance-amount">{formatCurrency(openingBalance)}</span>
                  <span className={`balance-tag ${openingBalanceType.toLowerCase()}`}>
                    {openingBalanceType}
                  </span>
                </td>
              </tr>

              {/* Loading State */}
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <Spinner animation="border" variant="primary" className="mb-2" />
                    <div>Loading chronological transactions...</div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="fs-5 fw-semibold mb-1">No Transactions Found</div>
                    <div className="small">
                      There are no vouchers recorded for this party within the selected period.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.refId ? `${tx.voucherType}-${tx.refId}` : idx}>
                    <td className="text-center text-muted small">{idx + 1}</td>
                    <td className="font-monospace text-dark">{formatDate(tx.date)}</td>
                    <td>{renderVoucherBadge(tx.voucherType)}</td>
                    <td className="font-monospace fw-semibold text-dark">
                      {tx.voucherNo || '—'}
                    </td>
                    <td className="text-dark">{tx.particulars}</td>
                    <td className="text-end debit-amount">
                      {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                    </td>
                    <td className="text-end credit-amount">
                      {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                    </td>
                    <td className="text-end">
                      <span className="balance-amount">{formatCurrency(tx.balance)}</span>
                      <span className={`balance-tag ${String(tx.balanceType).toLowerCase()}`}>
                        {tx.balanceType}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Summary Footer */}
            {!isLoading && (
              <tfoot>
                <tr>
                  <td colSpan="5" className="text-end text-uppercase fw-bold text-dark">
                    Total Transactions Volume:
                  </td>
                  <td className="text-end debit-amount fs-6">
                    {formatCurrency(summary?.totalDebit || 0)}
                  </td>
                  <td className="text-end credit-amount fs-6">
                    {formatCurrency(summary?.totalCredit || 0)}
                  </td>
                  <td className="text-end">
                    <span className="balance-amount fs-6">
                      {formatCurrency(summary?.netClosingBalance || 0)}
                    </span>
                    <span className={`balance-tag ${String(summary?.closingBalanceType || 'Dr').toLowerCase()}`}>
                      {summary?.closingBalanceType || 'Dr'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td colSpan="5" className="text-end text-uppercase fw-bold text-primary">
                    Net Closing Balance as on {formatDate(endDate)}:
                  </td>
                  <td colSpan="3" className="text-end text-primary fw-bold fs-6">
                    {formatCurrency(summary?.netClosingBalance || 0)}{' '}
                    <Badge bg={summary?.closingBalanceType === 'Dr' ? 'primary' : 'danger'}>
                      {summary?.closingBalanceType || 'Dr'}
                    </Badge>
                  </td>
                </tr>
              </tfoot>
            )}
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default PartyLedgerPage;
