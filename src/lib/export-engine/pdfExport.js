import React from 'react';
import { pdf } from '@react-pdf/renderer';
import PartyLedgerPdfDocument from './components/PartyLedgerPdfDocument';

/**
 * Exports Party Ledger to razor-sharp vector PDF using @react-pdf/renderer.
 * - 100% Vector Text (no blur on zoom, fully selectable and copyable).
 * - Option C Enterprise Framed layout.
 * - 4-KPI Metric Grid with neutral #fafbfc background.
 * - Captures directly into Chrome download history (chrome://downloads).
 * - 100% Frontend Client-side execution.
 *
 * @param {Object} config - Normalized ledger report configuration
 * @param {string} fileName - Destination file name (without extension)
 * @returns {Promise<{ success: boolean, fileName: string }>}
 */
export const exportToPdf = async (config, fileName = 'Party_Ledger') => {
  const safeFileName = `${fileName.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

  // Generate pure vector PDF blob in the browser
  const blob = await pdf(<PartyLedgerPdfDocument config={config} />).toBlob();

  // Capture into browser download history via native <a> download click
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
  }, 10000);

  return { success: true, fileName: safeFileName };
};

