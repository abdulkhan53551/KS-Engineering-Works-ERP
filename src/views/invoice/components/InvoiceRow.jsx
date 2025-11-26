import { useEffect } from "react";
import { Form } from "react-bootstrap";
import { useFormContext, useWatch } from "react-hook-form";
import { FaWindowClose } from "react-icons/fa";

export default function InvoiceRow({ index, remove, productUnit, gstSlab }) {
    const { control, register, setValue, formState: { errors }, } = useFormContext();
    const row = useWatch({ control, name: `items.${index}` });

    useEffect(() => {
        if (!row) return;

        const qty = Number(row.qty) || 0;
        const rate = Number(row.rate) || 0;
        const gstSlabId = row.gstSlabId;
        const gst = Number(getGstRate(gstSlabId)) || 0;

        const taxable = qty * rate;
        const gstAmt = (taxable * gst) / 100;

        const cgst = gstAmt / 2;
        const sgst = gstAmt / 2;

        const total = taxable + gstAmt;

        setValue(`items.${index}.taxableAmount`, taxable.toFixed(2), { shouldDirty: true });
        setValue(`items.${index}.cgst`, cgst.toFixed(2), { shouldDirty: true });
        setValue(`items.${index}.sgst`, sgst.toFixed(2), { shouldDirty: true });
        setValue(`items.${index}.total`, total.toFixed(2), { shouldDirty: true });

    }, [row?.qty, row?.rate, row?.gstSlabId]);

    const getGstRate = (gstSlabId) => {
        const slab = gstSlab.find((s) => s.id == gstSlabId);
        return slab ? slab.gstRate : 0;
    };

    return (
        <tr>
            <td>
                <Form.Control type="text" name='description' id="description" placeholder="Item Description" isInvalid={!!errors.items?.[index]?.description} {...register(`items.${index}.description`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.description?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Control type="text" name='hsnSacCode' id="hsnSacCode" placeholder="HSC/SAC Code" isInvalid={!!errors.items?.[index]?.hsnSacCode} {...register(`items.${index}.hsnSacCode`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.hsnSacCode?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Control type="text" name='qty' id="qty" placeholder="Qty" className="text-end" isInvalid={!!errors.items?.[index]?.qty} {...register(`items.${index}.qty`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.qty?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Select name="itemUnitId" id="itemUnitId" isInvalid={!!errors.items?.[index]?.itemUnitId} {...register(`items.${index}.itemUnitId`)}>
                    <option value="">--Select Unit--</option>
                    {productUnit.map((item) => (<option key={item.id} value={item.id}>{item.uqc}</option>))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.itemUnitId?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Control type="text" name='rate' id="rate" placeholder="Rate" className="text-end" isInvalid={!!errors.items?.[index]?.rate} {...register(`items.${index}.rate`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.rate?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Control type="text" name='taxableAmount' id="taxableAmount" placeholder="Taxable Amt" className="text-end" isInvalid={!!errors.items?.[index]?.taxableAmount} {...register(`items.${index}.taxableAmount`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.taxableAmount?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Select name="gstSlabId" id="gstSlabId" isInvalid={!!errors.items?.[index]?.gstSlabId} {...register(`items.${index}.gstSlabId`)}>
                    <option value="">--GST--</option>
                    {gstSlab.map((item) => (<option key={item.id} value={item.id}>{item.gstRate}</option>))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.gstSlabId?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Control type="text" name='cgst' id="cgst" placeholder="Qty" className="text-end" disabled={true} isInvalid={!!errors.items?.[index]?.cgst} {...register(`items.${index}.cgst`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.cgst?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Control type="text" name='sgst' id="sgst" placeholder="Qty" className="text-end" disabled={true} isInvalid={!!errors.items?.[index]?.sgst} {...register(`items.${index}.sgst`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.sgst?.message}</Form.Control.Feedback>
            </td>
            <td>
                <Form.Control type="text" name='total' id="total" placeholder="Qty" className="text-end" disabled={true} isInvalid={!!errors.items?.[index]?.total} {...register(`items.${index}.total`)} />
                <Form.Control.Feedback type="invalid">{errors.items?.[index]?.total?.message}</Form.Control.Feedback>
            </td>
            <td>
                <FaWindowClose
                    size={22}
                    color="#bb2124"
                    className="transition-colors cursor-pointer"
                    style={{ cursor: 'pointer', transition: 'color 0.2s ease' }}
                    onClick={() => {
                        if (index > 0) {
                            remove(index);
                        }
                    }}
                />
            </td>
        </tr>
    );
}