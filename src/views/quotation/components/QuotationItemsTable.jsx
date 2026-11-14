import React, { useMemo } from 'react';
import { Table, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
    FaPlus, 
    FaTrashAlt, 
    FaCogs, 
    FaCopy, 
    FaDraftingCompass, 
    FaInfoCircle,
    FaThList
} from 'react-icons/fa';
import { DEFAULT_SPEC_COLUMNS } from './TableSpecConfigModal';
import { resolveMatrixValue } from './MatrixRowSpecsModal';
import ProductAutocompleteInput from '../../products/components/ProductAutocompleteInput';
import { calculateLineItemTotals } from '../hooks/useQuotationCalculation';

const QuotationItemsTable = ({
    items = [],
    setItems,
    register,
    errors = {},
    setValue,
    clearErrors,
    products = [],
    isInterState = false,
    disabled = false,
    templateType = 'CARDS',
    tableSpecConfig = null,
    onOpenSpecsModal
}) => {

    const calculateItemTotals = (item) => calculateLineItemTotals(item, isInterState);

    const handleItemChange = (idx, field, value) => {
        setItems(prev => {
            const next = [...prev];
            const updated = calculateItemTotals({
                ...next[idx],
                [field]: value
            });
            next[idx] = updated;
            if (setValue) {
                setValue(`items.${idx}.${field}`, value, { shouldValidate: false, shouldDirty: true });
                setValue(`items.${idx}.taxableAmount`, updated.taxableAmount, { shouldDirty: true });
                setValue(`items.${idx}.cgst`, updated.cgst, { shouldDirty: true });
                setValue(`items.${idx}.sgst`, updated.sgst, { shouldDirty: true });
                setValue(`items.${idx}.igst`, updated.igst, { shouldDirty: true });
                setValue(`items.${idx}.total`, updated.total, { shouldDirty: true });
                setValue('items', next, { shouldValidate: false, shouldDirty: true });
            }
            return next;
        });
    };

    const handleProductSelect = (idx, prod) => {
        if (!prod) return;

        const name = prod.name || '';
        const drawingNo = prod.drawingNumber || prod.drawing_number || '';
        const hsn = prod.hsnSacCode || prod.hsn_sac_code || '';
        const rate = parseFloat(prod.sellingPrice || prod.selling_price || 0);
        const unit = prod.unitName || prod.unit_name || 'Nos';
        const taxRate = prod.gstRate !== undefined ? parseFloat(prod.gstRate) : (prod.taxRate !== undefined ? parseFloat(prod.taxRate) : 18.00);
        const materialGrade = prod.materialGrade || prod.material_grade || '';
        const dimensions = prod.dimensions || '';
        const unitWeight = parseFloat(prod.unitWeightKg || prod.unit_weight_kg || 0) || null;

        setItems(prev => {
            const next = [...prev];
            const defaultAnnex = {
                drawingNo: drawingNo || '',
                configuredCardsCount: 4,
                sections: [
                    {
                        id: 'raw_material',
                        title: 'Raw Material Specifications',
                        icon: '🛡',
                        fields: [
                            { key: 'grade', label: 'Material Grade', value: materialGrade || '', highlight: true },
                            { key: 'supply_condition', label: 'Supply Condition', value: '', highlight: false },
                            { key: 'hardness', label: 'Hardness Range', value: '', highlight: false },
                            { key: 'gross_wt', label: 'Gross Input Weight', value: unitWeight ? `${(unitWeight * 1.15).toFixed(3)} Kg` : '', highlight: false },
                            { key: 'net_wt', label: 'Finished Net Weight', value: unitWeight ? `${unitWeight} Kg` : '', highlight: false }
                        ]
                    },
                    {
                        id: 'dimensions',
                        title: 'Dimensions & Tolerances',
                        icon: '📐',
                        fields: [
                            { key: 'dimensions', label: 'Critical Dimensions', value: dimensions || '', highlight: false },
                            { key: 'tolerance', label: 'General Tolerance', value: '', highlight: false },
                            { key: 'drawing_ref', label: 'Reference Drawing', value: drawingNo || '', highlight: true }
                        ]
                    },
                    {
                        id: 'machining',
                        title: 'Machining & Heat Treatment',
                        icon: '⚙',
                        fields: [
                            { key: 'process', label: 'Primary Process', value: '', highlight: false },
                            { key: 'heat_treatment', label: 'Heat Treatment', value: '', highlight: false },
                            { key: 'conversion', label: 'Conversion Cost', value: '', highlight: false }
                        ]
                    },
                    {
                        id: 'quality',
                        title: 'Quality, Testing & Packaging',
                        icon: '✓',
                        fields: [
                            { key: 'inspection', label: 'QA Inspection', value: '', highlight: false },
                            { key: 'mtc', label: 'Mill Certificate', value: '', highlight: false },
                            { key: 'packaging', label: 'Transit Packaging', value: '', highlight: false }
                        ]
                    }
                ]
            };
            const chosenAnnex = next[idx].annexureData || next[idx].annexure_data || defaultAnnex;

            const updated = {
                ...next[idx],
                productId: prod.id || null,
                itemName: name || next[idx].itemName || next[idx].item_name,
                drawingNumber: drawingNo || next[idx].drawingNumber || next[idx].drawing_number || '',
                hsnSacCode: hsn || next[idx].hsnSacCode || next[idx].hsn_sac_code || '',
                rate: rate > 0 ? rate : next[idx].rate,
                unit: unit || next[idx].unit || 'Nos',
                taxRate: taxRate,
                productMaterialGrade: materialGrade,
                productDimensions: dimensions,
                productUnitWeightKg: unitWeight,
                annexureData: chosenAnnex
            };
            next[idx] = calculateItemTotals(updated);
            if (setValue) {
                setValue(`items.${idx}.productId`, prod.id || null, { shouldDirty: true });
                setValue(`items.${idx}.itemName`, updated.itemName, { shouldValidate: false, shouldDirty: true });
                setValue(`items.${idx}.drawingNumber`, updated.drawingNumber, { shouldDirty: true });
                setValue(`items.${idx}.hsnSacCode`, updated.hsnSacCode, { shouldDirty: true });
                setValue(`items.${idx}.rate`, updated.rate, { shouldValidate: false, shouldDirty: true });
                setValue(`items.${idx}.unit`, updated.unit, { shouldDirty: true });
                setValue(`items.${idx}.taxRate`, updated.taxRate, { shouldDirty: true });
                setValue(`items.${idx}.taxableAmount`, next[idx].taxableAmount, { shouldDirty: true });
                setValue(`items.${idx}.total`, next[idx].total, { shouldDirty: true });
                setValue('items', next, { shouldValidate: false, shouldDirty: true });
                if (clearErrors) {
                    clearErrors(`items.${idx}`);
                }
            }
            return next;
        });
    };

    const handleAddItem = () => {
        const newIdx = items.length;
        const newItem = calculateItemTotals({
            itemName: '',
            drawingNumber: '',
            hsnSacCode: '',
            qty: 1,
            unit: 'Nos',
            rate: 0,
            discountPercent: 0,
            discountAmount: 0,
            taxRate: 18.00,
            sortOrder: newIdx
        });
        if (clearErrors) {
            clearErrors(`items.${newIdx}`);
            clearErrors('items');
        }
        setItems(prev => {
            const next = [...prev, newItem];
            if (setValue) setValue('items', next, { shouldValidate: false, shouldDirty: true });
            return next;
        });
    };

    const handleDuplicateItem = (idx) => {
        const source = items[idx];
        if (!source) return;

        const duplicated = calculateItemTotals({
            ...JSON.parse(JSON.stringify(source)),
            id: undefined,
            sortOrder: items.length
        });

        if (clearErrors) {
            clearErrors(`items.${idx + 1}`);
        }

        setItems(prev => {
            const next = [...prev];
            next.splice(idx + 1, 0, duplicated);
            if (setValue) setValue('items', next, { shouldValidate: false, shouldDirty: true });
            return next;
        });
    };

    const handleRemoveItem = (idx) => {
        if (items.length <= 1) return;
        setItems(prev => {
            const next = prev.filter((_, i) => i !== idx);
            if (setValue) setValue('items', next, { shouldValidate: false, shouldDirty: true });
            return next;
        });
    };

    const totalQty = useMemo(() => {
        return items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0), 0);
    }, [items]);

    const formatCurrency = (val) => {
        const num = parseFloat(val) || 0;
        return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const activeMatrixCols = useMemo(() => {
        let cfg = tableSpecConfig;
        if (typeof cfg === 'string') {
            try { cfg = JSON.parse(cfg); } catch (_) { cfg = null; }
        }
        if (Array.isArray(cfg) && cfg.length > 0) {
            const enabled = cfg.filter(c => c.enabled !== false);
            if (enabled.length > 0) return enabled;
        }
        return DEFAULT_SPEC_COLUMNS;
    }, [tableSpecConfig]);

    return (
        <div className="quotation-items-wrapper">
            <div className="table-responsive">
                <Table className="quotation-items-table align-middle mb-0">
                    <thead>
                        <tr>
                            <th style={{ width: '42px', minWidth: '42px' }} className="text-center">#</th>
                            <th style={{ minWidth: '270px' }}>Product / Item & Engineering Drawing</th>
                            <th style={{ width: '95px', minWidth: '95px' }} className="text-center">HSN/SAC</th>
                            <th style={{ width: '85px', minWidth: '80px' }} className="text-center">Qty</th>
                            <th style={{ width: '85px', minWidth: '80px' }} className="text-center">Unit</th>
                            <th style={{ width: '110px', minWidth: '105px' }} className="text-end">Rate (₹)</th>
                            <th style={{ width: '80px', minWidth: '75px' }} className="text-end">Disc %</th>
                            <th style={{ width: '120px', minWidth: '115px' }} className="text-end">Taxable (₹)</th>
                            <th style={{ width: '85px', minWidth: '80px' }} className="text-center">GST %</th>
                            <th style={{ width: '125px', minWidth: '120px' }} className="text-end">Total (₹)</th>
                            <th style={{ width: '120px', minWidth: '115px' }} className="text-center">
                                {templateType === 'MATRIX' ? 'Matrix Specs' : 'Card Specs'}
                            </th>
                            <th style={{ width: '85px', minWidth: '80px' }} className="text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => {
                            let rawAnnex = item.annexureData !== undefined ? item.annexureData : item.annexure_data;
                            while (typeof rawAnnex === 'string') {
                                try { rawAnnex = JSON.parse(rawAnnex); } catch (_) { break; }
                            }
                            const configuredCardsCount = Array.isArray(rawAnnex)
                                ? rawAnnex.length
                                : (Array.isArray(rawAnnex?.sections) 
                                    ? rawAnnex.sections.length 
                                    : (rawAnnex?.configuredCardsCount ?? rawAnnex?.configured_cards_count ?? 4));
                            const matrixObj = (typeof rawAnnex === 'object' && rawAnnex?.matrix) ? rawAnnex.matrix : {};
                            const configuredMatrixCount = activeMatrixCols.filter(c => {
                                const resolved = resolveMatrixValue(matrixObj, c);
                                return resolved && resolved.trim() !== '';
                            }).length;
                            const itemNameVal = item.itemName ?? item.item_name ?? '';
                            const drawingVal = item.drawingNumber ?? item.drawing_number ?? '';
                            const hsnVal = item.hsnSacCode ?? item.hsn_sac_code ?? '';
                            const discVal = item.discountPercent ?? item.discount_percent ?? 0;
                            const taxRateVal = item.taxRate !== undefined ? item.taxRate : (item.tax_rate !== undefined ? item.tax_rate : 18);
                            const taxableVal = item.taxableAmount ?? item.taxable_amount ?? 0;
                            const totalVal = item.total ?? 0;

                            return (
                                <tr key={idx} className="quotation-item-row">
                                    <td className="text-center">
                                        <span className="line-item-index" title={`Line Item #${idx + 1}`}>
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex flex-column gap-1">
                                            <ProductAutocompleteInput
                                                value={itemNameVal}
                                                onChange={(e) => {
                                                    handleItemChange(idx, 'itemName', e.target.value);
                                                    if (setValue) setValue(`items.${idx}.itemName`, e.target.value, { shouldValidate: true, shouldDirty: true });
                                                }}
                                                onClear={() => {
                                                    handleItemChange(idx, 'itemName', '');
                                                    handleItemChange(idx, 'productId', null);
                                                    if (setValue) {
                                                        setValue(`items.${idx}.itemName`, '', { shouldValidate: true, shouldDirty: true });
                                                        setValue(`items.${idx}.productId`, null, { shouldDirty: true });
                                                    }
                                                }}
                                                onSelectProduct={(prod) => handleProductSelect(idx, prod)}
                                                placeholder="Type or search item from catalog..."
                                                disabled={disabled}
                                                isInvalid={!!errors?.items?.[idx]?.itemName}
                                                errorMessage={errors?.items?.[idx]?.itemName?.message}
                                            />
                                            <div className="drawing-input-group">
                                                <span className="drawing-badge" title="Component / Drawing Reference">
                                                    <FaDraftingCompass size={10} className="me-1 text-danger" />
                                                    DWG
                                                </span>
                                                <Form.Control
                                                    type="text"
                                                    size="sm"
                                                    className="drawing-control font-monospace"
                                                    placeholder="Part / Drawing No. (e.g. KS-DWG-01)"
                                                    value={drawingVal}
                                                    disabled={disabled}
                                                    title="Part / Component Drawing Number"
                                                    isInvalid={!!errors?.items?.[idx]?.drawingNumber}
                                                    {...(register ? register(`items.${idx}.drawingNumber`, {
                                                        onChange: (e) => handleItemChange(idx, 'drawingNumber', e.target.value)
                                                    }) : {
                                                        onChange: (e) => handleItemChange(idx, 'drawingNumber', e.target.value)
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            className="text-center font-monospace"
                                            placeholder="HSN/SAC"
                                            value={hsnVal}
                                            disabled={disabled}
                                            isInvalid={!!errors?.items?.[idx]?.hsnSacCode}
                                            {...(register ? register(`items.${idx}.hsnSacCode`, {
                                                onChange: (e) => handleItemChange(idx, 'hsnSacCode', e.target.value)
                                            }) : {
                                                onChange: (e) => handleItemChange(idx, 'hsnSacCode', e.target.value)
                                            })}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        {errors?.items?.[idx]?.hsnSacCode && (
                                            <Form.Control.Feedback type="invalid" className="d-block" style={{ fontSize: '0.70rem' }}>
                                                {errors?.items?.[idx]?.hsnSacCode?.message}
                                            </Form.Control.Feedback>
                                        )}
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            min="0.01"
                                            step="any"
                                            className="text-center fw-bold"
                                            value={item.qty ?? ''}
                                            disabled={disabled}
                                            isInvalid={!!errors?.items?.[idx]?.qty}
                                            {...(register ? register(`items.${idx}.qty`, {
                                                valueAsNumber: true,
                                                onChange: (e) => handleItemChange(idx, 'qty', e.target.value)
                                            }) : {
                                                onChange: (e) => handleItemChange(idx, 'qty', e.target.value)
                                            })}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        {errors?.items?.[idx]?.qty && (
                                            <Form.Control.Feedback type="invalid" className="d-block" style={{ fontSize: '0.70rem' }}>
                                                {errors?.items?.[idx]?.qty?.message}
                                            </Form.Control.Feedback>
                                        )}
                                    </td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            className="text-center"
                                            value={item.unit || 'Nos'}
                                            disabled={disabled}
                                            isInvalid={!!errors?.items?.[idx]?.unit}
                                            {...(register ? register(`items.${idx}.unit`, {
                                                onChange: (e) => handleItemChange(idx, 'unit', e.target.value)
                                            }) : {
                                                onChange: (e) => handleItemChange(idx, 'unit', e.target.value)
                                            })}
                                        >
                                            <option value="Nos">Nos</option>
                                            <option value="Pcs">Pcs</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Set">Set</option>
                                            <option value="Mtr">Mtr</option>
                                        </Form.Select>
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            min="0"
                                            step="0.01"
                                            className="text-end fw-bold"
                                            value={item.rate ?? ''}
                                            disabled={disabled}
                                            isInvalid={!!errors?.items?.[idx]?.rate}
                                            {...(register ? register(`items.${idx}.rate`, {
                                                valueAsNumber: true,
                                                onChange: (e) => handleItemChange(idx, 'rate', e.target.value)
                                            }) : {
                                                onChange: (e) => handleItemChange(idx, 'rate', e.target.value)
                                            })}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        {errors?.items?.[idx]?.rate && (
                                            <Form.Control.Feedback type="invalid" className="d-block" style={{ fontSize: '0.70rem' }}>
                                                {errors?.items?.[idx]?.rate?.message}
                                            </Form.Control.Feedback>
                                        )}
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            min="0"
                                            max="100"
                                            className="text-end"
                                            value={discVal}
                                            disabled={disabled}
                                            isInvalid={!!errors?.items?.[idx]?.discountPercent}
                                            {...(register ? register(`items.${idx}.discountPercent`, {
                                                valueAsNumber: true,
                                                onChange: (e) => handleItemChange(idx, 'discountPercent', e.target.value)
                                            }) : {
                                                onChange: (e) => handleItemChange(idx, 'discountPercent', e.target.value)
                                            })}
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </td>
                                    <td className="text-end">
                                        <span className="currency-value taxable-amount">
                                            {formatCurrency(taxableVal)}
                                        </span>
                                    </td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            className="text-center"
                                            value={taxRateVal}
                                            disabled={disabled}
                                            isInvalid={!!errors?.items?.[idx]?.taxRate}
                                            {...(register ? register(`items.${idx}.taxRate`, {
                                                valueAsNumber: true,
                                                onChange: (e) => handleItemChange(idx, 'taxRate', e.target.value)
                                            }) : {
                                                onChange: (e) => handleItemChange(idx, 'taxRate', e.target.value)
                                            })}
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </Form.Select>
                                    </td>
                                    <td className="text-end">
                                        <span className="currency-value total-amount">
                                            {formatCurrency(totalVal)}
                                        </span>
                                        {register && (
                                            <>
                                                <input type="hidden" {...register(`items.${idx}.productId`)} />
                                                <input type="hidden" {...register(`items.${idx}.taxableAmount`)} />
                                                <input type="hidden" {...register(`items.${idx}.total`)} />
                                            </>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <OverlayTrigger
                                            placement="top"
                                            overlay={
                                                <Tooltip id={`spec-tip-${idx}`}>
                                                    {templateType === 'MATRIX' 
                                                        ? `Configure specifications for ${activeMatrixCols.length} active matrix columns (Template 2)` 
                                                        : 'Configure executive dossier specification cards for this item (Template 1)'}
                                                </Tooltip>
                                            }
                                        >
                                            <button
                                                type="button"
                                                className={`spec-pill-btn ${templateType === 'MATRIX' ? (configuredMatrixCount > 0 ? 'is-active matrix-active' : 'matrix-mode') : (configuredCardsCount > 0 ? 'is-active' : '')}`}
                                                onClick={() => onOpenSpecsModal(item, idx)}
                                            >
                                                {templateType === 'MATRIX' ? (
                                                    <>
                                                        <FaThList size={11} className="spec-icon" />
                                                        <span className="spec-label">Matrix</span>
                                                        <span className="spec-badge-count">{configuredMatrixCount}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaCogs size={12} className="spec-icon" />
                                                        <span className="spec-label">Cards</span>
                                                        <span className="spec-badge-count">{configuredCardsCount}</span>
                                                    </>
                                                )}
                                            </button>
                                        </OverlayTrigger>
                                    </td>
                                    <td className="text-center">
                                        <div className="d-flex align-items-center justify-content-center gap-1.5">
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip id={`dup-tip-${idx}`}>Duplicate line item</Tooltip>}
                                            >
                                                <button
                                                    type="button"
                                                    className="table-action-btn copy-btn"
                                                    disabled={disabled}
                                                    onClick={() => handleDuplicateItem(idx)}
                                                    title="Duplicate line item"
                                                >
                                                    <FaCopy size={12} />
                                                </button>
                                            </OverlayTrigger>

                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip id={`del-tip-${idx}`}>{items.length <= 1 ? "At least one item required" : "Delete line item"}</Tooltip>}
                                            >
                                                <button
                                                    type="button"
                                                    className="table-action-btn delete-btn table-delete-btn"
                                                    disabled={disabled || items.length <= 1}
                                                    onClick={() => handleRemoveItem(idx)}
                                                    title={items.length <= 1 ? "At least one item required" : "Delete line item"}
                                                >
                                                    <FaTrashAlt size={12} />
                                                </button>
                                            </OverlayTrigger>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>

            {!disabled && (
                <div className="quotation-table-footer">
                    <div className="footer-actions d-flex align-items-center gap-2">
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleAddItem}
                            className="add-item-btn d-flex align-items-center gap-2"
                        >
                            <FaPlus size={11} />
                            <span>Add Commercial Item</span>
                        </Button>
                    </div>
                    <div className="footer-meta d-flex align-items-center gap-3">
                        <span className="footer-hint d-none d-md-flex align-items-center gap-1">
                            <FaInfoCircle size={13} className="text-danger flex-shrink-0" />
                            <span>Selecting from product master auto-populates drawings, dimensions, grade, and default annexure specs.</span>
                        </span>
                        <div className="items-summary-chips d-flex align-items-center gap-2">
                            <span className="summary-chip">
                                <strong>{items.length}</strong> {items.length === 1 ? 'Item' : 'Items'}
                            </span>
                            <span className="summary-chip qty-chip">
                                Qty: <strong>{totalQty.toLocaleString('en-IN')}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuotationItemsTable;
