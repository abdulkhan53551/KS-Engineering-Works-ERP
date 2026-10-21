import React from 'react';
import { Table, Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus, FaTrashAlt, FaInfoCircle } from 'react-icons/fa';
import ProductAutocompleteInput from '../../products/components/ProductAutocompleteInput';

const ProformaItemsTable = ({
    items = [],
    onAddItem,
    onRemoveItem,
    onItemChange,
    onProductSelect,
    register,
    errors = {},
    disabled = false
}) => {
    return (
        <div className="proforma-items-table-wrapper">
            <div className="table-responsive border rounded bg-white shadow-sm mb-3">
                <Table hover className="align-middle mb-0 proforma-table">
                    <thead className="table-light text-uppercase font-size-11 tracking-wider text-muted border-bottom">
                        <tr>
                            <th style={{ width: '40px' }} className="text-center py-2.5">#</th>
                            <th style={{ minWidth: '280px' }} className="py-2.5">Item & Description <span className="text-danger">*</span></th>
                            <th style={{ width: '130px' }} className="py-2.5">Drawing No</th>
                            <th style={{ width: '100px' }} className="py-2.5">HSN/SAC</th>
                            <th style={{ width: '90px' }} className="text-end py-2.5">Qty <span className="text-danger">*</span></th>
                            <th style={{ width: '90px' }} className="py-2.5">Unit</th>
                            <th style={{ width: '110px' }} className="text-end py-2.5">Rate (₹) <span className="text-danger">*</span></th>
                            <th style={{ width: '85px' }} className="text-end py-2.5">Disc %</th>
                            <th style={{ width: '110px' }} className="text-end py-2.5">Taxable (₹)</th>
                            <th style={{ width: '85px' }} className="text-end py-2.5">GST %</th>
                            <th style={{ width: '120px' }} className="text-end py-2.5">Total (₹)</th>
                            <th style={{ width: '48px' }} className="text-center py-2.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((row, idx) => {
                            const rowError = errors?.items?.[idx] || {};
                            return (
                                <tr key={row.id || `item-row-${idx}`} className="proforma-item-row">
                                    <td className="text-center text-muted fw-semibold font-size-12">
                                        {idx + 1}
                                    </td>

                                    {/* Item name & product autocomplete */}
                                    <td>
                                        <div className="d-flex flex-column gap-1">
                                            <ProductAutocompleteInput
                                                value={row.itemName || ''}
                                                onChange={(e) => onItemChange(idx, 'itemName', e?.target ? e.target.value : (typeof e === 'string' ? e : ''))}
                                                onSelectProduct={(prod) => onProductSelect(idx, prod)}
                                                placeholder="Type or select product..."
                                                disabled={disabled}
                                                isInvalid={Boolean(rowError?.itemName)}
                                                errorMessage={rowError?.itemName?.message}
                                            />
                                            {rowError?.itemName && (
                                                <div className="text-danger font-size-11 mt-0.5">
                                                    {rowError.itemName.message || 'Line item name is required'}
                                                </div>
                                            )}
                                            <Form.Control
                                                as="textarea"
                                                rows={1}
                                                size="sm"
                                                placeholder="Optional item details / specifications..."
                                                value={row.description || ''}
                                                onChange={(e) => onItemChange(idx, 'description', e.target.value)}
                                                disabled={disabled}
                                                className="font-size-11 text-muted border-0 bg-light p-1 rounded"
                                                style={{ resize: 'vertical' }}
                                            />
                                        </div>
                                    </td>

                                    {/* Drawing Number */}
                                    <td>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            placeholder="DWG-001"
                                            value={row.drawingNumber || ''}
                                            onChange={(e) => onItemChange(idx, 'drawingNumber', e.target.value)}
                                            disabled={disabled}
                                            className="font-size-12"
                                        />
                                    </td>

                                    {/* HSN / SAC */}
                                    <td>
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            placeholder="8483"
                                            value={row.hsnSacCode || ''}
                                            onChange={(e) => onItemChange(idx, 'hsnSacCode', e.target.value)}
                                            disabled={disabled}
                                            className="font-size-12"
                                        />
                                    </td>

                                    {/* Qty */}
                                    <td>
                                        <Form.Control
                                            type="number"
                                            step="any"
                                            min="0"
                                            size="sm"
                                            value={row.qty ?? ''}
                                            onChange={(e) => onItemChange(idx, 'qty', e.target.value)}
                                            disabled={disabled}
                                            isInvalid={Boolean(rowError?.qty)}
                                            className="font-size-12 text-end"
                                        />
                                    </td>

                                    {/* Unit */}
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={row.unit || 'Nos'}
                                            onChange={(e) => onItemChange(idx, 'unit', e.target.value)}
                                            disabled={disabled}
                                            className="font-size-12"
                                        >
                                            <option value="Nos">Nos</option>
                                            <option value="Pcs">Pcs</option>
                                            <option value="Sets">Sets</option>
                                            <option value="Kg">Kg</option>
                                            <option value="Mtr">Mtr</option>
                                            <option value="Ton">Ton</option>
                                        </Form.Select>
                                    </td>

                                    {/* Rate */}
                                    <td>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            size="sm"
                                            value={row.rate ?? ''}
                                            onChange={(e) => onItemChange(idx, 'rate', e.target.value)}
                                            disabled={disabled}
                                            isInvalid={Boolean(rowError?.rate)}
                                            className="font-size-12 text-end"
                                        />
                                    </td>

                                    {/* Disc % */}
                                    <td>
                                        <Form.Control
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            size="sm"
                                            value={row.discountPercent ?? ''}
                                            onChange={(e) => onItemChange(idx, 'discountPercent', e.target.value)}
                                            disabled={disabled}
                                            className="font-size-12 text-end"
                                        />
                                    </td>

                                    {/* Taxable Amount */}
                                    <td className="text-end fw-semibold font-size-12 text-dark">
                                        ₹{Number(row.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>

                                    {/* Tax Rate % */}
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            value={row.taxRate !== undefined ? row.taxRate : 18}
                                            onChange={(e) => onItemChange(idx, 'taxRate', parseFloat(e.target.value))}
                                            disabled={disabled}
                                            className="font-size-12 text-end"
                                        >
                                            <option value="0">0%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </Form.Select>
                                    </td>

                                    {/* Total */}
                                    <td className="text-end fw-bold font-size-13 text-primary">
                                        ₹{Number(row.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>

                                    {/* Remove action */}
                                    <td className="text-center">
                                        <OverlayTrigger placement="top" overlay={<Tooltip>Remove Item</Tooltip>}>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="btn-icon p-1 rounded-circle"
                                                onClick={() => onRemoveItem(idx)}
                                                disabled={disabled || items.length <= 1}
                                                style={{ width: '26px', height: '26px', lineHeight: '1' }}
                                            >
                                                <FaTrashAlt size={10} />
                                            </Button>
                                        </OverlayTrigger>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>

            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onAddItem}
                    disabled={disabled}
                    className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-1.5 shadow-sm"
                >
                    <FaPlus size={12} /> Add Item Row
                </Button>
                <div className="text-muted font-size-12 d-flex align-items-center gap-1">
                    <FaInfoCircle size={12} className="text-info" />
                    <span>Rates and taxable amounts are calculated in real-time according to standard GST laws.</span>
                </div>
            </div>
        </div>
    );
};

export default ProformaItemsTable;
