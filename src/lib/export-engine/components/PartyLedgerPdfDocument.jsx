import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Polygon,
  Circle,
  Font,
} from '@react-pdf/renderer';

// Register Unicode-compliant Noto Sans font with full Rupee (₹) glyph support
const origin = typeof window !== 'undefined' && window.location?.origin
  ? window.location.origin
  : '';

Font.register({
  family: 'Noto Sans',
  fonts: [
    {
      src: `${origin}/fonts/NotoSans-Regular.ttf`,
      fontWeight: 'normal',
    },
    {
      src: `${origin}/fonts/NotoSans-Bold.ttf`,
      fontWeight: 'bold',
    },
    {
      src: `${origin}/fonts/NotoSans-Italic.ttf`,
      fontStyle: 'italic',
    },
  ],
});

// Disable automatic hyphenation for clean financial figures & party names
Font.registerHyphenationCallback((word) => [word]);

/**
 * Number to Indian Words converter for accounting statements.
 */
function amountToWords(num) {
  if (!num || isNaN(num) || Number(num) === 0) return 'Zero Only';
  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'Overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += Number(n_array[1]) !== 0 ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += Number(n_array[2]) !== 0 ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += Number(n_array[3]) !== 0 ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += Number(n_array[4]) !== 0 ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += Number(n_array[5]) !== 0 ? (str !== '' ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str.trim();
  }

  const parts = Math.abs(Number(num)).toFixed(2).split('.');
  const integerPart = Number(parts[0]);
  const decimalPart = Number(parts[1]);

  let result = inWords(integerPart);
  if (!result) result = 'Zero';

  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + ' Paise';
  }
  return result + ' Only';
}

/**
 * Formats numeric values into Indian comma separated currency with Rupee symbol (₹).
 */
