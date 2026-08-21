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

    const closeModule = () => setActiveModule(null);

    const updateModuleData = (key, arr) => {
        setModuleData(prev => ({ ...prev, [key]: arr }));
    };

    const submitModule = (key, selectedIds = []) => {
        const formKey = moduleToFormKey[key];
        const flagKey = moduleToFlagKey[key];

        selectedDocument.current = {
            ...selectedDocument.current,
            [key]: selectedIds
        };

        console.log('selectedDocument => ', selectedDocument);


        if (formKey) {
            setValue(formKey, selectedIds, { shouldValidate: true, shouldDirty: true });
            if (flagKey) {
                setValue(flagKey, selectedIds.length > 0, { shouldValidate: true, shouldDirty: true });
            }
        }

        closeModule();
    };

    return {
        isLoading,
        moduleData: moduleData[activeModule] || [],
        activeModule,
        selectedDocumentIds: selectedDocument,
        fetchModuleFun,
        openModule,
        closeModule,
        updateModuleData,
        submitModule
    };
}
