import { memo } from "react";
import { Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useFormContext, useWatch } from "react-hook-form";
import { FaCopy, FaTrashAlt } from "react-icons/fa";
import ProductAutocompleteInput from "../../products/components/ProductAutocompleteInput";

const InvoiceRow = ({
    index,
    remove,
    onDuplicate,
    totalRows,
    productUnit,
    gstSlab,
    lastEditedFieldRef,
    isInterState = false
}) => {
    const { register, setValue, control, formState: { errors } } = useFormContext();
    // Consolidated single scoped row watch (replaces 7 separate observers per row)
    const rowItem = useWatch({ control, name: `items.${index}` }) || {};
    const descriptionValue = rowItem.description;
    const watchedSubTotal = rowItem.subTotal;
    const watchedTaxableAmount = rowItem.taxableAmount;
    const watchedCgst = rowItem.cgst;
    const watchedSgst = rowItem.sgst;
    const watchedIgst = rowItem.igst;
    const watchedTotal = rowItem.total;

    const formatIndianNumber = (val) => {
        if (val === undefined || val === null || val === "" || isNaN(Number(val))) return "0.00";
        return Number(val).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const isSingleRow = totalRows <= 1;

    const handleSelectProduct = (product) => {
        if (!product) return;
        setValue(`items.${index}.productId`, product.id || null, { shouldDirty: true });
        setValue(`items.${index}.description`, product.name || '', { shouldValidate: true, shouldDirty: true });
        setValue(`items.${index}.hsnSacCode`, product.hsnSacCode || '', { shouldValidate: true, shouldDirty: true });
        setValue(`items.${index}.rate`, Number(product.sellingPrice || 0).toFixed(2), { shouldValidate: true, shouldDirty: true });
        if (product.itemUnitId) {
            setValue(`items.${index}.itemUnitId`, product.itemUnitId, { shouldValidate: true, shouldDirty: true });
        }
        if (product.gstSlabId) {
            setValue(`items.${index}.gstSlabId`, product.gstSlabId, { shouldValidate: true, shouldDirty: true });
        }
        if (lastEditedFieldRef) {
            lastEditedFieldRef.current = "product_select";
        }
    };

    return (
        <tr className="align-middle invoice-table-row">
            {/* Index # Column */}
            <td className="text-center" style={{ width: '42px', minWidth: '42px' }}>
                <span className="line-item-index" title={`Line Item #${index + 1}`}>
                    {index + 1}
                </span>
            </td>

            {/* Description with Product Autocomplete */}
            <td style={{ minWidth: '260px' }}>
                <ProductAutocompleteInput
                    value={descriptionValue}
                    onChange={(e) => {
                        setValue(`items.${index}.description`, e.target.value, { shouldValidate: true, shouldDirty: true });
                        if (lastEditedFieldRef) {
                            lastEditedFieldRef.current = "description";
                        }
                    }}
                    onClear={() => {
                        setValue(`items.${index}.productId`, null, { shouldDirty: true });
                        setValue(`items.${index}.description`, '', { shouldValidate: true, shouldDirty: true });
                        if (lastEditedFieldRef) {
                            lastEditedFieldRef.current = "description";
                        }
                    }}
                    onSelectProduct={handleSelectProduct}
                    placeholder="Enter or search item / service..."
                    isInvalid={!!errors.items?.[index]?.description}
                    errorMessage={errors.items?.[index]?.description?.message}
                />
            </td>

            {/* HSN/SAC */}
            <td style={{ width: '105px', minWidth: '95px' }}>
                <Form.Control
                    size="sm"
                    type="text"
                    placeholder="HSN/SAC"
                    className="text-center font-monospace"
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    isInvalid={!!errors.items?.[index]?.hsnSacCode}
                    {...register(`items.${index}.hsnSacCode`, {
                        onChange: () => {
                            lastEditedFieldRef.current = "hsn";
                        }
                    })}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.hsnSacCode?.message}</Form.Control.Feedback>
            </td>

            {/* Quantity */}
            <td style={{ width: '90px', minWidth: '80px' }}>
                <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Qty"
                    className="text-end font-monospace"
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    isInvalid={!!errors.items?.[index]?.qty}
                    {...register(`items.${index}.qty`)}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.qty?.message}</Form.Control.Feedback>
            </td>

            {/* Unit */}
            <td style={{ width: '110px', minWidth: '95px' }}>
                <Form.Select
                    size="sm"
                    name="itemUnitId"
                    className="text-center"
                    isInvalid={!!errors.items?.[index]?.itemUnitId}
                    {...register(`items.${index}.itemUnitId`)}
                >
                    <option value="">-- Unit --</option>
                    {productUnit.map((item) => (
                        <option key={item.id} value={item.id}>{item.uqc}</option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.itemUnitId?.message}</Form.Control.Feedback>
            </td>

            {/* Rate (₹) */}
            <td style={{ width: '135px', minWidth: '120px' }}>
                <Form.Control
                    size="sm"
                    type="text"
                    placeholder="0.00"
                    className="text-end font-monospace"
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    isInvalid={!!errors.items?.[index]?.rate}
                    {...register(`items.${index}.rate`, {
                        onBlur: (e) => {
                            const val = e.target.value;
                            if (val !== '' && val !== null && val !== undefined && !Number.isNaN(Number(val))) {
                                setValue(`items.${index}.rate`, Number(val).toFixed(2), { shouldValidate: true });
                            }
                        }
                    })}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.rate?.message}</Form.Control.Feedback>
            </td>

            {/* Sub Total (Formatted with Indian separator) */}
            <td style={{ width: '135px', minWidth: '125px' }} title={`Sub Total: ₹ ${formatIndianNumber(watchedSubTotal)}`}>
                <input type="hidden" {...register(`items.${index}.subTotal`)} />
                <Form.Control
                    size="sm"
                    type="text"
                    placeholder="0.00"
                    value={formatIndianNumber(watchedSubTotal)}
                    className="form-control-readonly-calculated"
                    readOnly={true}
                    tabIndex={0}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    title={`Sub Total: ₹ ${formatIndianNumber(watchedSubTotal)} (Click to select & copy)`}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.subTotal?.message}</Form.Control.Feedback>
            </td>

            {/* GST Slab */}
            <td style={{ width: '105px', minWidth: '95px' }}>
                <Form.Select
                    size="sm"
                    name="gstSlabId"
                    className="text-center"
                    isInvalid={!!errors.items?.[index]?.gstSlabId}
                    {...register(`items.${index}.gstSlabId`)}
                >
                    <option value="">-- GST --</option>
                    {gstSlab.map((item) => (
                        <option key={item.id} value={item.id}>{item.gstRate}%</option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.gstSlabId?.message}</Form.Control.Feedback>
            </td>

            {/* Taxable Amount (Formatted with Indian separator) */}
            <td style={{ width: '135px', minWidth: '125px' }} title={`Taxable Amount: ₹ ${formatIndianNumber(watchedTaxableAmount)}`}>
                <input type="hidden" {...register(`items.${index}.taxableAmount`)} />
                <Form.Control
                    size="sm"
                    type="text"
                    placeholder="0.00"
                    value={formatIndianNumber(watchedTaxableAmount)}
                    className="form-control-readonly-calculated"
                    readOnly={true}
                    tabIndex={0}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    title={`Taxable Amount: ₹ ${formatIndianNumber(watchedTaxableAmount)} (Click to select & copy)`}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.taxableAmount?.message}</Form.Control.Feedback>
            </td>

            {/* Tax Columns: CGST + SGST (Intra-State) or IGST (Inter-State) */}
            {!isInterState ? (
                <>
                    {/* CGST */}
                    <td style={{ width: '115px', minWidth: '105px' }} title={`CGST: ₹ ${formatIndianNumber(watchedCgst)}`}>
                        <input type="hidden" {...register(`items.${index}.cgst`)} />
                        <Form.Control
                            size="sm"
                            type="text"
                            placeholder="0.00"
                            value={formatIndianNumber(watchedCgst)}
                            className="form-control-readonly-calculated tax-cell"
                            readOnly={true}
                            tabIndex={0}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            title={`CGST: ₹ ${formatIndianNumber(watchedCgst)} (Click to select & copy)`}
                        />
                        <Form.Control.Feedback type="invalid">{errors.items?.[index]?.cgst?.message}</Form.Control.Feedback>
                    </td>

                    {/* SGST */}
                    <td style={{ width: '115px', minWidth: '105px' }} title={`SGST: ₹ ${formatIndianNumber(watchedSgst)}`}>
                        <input type="hidden" {...register(`items.${index}.sgst`)} />
                        <Form.Control
                            size="sm"
                            type="text"
                            placeholder="0.00"
                            value={formatIndianNumber(watchedSgst)}
                            className="form-control-readonly-calculated tax-cell"
                            readOnly={true}
                            tabIndex={0}
                            onFocus={(e) => e.target.select()}
                            onClick={(e) => e.target.select()}
                            title={`SGST: ₹ ${formatIndianNumber(watchedSgst)} (Click to select & copy)`}
                        />
                        <Form.Control.Feedback type="invalid">{errors.items?.[index]?.sgst?.message}</Form.Control.Feedback>
                    </td>
                </>
            ) : (
                /* IGST */
                <td style={{ width: '130px', minWidth: '115px' }} title={`IGST: ₹ ${formatIndianNumber(watchedIgst)}`}>
                    <input type="hidden" {...register(`items.${index}.igst`)} />
                    <Form.Control
                        size="sm"
                        type="text"
                        placeholder="0.00"
                        value={formatIndianNumber(watchedIgst)}
                        className="form-control-readonly-calculated tax-cell"
                        readOnly={true}
                        tabIndex={0}
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.target.select()}
                        title={`IGST: ₹ ${formatIndianNumber(watchedIgst)} (Click to select & copy)`}
                    />
                    <Form.Control.Feedback type="invalid">{errors.items?.[index]?.igst?.message}</Form.Control.Feedback>
                </td>
            )}

            {/* Total (Formatted with Indian separator) */}
            <td style={{ width: '150px', minWidth: '140px' }} title={`Line Total: ₹ ${formatIndianNumber(watchedTotal)}`}>
                <input type="hidden" {...register(`items.${index}.total`)} />
                <Form.Control
                    size="sm"
                    type="text"
                    placeholder="0.00"
                    value={formatIndianNumber(watchedTotal)}
                    className="form-control-readonly-calculated total-cell"
                    readOnly={true}
                    tabIndex={0}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    title={`Line Total: ₹ ${formatIndianNumber(watchedTotal)} (Click to select & copy)`}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.total?.message}</Form.Control.Feedback>
            </td>

            {/* Actions: Duplicate & Delete */}
            <td style={{ width: '65px', minWidth: '65px' }} className="text-center">
                <div className="d-flex align-items-center justify-content-center gap-1">
                    {/* Duplicate Row */}
                    <OverlayTrigger placement="top" overlay={<Tooltip>Duplicate Row</Tooltip>}>
                        <button
                            type="button"
                            className="btn-row-action btn-row-duplicate"
                            onClick={() => onDuplicate && onDuplicate(index)}
                            title="Duplicate Row"
                        >
                            <FaCopy size={12} />
                        </button>
                    </OverlayTrigger>

                    {/* Delete Row */}
                    <OverlayTrigger placement="top" overlay={<Tooltip>{isSingleRow ? "Cannot remove single item" : "Delete Row"}</Tooltip>}>
                        <span>
                            <button
                                type="button"
                                className={`btn-row-action btn-row-delete ${isSingleRow ? 'disabled' : ''}`}
                                onClick={() => !isSingleRow && remove(index)}
                                disabled={isSingleRow}
                                title={isSingleRow ? "Cannot delete the only row" : "Delete Row"}
                            >
                                <FaTrashAlt size={12} />
                            </button>
                        </span>
                    </OverlayTrigger>
                </div>
            </td>
        </tr>
    );
};

export default memo(InvoiceRow);