const formatRupeeAmount = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(String(val).replace(/[₹'",]/g, '').trim());
  if (isNaN(num)) return String(val);
  return `₹ ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formats dates safely from ISO timestamps or Date objects into clean DD-MMM-YYYY.
 */
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—';
  if (typeof dateStr === 'string' && /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  if (typeof dateStr === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, m, year] = dateStr.split('/');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[parseInt(m, 10) - 1] || m;
    return `${day}-${month}-${year}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const styles = StyleSheet.create({
  page: {
    padding: 12,
    fontFamily: 'Noto Sans',
    backgroundColor: '#ffffff',
    fontSize: 6.8,
    color: '#1e293b',
  },
  docFrame: {
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderTopWidth: 3.5,
    borderTopColor: '#dc2626',
    borderRadius: 3,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  // Top bar
  topBar: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1.2,
    borderBottomColor: '#cbd5e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  companyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coName: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#dc2626',
    letterSpacing: 0.3,
  },
  coSub: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 1,
  },
  coTax: {
    fontSize: 6.2,
    color: '#64748b',
    marginTop: 1.5,
  },
  docTitleBox: {
    alignItems: 'flex-end',
  },
  docTitleTxt: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.2,
  },
  periodChip: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 3,
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    marginTop: 2.5,
  },
  periodChipTxt: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  docMetaSub: {
    fontSize: 6.2,
    color: '#64748b',
    marginTop: 2,
  },
  // Meta Grid (Party + 4 KPIs)
  metaGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  partyCell: {
    flex: 1.15,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
  },
  secTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  secTagLeft: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#dc2626',
    letterSpacing: 0.4,
  },
  secTagRight: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  partyName: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  partyText: {
    fontSize: 6.4,
    color: '#475569',
    lineHeight: 1.3,
  },
  kpiStrip: {
    flex: 1.15,
    flexDirection: 'column',
    backgroundColor: '#fafbfc',
  },
  kpiRow: {
    flexDirection: 'row',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  kpiItem: {
    flex: 1,
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    justifyContent: 'center',
  },
  kpiLbl: {
    fontSize: 5.8,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  kpiVal: {
    fontSize: 7.6,
    fontWeight: 'bold',
    marginTop: 1,
  },
  drBadge: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#dc2626',
    marginLeft: 2,
  },
  crBadge: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#15803d',
    marginLeft: 2,
  },
  // Table
  tableBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderTopWidth: 1.2,
    borderTopColor: '#fecdd3',
    borderBottomWidth: 1.8,
    borderBottomColor: '#dc2626',
    paddingVertical: 3.5,
    alignItems: 'center',
  },
  th: {
    fontSize: 6.3,
    fontWeight: 'bold',
    color: '#991b1b',
    letterSpacing: 0.25,
    paddingHorizontal: 3,
    borderRightWidth: 0.8,
    borderRightColor: '#fee2e2',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2.2,
    borderBottomWidth: 0.8,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#fafbfc',
  },
  td: {
    fontSize: 6.4,
    color: '#1e293b',
    paddingHorizontal: 3,
    borderRightWidth: 0.8,
    borderRightColor: '#f1f5f9',
  },
  openingRow: {
    flexDirection: 'row',
    paddingVertical: 2.5,
    backgroundColor: '#fffdf5',
    borderBottomWidth: 1,
    borderBottomColor: '#fef08a',
    alignItems: 'center',
  },
  openingTd: {
    fontSize: 6.4,
    color: '#854d0e',
    fontWeight: 'bold',
    paddingHorizontal: 3,
    borderRightWidth: 0.8,
    borderRightColor: '#fef08a',
  },
  carryRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    alignItems: 'center',
  },
  carryLabelCol: {
    width: '65%',
    textAlign: 'right',
    paddingRight: 8,
  },
  carryText: {
    fontSize: 6.3,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    backgroundColor: '#fef2f2',
    borderTopWidth: 1.2,
    borderTopColor: '#fecdd3',
    borderBottomWidth: 2,
    borderBottomColor: '#dc2626',
    alignItems: 'center',
  },
  gtLabelCol: {
    width: '65%',
    textAlign: 'right',
    paddingRight: 8,
  },
  gtLabelText: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#991b1b',
  },
  // Column Widths
  colIdx: { width: '3%', textAlign: 'center' },
  colDate: { width: '10%', textAlign: 'center' },
  colType: { width: '12%' },
  colNo: { width: '13%' },
  colDesc: { width: '27%' },
  colDebit: { width: '11%', textAlign: 'right' },
  colCredit: { width: '11%', textAlign: 'right' },
  colBal: { width: '13%', textAlign: 'right', paddingRight: 4 },
  // Continuation bar for Page 2+
  contBar: {
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#dc2626',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  contComp: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  contParty: {
    fontSize: 6.8,
    color: '#334155',
    marginTop: 1,
  },
  contTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  contMeta: {
    fontSize: 6.4,
    color: '#64748b',
    marginTop: 1,
    textAlign: 'right',
  },
  // Bottom Box
  bottomBox: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  wordsArea: {
    flex: 1.35,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  wordsTxt: {
    fontSize: 6.5,
    color: '#334155',
    marginBottom: 3,
  },
  termsTag: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 1.5,
  },
  termsTxt: {
    fontSize: 6,
    color: '#64748b',
    lineHeight: 1.3,
  },
  signArea: {
    flex: 0.85,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafbfc',
  },
  signComp: {
    fontSize: 6.8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  signSpace: {
    height: 24,
  },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: '#ef4444',
    borderStyle: 'dashed',
    width: 130,
    paddingTop: 2,
    alignItems: 'center',
  },
  signLabel: {
    fontSize: 6.2,
    color: '#64748b',
    fontWeight: 'bold',
  },
  continuationNotice: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 6.5,
    color: '#475569',
    textAlign: 'right',
  },
  docFooter: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6,
    color: '#94a3b8',
    backgroundColor: '#ffffff',
  },
});

const OctagonLogo = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Polygon
      points="50,4 88,26 88,74 50,96 12,74 12,26"
      fill="#fef2f2"
      stroke="#dc2626"
      strokeWidth={5}
      strokeLinejoin="round"
    />
    <Circle
      cx={50}
      cy={50}
      r={32}
      fill="#ffffff"
      stroke="#ef4444"
      strokeWidth={2.5}
      strokeDasharray="4 2"
    />
    <Text
      x={50}
      y={57}
      fontSize={22}
      fontWeight="bold"
      fill="#dc2626"
      textAnchor="middle"
    >
      KS
    </Text>
  </Svg>
);

