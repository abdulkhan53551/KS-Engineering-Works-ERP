import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { 
    FaCheck, 
    FaThList, 
    FaInfoCircle, 
    FaMagic, 
    FaTrashAlt,
    FaDraftingCompass,
    FaShieldAlt
} from 'react-icons/fa';
import { DEFAULT_SPEC_COLUMNS } from './TableSpecConfigModal';
import './MatrixRowSpecsModal.scss';

export const toCamelCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
};

export const toSnakeCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
};

export const normalizeKey = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const resolveMatrixValue = (matrix, col) => {
    if (!matrix || typeof matrix !== 'object' || !col) return '';

    const colId = String(col.id || '');
    const colHeader = String(col.header || '');

    // 1. Direct match on col.id
    if (matrix[colId] !== undefined && matrix[colId] !== null && String(matrix[colId]).trim() !== '') {
        return String(matrix[colId]);
    }

    // 2. CamelCase version of col.id (e.g. base_metal -> baseMetal, material_grade -> materialGrade)
    const camelId = toCamelCase(colId);
    if (camelId && matrix[camelId] !== undefined && matrix[camelId] !== null && String(matrix[camelId]).trim() !== '') {
        return String(matrix[camelId]);
    }

    // 3. Snake_case version of col.id (e.g. baseMetal -> base_metal)
    const snakeId = toSnakeCase(colId);
    if (snakeId && matrix[snakeId] !== undefined && matrix[snakeId] !== null && String(matrix[snakeId]).trim() !== '') {
        return String(matrix[snakeId]);
    }

    // 4. Exact header match (e.g. 'GRINDING')
    if (colHeader && matrix[colHeader] !== undefined && matrix[colHeader] !== null && String(matrix[colHeader]).trim() !== '') {
        return String(matrix[colHeader]);
    }

    // 5. Lowercase / slug header match (e.g. 'grinding')
    const lowerHeader = colHeader.toLowerCase().trim();
    if (lowerHeader && matrix[lowerHeader] !== undefined && matrix[lowerHeader] !== null && String(matrix[lowerHeader]).trim() !== '') {
        return String(matrix[lowerHeader]);
    }

    const headerSlug = lowerHeader.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (headerSlug && matrix[headerSlug] !== undefined && matrix[headerSlug] !== null && String(matrix[headerSlug]).trim() !== '') {
        return String(matrix[headerSlug]);
    }

    const camelHeader = toCamelCase(headerSlug);
    if (camelHeader && matrix[camelHeader] !== undefined && matrix[camelHeader] !== null && String(matrix[camelHeader]).trim() !== '') {
        return String(matrix[camelHeader]);
    }

    // 6. Normalized key match across all matrix keys
    const normId = normalizeKey(colId);
    const normHeader = normalizeKey(colHeader);

    for (const [key, val] of Object.entries(matrix)) {
        if (val === undefined || val === null || String(val).trim() === '') continue;
        const normK = normalizeKey(key);
        if (normK && (normK === normId || normK === normHeader)) {
            return String(val);
        }
    }

    return '';
};

