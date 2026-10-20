import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { 
    FaCheck, 
    FaUndo, 
    FaColumns, 
    FaInfoCircle, 
    FaLayerGroup,
    FaLock,
    FaPlus,
    FaTrashAlt,
    FaArrowUp,
    FaArrowDown,
    FaMagic,
    FaSlidersH
} from 'react-icons/fa';
import './TableSpecConfigModal.scss';

export const toCamelCase = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
};

export const DEFAULT_SPEC_COLUMNS = [
    { id: 'materialGrade', header: 'MATERIAL GRADE & STANDARD', width: '14%', enabled: true, description: 'Material grade, specifications & chemical norms', icon: '🛡', categoryLabel: 'Material Grade' },
    { id: 'weight', header: 'INPUT & NET WEIGHT', width: '12%', enabled: true, description: 'Gross raw weight, net finished weight & scrap recovery', icon: '⚖', categoryLabel: 'Weight' },
    { id: 'baseMetal', header: 'BASE METAL & ESCALATION', width: '13%', enabled: true, description: 'Base index metal price, escalation formula & raw material cost', icon: '📈', categoryLabel: 'Base Metal' },
    { id: 'machining', header: 'MACHINING & HEAT TREATMENT', width: '14%', enabled: true, description: 'CNC processes, hardening, tempering & conversion charges', icon: '⚙', categoryLabel: 'Machining' },
    { id: 'surface', header: 'SURFACE & TESTING NORMS', width: '12%', enabled: true, description: 'Plating, coatings, NDT, UT tests & Mill Test Certificate', icon: '🔬', categoryLabel: 'Surface & QA' }
];

export const PRESET_COLUMNS = [
    { id: 'heatTreatment', header: 'HEAT TREATMENT & HARDNESS', width: '12%', icon: '🔥', description: 'Hardness range (HRC/BHN), annealing, case hardening', categoryLabel: 'Heat Treat' },
    { id: 'coatingPlating', header: 'SURFACE FINISH & PLATING', width: '12%', icon: '✨', description: 'Zinc, nickel, chrome plating, anodizing, passivation', categoryLabel: 'Coating' },
    { id: 'ndtTesting', header: 'NDT & QA TESTING NORMS', width: '12%', icon: '🧪', description: 'Ultrasonic (UT), MPI, Dye Penetrant, Mill Test Cert 3.1', categoryLabel: 'Testing' },
    { id: 'tolerances', header: 'CRITICAL TOLERANCES & GD&T', width: '12%', icon: '📐', description: 'Concentricity, runout, micro-inch Ra finish, key dimensions', categoryLabel: 'Tolerances' },
    { id: 'toolingMoq', header: 'TOOLING & BATCH NORMS', width: '11%', icon: '📦', description: 'Special fixtures, gauges, batch run quantity, lead time', categoryLabel: 'Tooling' },
    { id: 'scrapRecovery', header: 'SCRAP RECOVERY & BURNING', width: '11%', icon: '♻', description: 'Scrap allowance percentage, burning loss, chips credit', categoryLabel: 'Scrap' }
];

const CATEGORY_MAP = {
    materialGrade: { icon: '🛡', label: 'Material Grade', badgeClass: 'cat-materialGrade' },
    weight: { icon: '⚖', label: 'Weight Norms', badgeClass: 'cat-weight' },
    baseMetal: { icon: '📈', label: 'Base Metal', badgeClass: 'cat-baseMetal' },
    machining: { icon: '⚙', label: 'Machining', badgeClass: 'cat-machining' },
    surface: { icon: '🔬', label: 'Surface & QA', badgeClass: 'cat-surface' }
};

