import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook to manage Technical Specification Modals (Card & Matrix annexures), Table Spec Config, and Live PDF Preview.
 * 
 * @param {Object} params
 * @param {Array} params.items
 * @param {string} params.templateType
 * @param {any} params.tableSpecConfig
 * @param {Function} params.onUpdateItemAnnexure
 * @returns {{
 *   showSpecsModal: boolean,
 *   setShowSpecsModal: Function,
 *   showMatrixSpecsModal: boolean,
 *   setShowMatrixSpecsModal: Function,
 *   activeSpecItem: Object,
 *   activeSpecIdx: number,
 *   showConfigModal: boolean,
 *   setShowConfigModal: Function,
 *   showPdfModal: boolean,
 *   setShowPdfModal: Function,
 *   activeMatrixColumnsCount: number,
 *   handleOpenSpecs: Function,
 *   handleSaveSpecs: Function
 * }}
 */
export const useQuotationSpecs = ({
    items = [],
    templateType = 'CARDS',
    tableSpecConfig = null,
    onUpdateItemAnnexure
}) => {
    const [showSpecsModal, setShowSpecsModal] = useState(false);
    const [showMatrixSpecsModal, setShowMatrixSpecsModal] = useState(false);
    const [activeSpecItem, setActiveSpecItem] = useState(null);
    const [activeSpecIdx, setActiveSpecIdx] = useState(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);

    // Active Matrix dynamic columns count
    const activeMatrixColumnsCount = useMemo(() => {
        let cfg = tableSpecConfig;
        if (typeof cfg === 'string') {
            try { cfg = JSON.parse(cfg); } catch (_) { cfg = null; }
        }
        if (Array.isArray(cfg) && cfg.length > 0) {
            return cfg.filter(c => c.enabled !== false).length;
        }
        return 5;
    }, [tableSpecConfig]);

    // Open technical specs modal based on active template
    const handleOpenSpecs = useCallback((item, idx) => {
        const currentItem = (items && items[idx]) ? items[idx] : item;
        setActiveSpecItem(currentItem);
        setActiveSpecIdx(idx);
        if (templateType === 'MATRIX') {
            setShowMatrixSpecsModal(true);
        } else {
            setShowSpecsModal(true);
        }
    }, [items, templateType]);

    // Save technical specs updates
    const handleSaveSpecs = useCallback((updatedAnnexureData) => {
        if (activeSpecIdx !== null && activeSpecIdx !== undefined) {
            if (onUpdateItemAnnexure) {
                onUpdateItemAnnexure(activeSpecIdx, updatedAnnexureData);
            }
            setActiveSpecItem(prev => ({
                ...(prev || {}),
                annexureData: updatedAnnexureData,
                annexure_data: updatedAnnexureData
            }));
        }
    }, [activeSpecIdx, onUpdateItemAnnexure]);

    return {
        showSpecsModal,
        setShowSpecsModal,
        showMatrixSpecsModal,
        setShowMatrixSpecsModal,
        activeSpecItem,
        setActiveSpecItem,
        activeSpecIdx,
        setActiveSpecIdx,
        showConfigModal,
        setShowConfigModal,
        showPdfModal,
        setShowPdfModal,
        activeMatrixColumnsCount,
        handleOpenSpecs,
        handleSaveSpecs
    };
};

export default useQuotationSpecs;
