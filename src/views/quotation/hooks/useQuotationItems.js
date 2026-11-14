import { useState, useCallback } from 'react';
import { calculateLineItemTotals } from './useQuotationCalculation';

/**
 * Creates default technical specification annexure template for an engineering item.
 */
export const createDefaultItemAnnexure = ({
    drawingNo = '',
    materialGrade = '',
    dimensions = '',
    unitWeight = null,
    rate = 0
} = {}) => ({
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
});

/**
 * Creates a blank new item line with default values.
 */
export const createEmptyItem = (index = 0, isInterState = false) => {
    return calculateLineItemTotals({
        itemName: '',
        drawingNumber: '',
        hsnSacCode: '',
        qty: 1,
        unit: 'Nos',
        rate: 0,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: 18.00,
        sortOrder: index
    }, isInterState);
};

/**
 * Custom hook to manage Quotation line items (Add, Remove, Duplicate, Field Change, Product Select, and Annexure Specs).
 * 
 * @param {Object} params
 * @param {Array} params.initialItems
 * @param {boolean} params.isInterState
 * @param {Function} params.setValue
 * @param {Function} [params.clearErrors]
 * @returns {{ items: Array, setItems: Function, handleAddItem: Function, handleRemoveItem: Function, handleDuplicateItem: Function, handleItemChange: Function, handleProductSelect: Function, handleUpdateItemAnnexure: Function }}
 */
export const useQuotationItems = ({
    initialItems = [],
    isInterState = false,
    setValue,
    clearErrors
}) => {
    const [items, setItems] = useState(() => {
        if (Array.isArray(initialItems) && initialItems.length > 0) {
            return initialItems;
        }
        return [createEmptyItem(0, isInterState)];
    });

    // Add new item row
    const handleAddItem = useCallback(() => {
        setItems(prev => {
            const newIdx = prev.length;
            const newItem = createEmptyItem(newIdx, isInterState);
            const next = [...prev, newItem];

            if (clearErrors) {
                clearErrors(`items.${newIdx}`);
                clearErrors('items');
            }
            if (setValue) {
                setValue('items', next, { shouldValidate: false, shouldDirty: true });
            }
            return next;
        });
    }, [isInterState, setValue, clearErrors]);

    // Remove item row
    const handleRemoveItem = useCallback((idx) => {
        setItems(prev => {
            if (prev.length <= 1) {
                // If only 1 item left, reset it instead of removing
                const resetItem = createEmptyItem(0, isInterState);
                const next = [resetItem];
                if (setValue) setValue('items', next, { shouldValidate: false, shouldDirty: true });
                return next;
            }
            const next = prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i }));
            if (setValue) setValue('items', next, { shouldValidate: false, shouldDirty: true });
            return next;
        });
    }, [isInterState, setValue]);

    // Duplicate item row
    const handleDuplicateItem = useCallback((idx) => {
        setItems(prev => {
            const source = prev[idx];
            if (!source) return prev;
            const cloned = {
                ...source,
                id: undefined, // remove backend id for new row
                itemName: source.itemName ? `${source.itemName} (Copy)` : '',
                sortOrder: prev.length
            };
            const next = [...prev, calculateLineItemTotals(cloned, isInterState)];
            if (setValue) setValue('items', next, { shouldValidate: false, shouldDirty: true });
            return next;
        });
    }, [isInterState, setValue]);

    // Update single field in item row
    const handleItemChange = useCallback((idx, field, value) => {
        setItems(prev => {
            const next = [...prev];
            if (!next[idx]) return prev;

            const updated = calculateLineItemTotals({
                ...next[idx],
                [field]: value
            }, isInterState);

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
    }, [isInterState, setValue]);

    // Auto-fill item row from product master selection
    const handleProductSelect = useCallback((idx, prod) => {
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
            if (!next[idx]) return prev;

            const defaultAnnex = createDefaultItemAnnexure({
                drawingNo,
                materialGrade,
                dimensions,
                unitWeight,
                rate
            });

            const chosenAnnex = next[idx].annexureData || next[idx].annexure_data || defaultAnnex;

            const updated = calculateLineItemTotals({
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
            }, isInterState);

            next[idx] = updated;

            if (setValue) {
                setValue(`items.${idx}.productId`, prod.id || null, { shouldDirty: true });
                setValue(`items.${idx}.itemName`, updated.itemName, { shouldValidate: false, shouldDirty: true });
                setValue(`items.${idx}.drawingNumber`, updated.drawingNumber, { shouldDirty: true });
                setValue(`items.${idx}.hsnSacCode`, updated.hsnSacCode, { shouldDirty: true });
                setValue(`items.${idx}.rate`, updated.rate, { shouldValidate: false, shouldDirty: true });
                setValue(`items.${idx}.unit`, updated.unit, { shouldDirty: true });
                setValue(`items.${idx}.taxRate`, updated.taxRate, { shouldDirty: true });
                setValue(`items.${idx}.taxableAmount`, updated.taxableAmount, { shouldDirty: true });
                setValue(`items.${idx}.total`, updated.total, { shouldDirty: true });
                setValue('items', next, { shouldValidate: false, shouldDirty: true });
                if (clearErrors) {
                    clearErrors(`items.${idx}`);
                }
            }
            return next;
        });
    }, [isInterState, setValue, clearErrors]);

    // Save updated technical specifications / annexure data for item
    const handleUpdateItemAnnexure = useCallback((idx, updatedAnnexureData) => {
        if (idx === null || idx === undefined) return;
        setItems(prev => {
            const next = [...prev];
            if (!next[idx]) return prev;
            next[idx] = {
                ...next[idx],
                annexureData: updatedAnnexureData,
                annexure_data: updatedAnnexureData
            };
            if (setValue) {
                setValue('items', next, { shouldValidate: false, shouldDirty: true });
            }
            return next;
        });
    }, [setValue]);

    return {
        items,
        setItems,
        handleAddItem,
        handleRemoveItem,
        handleDuplicateItem,
        handleItemChange,
        handleProductSelect,
        handleUpdateItemAnnexure
    };
};

export default useQuotationItems;
