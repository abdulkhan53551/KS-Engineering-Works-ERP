import { useCallback } from "react";
import { useGstSlab } from "../views/dashboard/hooks/api.hooks";

const useGst = () => {
    const { data: gstSlab = [] } = useGstSlab();

    const getGstRate = useCallback((gstSlabId) => {
        const slab = gstSlab.find((s) => s.id == gstSlabId);
        return slab ? slab.gstRate : 0;
    }, [gstSlab]);

    return { getGstRate };
};

export default useGst;