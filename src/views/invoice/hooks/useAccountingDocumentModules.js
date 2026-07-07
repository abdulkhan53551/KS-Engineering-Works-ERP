import { useState, useMemo, useEffect, useRef } from "react";
import { usePaymentMode, usePaymentStatus } from "../../dashboard/hooks/api.hooks";
import { useUnmappedEwayBillByInvoiceId, useUnmappedInvoiceChallanByInvoiceId, useUnmappedPurchaseOrderByInvoiceId } from "./useApi";
import { useDeleteInvoiceChallan } from "../../invoice-challan/hooks/useApi";
import { useDeletePurchaseOrder } from "../../purchase-order/hooks/useApi";
import { useDeleteEwayBill } from "../../eway-bill/hooks/useApi";

export default function useAccountingDocumentModules({ invoiceId, setValue }) {

    // NEW: each module holds only an array
    const [moduleData, setModuleData] = useState({
        // challan: initialData.challan || [],
        // purchaseOrder: initialData.purchaseOrder || [],
        // ewayBill: initialData.ewayBill || []
        challan: [],
        purchaseOrder: [],
        ewayBill: []
    });

    const [isLoading, setIsLoading] = useState(false);
    const [activeModule, setActiveModule] = useState(null);
    const selectedDocument = useRef(null);

    const fetchChallanQuery = useUnmappedInvoiceChallanByInvoiceId(invoiceId);
    const fetchPOQuery = useUnmappedPurchaseOrderByInvoiceId(invoiceId);
    const fetchEWBQuery = useUnmappedEwayBillByInvoiceId(invoiceId);

    const deleteChallanQuery = useDeleteInvoiceChallan();
    const deletePOQuery = useDeletePurchaseOrder();
    const deleteEWBQuery = useDeleteEwayBill();

    useEffect(() => {
        
    }, [])

    const fetchModuleFun = (module) => {
        const fetchDocument = () => {
            switch (module) {
                case "challan": return fetchChallanQuery;
                case "purchaseOrder": return fetchPOQuery;
                case "ewayBill": return fetchEWBQuery;
                default:
                    return { data: [], isLoading: false, refetch: () => { } };
            }
        }

        const deleteDocument = () => {
            switch (module) {
                case "challan": return deleteChallanQuery;
                case "purchaseOrder": return deletePOQuery;
                case "ewayBill": return deleteEWBQuery;
                default:
                    return { isSuccess: false, mutate: () => { } };
            }
        }



        return {
            fetchDocument: fetchDocument,
            deleteDocument: deleteDocument
        }
    };

    const openModule = (key) => {
        setActiveModule(key);

        const q = fetchModuleFun(key);
        // q.refetch()
        // setIsLoading(true);
        // q.refetch?.().then(res => {
        //     if (res?.data) {
        //         const formatted = res.data.map(item => ({
        //             id: item.documentId,
        //             text: `${item.documentNo} - (${item.customerName})`,
        //             selected: false
        //         }));
        //         setModuleData(prev => ({ ...prev, [key]: formatted }));
        //     }
        // }).finally(() => setIsLoading(false));
    };

    const closeModule = () => setActiveModule(null);

    const updateModuleData = (key, arr) => {
        setModuleData(prev => ({ ...prev, [key]: arr }));
    };

    const submitModule = (key, selectedIds) => {
        const newDocumentKeys = {
            challan: 'challanIds',
            purchaseOrder: 'poIds',
            challan: 'ewayBillIds',
        }

        selectedDocument.current = {
            ...selectedDocument.current,
            // [newDocumentKeys[key]]: selectedIds
            [key]: selectedIds
        }

        setValue('challanIds', selectedDocument.current?.challan || []);
        setValue('poIds', selectedDocument.current?.purchaseOrder || []);
        setValue('ewayBillIds', selectedDocument.current?.ewayBill || []);

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
