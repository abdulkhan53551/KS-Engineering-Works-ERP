import { useFieldArray, useFormContext } from "react-hook-form";
import { MdAddBox } from "react-icons/md";
import InvoiceRow from "./InvoiceRow";
import { Table } from "react-bootstrap";

export default function InvoiceItemsTable({ productUnit, gstSlab }) {
    const { control } = useFormContext();
    const { fields, append, remove } = useFieldArray({ control, name: "items" });

    const defaultItem = {
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
    };

    return (
        <div className="table-responsive">
            <Table className='table-sortable' striped bordered hover responsive="xl">
                <thead className="text-center">
                    <tr className="ligth">
                        <th style={{ minWidth: '400px' }}>Description</th>
                        <th style={{ minWidth: '140px' }}>HSC/SAC</th>
                        <th style={{ minWidth: '150px' }}>Qty</th>
                        <th style={{ minWidth: '140px' }}>Unit</th>
                        <th style={{ minWidth: '200px' }}>Rate</th>
                        {/* <th>Discount %</th>
                                                     <th>Discount Amt</th> */}
                        <th style={{ minWidth: '200px' }}>Taxable Amt</th>
                        <th style={{ minWidth: '150px' }}>GST Slab</th>
                        <th style={{ minWidth: '190px' }}>CGST</th>
                        <th style={{ minWidth: '190px' }}>SGST</th>
                        <th style={{ minWidth: '210px' }}>Total</th>
                        <th style={{ padding: '0.3rem 0.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <MdAddBox
                                size={33}
                                color="green"
                                className="transition-colors"
                                onClick={() => append(defaultItem)}
                            />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field, index) => (
                        <InvoiceRow
                            key={field.id}
                            index={index}
                            remove={remove}
                            productUnit={productUnit}
                            gstSlab={gstSlab}
                        />
                    ))}
                </tbody>
            </Table>
        </div>
    );
}