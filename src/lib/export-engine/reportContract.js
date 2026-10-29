/**
 * Universal Report Schema Contract & Validator
 * 
 * Ensures all ERP modules (Party Ledger, Sales Register, Muster Roll, Stock Summary)
 * provide a standardized, consistent data structure to the export pipeline.
 */

/**
 * Validates whether a provided configuration object adheres to the Universal Report Schema.
 * @param {object} config - The report configuration object.
 * @returns {{ isValid: boolean, error?: string }}
 */
export const validateReportConfig = (config) => {
  if (!config) {
    return { isValid: false, error: "Report configuration is missing." };
  }

  if (!config.title || typeof config.title !== "string") {
    return { isValid: false, error: "Report 'title' is required and must be a string." };
  }

  if (!Array.isArray(config.columns) || config.columns.length === 0) {
    return { isValid: false, error: "Report 'columns' must be a non-empty array." };
  }

  for (let i = 0; i < config.columns.length; i++) {
    const col = config.columns[i];
    if (!col.header || !col.key) {
      return { 
        isValid: false, 
        error: `Column at index ${i} is missing required 'header' or 'key' property.` 
      };
    }
  }

  if (!Array.isArray(config.rows)) {
    return { isValid: false, error: "Report 'rows' must be an array." };
  }

  return { isValid: true };
};

/**
 * Normalizes input configuration, filling in sensible defaults.
 * @param {object} config 
 * @returns {object}
 */
export const normalizeReportConfig = (config) => {
  const { isValid, error } = validateReportConfig(config);
  if (!isValid) {
    throw new Error(`[ReportContractError] ${error}`);
  }

  return {
    ...config,
    title: config.title.trim(),
    subTitle: config.subTitle ? config.subTitle.trim() : null,
    company: {
      name: config.company?.name || "",
      address: config.company?.address || "",
      gstin: config.company?.gstin || "",
      pan: config.company?.pan || "",
      phone: config.company?.phone || "",
      email: config.company?.email || "",
      ...config.company,
    },
    metadata: Array.isArray(config.metadata) ? config.metadata : [],
    columns: config.columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 15,
      type: col.type || "text", // 'text' | 'date' | 'currency' | 'number'
      align: col.align || (col.type === "currency" || col.type === "number" ? "right" : "left"),
      ...col,
    })),
    rows: config.rows || [],
    summaryRows: Array.isArray(config.summaryRows)
      ? config.summaryRows.map((sum) => ({
          label: sum.label || sum.particulars || sum.title || '',
          value:
            sum.value !== null && sum.value !== undefined
              ? String(sum.value)
              : sum.balance !== null && sum.balance !== undefined
              ? String(sum.balance)
              : '',
          isHighlighted: Boolean(sum.isHighlighted),
          ...sum,
        }))
      : [],
    orientation: config.orientation || "portrait", // 'portrait' | 'landscape'
  };
};
