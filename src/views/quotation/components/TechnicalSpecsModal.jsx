import React, { useState, useEffect } from 'react';
import { Modal, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
    FaPlus, 
    FaTrashAlt, 
    FaCheck, 
    FaUndo, 
    FaCogs, 
    FaStar, 
    FaInfoCircle, 
    FaThLarge 
} from 'react-icons/fa';
import './TechnicalSpecsModal.scss';

const DEFAULT_SECTIONS_TEMPLATES = [
    {
        id: 'raw_material',
        title: 'Raw Material Specifications',
        icon: '🛡',
        fields: [
            { key: 'grade', label: 'Material Grade', value: '', highlight: true },
            { key: 'supply_condition', label: 'Supply Condition', value: 'Normalized / Rolled', highlight: false },
            { key: 'hardness', label: 'Hardness Range', value: '160 - 200 BHN', highlight: false },
            { key: 'gross_wt', label: 'Gross Input Weight', value: '', highlight: false },
            { key: 'net_wt', label: 'Finished Net Weight', value: '', highlight: false }
        ]
    },
    {
        id: 'dimensions',
        title: 'Dimensions & Tolerances',
        icon: '📐',
        fields: [
            { key: 'dimensions', label: 'Critical Dimensions', value: '', highlight: false },
            { key: 'tolerance', label: 'General Tolerance', value: '±0.02 mm / Drawing standard', highlight: false },
            { key: 'drawing_ref', label: 'Reference Drawing', value: '', highlight: true }
        ]
    },
    {
        id: 'machining',
        title: 'Machining & Heat Treatment',
        icon: '⚙',
        fields: [
            { key: 'process', label: 'Primary Process', value: 'CNC Turning & Milling', highlight: false },
            { key: 'heat_treatment', label: 'Heat Treatment', value: 'Stress Relief Annealed', highlight: false },
            { key: 'conversion', label: 'Conversion Cost', value: '', highlight: true }
        ]
    },
    {
        id: 'quality',
        title: 'Quality, Testing & Packaging',
        icon: '✓',
        fields: [
            { key: 'inspection', label: 'QA Inspection', value: '100% Visual & Dimensional CMM', highlight: false },
            { key: 'mtc', label: 'Mill Certificate', value: 'EN 10204 Type 3.1 Attached', highlight: false },
            { key: 'packaging', label: 'Transit Packaging', value: 'Anti-Rust Wrap + Heavy Duty Box', highlight: false }
        ]
    }
];

