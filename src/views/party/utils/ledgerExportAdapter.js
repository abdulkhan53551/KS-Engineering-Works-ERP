/**
 * Party Ledger Export Adapter
 * 
 * Transforms API party ledger response payload into the Universal Report Contract
 * required by the Global Export Engine (Web Worker Excel + A4 Native Print Driver).
 */

const formatIndianCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—';
  if (typeof dateStr === 'string' && /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Transforms Party Ledger API data into Universal Report Schema.
 * 
 * @param {object} ledgerData - Response from GET /parties/:partyId/ledger
 * @param {object} [activeFirm] - Current active firm from Redux store
 * @returns {object} Universal Report Config for Export Engine
 */
export const formatPartyLedgerToExportSchema = (ledgerData, activeFirm = {}) => {
  if (!ledgerData || !ledgerData.party) {
    throw new Error('Invalid ledger data provided to export adapter.');
  }

  const { party, period, openingBalance, openingBalanceType, transactions = [], summary = {}, agingSummary } = ledgerData;

  // Firm details resolved from Backend response first, then Redux session (No hardcoded fallbacks)
  const firmSource = ledgerData?.firm || activeFirm || {};
  const firmName = firmSource.name || firmSource.firmName || firmSource.firm_name || firmSource.legalName || firmSource.tradeName || '';
  const firmGstin = firmSource.gstin || '';
  const firmAddress = firmSource.address || firmSource.billingAddress || '';
  const firmPhone = firmSource.phone || firmSource.mobile || firmSource.phone_number || '';
  const firmEmail = firmSource.email || '';
  const firmPan = firmSource.panNumber || firmSource.pan_number || firmSource.pan || '';
  const firmLogo = firmSource.logoUrl || firmSource.logo_url || firmSource.logo || null;

  // Metadata for report header
  const metadata = [
    { label: 'Party Name', value: party.legalName || party.displayName || '—' },
    { label: 'Party Code', value: party.partyCode || '—' },
    { label: 'GSTIN', value: party.gstin || 'Unregistered' },
    { label: 'Contact', value: party.mobile || party.email || '—' },
    { label: 'Address', value: party.address || '—' },
    { label: 'Statement Period', value: `${formatDateDisplay(period?.startDate)} to ${formatDateDisplay(period?.endDate)}` },
    { label: 'Opening Balance', value: `₹${formatIndianCurrency(openingBalance)} ${openingBalanceType || 'Dr'}` },
    { label: 'Closing Balance', value: `₹${formatIndianCurrency(summary?.netClosingBalance)} ${summary?.closingBalanceType || 'Dr'}` },
  ];

  if (agingSummary) {
    if (agingSummary.applicableCreditDays > 0) {
      metadata.push({ label: 'Credit Terms', value: `${agingSummary.applicableCreditDays} Days` });
    }
    if (agingSummary.overdueAmount > 0) {
      metadata.push({ label: 'Immediate Overdue', value: `₹${formatIndianCurrency(agingSummary.overdueAmount)} (Past Credit Terms)` });
    }
    if (agingSummary.currentDueAmount > 0) {
      metadata.push({ label: 'Within Terms Due', value: `₹${formatIndianCurrency(agingSummary.currentDueAmount)}` });
    }
  }

  // Table Columns (Option C Enterprise Format)
  const columns = [
    { header: '#', key: 'index', width: 8, type: 'number', align: 'center' },
    { header: 'Date', key: 'date', width: 19, type: 'date', align: 'center' },
    { header: 'Type', key: 'voucherType', width: 23, type: 'text', align: 'left' },
    { header: 'Voucher No', key: 'voucherNo', width: 25, type: 'text', align: 'left' },
    { header: 'Particulars', key: 'particulars', width: 53, type: 'text', align: 'left' },
    { header: 'Debit (₹)', key: 'debit', width: 22, type: 'currency', align: 'right' },
    { header: 'Credit (₹)', key: 'credit', width: 22, type: 'currency', align: 'right' },
    { header: 'Balance (₹)', key: 'balance', width: 22, type: 'text', align: 'right' },
  ];

  // Rows Construction
  const rows = [];

  // Row 0: Opening Balance
  rows.push({
    index: 1,
    date: formatDateDisplay(period?.startDate),
    type: 'OPENING',
    voucherType: 'Opening',
    voucherNo: '—',
    description: 'Opening Balance brought forward',
    particulars: 'Opening Balance brought forward',
    debit: openingBalanceType === 'Dr' && openingBalance > 0 ? openingBalance : null,
    credit: openingBalanceType === 'Cr' && openingBalance > 0 ? openingBalance : null,
    rawDebit: openingBalanceType === 'Dr' && openingBalance > 0 ? openingBalance : 0,
    rawCredit: openingBalanceType === 'Cr' && openingBalance > 0 ? openingBalance : 0,
    balance: `₹${formatIndianCurrency(openingBalance)} ${openingBalanceType || 'Dr'}`,
    balanceNum: openingBalance,
    rawBalance: openingBalance,
    balanceType: openingBalanceType || 'Dr',
    isOpening: true,
  });

  // Transaction Rows
  transactions.forEach((tx, idx) => {
    const dVal = Number(tx.debit || 0);
    const cVal = Number(tx.credit || 0);
    const bVal = Number(tx.balance ?? 0);
    const rowDesc = tx.particulars || '—';

    rows.push({
      index: idx + 2,
      date: formatDateDisplay(tx.date),
      type: (tx.voucherType || 'Transaction').toUpperCase(),
      voucherType: tx.voucherType || 'Transaction',
      voucherNo: tx.voucherNo || '—',
      description: rowDesc,
      particulars: rowDesc,
      debit: dVal > 0 ? dVal : null,
      credit: cVal > 0 ? cVal : null,
      balance: `₹${formatIndianCurrency(bVal)} ${tx.balanceType || 'Dr'}`,
      balanceNum: bVal,
      rawBalance: bVal,
      balanceType: tx.balanceType || (bVal >= 0 ? 'Dr' : 'Cr'),
      rawDebit: dVal,
      rawCredit: cVal,
      dueDate: tx.dueDate ? formatDateDisplay(tx.dueDate) : null,
      isSettled: tx.isSettled,
      isOverdue: tx.isOverdue,
      overdueDays: tx.overdueDays,
    });
  });

  // Summary Rows
  const summaryRows = [
    {
      label: 'Total Debit',
      value: `₹${formatIndianCurrency(summary?.totalDebit || 0)}`,
      particulars: 'Total Debit',
      debit: summary?.totalDebit || 0,
    },
    {
      label: 'Total Credit',
      value: `₹${formatIndianCurrency(summary?.totalCredit || 0)}`,
      particulars: 'Total Credit',
      credit: summary?.totalCredit || 0,
    },
    {
      label: 'Closing Balance',
      value: `₹${formatIndianCurrency(summary?.netClosingBalance ?? 0)} ${summary?.closingBalanceType || 'Dr'}`,
      particulars: 'Closing Balance carried forward',
      balance: `₹${formatIndianCurrency(summary?.netClosingBalance ?? 0)} ${summary?.closingBalanceType || 'Dr'}`,
      isHighlighted: true,
    },
  ];

  // Option C: 4-KPI Metric Grid (All 4 with identical neutral background #fafbfc per user instruction)
  const kpiGrid = [
    {
      label: 'OPENING BALANCE',
      value: `₹${formatIndianCurrency(openingBalance)}`,
      badge: openingBalanceType || 'Dr',
      badgeColor: openingBalanceType === 'Dr' ? '#dc2626' : '#15803d',
    },
    {
      label: 'TOTAL INVOICED (DR)',
      value: `₹${formatIndianCurrency(summary?.totalDebit || 0)}`,
      valueColor: '#1d4ed8',
    },
    {
      label: 'TOTAL RECEIVED (CR)',
      value: `₹${formatIndianCurrency(summary?.totalCredit || 0)}`,
      valueColor: '#15803d',
    },
    {
      label: 'CLOSING BALANCE DUE',
      value: `₹${formatIndianCurrency(summary?.netClosingBalance ?? 0)}`,
      badge: summary?.closingBalanceType || 'Dr',
      badgeColor: summary?.closingBalanceType === 'Dr' ? '#dc2626' : '#15803d',
      // Neutral background #fafbfc retained
    },
  ];

  return {
    reportType: 'PARTY_LEDGER',
    title: 'STATEMENT OF ACCOUNT',
    subTitle: 'PARTY LEDGER',
    party,
    period: {
      startDate: formatDateDisplay(period?.startDate),
      endDate: formatDateDisplay(period?.endDate),
      rawStartDate: period?.startDate,
      rawEndDate: period?.endDate,
    },
    openingBalance,
    openingBalanceType,
    summary,
    agingSummary,
    kpiGrid,
    company: {
      name: firmName,
      address: firmAddress,
      gstin: firmGstin,
      pan: firmPan,
      phone: firmPhone,
      email: firmEmail,
      logo: firmLogo,
    },
    metadata,
    columns,
    rows,
    summaryRows,
    orientation: 'portrait',
  };
};