const TableSpecConfigModal = ({ show, onHide, config, onSave }) => {
    const [columns, setColumns] = useState([]);

    useEffect(() => {
        let rawConfig = config;
        if (typeof rawConfig === 'string') {
            try { rawConfig = JSON.parse(rawConfig); } catch (_) {}
        }
        if (!rawConfig || !Array.isArray(rawConfig) || rawConfig.length === 0) {
            setColumns(JSON.parse(JSON.stringify(DEFAULT_SPEC_COLUMNS)));
        } else {
            // Preserve all configured columns (including custom added ones) and normalize legacy snake_case IDs to camelCase
            setColumns(rawConfig.map((c, i) => {
                const normId = c.id ? toCamelCase(c.id) : `col${i}${Date.now().toString(36)}`;
                const isDefault = DEFAULT_SPEC_COLUMNS.some(d => d.id === normId || d.id === c.id);
                const defaultDef = DEFAULT_SPEC_COLUMNS.find(d => d.id === normId || d.id === c.id);
                return {
                    id: normId,
                    header: c.header || defaultDef?.header || `COLUMN ${i + 1}`,
                    width: c.width || defaultDef?.width || '12%',
                    enabled: c.enabled !== false,
                    description: c.description || defaultDef?.description || 'Custom engineering specification parameter',
                    icon: c.icon || defaultDef?.icon || '⚙',
                    categoryLabel: c.categoryLabel || defaultDef?.categoryLabel || 'Custom',
                    isCustom: c.isCustom !== undefined ? c.isCustom : !isDefault
                };
            }));
        }
    }, [config, show]);

    const handleToggle = (idx) => {
        setColumns(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], enabled: !next[idx].enabled };
            return next;
        });
    };

    const handleHeaderChange = (idx, value) => {
        setColumns(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], header: value };
            return next;
        });
    };

    const handleWidthChange = (idx, value) => {
        setColumns(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], width: value };
            return next;
        });
    };

    const handleAddColumn = (preset = null) => {
        setColumns(prev => {
            if (preset) {
                // Ensure unique id if already exists
                let presetId = preset.id;
                let counter = 1;
                while (prev.some(c => c.id === presetId)) {
                    presetId = `${preset.id}${counter++}`;
                }
                const newCol = {
                    ...preset,
                    id: presetId,
                    enabled: true,
                    isCustom: true
                };
                return [...prev, newCol];
            }

            const newId = `col${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
            const newCol = {
                id: newId,
                header: `SPECIFICATION COL ${prev.length + 1}`,
                width: '12%',
                enabled: true,
                description: 'Custom engineering specification parameter',
                icon: '⚙',
                categoryLabel: 'Custom',
                isCustom: true
            };
            return [...prev, newCol];
        });
    };

    const handleDeleteColumn = (idx) => {
        setColumns(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter((_, i) => i !== idx);
        });
    };

    const handleMoveColumn = (idx, direction) => {
        setColumns(prev => {
            const next = [...prev];
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= next.length) return prev;
            const temp = next[idx];
            next[idx] = next[targetIdx];
            next[targetIdx] = temp;
            return next;
        });
    };

    const handleAutoBalanceWidths = () => {
        setColumns(prev => {
            const activeCount = prev.filter(c => c.enabled).length;
            if (activeCount === 0) return prev;
            // Target ~65% total width for dynamic columns (35% allocated to Fixed #, Item/DWG, and Rate)
            const targetTotal = 65;
            const basePct = Math.max(6, Math.floor(targetTotal / activeCount));
            const remainder = targetTotal - (basePct * activeCount);

            let activeSeen = 0;
            return prev.map(c => {
                if (!c.enabled) return c;
                activeSeen++;
                // Add remainder to the first column
                const w = activeSeen === 1 ? basePct + remainder : basePct;
                return { ...c, width: `${w}%` };
            });
        });
    };

    const handleReset = () => {
        setColumns(JSON.parse(JSON.stringify(DEFAULT_SPEC_COLUMNS)));
    };

    const handleSave = () => {
        onSave(columns);
        onHide();
    };

    const activeCount = columns.filter(c => c.enabled).length;
    
    // Calculate total percentage allocated
    const totalAllocatedWidth = columns
        .filter(c => c.enabled)
        .reduce((sum, c) => sum + (parseFloat(c.width) || 0), 0);

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            backdrop="static" 
            centered
            className="table-spec-config-modal"
            dialogClassName="table-spec-config-modal"
        >
            <Modal.Header closeButton className="matrix-modal-header">
                <div className="d-flex align-items-center gap-2.5">
                    <div className="matrix-modal-icon-badge">
                        <FaColumns size={18} />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h6 className="modal-title-main">
                                Configure Tabular Matrix Columns (Annexure - I)
                            </h6>
                            <span className="badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '3px 8px' }}>
                                {activeCount} Active Specification {activeCount === 1 ? 'Column' : 'Columns'}
                            </span>
                        </div>
                        <div className="text-muted small mt-0.5" style={{ fontSize: '12px' }}>
                            Add 1 to 8+ engineering specification columns, customize headers, order, and printable width allocations
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="matrix-modal-body">
                {/* Top Summary & Actions Bar */}
                <div className="matrix-top-control-bar">
                    <div className="d-flex flex-wrap align-items-center gap-2.5">
                        <div className="stat-pill">
                            <span>Dynamic Columns:</span>
                            <span className="badge-crimson">
                                {activeCount} of {columns.length} Active
                            </span>
                        </div>
                        <div className="stat-pill d-none d-md-flex align-items-center gap-1.5">
                            <FaLock size={11} className="text-muted" />
                            <span>Full Layout:</span>
                            <strong className="text-dark">3 Fixed + {activeCount} Dynamic = {3 + activeCount} Columns</strong>
                        </div>
                        <div className={`width-stat-pill ${totalAllocatedWidth > 72 ? 'warning' : ''}`} title="Target width for dynamic columns is ~62-68% (Fixed columns take ~32-35%)">
                            <span>Dynamic Width:</span>
                            <strong>{totalAllocatedWidth}%</strong>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <button 
                            type="button"
                            onClick={handleAutoBalanceWidths} 
                            className="btn-auto-balance"
                            title="Distribute 65% width equally across all active columns"
                        >
                            <FaMagic size={10} /> Auto-Balance %
                        </button>
                        <button 
                            type="button"
                            onClick={handleReset} 
                            className="btn-reset-defaults"
                            title="Reset to 5 KS Engineering standard columns"
                        >
                            <FaUndo size={11} /> Reset Defaults
                        </button>
                    </div>
                </div>

                {/* Quick Add Preset Columns Chips */}
                <div className="matrix-presets-wrapper mb-3">
                    <div className="presets-label">
                        <FaSlidersH size={11} className="text-danger" />
                        <span>Quick-Add Popular Engineering Presets:</span>
                    </div>
                    <div className="presets-chips-container">
                        {PRESET_COLUMNS.map(preset => {
                            const isAlreadyAdded = columns.some(c => c.id === preset.id || c.header.toUpperCase() === preset.header.toUpperCase());
                            return (
                                <button
                                    key={preset.id}
                                    type="button"
                                    className={`preset-chip-btn ${isAlreadyAdded ? 'already-added' : ''}`}
                                    onClick={() => handleAddColumn(preset)}
                                    title={preset.description}
                                >
                                    <span className="preset-icon">{preset.icon}</span>
                                    <span>{preset.categoryLabel}</span>
                                    <FaPlus size={8} className="ms-1 text-muted" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Info Callout Card */}
                <div className="matrix-info-card">
                    <div className="info-title d-flex align-items-center gap-1.5">
                        <FaLayerGroup size={12} className="text-danger" />
                        <span>Annexure Page 2 Table Architecture</span>
                    </div>
                    <p className="info-text">
                        Fixed system columns: <span className="fixed-col-chip"># (Serial)</span>, 
                        <span className="fixed-col-chip">Item Description & Drawing Ref</span>, and 
                        <span className="fixed-col-chip">Quoted Rate (₹)</span> are always locked.
                        You can add, re-order, or delete dynamic specification columns below (supports 1, 2, 4, 6, 8 or custom columns).
                    </p>
                </div>

                {/* Columns Table / Card Container */}
                <div className="matrix-columns-container">
                    <div className="col-header-row">
                        <div className="col-h-order">Order</div>
                        <div className="col-h-visible">Visible</div>
                        <div className="col-h-title">Column Header & Description</div>
                        <div className="col-h-width">Width %</div>
                        <div className="col-h-actions">Actions</div>
                    </div>

                    {columns.map((col, idx) => {
                        const catInfo = CATEGORY_MAP[col.id] || { 
                            icon: col.icon || '⚙', 
                            label: col.categoryLabel || 'Custom', 
                            badgeClass: 'cat-default' 
                        };

                        return (
                            <div key={col.id} className={`matrix-item-row ${!col.enabled ? 'is-disabled' : ''}`}>
                                {/* Re-order buttons */}
                                <div className="col-item-order">
                                    <button
                                        type="button"
                                        className="btn-order-arrow"
                                        disabled={idx === 0}
                                        onClick={() => handleMoveColumn(idx, 'up')}
                                        title="Move column left/up"
                                    >
                                        <FaArrowUp size={9} />
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-order-arrow"
                                        disabled={idx === columns.length - 1}
                                        onClick={() => handleMoveColumn(idx, 'down')}
                                        title="Move column right/down"
                                    >
                                        <FaArrowDown size={9} />
                                    </button>
                                </div>

                                {/* Visibility Toggle */}
                                <div className="col-item-visible">
                                    <Form.Check
                                        type="switch"
                                        id={`toggle-${col.id}`}
                                        checked={col.enabled}
                                        onChange={() => handleToggle(idx)}
                                    />
                                    <span className={`visibility-status-text ${col.enabled ? 'active' : 'hidden'}`}>
                                        {col.enabled ? 'Active' : 'Hidden'}
                                    </span>
                                </div>

                                {/* Header & Description Input */}
                                <div className="col-item-title">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="col-icon-tag">{col.icon || '⚙'}</span>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            value={col.header}
                                            disabled={!col.enabled}
                                            onChange={(e) => handleHeaderChange(idx, e.target.value.toUpperCase())}
                                            className="header-input fw-bold"
                                            placeholder="COLUMN HEADER TITLE"
                                        />
                                    </div>
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        value={col.description || ''}
                                        disabled={!col.enabled}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setColumns(prev => {
                                                const next = [...prev];
                                                next[idx] = { ...next[idx], description: v };
                                                return next;
                                            });
                                        }}
                                        className="desc-input"
                                        placeholder="Optional description / helper text"
                                    />
                                </div>

                                {/* Width Allocation Input */}
                                <div className="col-item-width">
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        value={col.width || '12%'}
                                        disabled={!col.enabled}
                                        onChange={(e) => handleWidthChange(idx, e.target.value)}
                                        className="width-input text-center fw-bold"
                                        placeholder="12%"
                                        title="Column width percentage in table"
                                    />
                                </div>

                                {/* Actions / Delete Column */}
                                <div className="col-item-actions">
                                    <button
                                        type="button"
                                        className="btn-delete-col"
                                        disabled={columns.length <= 1}
                                        onClick={() => handleDeleteColumn(idx)}
                                        title={columns.length <= 1 ? "At least 1 column required" : "Delete this column"}
                                    >
                                        <FaTrashAlt size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Custom Column Button */}
                <div className="matrix-add-column-bar mt-3">
                    <button
                        type="button"
                        className="btn-add-custom-col"
                        onClick={() => handleAddColumn()}
                    >
                        <FaPlus size={11} className="me-1.5" />
                        <span>Add Custom Specification Column</span>
                    </button>
                </div>
            </Modal.Body>

            <Modal.Footer className="matrix-modal-footer">
                <div className="footer-info-text">
                    <FaInfoCircle size={13} className="text-danger flex-shrink-0" />
                    <span>Configured columns will be rendered on Page 2 in Pure Tabular Matrix (Template 2) PDF.</span>
                </div>
                <div className="footer-actions">
                    <button type="button" className="btn-cancel" onClick={onHide}>
                        Cancel
                    </button>
                    <button type="button" className="btn-save" onClick={handleSave}>
                        <FaCheck size={11} /> Apply Column Configuration
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default TableSpecConfigModal;
