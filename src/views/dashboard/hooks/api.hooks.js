import { useQuery } from "@tanstack/react-query";
import { getCity, getState, getUserProfile } from "../api";

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