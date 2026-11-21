import { useCallback } from 'react';
import { calculateLineItemTotals } from './useProformaCalculation';

export const createBlankProformaItem = (idx = 0) => ({
    id: undefined,
    productId: null,
    itemName: '',
    description: '',
    drawingNumber: '',
    hsnSacCode: '',
    qty: 1,
    unit: 'Nos',
    rate: 0,
    discountPercent: 0,
    discountAmount: 0,
    subTotal: 0,
    taxableAmount: 0,
    taxRate: 18.00,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
    sortOrder: idx
});

/**
 * Custom hook to manage Proforma Invoice line items table state.
 */
export const useProformaItems = ({
    items = [],
    setItems,
    setValue,
    isInterState = false
}) => {
    const handleAddItem = useCallback(() => {
        setItems(prev => {
            const nextIdx = prev.length;
            const newItem = createBlankProformaItem(nextIdx);
            const nextList = [...prev, newItem];
            if (setValue) {
                setValue('items', nextList, { shouldDirty: true });
            }
            return nextList;
        });
    }, [setItems, setValue]);

    const handleRemoveItem = useCallback((index) => {
        setItems(prev => {
            if (prev.length <= 1) {
                // If only 1 item left, reset it to blank rather than having empty list
                const blank = [createBlankProformaItem(0)];
                if (setValue) setValue('items', blank, { shouldDirty: true });
                return blank;
            }
            const nextList = prev.filter((_, idx) => idx !== index);
            if (setValue) setValue('items', nextList, { shouldDirty: true });
            return nextList;
        });
    }, [setItems, setValue]);

    const handleItemChange = useCallback((index, field, value) => {
        const actualValue = (value && typeof value === 'object' && value.target !== undefined) ? value.target.value : value;

        setItems(prev => {
            const nextList = [...prev];
            const updatedRow = calculateLineItemTotals({
                ...nextList[index],
                [field]: actualValue
            }, isInterState);
            nextList[index] = updatedRow;

            if (setValue) {
                setValue(`items.${index}.${field}`, actualValue, { shouldValidate: false, shouldDirty: true });
                setValue(`items.${index}.subTotal`, updatedRow.subTotal, { shouldDirty: true });
                setValue(`items.${index}.taxableAmount`, updatedRow.taxableAmount, { shouldDirty: true });
                setValue(`items.${index}.cgst`, updatedRow.cgst, { shouldDirty: true });
                setValue(`items.${index}.sgst`, updatedRow.sgst, { shouldDirty: true });
                setValue(`items.${index}.igst`, updatedRow.igst, { shouldDirty: true });
                setValue(`items.${index}.total`, updatedRow.total, { shouldDirty: true });
                setValue('items', nextList, { shouldValidate: false, shouldDirty: true });
            }
            return nextList;
        });
    }, [setItems, setValue, isInterState]);


    const handleProductSelect = useCallback((index, product) => {
        if (!product) return;

        setItems(prev => {
            const nextList = [...prev];
            const row = nextList[index] || {};

            const name = product.name || product.itemName || '';
            const drawingNo = product.drawingNumber || product.drawing_number || '';
            const hsn = product.hsnSacCode || product.hsn_sac_code || '';
            const unit = product.unit || product.primaryUnit || 'Nos';
            const rate = parseFloat(product.standardRate || product.sales_rate || product.rate || row.rate || 0);
            const taxRate = parseFloat(product.taxRate || product.tax_rate || product.gstRate || 18.00);

            const updatedRow = calculateLineItemTotals({
                ...row,
                productId: product.id || null,
                itemName: name,
                description: product.description || '',
                drawingNumber: drawingNo,
                hsnSacCode: hsn,
                unit: unit,
                rate: rate,
                taxRate: taxRate
            }, isInterState);

            nextList[index] = updatedRow;

            if (setValue) {
                setValue(`items.${index}.productId`, product.id || null, { shouldDirty: true });
                setValue(`items.${index}.itemName`, name, { shouldValidate: true, shouldDirty: true });
                setValue(`items.${index}.description`, product.description || '', { shouldDirty: true });
                setValue(`items.${index}.drawingNumber`, drawingNo, { shouldDirty: true });
                setValue(`items.${index}.hsnSacCode`, hsn, { shouldDirty: true });
                setValue(`items.${index}.unit`, unit, { shouldDirty: true });
                setValue(`items.${index}.rate`, rate, { shouldValidate: true, shouldDirty: true });
                setValue(`items.${index}.taxRate`, taxRate, { shouldDirty: true });
                setValue(`items.${index}.subTotal`, updatedRow.subTotal, { shouldDirty: true });
                setValue(`items.${index}.taxableAmount`, updatedRow.taxableAmount, { shouldDirty: true });
                setValue(`items.${index}.cgst`, updatedRow.cgst, { shouldDirty: true });
                setValue(`items.${index}.sgst`, updatedRow.sgst, { shouldDirty: true });
                setValue(`items.${index}.igst`, updatedRow.igst, { shouldDirty: true });
                setValue(`items.${index}.total`, updatedRow.total, { shouldDirty: true });
                setValue('items', nextList, { shouldValidate: false, shouldDirty: true });
            }

            return nextList;
        });
    }, [setItems, setValue, isInterState]);

    return {
        handleAddItem,
        handleRemoveItem,
        handleItemChange,
        handleProductSelect
    };
};

export default useProformaItems;
