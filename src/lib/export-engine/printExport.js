/**
 * Universal Native Print & PDF Driver (Option C: Enterprise Framed Design).
 * Generates an isolated, print-optimized A4 HTML document matching Option C,
 * attaches standard print stylesheets, triggers window.print(), and cleans up the DOM.
 * 
 * @param {object} config - Normalized Report Config
 * @returns {Promise<{ success: boolean }>}
 */

const formatIndianCurrency = (val) => {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₹'"]/g, '').trim();
    const num = Number(cleaned.replace(/,/g, ''));
    if (!isNaN(num) && cleaned !== '') {
      return num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return cleaned;
  }
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '—';
  if (typeof dateStr === 'string' && dateStr.length <= 11 && !dateStr.includes('T')) {
    return dateStr;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

function amountToWords(num) {
  if (!num || isNaN(num) || Number(num) === 0) return 'Zero Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
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
    str += Number(n_array[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
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

export const exportToPrint = async (config) => {
  return new Promise((resolve, reject) => {
    try {
      const {
        title = 'STATEMENT OF ACCOUNT',
        company = {},
        party = {},
        period = {},
        openingBalance = 0,
        openingBalanceType = 'Dr',
        summary = {},
        columns = [],
        rows = [],
        summaryRows = [],
        orientation = 'portrait',
      } = config;

      // 1. Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow.document;

      const companyName = (company?.name || '').toUpperCase();
      const companyAddress = company?.address || '';
      const companyGstin = company?.gstin || '';
      const companyPhone = company?.phone || '';

      const partyName = (party?.legalName || party?.displayName || 'Client Party').toUpperCase();
      const partyGstin = party?.gstin || 'Unregistered';
      const partyCode = party?.partyCode || '—';
      const partyAddress = party?.address || '—';
      const partyContact = party?.mobile || party?.email || '—';

      const startDateFormatted = formatDateDisplay(period?.startDate);
      const endDateFormatted = formatDateDisplay(period?.endDate);
      const periodText = startDateFormatted && endDateFormatted
        ? `${startDateFormatted} to ${endDateFormatted}`
        : 'All Transactions';

      const closingBalance = summary?.netClosingBalance ?? 0;
      const closingBalanceType = summary?.closingBalanceType || 'Dr';
      const wordsStr = amountToWords(closingBalance) + ` (${closingBalanceType === 'Dr' ? 'Debit' : 'Credit'} Balance);`;

      const now = new Date();
      const generatedStr = `${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;

      // 2. Generate Option C HTML content
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${partyName} - ${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 ${orientation || 'portrait'};
      margin: 8mm 9mm 8mm 9mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      -webkit-font-smoothing: antialiased;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
    .doc-frame {
      border: 1.5px solid #cbd5e1;
      border-top: 3.5px solid #dc2626;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      overflow: hidden;
      min-height: calc(100vh - 16mm);
    }
    .num {
      font-family: 'JetBrains Mono', monospace;
      font-feature-settings: 'tnum';
      font-variant-numeric: tabular-nums;
    }
    .debit-val { color: #1d4ed8 !important; font-weight: 600; }
    .credit-val { color: #15803d !important; font-weight: 600; }
    .dr-badge { font-size: 6.2pt; font-weight: 700; color: #dc2626; margin-left: 2px; }
    .cr-badge { font-size: 6.2pt; font-weight: 700; color: #15803d; margin-left: 2px; }

    /* Top Bar */
    .top-bar {
      padding: 6px 10px;
      border-bottom: 1.5px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo-wrap {
      width: 44px;
      height: 44px;
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .co-name {
      font-size: 13pt;
      font-weight: 800;
      color: #dc2626;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .co-sub {
      font-size: 6.8pt;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }
    .co-tax {
      font-size: 6.6pt;
      color: #64748b;
      margin-top: 2px;
    }
    .co-tax strong { color: #1e293b; }
    .doc-title-box { text-align: right; }
    .doc-title-txt {
      font-size: 12.5pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .period-chip {
      display: inline-block;
      background: #fef2f2;
      border: 1px solid #fecdd3;
      color: #dc2626;
      font-size: 6.8pt;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 3px;
      margin-top: 3px;
    }
    .doc-meta-sub {
      font-size: 6.5pt;
      color: #64748b;
      margin-top: 2px;
    }

    /* Party & 4-KPI Grid */
    .meta-grid {
      display: flex;
      border-bottom: 1px solid #cbd5e1;
      background: #ffffff;
    }
    .party-cell {
      flex: 1.15;
      padding: 6px 9px;
      border-right: 1px solid #cbd5e1;
    }
    .sec-tag {
      font-size: 6.2pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #dc2626;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
      display: flex;
      justify-content: space-between;
    }
    .party-name {
      font-size: 8.8pt;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .party-text {
      font-size: 6.7pt;
      color: #475569;
      line-height: 1.35;
    }
    .party-text strong { color: #1e293b; }

    /* 4-KPI Metric Grid: Neutral background #fafbfc for ALL boxes per user instruction */
    .kpi-strip {
      flex: 1.15;
      display: flex;
      flex-direction: column;
      background: #fafbfc;
    }
    .kpi-row {
      display: flex;
      flex: 1;
      border-bottom: 1px solid #e2e8f0;
    }
    .kpi-row:last-child {
      border-bottom: none;
    }
    .kpi-item {
      flex: 1;
      padding: 4px 7px;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: #fafbfc;
    }
    .kpi-item:last-child {
      border-right: none;
    }
    .kpi-lbl {
      font-size: 5.9pt;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.2px;
    }
    .kpi-val {
      font-size: 7.8pt;
      font-weight: 700;
      margin-top: 1px;
    }

    /* Table */
    .table-box {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .comm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 6.8pt;
      table-layout: fixed;
    }
    .comm-table thead tr {
      background: #fef2f2;
      border-top: 1.2px solid #fecdd3;
      border-bottom: 1.8px solid #dc2626;
    }
    .comm-table th {
      padding: 3.5px 4px;
      font-size: 6.4pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.25px;
      color: #991b1b;
      text-align: left;
      border-right: 1px solid #fee2e2;
    }
    .comm-table th:last-child { border-right: none; }
    .comm-table th.num { text-align: right; }
    .comm-table td {
      padding: 2.2px 4px;
      border-bottom: 1px solid #e2e8f0;
      border-right: 1px solid #f1f5f9;
      color: #1e293b;
      vertical-align: middle;
      line-height: 1.2;
      white-space: nowrap;
    }
    .comm-table td:last-child { border-right: none; }
    .comm-table tbody tr:nth-child(even) { background: #fafbfc; }
    .comm-table tr.opening-row { background: #fffdf5 !important; font-weight: 600; }
    .comm-table tr.opening-row td { border-bottom: 1px solid #fef08a; color: #854d0e; }

    .col-idx { width: 3%; text-align: center; }
    .col-date { width: 10%; text-align: center; }
    .col-type { width: 12%; }
    .col-no { width: 13%; }
    .col-desc { width: 27%; overflow: hidden; text-overflow: ellipsis; }
    .col-debit { width: 11%; text-align: right; }
    .col-credit { width: 11%; text-align: right; }
    .col-bal { width: 13%; text-align: right; font-weight: 600; padding-right: 8px; }

    /* Grand Total CA Double Underline */
    .comm-table tfoot tr {
      background: #fef2f2;
      font-weight: 700;
      border-top: 1.2px solid #fecdd3;
      border-bottom: 2px double #dc2626;
    }
    .comm-table tfoot td {
      padding: 3.5px 4px;
      color: #0f172a;
      border-right: 1px solid #fee2e2;
    }
    .comm-table tfoot td:last-child { border-right: none; padding-right: 8px; }
    .comm-table tfoot .debit-val { color: #1d4ed8 !important; }
    .comm-table tfoot .credit-val { color: #15803d !important; }
    .comm-table tfoot .dr-badge { color: #dc2626 !important; }

    /* Bottom Settlement Block */
    .bottom-box {
      display: flex;
      border-top: 1px solid #cbd5e1;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .words-area {
      flex: 1.35;
      padding: 6px 9px;
      border-right: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .words-txt {
      font-size: 6.8pt;
      color: #334155;
      margin-bottom: 4px;
    }
    .words-txt strong { color: #0f172a; }
    .terms-txt {
      font-size: 6.3pt;
      color: #64748b;
      line-height: 1.35;
    }
    .terms-tag {
      font-size: 6.2pt;
      font-weight: 700;
      color: #dc2626;
      text-transform: uppercase;
      margin-bottom: 1.5px;
    }

    .sign-area {
      flex: 0.85;
      padding: 6px 9px;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      background: #fafbfc;
    }
    .sign-comp {
      font-size: 7.2pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
    }
    .sign-space { height: 26px; }
    .sign-line {
      border-top: 1px dashed #ef4444;
      width: 140px;
      padding-top: 2px;
      font-size: 6.6pt;
      font-weight: 600;
      color: #64748b;
    }

    .doc-footer {
      padding: 3px 9px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 6.2pt;
      color: #94a3b8;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <div class="doc-frame">
    <!-- Top Bar -->
    <div class="top-bar">
      <div class="brand-group">
        <div class="brand-logo-wrap">
          <svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="emblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#dc2626"/>
                <stop offset="100%" stop-color="#991b1b"/>
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="20" fill="url(#emblemGrad)"/>
            <path d="M50 14 L55 24 L66 22 L67 33 L78 35 L75 46 L84 51 L78 60 L84 68 L74 72 L74 83 L63 82 L59 92 L50 87 L41 92 L37 82 L26 83 L26 72 L16 68 L22 60 L16 51 L25 46 L22 35 L33 33 L34 22 L45 24 Z" fill="none" stroke="#fecdd3" stroke-width="2.5" opacity="0.45"/>
            <circle cx="50" cy="53" r="28" fill="#ffffff" stroke="#fecdd3" stroke-width="2.5"/>
            <text x="50" y="61" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="900" font-size="23" fill="#dc2626" letter-spacing="-1">KS</text>
          </svg>
        </div>
        <div>
          <div class="co-name">${companyName}</div>
          ${(company?.tradeName || subTitle) ? `<div class="co-sub">${company?.tradeName || subTitle}</div>` : ''}
          <div class="co-tax">
            ${[
              companyAddress,
              companyGstin ? `<strong>GSTIN:</strong> ${companyGstin}` : null,
              companyPhone ? `<strong>Mob:</strong> ${companyPhone}` : null,
            ].filter(Boolean).join(' &nbsp;|&nbsp; ')}
          </div>
        </div>
      </div>
      <div class="doc-title-box">
        <div class="doc-title-txt">${title}</div>
        <div><span class="period-chip">PERIOD: ${periodText}</span></div>
        <div class="doc-meta-sub">Generated: ${generatedStr}</div>
      </div>
    </div>

    <!-- Dual Party & 4-KPI Grid Block -->
    <div class="meta-grid">
      <div class="party-cell">
        <div class="sec-tag">
          <span>CUSTOMER / PARTY DETAILS</span>
          <span style="color: #64748b; font-weight: 600;">Code: ${partyCode}</span>
        </div>
        <div class="party-name">${partyName}</div>
        <div class="party-text">
          <strong>GSTIN:</strong> ${partyGstin} &nbsp;|&nbsp; <strong>State:</strong> Maharashtra<br>
          <strong>Address:</strong> ${partyAddress}<br>
          <strong>Contact:</strong> ${partyContact}
        </div>
      </div>

      <!-- 4-KPI Metric Grid (All 4 neutral #fafbfc background per user request) -->
      <div class="kpi-strip">
        <div class="kpi-row">
          <div class="kpi-item">
            <span class="kpi-lbl">Opening Balance</span>
            <span class="kpi-val num" style="color: #0f172a;">
              ₹${formatIndianCurrency(openingBalance)} <span class="${openingBalanceType === 'Dr' ? 'dr-badge' : 'cr-badge'}">${openingBalanceType || 'Dr'}</span>
            </span>
          </div>
          <div class="kpi-item">
            <span class="kpi-lbl">Total Invoiced (Dr)</span>
            <span class="kpi-val num debit-val">₹${formatIndianCurrency(summary?.totalDebit || 0)}</span>
          </div>
        </div>
        <div class="kpi-row">
          <div class="kpi-item">
            <span class="kpi-lbl">Total Received (Cr)</span>
            <span class="kpi-val num credit-val">₹${formatIndianCurrency(summary?.totalCredit || 0)}</span>
          </div>
          <div class="kpi-item">
            <span class="kpi-lbl">Closing Balance Due</span>
            <span class="kpi-val num" style="color: #0f172a;">
              ₹${formatIndianCurrency(summary?.netClosingBalance ?? 0)} <span class="${summary?.closingBalanceType === 'Dr' ? 'dr-badge' : 'cr-badge'}">${summary?.closingBalanceType || 'Dr'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Precision Table -->
    <div class="table-box">
      <table class="comm-table">
        <thead>
          <tr>
            <th class="col-idx">#</th>
            <th class="col-date">Date</th>
            <th class="col-type">Type</th>
            <th class="col-no">Voucher No</th>
            <th class="col-desc">Particulars</th>
            <th class="col-debit num">Debit (₹)</th>
            <th class="col-credit num">Credit (₹)</th>
            <th class="col-bal num">Balance (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, idx) => `
            <tr class="${row.isOpening ? 'opening-row' : ''}">
              <td class="col-idx num">${row.index || idx + 1}</td>
              <td class="col-date num">${row.date || '—'}</td>
              <td class="col-type">${row.voucherType || '—'}</td>
              <td class="col-no num">${row.voucherNo || '—'}</td>
              <td class="col-desc">${row.particulars || '—'}</td>
              <td class="col-debit num debit-val">${row.debit ? formatIndianCurrency(row.debit) : '—'}</td>
              <td class="col-credit num credit-val">${row.credit ? formatIndianCurrency(row.credit) : '—'}</td>
              <td class="col-bal num">${row.balance ? String(row.balance).trim() : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="5" style="text-align: right; padding-right: 12px; font-weight: 800; letter-spacing: 0.5px;">GRAND TOTAL:</td>
            <td class="col-debit num debit-val">₹${formatIndianCurrency(summary?.totalDebit || 0)}</td>
            <td class="col-credit num credit-val">₹${formatIndianCurrency(summary?.totalCredit || 0)}</td>
            <td class="col-bal num">₹${formatIndianCurrency(summary?.netClosingBalance ?? 0)} ${summary?.closingBalanceType || 'Dr'}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Settlement Block & Signatory (Zero Bank Details) -->
    <div class="bottom-box">
      <div class="words-area">
        <div>
          <div class="terms-tag">Settlement & Audit Reconciliation Notice</div>
          <div class="terms-txt">
            Please examine this statement immediately. Any discrepancy must be reported within 7 days of receipt with supporting reconciliation, failing which the balance shown herein shall be treated as final, correct, and accepted by both parties.
          </div>
        </div>
        <div class="words-txt">
          Amount in Words: <strong>${wordsStr}</strong>
        </div>
      </div>
      <div class="sign-area">
        <div class="sign-comp">For <strong>${companyName}</strong></div>
        <div class="sign-space"></div>
        <div class="sign-line">Authorized Signatory</div>
      </div>
    </div>

    <!-- Document Footer -->
    <div class="doc-footer">
      <span>* This is a computer-generated account statement and requires no physical signature.</span>
      <span>K.S. Engineering Works ERP Document Engine</span>
    </div>
  </div>
</body>
</html>
      `;

      doc.open();
      doc.write(html);
      doc.close();

      // 3. Trigger Print after content loads
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        resolve({ success: true });

        // Clean up iframe after print dialog is closed
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      }, 300);

    } catch (err) {
      console.error("[PrintDriver] Print generation error:", err);
      reject(err);
    }
  });
};