const TechnicalSpecsModal = ({ show, onHide, item, onSave }) => {
    const [sections, setSections] = useState([]);

    useEffect(() => {
        if (!item) return;

        let rawAnnexure = item.annexureData !== undefined ? item.annexureData : item.annexure_data;
        while (typeof rawAnnexure === 'string') {
            try { rawAnnexure = JSON.parse(rawAnnexure); } catch (_) { break; }
        }

        let existingSections = null;
        if (Array.isArray(rawAnnexure)) {
            existingSections = rawAnnexure;
        } else if (Array.isArray(rawAnnexure?.sections)) {
            existingSections = rawAnnexure.sections;
        }

        if (!Array.isArray(existingSections) || existingSections.length === 0) {
            // Populate defaults using product data if available
            const defaultClone = JSON.parse(JSON.stringify(DEFAULT_SECTIONS_TEMPLATES));
            const dwgVal = item.drawingNumber || item.drawing_number;
            const matVal = item.productMaterialGrade || item.product_material_grade;
            const dimVal = item.productDimensions || item.product_dimensions;
            const wtVal = item.productUnitWeightKg || item.product_unit_weight_kg;

            if (dwgVal) {
                const dimSec = defaultClone.find(s => s.id === 'dimensions');
                const dwgField = dimSec?.fields?.find(f => f.key === 'drawing_ref');
                if (dwgField) dwgField.value = dwgVal;
            }
            if (matVal) {
                const matSec = defaultClone.find(s => s.id === 'raw_material');
                const gradeField = matSec?.fields?.find(f => f.key === 'grade');
                if (gradeField) gradeField.value = matVal;
            }
            if (dimVal) {
                const dimSec = defaultClone.find(s => s.id === 'dimensions');
                const dimField = dimSec?.fields?.find(f => f.key === 'dimensions');
                if (dimField) dimField.value = dimVal;
            }
            if (wtVal) {
                const matSec = defaultClone.find(s => s.id === 'raw_material');
                const netField = matSec?.fields?.find(f => f.key === 'net_wt');
                if (netField) netField.value = `${wtVal} Kg`;
            }
            setSections(defaultClone);
        } else {
            setSections(JSON.parse(JSON.stringify(existingSections)));
        }
    }, [item, show]);

    const handleSectionTitleChange = (sIdx, value) => {
        setSections(prev => {
            const next = [...prev];
            next[sIdx].title = value;
            return next;
        });
    };

    const handleSectionIconChange = (sIdx, value) => {
        setSections(prev => {
            const next = [...prev];
            next[sIdx].icon = value;
            return next;
        });
    };

    const handleFieldChange = (sIdx, fIdx, fieldKey, value) => {
        setSections(prev => {
            const next = [...prev];
            next[sIdx].fields[fIdx][fieldKey] = value;
            return next;
        });
    };

    const handleAddField = (sIdx) => {
        setSections(prev => {
            const next = [...prev];
            next[sIdx].fields.push({
                key: `custom_${Date.now()}`,
                label: 'New Spec Label',
                value: '',
                highlight: false
            });
            return next;
        });
    };

    const handleRemoveField = (sIdx, fIdx) => {
        setSections(prev => {
            const next = [...prev];
            next[sIdx].fields.splice(fIdx, 1);
            return next;
        });
    };

    const handleAddSection = () => {
        if (sections.length >= 12) return;
        setSections(prev => [
            ...prev,
            {
                id: `sec_${Date.now()}`,
                title: `Technical Section ${prev.length + 1}`,
                icon: '⚙',
                fields: [
                    { key: 'param_1', label: 'Specification Parameter', value: '', highlight: false }
                ]
            }
        ]);
    };

    const handleRemoveSection = (sIdx) => {
        setSections(prev => prev.filter((_, idx) => idx !== sIdx));
    };

    const handleResetDefaults = () => {
        setSections(JSON.parse(JSON.stringify(DEFAULT_SECTIONS_TEMPLATES)));
    };

    const handleSave = () => {
        let rawAnnexure = item?.annexureData !== undefined ? item?.annexureData : item?.annexure_data;
        while (typeof rawAnnexure === 'string') {
            try { rawAnnexure = JSON.parse(rawAnnexure); } catch (_) { break; }
        }
        onSave({
            ...(typeof rawAnnexure === 'object' && !Array.isArray(rawAnnexure) ? rawAnnexure : {}),
            drawingNo: item?.drawingNumber || item?.drawing_number || '',
            configuredCardsCount: sections.length,
            sections: [...sections]
        });
        onHide();
    };

    if (!item) return null;

    const itemName = item.itemName || item.item_name || 'Component';
    const drawingNo = item.drawingNumber || item.drawing_number;
    const layoutModeText = sections.length === 1 
        ? 'Single (100% Width)' 
        : sections.length === 2 
        ? '2 Columns (50/50)' 
        : sections.length <= 4 
        ? '2x2 Grid (4 Cards)' 
        : sections.length <= 6
        ? '3x2 Grid (6 Cards)'
        : `${sections.length} Cards Multi-Grid`;

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            size="lg" 
            backdrop="static" 
            centered
            className="technical-specs-modal"
            dialogClassName="technical-specs-modal"
        >
            <Modal.Header closeButton className="spec-modal-header">
                <div className="d-flex align-items-center gap-2.5">
                    <div className="spec-modal-icon-badge">
                        <FaCogs size={18} />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h6 className="modal-title-main">
                                Technical Specifications & Annexure Cards
                            </h6>
                            <span className="badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '3px 8px' }}>
                                {sections.length} Active {sections.length === 1 ? 'Card' : 'Cards'}
                            </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted small mt-0.5" style={{ fontSize: '12px' }}>
                            <span>Item: <strong className="text-dark">{itemName}</strong></span>
                            {drawingNo && (
                                <span className="badge bg-light text-danger border font-monospace px-1.5 py-0.5" style={{ fontSize: '10.5px' }}>
                                    DWG: {drawingNo}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="spec-modal-body">
                {/* Top Control Bar */}
                <div className="spec-top-control-bar">
                    <div className="d-flex align-items-center gap-3">
                        <div className="stat-pill">
                            <span>Cards Configured:</span>
                            <span className="badge-crimson">
                                {sections.length} of 12 Cards
                            </span>
                        </div>
                        <div className="stat-pill d-none d-sm-flex align-items-center gap-1.5">
                            <FaThLarge size={11} className="text-danger" />
                            <span>Layout:</span>
                            <strong className="text-dark">{layoutModeText}</strong>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button 
                            type="button"
                            onClick={handleResetDefaults} 
                            className="btn-reset-defaults"
                        >
                            <FaUndo size={11} /> Reset Defaults
                        </button>
                        <button
                            type="button"
                            onClick={handleAddSection}
                            disabled={sections.length >= 12}
                            className="btn-add-card"
                        >
                            <FaPlus size={11} /> Add Card ({sections.length}/12)
                        </button>
                    </div>
                </div>

                {/* Section Cards */}
                <div className="cards-editor-container">
                    {sections.map((section, sIdx) => (
                        <div key={section.id || sIdx} className="spec-section-card">
                            <div className="spec-card-header">
                                <div className="header-left">
                                    <span className="card-idx-badge">Card #{sIdx + 1}</span>
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        className="icon-input"
                                        value={section.icon || '⚙'}
                                        onChange={(e) => handleSectionIconChange(sIdx, e.target.value)}
                                        title="Card Emoji / Icon"
                                    />
                                    <Form.Control
                                        type="text"
                                        size="sm"
                                        className="title-input"
                                        value={section.title}
                                        onChange={(e) => handleSectionTitleChange(sIdx, e.target.value)}
                                        placeholder="Section Title (e.g. Raw Material Specifications)"
                                    />
                                </div>
                                <div className="header-right">
                                    <span className="badge-params-count">
                                        {section.fields?.length || 0} Params
                                    </span>
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id={`del-card-${sIdx}`}>{sections.length <= 1 ? "At least one card required" : "Delete Card"}</Tooltip>}
                                    >
                                        <button
                                            type="button"
                                            className="btn-del-card"
                                            onClick={() => handleRemoveSection(sIdx)}
                                            disabled={sections.length <= 1}
                                        >
                                            <FaTrashAlt size={12} />
                                        </button>
                                    </OverlayTrigger>
                                </div>
                            </div>

                            <div className="spec-card-body">
                                <div className="params-header-row">
                                    <div className="col-header-label">Parameter / Specification Label</div>
                                    <div className="col-header-value">Value & Technical Standard</div>
                                    <div className="col-header-hl">PDF Highlight</div>
                                    <div className="col-header-act">Act</div>
                                </div>

                                {section.fields.map((field, fIdx) => (
                                    <div key={fIdx} className={`param-row ${field.highlight ? 'is-highlighted' : ''}`}>
                                        <div className="param-label-col">
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                value={field.label}
                                                onChange={(e) => handleFieldChange(sIdx, fIdx, 'label', e.target.value)}
                                                placeholder="Label (e.g. Material Grade)"
                                                className="param-input label-field"
                                            />
                                        </div>
                                        <div className="param-value-col">
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                value={field.value}
                                                onChange={(e) => handleFieldChange(sIdx, fIdx, 'value', e.target.value)}
                                                placeholder="Value (e.g. IS 2062 Gr.B)"
                                                className="param-input value-field"
                                            />
                                        </div>
                                        <div className="param-hl-col">
                                            <button
                                                type="button"
                                                className={`hl-toggle-btn ${field.highlight ? 'active' : ''}`}
                                                onClick={() => handleFieldChange(sIdx, fIdx, 'highlight', !field.highlight)}
                                                title={field.highlight ? "Featured key spec in PDF card" : "Click to highlight parameter"}
                                            >
                                                <FaStar size={11} />
                                                <span>{field.highlight ? 'Highlighted' : 'Normal'}</span>
                                            </button>
                                        </div>
                                        <div className="param-act-col">
                                            <button
                                                type="button"
                                                className="btn-del-param"
                                                onClick={() => handleRemoveField(sIdx, fIdx)}
                                                disabled={section.fields.length <= 1}
                                                title="Remove Parameter"
                                            >
                                                <FaTrashAlt size={11} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    className="btn-add-param"
                                    onClick={() => handleAddField(sIdx)}
                                >
                                    <FaPlus size={10} />
                                    <span>Add Parameter Row</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal.Body>

            <Modal.Footer className="spec-modal-footer">
                <div className="footer-info-text">
                    <FaInfoCircle size={13} className="text-danger flex-shrink-0" />
                    <span>Configured specification cards appear in Annexure - I of the Quotation PDF.</span>
                </div>
                <div className="footer-actions">
                    <button type="button" className="btn-cancel" onClick={onHide}>
                        Cancel
                    </button>
                    <button type="button" className="btn-save" onClick={handleSave}>
                        <FaCheck size={11} /> Save Specifications
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default TechnicalSpecsModal;

