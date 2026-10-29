import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { normalizeReportConfig } from './reportContract';
import { exportToExcel } from './excelExport';
import { exportToPdf } from './pdfExport';
import { exportToPrint } from './printExport';

/**
 * Universal React Hook for Client-Side Document Exports.
 * Reusable across any module (Party Ledger, Sales Register, Muster Roll, Stock Summary).
 * 
 * Features:
 * - Single-click lock (prevents duplicate rapid clicks)
 * - Yields to browser render loop for instant button spinner feedback
 * - Direct high-speed client-side export (PDF / Excel / Print)
 * - Native browser download history capture
 * - User-friendly toast feedback
 */
export const useExportTask = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFormat, setActiveFormat] = useState(null); // 'excel' | 'pdf' | 'print' | null
  const isMountedRef = useRef(true);
  const isExecutingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Executes an export task.
   * 
   * @param {object} options
   * @param {object} options.config - The Report Configuration object (matches standardReportSchema)
   * @param {'excel' | 'pdf' | 'print'} options.format - Desired export format
   * @param {string} [options.fileName] - Custom file name for file downloads (without extension)
   * @param {boolean} [options.showToast=true] - Whether to show feedback toasts
   */
  const executeExport = useCallback(
    async ({ config, format = 'excel', fileName = 'Report', showToast = true }) => {
      if (isExecutingRef.current) {
        return;
      }

      if (!config) {
        toast.error('Export failed: No data or configuration provided.');
        return;
      }

      if (format !== 'excel' && format !== 'pdf' && format !== 'print') {
        toast.error(`Export failed: Unsupported format '${format}'. Use 'excel', 'pdf', or 'print'.`);
        return;
      }

      let normalizedConfig;
      try {
        normalizedConfig = normalizeReportConfig(config);
      } catch (contractErr) {
        console.error('[useExportTask] Schema Validation Failed:', contractErr);
        toast.error(contractErr.message || 'Report data schema is invalid.');
        return;
      }

      isExecutingRef.current = true;
      if (isMountedRef.current) {
        setIsProcessing(true);
        setActiveFormat(format);
      }

      // Small yield to let React paint the button spinner before CPU compilation
      await new Promise((resolve) => setTimeout(resolve, 40));

      try {
        let result;
        if (format === 'excel') {
          result = await exportToExcel(normalizedConfig, fileName);
        } else if (format === 'pdf') {
          result = await exportToPdf(normalizedConfig, fileName);
        } else {
          result = await exportToPrint(normalizedConfig);
        }

        if (showToast) {
          toast.success(
            format === 'excel' || format === 'pdf'
              ? `Downloaded ${result?.fileName || 'file'} successfully!`
              : 'Document ready for printing!'
          );
        }

        return result;
      } catch (err) {
        console.error('[useExportTask] Execution Error:', err);
        if (showToast) {
          toast.error(err.message || 'Failed to generate document. Please try again.');
        }
        return { success: false, error: err };
      } finally {
        setTimeout(() => {
          isExecutingRef.current = false;
          if (isMountedRef.current) {
            setIsProcessing(false);
            setActiveFormat(null);
          }
        }, 300);
      }
    },
    []
  );

  const isBusy = isProcessing;

  return {
    executeExport,
    isProcessing: isBusy,
    isExporting: isBusy,
    activeFormat,
  };
};
