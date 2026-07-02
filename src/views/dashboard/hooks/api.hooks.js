import { useQuery } from "@tanstack/react-query";
import { getCity, getGstSlab, getPaymentMode, getPaymentStatus, getProductUnit, getState, getUserProfile } from "../api";

// Get user profile
export const useUserProfile = () => {
    return useQuery({
        queryKey: ["userProfile"],
        queryFn: getUserProfile
    });
}

// Get state
export const useCountryState = () => {
    return useQuery({
        queryKey: ["countryState"],
        queryFn: getState,
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: false,
        select: (result) => {
            return result?.data ?? [];
        }
    });
}

// Get city
export const useStateCity = (selectedState = 0) => {
    return useQuery({
        queryKey: ["cities", selectedState],
        queryFn: () => getCity(selectedState),
        enabled: !!selectedState, // ⛔ Only fetch when a state is selected
        select: (result) => {
            return result?.data ?? [];
        }
    });
}

// Get product unit
export const useProductUnit = () => {
    return useQuery({
        queryKey: ["productUnit"],
        queryFn: getProductUnit,
        staleTime: Infinity,
        cacheTime: Infinity,
        select: (result) => {
            return result?.data ?? [];
        }
    });
}

// Get GST slabs
export const useGstSlab = () => {
    return useQuery({
        queryKey: ["gstSlab"],
        queryFn: getGstSlab,
        staleTime: Infinity,
        cacheTime: Infinity,
        select: (result) => {
            return result?.data ?? [];
        }
    });
}

// Get payment status
export const usePaymentStatus = () => {
    return useQuery({
        queryKey: ["paymentStatus"],
        queryFn: getPaymentStatus,
        staleTime: Infinity,
        cacheTime: Infinity,
        select: (result) => {
            return result?.data ?? [];
        }
    });
}

// Get payment mode
export const usePaymentMode = () => {
    return useQuery({
        queryKey: ["paymentMode"],
        queryFn: getPaymentMode,
        staleTime: Infinity,
        cacheTime: Infinity,
        select: (result) => {
            return result?.data ?? [];
        }
    });
}