import { useQuery } from "@tanstack/react-query";
import { getState, getUserProfile } from "../api";

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
        select: (result) => {
            return result?.data ?? [];
        }
    });
}