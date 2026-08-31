import { useState, useRef } from "react";
import { useUnmappedEwayBillByInvoiceId, useUnmappedInvoiceChallanByInvoiceId, useUnmappedPurchaseOrderByInvoiceId } from "./useApi";
import { useDeleteInvoiceChallan } from "../../invoice-challan/hooks/useApi";
import { useDeletePurchaseOrder } from "../../purchase-order/hooks/useApi";
import { useDeleteEwayBill } from "../../eway-bill/hooks/useApi";

const moduleToFormKey = {
    challan: 'challanIds',
    purchaseOrder: 'poIds',
    ewayBill: 'ewayBillIds',
};

const moduleToFlagKey = {
    challan: 'hasChallan',
    purchaseOrder: 'hasPo',
    ewayBill: 'hasEwayBill',
};

export default function useAccountingDocumentModules({ invoiceId, setValue }) {
    const [moduleData, setModuleData] = useState({
        challan: [],
        purchaseOrder: [],
        ewayBill: []
    });

    const [isLoading, setIsLoading] = useState(false);
    const [activeModule, setActiveModule] = useState(null);
    const selectedDocument = useRef({});

    const fetchChallanQuery = useUnmappedInvoiceChallanByInvoiceId(invoiceId);
    const fetchPOQuery = useUnmappedPurchaseOrderByInvoiceId(invoiceId);
    const fetchEWBQuery = useUnmappedEwayBillByInvoiceId(invoiceId);

    const deleteChallanQuery = useDeleteInvoiceChallan();
    const deletePOQuery = useDeletePurchaseOrder();
    const deleteEWBQuery = useDeleteEwayBill();

    const fetchModuleFun = (module) => {
        const fetchDocument = () => {
            switch (module) {
                case "challan": return fetchChallanQuery;
                case "purchaseOrder": return fetchPOQuery;
                case "ewayBill": return fetchEWBQuery;
                default:
                    return { data: [], isLoading: false, refetch: () => { } };
            }
        };

        const deleteDocument = () => {
            switch (module) {
                case "challan": return deleteChallanQuery;
                case "purchaseOrder": return deletePOQuery;
                case "ewayBill": return deleteEWBQuery;
                default:
                    return { isSuccess: false, mutate: () => { } };
            }
        };

        return {
            fetchDocument,
            deleteDocument
        };
    };

    const openModule = (key) => {
        setActiveModule(key);
    };

    const closeModule = () => {
        if (activeModule) {
            const flagKey = moduleToFlagKey[activeModule];
            const currentIds = selectedDocument.current[activeModule] || [];
            if (flagKey) {
                setValue(flagKey, currentIds.length > 0, { shouldValidate: true });
            }
        }
        setActiveModule(null);
    };

    const [docNameMap, setDocNameMap] = useState({});

    const updateModuleData = (key, arr) => {
        setModuleData(prev => ({ ...prev, [key]: arr }));
    };

    const submitModule = (key, selectedIds = [], selectedItems = []) => {
        const formKey = moduleToFormKey[key];
        const flagKey = moduleToFlagKey[key];

        // Store human-readable document numbers in map
        if (Array.isArray(selectedItems) && selectedItems.length > 0) {
            setDocNameMap(prev => {
                const updated = { ...prev };
                selectedItems.forEach(item => {
                    const docNumber = item.documentNo || (item.text ? item.text.split(' - ')[0] : null);
                    if (item.id && docNumber) {
                        updated[`${key}-${item.id}`] = docNumber;
                    }
                });
                return updated;
            });
        }

        selectedDocument.current = {
            ...selectedDocument.current,
            [key]: selectedIds
        };

        if (formKey) {
            setValue(formKey, selectedIds, { shouldValidate: true, shouldDirty: true });
            if (flagKey) {
                setValue(flagKey, selectedIds.length > 0, { shouldValidate: true, shouldDirty: true });
            }
        }

        closeModule();
    };

    const getDocumentLabel = (key, id) => {
        if (docNameMap[`${key}-${id}`]) {
            return docNameMap[`${key}-${id}`];
        }

        const list = key === 'challan' ? fetchChallanQuery.data :
                     key === 'purchaseOrder' ? fetchPOQuery.data :
                     key === 'ewayBill' ? fetchEWBQuery.data : [];

        const match = list?.find(item => item.documentId === id);
        if (match && match.documentNo) {
            return match.documentNo;
        }

        // Generic friendly fallback without exposing database IDs
        const title = key === 'challan' ? 'Challan' : key === 'purchaseOrder' ? 'PO' : 'E-Way';
        return `${title} Doc`;
    };

    return {
        isLoading,
        moduleData: moduleData[activeModule] || [],
        activeModule,
        fetchModuleFun,
        openModule,
        closeModule,
        updateModuleData,
        submitModule,
        getDocumentLabel
    };
}
