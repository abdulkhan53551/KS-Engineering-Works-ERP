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
    lastEditedFieldRef
}) => {
    const { register, setValue, control, formState: { errors } } = useFormContext();
    const descriptionValue = useWatch({ control, name: `items.${index}.description` });

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
        <tr className="align-middle">
            {/* Index # Column */}
            <td className="text-center fw-semibold text-muted" style={{ width: '40px', minWidth: '40px', fontSize: '0.85rem' }}>
                <span className="badge bg-light text-dark border px-2 py-1">
                    {index + 1}
                </span>
            </td>

            {/* Description with Product Autocomplete */}
            <td style={{ minWidth: '280px' }}>
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
            <td style={{ width: '130px', minWidth: '120px' }}>
                <Form.Control
                    type="text"
                    placeholder="HSN/SAC"
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
            <td style={{ width: '130px', minWidth: '120px' }}>
                <Form.Control
                    type="text"
                    placeholder="Qty"
                    className="text-end"
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => e.target.select()}
                    isInvalid={!!errors.items?.[index]?.qty}
                    {...register(`items.${index}.qty`)}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.qty?.message}</Form.Control.Feedback>
            </td>

            {/* Unit */}
            <td style={{ width: '150px', minWidth: '140px' }}>
                <Form.Select
                    name="itemUnitId"
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

            {/* Rate */}
            <td style={{ width: '160px', minWidth: '150px' }}>
                <Form.Control
                    type="text"
                    placeholder="Rate"
                    className="text-end"
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

            {/* Sub Total */}
            <td style={{ width: '150px', minWidth: '140px' }}>
                <Form.Control
                    type="text"
                    placeholder="Sub Total"
                    className="text-end bg-light fw-medium"
                    disabled={true}
                    isInvalid={!!errors.items?.[index]?.subTotal}
                    {...register(`items.${index}.subTotal`)}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.subTotal?.message}</Form.Control.Feedback>
            </td>

            {/* GST Slab */}
            <td style={{ width: '140px', minWidth: '130px' }}>
                <Form.Select
                    name="gstSlabId"
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

            {/* Taxable Amount */}
            <td style={{ width: '150px', minWidth: '140px' }}>
                <Form.Control
                    type="text"
                    placeholder="Taxable Amt"
                    className="text-end bg-light"
                    disabled={true}
                    isInvalid={!!errors.items?.[index]?.taxableAmount}
                    {...register(`items.${index}.taxableAmount`)}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.taxableAmount?.message}</Form.Control.Feedback>
            </td>

            {/* CGST */}
            <td style={{ width: '130px', minWidth: '120px' }}>
                <Form.Control
                    type="text"
                    placeholder="CGST"
                    className="text-end bg-light text-muted"
                    disabled={true}
                    isInvalid={!!errors.items?.[index]?.cgst}
                    {...register(`items.${index}.cgst`)}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.cgst?.message}</Form.Control.Feedback>
            </td>

            {/* SGST */}
            <td style={{ width: '130px', minWidth: '120px' }}>
                <Form.Control
                    type="text"
                    placeholder="SGST"
                    className="text-end bg-light text-muted"
                    disabled={true}
                    isInvalid={!!errors.items?.[index]?.sgst}
                    {...register(`items.${index}.sgst`)}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.sgst?.message}</Form.Control.Feedback>
            </td>

            {/* Total */}
            <td style={{ width: '180px', minWidth: '170px' }}>
                <Form.Control
                    type="text"
                    placeholder="Total"
                    className="text-end bg-light fw-bold text-dark"
                    disabled={true}
                    isInvalid={!!errors.items?.[index]?.total}
                    {...register(`items.${index}.total`)}
                />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.total?.message}</Form.Control.Feedback>
            </td>

            {/* Actions: Compact Clone & Delete */}
            <td style={{ width: '65px', minWidth: '65px', padding: '0.4rem 0.1rem' }} className="text-center">
                <div className="d-flex align-items-center justify-content-center gap-1">
                    {/* Duplicate Row */}
                    <OverlayTrigger placement="top" overlay={<Tooltip>Duplicate Row</Tooltip>}>
                        <button
                            type="button"
                            className="btn btn-sm p-1 border-0 rounded text-primary hover-scale"
                            onClick={() => onDuplicate && onDuplicate(index)}
                            title="Duplicate Row"
                            style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <FaCopy size={13} />
                        </button>
                    </OverlayTrigger>

                    {/* Delete Row */}
                    <OverlayTrigger placement="top" overlay={<Tooltip>{isSingleRow ? "Cannot remove single item" : "Delete Row"}</Tooltip>}>
                        <span>
                            <button
                                type="button"
                                className={`btn btn-sm p-1 border-0 rounded ${isSingleRow ? 'text-muted opacity-25' : 'text-danger hover-scale'}`}
                                onClick={() => !isSingleRow && remove(index)}
                                disabled={isSingleRow}
                                title={isSingleRow ? "Cannot delete the only row" : "Delete Row"}
                                style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <FaTrashAlt size={13} />
                            </button>
                        </span>
                    </OverlayTrigger>
                </div>
            </td>
        </tr>
    );
};

export default memo(InvoiceRow);