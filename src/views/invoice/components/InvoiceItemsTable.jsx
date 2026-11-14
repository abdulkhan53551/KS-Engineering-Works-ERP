import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { MdAddBox } from "react-icons/md";
import { FaPlus } from "react-icons/fa";
import InvoiceRow from "./InvoiceRow";
import { Table } from "react-bootstrap";
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
            <div className="invoice-table-scroll-container">
                <Table className="table-sortable align-middle mb-0" striped bordered hover>
                    <thead>
                        <tr className="invoice-table-header-row">
                            <th style={{ width: '42px', minWidth: '42px' }} className="py-2 text-center">#</th>
                            <th style={{ minWidth: '260px' }} className="py-2 text-start ps-3">
                                Description <span className="text-danger">*</span>
                            </th>
                            <th style={{ width: '105px', minWidth: '95px' }} className="py-2 text-center">HSN/SAC</th>
                            <th style={{ width: '90px', minWidth: '80px' }} className="py-2 text-end pe-2">
                                Qty <span className="text-danger">*</span>
                            </th>
                            <th style={{ width: '110px', minWidth: '95px' }} className="py-2 text-center">
                                Unit <span className="text-danger">*</span>
                            </th>
                            <th style={{ width: '135px', minWidth: '120px' }} className="py-2 text-end pe-2">
                                Rate (₹) <span className="text-danger">*</span>
                            </th>
                            <th style={{ width: '135px', minWidth: '125px' }} className="py-2 text-end pe-2">
                                Sub Total (₹) <span className="th-badge-auto">Auto</span>
                            </th>
                            <th style={{ width: '105px', minWidth: '95px' }} className="py-2 text-center">
                                GST Slab <span className="text-danger">*</span>
                            </th>
                            <th style={{ width: '135px', minWidth: '125px' }} className="py-2 text-end pe-2">
                                Taxable (₹) <span className="th-badge-auto">Auto</span>
                            </th>
                            {!isInterState ? (
                                <>
                                    <th style={{ width: '115px', minWidth: '105px' }} className="py-2 text-end pe-2">
                                        CGST (₹) <span className="th-badge-auto">Auto</span>
                                    </th>
                                    <th style={{ width: '115px', minWidth: '105px' }} className="py-2 text-end pe-2">
                                        SGST (₹) <span className="th-badge-auto">Auto</span>
                                    </th>
                                </>
                            ) : (
                                <th style={{ width: '130px', minWidth: '115px' }} className="py-2 text-end pe-2">
                                    IGST (₹) <span className="th-badge-auto">Auto</span>
                                </th>
                            )}
                            <th style={{ width: '150px', minWidth: '140px' }} className="py-2 text-end pe-3">
                                Total (₹) <span className="th-badge-calc">Total</span>
                            </th>
                            <th style={{ width: '65px', minWidth: '65px', padding: '0.4rem 0.1rem' }} className="text-center py-2">
                                <span title="Add New Item Row" className="cursor-pointer" onClick={() => append(defaultItem)}>
                                    <MdAddBox
                                        size={22}
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

            {/* Table Footer Action & Summary Toolbar */}
            <div className="invoice-table-footer-toolbar">
                <div className="d-flex align-items-center gap-2">
                    <button
                        type="button"
                        className="btn-add-line-row"
                        onClick={() => append(defaultItem)}
                        title="Add another line item to this invoice"
                    >
                        <span className="btn-icon-wrap">
                            <FaPlus size={10} />
                        </span>
                        <span className="btn-text">Add Line Item</span>
                    </button>
                </div>

                <div className="table-footer-stats">
                    <div className="stat-pill" title="Total number of line items">
                        <span className="stat-label">Items:</span>
                        <span className="stat-value">{fields.length}</span>
                    </div>
                    <div className="stat-pill highlight" title="Sum of all quantities">
                        <span className="stat-label">Total Qty:</span>
                        <span className="stat-value font-monospace">
                            {totalQty.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}