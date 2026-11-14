import { useCallback, useMemo } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useProductUnit } from '../../dashboard/hooks/api.hooks';

/**
 * Custom hook to manage line items, calculations, unit options,
 * and array operations for Delivery Challan.
 */
export const useChallanItems = ({ control, setValue, getValues }) => {
    // 1. Fetch master product units from the global hook
    const { data: productUnits = [], isLoading: isLoadingUnits } = useProductUnit();

    // 2. React Hook Form Field Array
    const { fields, append, remove, insert } = useFieldArray({
        control,
        name: "items"
    });

    // 3. Live watch items for summary aggregates
    const watchedItems = useWatch({ control, name: "items" }) || [];

    // 4. Total Quantity & Total Approximate Transit Value
    const totalQty = useMemo(() => {
        return watchedItems.reduce((sum, it) => sum + (Number(it?.qty) || 0), 0);
    }, [watchedItems]);

    const totalApproxVal = useMemo(() => {
        return watchedItems.reduce((sum, it) => sum + (Number(it?.total) || 0), 0);
    }, [watchedItems]);

    // 5. Quantity / Rate live calculation handler
    const handleQtyOrRateChange = useCallback((index) => {
        const currentItems = getValues('items') || [];
        const item = currentItems[index];
        if (item) {
            const qty = Number(item.qty) || 0;
            const rate = Number(item.rate) || 0;
            const total = Number((qty * rate).toFixed(2));
            setValue(`items.${index}.total`, total, { shouldDirty: true });
        }
    }, [getValues, setValue]);

    // 6. Duplicate row handler
    const handleDuplicateRow = useCallback((index) => {
        const item = getValues(`items.${index}`);
        if (item) {
            insert(index + 1, { ...item, id: undefined });
        }
    }, [getValues, insert]);

    // 7. Add default empty row handler
    const handleAddItem = useCallback(() => {
        const defaultUnit = (productUnits && productUnits.length > 0 && productUnits[0].uqc) ? productUnits[0].uqc : 'Nos';
        append({
            itemName: '',
            description: '',
            hsnSacCode: '',
            qty: 1,
            unit: defaultUnit,
            rate: 0,
            total: 0
        });
    }, [append, productUnits]);

    // 8. Product selection handler from autocomplete
    const handleProductSelect = useCallback((index, product) => {
        if (!product) return;
        setValue(`items.${index}.productId`, product.id ? Number(product.id) : null, { shouldDirty: true });
        setValue(`items.${index}.itemName`, product.name || '', { shouldValidate: true, shouldDirty: true });

        // Auto-populate description / drawing info if available
        const descParts = [];
        if (product.drawingNumber) descParts.push(`DWG: ${product.drawingNumber}`);
        if (product.materialGrade) descParts.push(`Grade: ${product.materialGrade}`);
        if (product.dimensions) descParts.push(`Dim: ${product.dimensions}`);
        if (descParts.length > 0) {
            setValue(`items.${index}.description`, descParts.join(' | '), { shouldDirty: true });
        }

        if (product.hsnSacCode) {
            setValue(`items.${index}.hsnSacCode`, product.hsnSacCode, { shouldDirty: true });
        }

        if (product.unitName) {
            const matchedUnit = (productUnits || []).find(
                u => u.uqc?.toLowerCase() === product.unitName?.toLowerCase()
            );
            setValue(`items.${index}.unit`, matchedUnit ? matchedUnit.uqc : product.unitName, { shouldDirty: true });
        }

        const rate = Number(product.sellingPrice) || 0;
        setValue(`items.${index}.rate`, rate, { shouldValidate: true, shouldDirty: true });

        const currentQty = Number(getValues(`items.${index}.qty`)) || 1;
        const total = Number((currentQty * rate).toFixed(2));
        setValue(`items.${index}.total`, total, { shouldDirty: true });
    }, [setValue, getValues, productUnits]);

    return {
        fields,
        append,
        remove,
        insert,
        productUnits,
        isLoadingUnits,
        watchedItems,
        totalQty,
        totalApproxVal,
        handleQtyOrRateChange,
        handleDuplicateRow,
        handleAddItem,
        handleProductSelect
    };
};

export default useChallanItems;
