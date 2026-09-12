import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { MdAddBox } from "react-icons/md";
import { FaPlus } from "react-icons/fa";
import InvoiceRow from "./InvoiceRow";
import { Table, Button } from "react-bootstrap";
import { useMemo, useCallback } from "react";

export default function InvoiceItemsTable({ productUnit, gstSlab, lastEditedFieldRef, isInterState = false }) {
    const { control, getValues } = useFormContext();
    const { fields, append, remove, insert } = useFieldArray({ control, name: "items" });

    // Watch items to calculate total quantity in summary bar
    const watchedItems = useWatch({ control, name: "items" }) || [];

    const totalQty = useMemo(() => {
        return watchedItems.reduce((acc, item) => acc + (Number(item?.qty) || 0), 0);
    }, [watchedItems]);

    const defaultItem = useMemo(() => ({
        description: "",
        hsnSacCode: "",
        qty: 1,
        itemUnitId: null,
        rate: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 0,
        gstSlabId: null,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
    }), []);

    const handleDuplicateRow = useCallback((index) => {
        const itemToDuplicate = getValues(`items.${index}`);
        if (itemToDuplicate) {
            insert(index + 1, {
                ...itemToDuplicate,
                description: itemToDuplicate.description ? `${itemToDuplicate.description}` : "",
            });
        }
    }, [getValues, insert]);

    return (
        <div className="invoice-items-wrapper">
            <div className="table-responsive">
                <Table className="table-sortable align-middle mb-0" striped bordered hover responsive="xl">
                    <thead className="text-center bg-light">
                        <tr className="light">
                            <th style={{ width: '40px', minWidth: '40px' }} className="py-2">#</th>
                            <th style={{ minWidth: '280px' }} className="py-2">Description</th>
                            <th style={{ width: '130px', minWidth: '120px' }} className="py-2">HSN/SAC</th>
                            <th style={{ width: '130px', minWidth: '120px' }} className="py-2">Qty</th>
                            <th style={{ width: '150px', minWidth: '140px' }} className="py-2">Unit</th>
                            <th style={{ width: '160px', minWidth: '150px' }} className="py-2">Rate (₹)</th>
                            <th style={{ width: '150px', minWidth: '140px' }} className="py-2">Sub Total (₹)</th>
                            <th style={{ width: '140px', minWidth: '130px' }} className="py-2">GST Slab</th>
                            <th style={{ width: '150px', minWidth: '140px' }} className="py-2">Taxable Amt (₹)</th>
                            {!isInterState ? (
                                <>
                                    <th style={{ width: '130px', minWidth: '120px' }} className="py-2">CGST (₹)</th>
                                    <th style={{ width: '130px', minWidth: '120px' }} className="py-2">SGST (₹)</th>
                                </>
                            ) : (
                                <th style={{ width: '160px', minWidth: '140px' }} className="py-2">IGST (₹)</th>
                            )}
                            <th style={{ width: '180px', minWidth: '170px' }} className="py-2">Total (₹)</th>
                            <th style={{ width: '65px', minWidth: '65px', padding: '0.4rem 0.1rem' }} className="text-center py-2">
                                <span title="Add New Row" className="cursor-pointer" onClick={() => append(defaultItem)}>
                                    <MdAddBox
                                        size={26}
                                        className="text-success cursor-pointer hover-scale transition-transform"
                                    />
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map((field, index) => (
                            <InvoiceRow
                                key={field.id}
                                index={index}
                                remove={remove}
                                onDuplicate={handleDuplicateRow}
                                totalRows={fields.length}
                                productUnit={productUnit}
                                gstSlab={gstSlab}
                                lastEditedFieldRef={lastEditedFieldRef}
                                isInterState={isInterState}
                            />
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* Table Footer Action & Summary Bar */}
            <div className="d-flex flex-wrap justify-content-between align-items-center bg-light border border-top-0 p-2 rounded-bottom">
                <Button
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center gap-2 fw-medium px-3 py-1 shadow-none"
                    onClick={() => append(defaultItem)}
                >
                    <FaPlus size={12} /> Add Line Item
                </Button>

                <div className="d-flex align-items-center gap-3 text-muted small">
                    <span>
                        Total Items: <strong className="text-dark">{fields.length}</strong>
                    </span>
                    <span className="border-start ps-3">
                        Total Quantity: <strong className="text-dark">{totalQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}