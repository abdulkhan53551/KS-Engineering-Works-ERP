import * as XLSX from 'xlsx';

/**
 * Universal Client-Side Excel Workbook Compiler.
 * Compiles a Normalized Report Config into an Excel (.xlsx) binary byte buffer.
 * 
 * @param {object} config - Normalized Report Configuration
 * @returns {Uint8Array} Binary array buffer representing the .xlsx file
 */
export const compileExcel = (config) => {
  const { title = 'Report', company = {}, metadata = [], columns = [], rows = [], summaryRows = [] } = config;

  const sheetData = [];

  // Row 1: Company Header
  if (company?.name) {
    sheetData.push([company.name.toUpperCase()]);
    if (company.address || company.gstin) {
      const subInfo = [
        company.address,
        company.gstin ? `GSTIN: ${company.gstin}` : null,
        company.email ? `Email: ${company.email}` : null,
      ].filter(Boolean).join(' | ');
      sheetData.push([subInfo]);
    }
  }

  // Title & Subtitle
  sheetData.push([title]);
  if (config.subTitle) {
    sheetData.push([config.subTitle]);
  }
  sheetData.push([]); // Spacer row

  // Metadata Block
  if (Array.isArray(metadata) && metadata.length > 0) {
    metadata.forEach((meta) => {
      sheetData.push([meta.label ? `${meta.label}:` : '', meta.value || '']);
    });
    sheetData.push([]);
  }

  // Column Headers
  const headerRow = columns.map((col) => col.header);
  sheetData.push(headerRow);

  // Data Rows
  rows.forEach((row) => {
    const rowData = columns.map((col) => {
      const val = row[col.key];
      if (val === null || val === undefined) return '';
      return val;
    });
    sheetData.push(rowData);
  });

  // Summary Rows
  if (Array.isArray(summaryRows) && summaryRows.length > 0) {
    sheetData.push([]);
    summaryRows.forEach((summary) => {
      const label = summary.label || summary.particulars || summary.title || '';
      const value =
        summary.value !== null && summary.value !== undefined
          ? summary.value
          : summary.balance !== null && summary.balance !== undefined
          ? summary.balance
          : '';
      const summaryRow = new Array(columns.length).fill('');
      if (columns.length >= 2) {
        summaryRow[columns.length - 2] = label;
        summaryRow[columns.length - 1] = value;
      } else {
        summaryRow[0] = label ? `${label}: ${value}` : `${value}`;
      }
      sheetData.push(summaryRow);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-fit column widths
  const colWidths = columns.map((col) => {
    let maxLen = (col.header || '').length;
    const sampleLimit = Math.min(rows.length, 500);
    for (let i = 0; i < sampleLimit; i++) {
      const cellVal = rows[i][col.key];
      if (cellVal !== null && cellVal !== undefined) {
        const strLen = String(cellVal).length;
        if (strLen > maxLen) maxLen = strLen;
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, col.width || 12), 45) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  const safeSheetName = (title || 'Report').substring(0, 31).replace(/[\\/?*[\]]/g, '_');
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });
};

/**
 * Universal Excel Export Function.
 * Compiles report directly into an Excel Blob and triggers browser download.
 * 
 * @param {object} config - Normalized Report Config
 * @param {string} fileName - Destination file name (without extension)
 * @returns {Promise<{ success: boolean, fileName: string }>}
 */
export const exportToExcel = async (config, fileName = 'Report') => {
  const buffer = compileExcel(config);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeFileName = `${fileName.replace(/[/\\?%*:|"<>]/g, '_')}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => {
    try {
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Ignored
    }
  }, 1000);

  return { success: true, fileName: safeFileName };
};