const MatrixRowSpecsModal = ({ 
    show, 
    onHide, 
    item, 
    tableSpecConfig, 
    onSave 
}) => {
    const [matrixValues, setMatrixValues] = useState({});

    // Determine active columns from tableSpecConfig strictly
    const activeColumns = useMemo(() => {
        let cfg = tableSpecConfig;
        if (typeof cfg === 'string') {
            try { cfg = JSON.parse(cfg); } catch (_) { cfg = null; }
        }
        if (Array.isArray(cfg) && cfg.length > 0) {
            const enabledCols = cfg.filter(c => c.enabled !== false);
            if (enabledCols.length > 0) return enabledCols;
        }
        return DEFAULT_SPEC_COLUMNS;
    }, [tableSpecConfig]);

    // Initialize values when modal opens or item/activeColumns change
    useEffect(() => {
        if (!item || !show) return;

        let rawAnnex = item.annexureData !== undefined ? item.annexureData : item.annexure_data;
        while (typeof rawAnnex === 'string') {
            try { rawAnnex = JSON.parse(rawAnnex); } catch (_) { break; }
        }

        const existingMatrix = (typeof rawAnnex === 'object' && rawAnnex?.matrix) ? rawAnnex.matrix : {};
        
        // Strictly load saved values for currently active columns with multi-key resolution
        const initial = {};
        activeColumns.forEach(col => {
            const resolved = resolveMatrixValue(existingMatrix, col);
            if (resolved !== '') {
                initial[col.id] = resolved;
            } else {
                // Completely new/empty column: only pre-fill product material grade if col.id is material_grade or header contains material
                const isMaterial = col.id === 'material_grade' || col.id === 'materialGrade' || (col.header && col.header.toLowerCase().includes('material'));
                if (isMaterial && (item.productMaterialGrade || item.product_material_grade)) {
                    initial[col.id] = item.productMaterialGrade || item.product_material_grade;
                } else {
                    initial[col.id] = '';
                }
            }
        });

        setMatrixValues(initial);
    }, [item, show, activeColumns]);

    const handleValueChange = (colId, value) => {
        setMatrixValues(prev => ({
            ...prev,
            [colId]: value
        }));
    };

    // Explicit user action to auto-fill product specs on demand from actual product data
    const handleAutoFillDefaults = () => {
        if (!item) return;
        const prodGrade = item.productMaterialGrade || item.product_material_grade || '';
        const prodDimensions = item.productDimensions || item.product_dimensions || '';
        const prodDrawingNo = item.drawingNumber || item.drawing_number || '';
        const prodUnitWt = item.productUnitWeightKg || item.product_unit_weight_kg || null;

        const updated = { ...matrixValues };

        activeColumns.forEach(col => {
            const headerLower = (col.header || '').toLowerCase();
            const idLower = (col.id || '').toLowerCase();

            if (idLower === 'materialgrade' || idLower === 'material_grade' || headerLower.includes('material')) {
                if (prodGrade) updated[col.id] = prodGrade;
            } else if (idLower === 'dimensions' || headerLower.includes('dimension')) {
                if (prodDimensions) updated[col.id] = prodDimensions;
            } else if (idLower === 'drawing' || idLower === 'drawingno' || headerLower.includes('drawing')) {
                if (prodDrawingNo) updated[col.id] = prodDrawingNo;
            } else if (idLower === 'weight' || headerLower.includes('weight')) {
                if (prodUnitWt) {
                    updated[col.id] = `Finished Net: ${prodUnitWt} Kg`;
                }
            }
        });

        setMatrixValues(updated);
    };

    const handleClearAll = () => {
        const cleared = {};
        activeColumns.forEach(c => {
            cleared[c.id] = '';
        });
        setMatrixValues(cleared);
    };

    const handleSave = () => {
        let rawAnnexure = item?.annexureData !== undefined ? item?.annexureData : item?.annexure_data;
        while (typeof rawAnnexure === 'string') {
            try { rawAnnexure = JSON.parse(rawAnnexure); } catch (_) { break; }
        }

        const baseAnnex = (typeof rawAnnexure === 'object' && !Array.isArray(rawAnnexure)) ? rawAnnexure : {};

        // Clean matrix: ONLY store values for active columns, saving under primary id as well as camelCase and header aliases
        const cleanMatrix = {};
        activeColumns.forEach(c => {
            const val = matrixValues[c.id];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
                const trimmed = String(val).trim();
                cleanMatrix[c.id] = trimmed;

                // Also save under camelCase version of col.id
                const camelId = toCamelCase(c.id);
                if (camelId) cleanMatrix[camelId] = trimmed;

                // Also save under slugified header (e.g. grinding)
                if (c.header) {
                    const slug = c.header.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                    if (slug) {
                        cleanMatrix[slug] = trimmed;
                        const cSlug = toCamelCase(slug);
                        if (cSlug) cleanMatrix[cSlug] = trimmed;
                    }
                }
            }
        });

        // CRITICAL INDEPENDENCE: Keep sections (Cards) 100% intact, only update clean matrix
        const updatedAnnex = {
            ...baseAnnex,
            drawingNo: item?.drawingNumber || item?.drawing_number || '',
            matrix: cleanMatrix
        };

        onSave(updatedAnnex);
        onHide();
    };

    if (!item) return null;

    const itemName = item.itemName || item.item_name || 'Component';
    const drawingNo = item.drawingNumber || item.drawing_number;
    const filledCount = activeColumns.filter(c => matrixValues[c.id] && String(matrixValues[c.id]).trim() !== '').length;

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            backdrop="static" 
            centered
            className="matrix-row-specs-modal"
            dialogClassName="matrix-row-specs-modal"
        >
            <Modal.Header closeButton className="matrix-specs-header">
                <div className="d-flex align-items-center gap-2.5">
                    <div className="matrix-specs-icon-badge">
                        <FaThList size={18} />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h6 className="modal-title-main">
                                Tabular Matrix Specifications (Template 2)
                            </h6>
                            <span className="badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '3px 8px' }}>
                                {filledCount} of {activeColumns.length} Active Columns Filled
                            </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted small mt-0.5" style={{ fontSize: '12px' }}>
                            <span>Item: <strong className="text-dark">{itemName}</strong></span>
                            {drawingNo && (
                                <span className="badge bg-light text-danger border font-monospace px-1.5 py-0.5" style={{ fontSize: '10.5px' }}>
                                    <FaDraftingCompass size={9} className="me-1" />
                                    DWG: {drawingNo}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="matrix-specs-body">
                {/* Control Top Bar */}
                <div className="matrix-specs-topbar">
                    <div className="d-flex align-items-center gap-2">
                        <span className="topbar-badge">
                            Active Engineering Grid: {activeColumns.length} {activeColumns.length === 1 ? 'Column' : 'Columns'}
                        </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <button
                            type="button"
                            className="btn-autofill-action"
                            onClick={handleAutoFillDefaults}
                            title="Auto-fill recommended engineering defaults for empty fields"
                        >
                            <FaMagic size={11} /> Auto-Fill Product Norms
                        </button>
                        <button
                            type="button"
                            className="btn-clear-action"
                            onClick={handleClearAll}
                            title="Clear all column fields"
                        >
                            <FaTrashAlt size={10} /> Clear
                        </button>
                    </div>
                </div>

                {/* Info Note */}
                <div className="matrix-specs-info">
                    <FaInfoCircle size={13} className="text-danger flex-shrink-0 mt-0.5" />
                    <span>
                        Values entered below will appear in the corresponding columns on <b>Page 2 (Engineering Matrix Table)</b> of the quotation PDF. You can use multiple lines (e.g., <code>Key: Value</code>) for clean tabular presentation.
                    </span>
                </div>

                {/* Column Inputs Grid */}
                <div className="matrix-fields-container">
                    <Row className="g-3">
                        {activeColumns.map((col) => {
                            const val = matrixValues[col.id] || '';
                            const isFilled = val.trim().length > 0;

                            return (
                                <Col md={6} key={col.id} className="matrix-col-field">
                                    <div className={`matrix-field-card ${isFilled ? 'is-filled' : ''}`}>
                                        <div className="field-card-header">
                                            <div className="d-flex align-items-center gap-1.5 min-w-0">
                                                <span className="col-icon">{col.icon || '⚙'}</span>
                                                <span className="col-header-text text-truncate" title={col.header}>
                                                    {col.header}
                                                </span>
                                            </div>
                                            <span className="col-width-tag">{col.width || '12%'}</span>
                                        </div>

                                        {col.description && (
                                            <div className="field-desc-text">
                                                {col.description}
                                            </div>
                                        )}

                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            size="sm"
                                            value={val}
                                            onChange={(e) => handleValueChange(col.id, e.target.value)}
                                            placeholder={`Enter ${col.header.toLowerCase()}...`}
                                            className="matrix-textarea"
                                        />
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </div>
            </Modal.Body>

            <Modal.Footer className="matrix-specs-footer">
                <div className="footer-status-text">
                    <FaShieldAlt size={12} className="text-success me-1" />
                    <span>Template 1 (Cards) specs are preserved independently.</span>
                </div>
                <div className="footer-action-buttons">
                    <Button variant="outline-dark" size="sm" onClick={onHide} className="px-3">
                        Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleSave} className="px-3 d-inline-flex align-items-center gap-1.5">
                        <FaCheck size={11} /> Apply Matrix Data
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default MatrixRowSpecsModal;