const PartyLedgerPdfDocument = ({ config = {} }) => {
  const {
    company = {},
    party = {},
    period = {},
    openingBalance = 0,
    openingBalanceType = 'Dr',
    summary = {},
    agingSummary = null,
    rows = [],
  } = config;

  const companyName = (company?.name || '').toUpperCase();
  const companyAddress = company?.address || '';
  const companyGstin = company?.gstin || '';
  const companyPan = company?.pan || '';

  const partyName = (party?.legalName || party?.displayName || '').toUpperCase();
  const partyCode = party?.partyCode || '—';
  const partyAddress = party?.address || '—';
  const partyGstin = party?.gstin || 'Unregistered';
  const partyStateCode = party?.stateCode || (party?.gstin ? party.gstin.slice(0, 2) : '—');
  const partyPan = party?.pan || (party?.gstin && party.gstin.length >= 12 ? party.gstin.slice(2, 12) : '—');
  const partyContact = party?.contactPerson || party?.mobile || party?.email || '—';

  const startDateFormatted = formatDateDisplay(period?.startDate) || '—';
  const endDateFormatted = formatDateDisplay(period?.endDate) || '—';
  const periodFormatted = `${startDateFormatted} to ${endDateFormatted}`;

  const now = new Date();
  const genDate = formatDateDisplay(now);
  const closingWords = amountToWords(summary?.netClosingBalance ?? 0);

  // Pagination Chunking: 16 rows on page 1, 20 rows on subsequent pages
  const PAGE_1_ROWS = 16;
  const SUBSEQUENT_PAGE_ROWS = 20;

  // Separate opening row if passed inside rows array
  const isOpeningRowPresent = rows.length > 0 && rows[0].isOpening;
  const dataRows = isOpeningRowPresent ? rows.slice(1) : rows;

  const pages = [];
  if (dataRows.length <= PAGE_1_ROWS) {
    pages.push(dataRows);
  } else {
    pages.push(dataRows.slice(0, PAGE_1_ROWS));
    let rem = dataRows.slice(PAGE_1_ROWS);
    while (rem.length > 0) {
      pages.push(rem.slice(0, SUBSEQUENT_PAGE_ROWS));
      rem = rem.slice(SUBSEQUENT_PAGE_ROWS);
    }
  }

  const totalPages = pages.length;

  return (
    <Document>
      {pages.map((pageRows, pageIdx) => {
        const isFirstPage = pageIdx === 0;
        const isLastPage = pageIdx === totalPages - 1;
        const pageNumber = pageIdx + 1;

        let offset = 0;
        for (let p = 0; p < pageIdx; p++) {
          offset += pages[p].length;
        }

        const lastRowOnPage = pageRows[pageRows.length - 1];
        const carryDebit = pageRows.reduce((acc, r) => acc + Number(r.rawDebit ?? r.debit ?? 0), 0);
        const carryCredit = pageRows.reduce((acc, r) => acc + Number(r.rawCredit ?? r.credit ?? 0), 0);
        const carryBalance = lastRowOnPage ? (lastRowOnPage.rawBalance ?? lastRowOnPage.balanceNum ?? 0) : 0;
        const carryBalanceType = lastRowOnPage ? (lastRowOnPage.balanceType || (carryBalance >= 0 ? 'Dr' : 'Cr')) : 'Dr';

        return (
          <Page key={pageIdx} size="A4" style={styles.page}>
            <View style={styles.docFrame}>
              {/* Header */}
              {isFirstPage ? (
                <View>
                  <View style={styles.topBar}>
                    <View style={styles.companyWrap}>
                      <OctagonLogo size={40} />
                      <View>
                        <Text style={styles.coName}>{companyName}</Text>
                        {company?.tradeName ? (
                          <Text style={styles.coSub}>{company.tradeName}</Text>
                        ) : null}
                        <Text style={styles.coTax}>
                          {[
                            companyAddress,
                            companyGstin ? `GSTIN: ${companyGstin}` : null,
                            companyPan ? `PAN: ${companyPan}` : null,
                          ].filter(Boolean).join('  |  ')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.docTitleBox}>
                      <Text style={styles.docTitleTxt}>STATEMENT OF ACCOUNT</Text>
                      <View style={styles.periodChip}>
                        <Text style={styles.periodChipTxt}>PERIOD: {periodFormatted}</Text>
                      </View>
                      <Text style={styles.docMetaSub}>
                        {`Date: ${genDate}  |  Currency: INR (₹)`}
                      </Text>
                    </View>
                  </View>

                  {/* Party & 4-KPI Meta Grid */}
                  <View style={styles.metaGrid}>
                    <View style={styles.partyCell}>
                      <View style={styles.secTag}>
                        <Text style={styles.secTagLeft}>BILLED TO / ACCOUNT PARTY</Text>
                        <Text style={styles.secTagRight}>CODE: {partyCode}</Text>
                      </View>
                      <Text style={styles.partyName}>{partyName}</Text>
                      <Text style={styles.partyText}>
                        {`${partyAddress}\nGSTIN: ${partyGstin}  |  State Code: ${partyStateCode}  |  PAN: ${partyPan}\nContact: ${partyContact}`}
                      </Text>
                    </View>
                    <View style={styles.kpiStrip}>
                      <View style={styles.kpiRow}>
                        <View style={styles.kpiItem}>
                          <Text style={styles.kpiLbl}>OPENING BALANCE</Text>
                          <Text style={[styles.kpiVal, { color: '#0f172a' }]}>
                            {`${formatRupeeAmount(openingBalance)} `}
                            <Text style={styles.drBadge}>{openingBalanceType}</Text>
                          </Text>
                        </View>
                        <View style={[styles.kpiItem, { borderRightWidth: 0 }]}>
                          <Text style={styles.kpiLbl}>TOTAL INVOICED (DEBITS)</Text>
                          <Text style={[styles.kpiVal, { color: '#1d4ed8' }]}>
                            {formatRupeeAmount(summary?.totalDebit || 0)}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.kpiRow, { borderBottomWidth: 0 }]}>
                        <View style={styles.kpiItem}>
                          <Text style={styles.kpiLbl}>TOTAL RECEIVED (CREDITS)</Text>
                          <Text style={[styles.kpiVal, { color: '#15803d' }]}>
                            {formatRupeeAmount(summary?.totalCredit || 0)}
                          </Text>
                        </View>
                        <View style={[styles.kpiItem, { borderRightWidth: 0 }]}>
                          <Text style={styles.kpiLbl}>CLOSING BALANCE DUE</Text>
                          <Text style={[styles.kpiVal, { color: '#1d4ed8' }]}>
                            {`${formatRupeeAmount(summary?.netClosingBalance ?? 0)} `}
                            <Text style={styles.drBadge}>{summary?.closingBalanceType || 'Dr'}</Text>
                          </Text>
                          {agingSummary?.overdueAmount > 0 && (
                            <Text style={{ fontSize: 6.5, color: '#dc2626', fontWeight: 'bold', marginTop: 1 }}>
                              {`Overdue: ${formatRupeeAmount(agingSummary.overdueAmount)}`}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                /* Continuation Header on Page 2+ */
                <View style={styles.contBar}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <OctagonLogo size={24} />
                    <View>
                      <Text style={styles.contComp}>{companyName}</Text>
                      <Text style={styles.contParty}>{`Account: ${partyName} (${partyCode})`}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.contTitle}>STATEMENT OF ACCOUNT</Text>
                    <Text style={styles.contMeta}>
                      {`Period: ${periodFormatted}  |  Sheet: Page ${pageNumber} of ${totalPages}`}
                    </Text>
                  </View>
                </View>
              )}

              {/* Transactions Table */}
              <View style={styles.tableBox}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, styles.colIdx]}>#</Text>
                  <Text style={[styles.th, styles.colDate]}>DATE</Text>
                  <Text style={[styles.th, styles.colType]}>VCH TYPE</Text>
                  <Text style={[styles.th, styles.colNo]}>VOUCHER NO</Text>
                  <Text style={[styles.th, styles.colDesc]}>PARTICULARS / NARRATION</Text>
                  <Text style={[styles.th, styles.colDebit]}>DEBIT (₹)</Text>
                  <Text style={[styles.th, styles.colCredit]}>CREDIT (₹)</Text>
                  <Text style={[styles.th, styles.colBal, { borderRightWidth: 0 }]}>BALANCE (₹)</Text>
                </View>

                {/* Opening Balance Row on Page 1 */}
                {isFirstPage && (
                  <View style={styles.openingRow}>
                    <Text style={[styles.openingTd, styles.colIdx]}>—</Text>
                    <Text style={[styles.openingTd, styles.colDate]}>{startDateFormatted}</Text>
                    <Text style={[styles.openingTd, styles.colType]}>Opening</Text>
                    <Text style={[styles.openingTd, styles.colNo]}>—</Text>
                    <Text style={[styles.openingTd, styles.colDesc]}>
                      Opening Balance Brought Forward
                    </Text>
                    <Text style={[styles.openingTd, styles.colDebit, { color: '#1d4ed8' }]}>
                      {openingBalanceType === 'Dr' && openingBalance > 0
                        ? formatRupeeAmount(openingBalance)
                        : '—'}
                    </Text>
                    <Text style={[styles.openingTd, styles.colCredit, { color: '#94a3b8' }]}>
                      {openingBalanceType === 'Cr' && openingBalance > 0
                        ? formatRupeeAmount(openingBalance)
                        : '—'}
                    </Text>
                    <Text style={[styles.openingTd, styles.colBal, { borderRightWidth: 0 }]}>
                      {`${formatRupeeAmount(openingBalance)} `}
                      <Text style={styles.drBadge}>{openingBalanceType}</Text>
                    </Text>
                  </View>
                )}

                {/* Brought Forward Row on Page 2+ */}
                {!isFirstPage && (
                  <View style={styles.carryRow}>
                    <View style={styles.carryLabelCol}>
                      <Text style={styles.carryText}>{`Brought Forward from Page ${pageNumber - 1}:`}</Text>
                    </View>
                    <Text style={[styles.td, styles.colDebit, { color: '#1d4ed8', fontWeight: 'bold' }]}>
                      {formatRupeeAmount(carryDebit)}
                    </Text>
                    <Text style={[styles.td, styles.colCredit, { color: '#15803d', fontWeight: 'bold' }]}>
                      {formatRupeeAmount(carryCredit)}
                    </Text>
                    <Text style={[styles.td, styles.colBal, { fontWeight: 'bold', borderRightWidth: 0 }]}>
                      {`${formatRupeeAmount(Math.abs(carryBalance))} `}
                      <Text style={styles.drBadge}>{carryBalanceType}</Text>
                    </Text>
                  </View>
                )}

                {/* Transaction Rows */}
                {pageRows.map((row, rIdx) => {
                  const globalIdx = offset + rIdx + 1;
                  const isEven = rIdx % 2 === 0;
                  const debitVal = Number(row.rawDebit ?? row.debit ?? 0);
                  const creditVal = Number(row.rawCredit ?? row.credit ?? 0);
                  const balanceVal = Number(row.rawBalance ?? row.balanceNum ?? 0);
                  const rowType = row.type || row.voucherType || 'Transaction';
                  const rowDesc = row.description || row.particulars || '—';

                  return (
                    <View
                      key={rIdx}
                      style={[
                        styles.tableRow,
                        isEven ? styles.tableRowEven : styles.tableRowOdd,
                      ]}
                    >
                      <Text style={[styles.td, styles.colIdx]}>{globalIdx}</Text>
                      <Text style={[styles.td, styles.colDate]}>{formatDateDisplay(row.date)}</Text>
                      <Text style={[styles.td, styles.colType]}>{rowType}</Text>
                      <Text style={[styles.td, styles.colNo, { fontWeight: 'bold' }]}>
                        {row.voucherNo || '—'}
                      </Text>
                      <Text style={[styles.td, styles.colDesc]}>{rowDesc}</Text>
                      <Text
                        style={[
                          styles.td,
                          styles.colDebit,
                          {
                            color: debitVal > 0 ? '#1d4ed8' : '#94a3b8',
                            fontWeight: debitVal > 0 ? 'bold' : 'normal',
                          },
                        ]}
                      >
                        {debitVal > 0 ? formatRupeeAmount(debitVal) : '—'}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          styles.colCredit,
                          {
                            color: creditVal > 0 ? '#15803d' : '#94a3b8',
                            fontWeight: creditVal > 0 ? 'bold' : 'normal',
                          },
                        ]}
                      >
                        {creditVal > 0 ? formatRupeeAmount(creditVal) : '—'}
                      </Text>
                      <Text style={[styles.td, styles.colBal, { borderRightWidth: 0 }]}>
                        {`${formatRupeeAmount(Math.abs(balanceVal))} `}
                        <Text style={row.balanceType === 'Cr' ? styles.crBadge : styles.drBadge}>
                          {row.balanceType || (balanceVal >= 0 ? 'Dr' : 'Cr')}
                        </Text>
                      </Text>
                    </View>
                  );
                })}

                {/* Carried Forward Row on Page 1 (if multiple pages) */}
                {!isLastPage && (
                  <View style={styles.carryRow}>
                    <View style={styles.carryLabelCol}>
                      <Text style={styles.carryText}>{`Carried Forward to Page ${pageNumber + 1}:`}</Text>
                    </View>
                    <Text style={[styles.td, styles.colDebit, { color: '#1d4ed8', fontWeight: 'bold' }]}>
                      {formatRupeeAmount(carryDebit)}
                    </Text>
                    <Text style={[styles.td, styles.colCredit, { color: '#15803d', fontWeight: 'bold' }]}>
                      {formatRupeeAmount(carryCredit)}
                    </Text>
                    <Text style={[styles.td, styles.colBal, { fontWeight: 'bold', borderRightWidth: 0 }]}>
                      {`${formatRupeeAmount(Math.abs(carryBalance))} `}
                      <Text style={styles.drBadge}>{carryBalanceType}</Text>
                    </Text>
                  </View>
                )}

                {/* Grand Total Row on Last Page */}
                {isLastPage && (
                  <View style={styles.grandTotalRow}>
                    <View style={styles.gtLabelCol}>
                      <Text style={styles.gtLabelText}>Grand Total / Closing Balance:</Text>
                    </View>
                    <Text style={[styles.td, styles.colDebit, { fontWeight: 'bold', color: '#1d4ed8', borderRightColor: '#fee2e2' }]}>
                      {formatRupeeAmount(summary?.totalDebit || 0)}
                    </Text>
                    <Text style={[styles.td, styles.colCredit, { fontWeight: 'bold', color: '#15803d', borderRightColor: '#fee2e2' }]}>
                      {formatRupeeAmount(summary?.totalCredit || 0)}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.colBal,
                        { fontWeight: 'bold', color: '#0f172a', borderRightWidth: 0 },
                      ]}
                    >
                      {`${formatRupeeAmount(summary?.netClosingBalance ?? 0)} `}
                      <Text style={styles.drBadge}>{summary?.closingBalanceType || 'Dr'}</Text>
                    </Text>
                  </View>
                )}
              </View>

              {/* Continues Notice on Page 1 (if multiple pages) */}
              {!isLastPage ? (
                <View style={{ marginTop: 'auto' }}>
                  <Text style={styles.continuationNotice}>{`Continues on Page ${pageNumber + 1} >>`}</Text>
                </View>
              ) : (
                /* Bottom Settlement Box on Last Page */
                <View style={styles.bottomBox}>
                  <View style={styles.wordsArea}>
                    <Text style={styles.wordsTxt}>
                      {'Amount in Words: '}
                      <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        {`${closingWords} (${(summary?.closingBalanceType || 'Dr') === 'Dr' ? 'Debit Balance' : 'Credit Balance'})`}
                      </Text>
                    </Text>
                    <View>
                      <Text style={styles.termsTag}>VERIFICATION & SETTLEMENT NOTICE</Text>
                      <Text style={styles.termsTxt}>
                        Please examine this statement immediately. Discrepancies, if any, must be reported within 7 business days from receipt, failing which this statement shall be deemed correct, verified, and accepted in full.
                      </Text>
                      {agingSummary?.overdueAmount > 0 && (
                        <View style={{ marginTop: 3.5, padding: 3.5, backgroundColor: '#fffbeb', borderRadius: 2, borderLeftWidth: 2, borderLeftColor: '#f59e0b' }}>
                          <Text style={{ fontSize: 6.8, color: '#92400e', lineHeight: 1.25 }}>
                            <Text style={{ fontWeight: 'bold' }}>PAYMENT REMINDER: </Text>
                            {`As per our agreed credit terms of ${agingSummary.applicableCreditDays || 30} days, an overdue balance of ${formatRupeeAmount(agingSummary.overdueAmount)} is pending for settlement. We kindly request you to review and arrange the payment at your earliest convenience.`}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.signArea}>
                    <Text style={styles.signComp}>
                      {'FOR '}
                      <Text style={{ color: '#dc2626' }}>{companyName}</Text>
                    </Text>
                    <View style={styles.signSpace} />
                    <View style={styles.signLine}>
                      <Text style={styles.signLabel}>Authorized Signatory</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Document Footer */}
              <View style={styles.docFooter}>
                <Text>{`Computer-Generated Statement  |  Party Code: ${partyCode}`}</Text>
                <Text>{`Page ${pageNumber} of ${totalPages}`}</Text>
              </View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default PartyLedgerPdfDocument;
