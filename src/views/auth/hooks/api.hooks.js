import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../../../lib/axios";
import { requestMethod } from "../../../utilities/api/constants";
import { apiRequest } from "../../../utilities/api";

// Login
export const useLogin = () =>
    useMutation({
        // mutationFn: (data) => axios.post("/auth/login", data),
        mutationFn: async (data) => await apiRequest({ url: "/auth/login", method: requestMethod.POST, data }),
    });

// Current User
export const useCurrentUser = () =>
    useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            // const res = await apiClient.get("/auth/me");
            // const res = await apiRequest({ url: "/auth/me", method: requestMethod.GET, data });
            // const res = await apiRequest({ url: "https://jsonplaceholder.typicode.com/users", method: requestMethod.GET });
            const res = await apiRequest({
                url: "https://abcjsonplaceholder.typicode.com/",
                retries: 3,
                backoff: 3000,
                method: requestMethod.GET
            });
            return res.data;
        },
        // staleTime: 1000 * 60 * 10,
        staleTime: 0,
        gcTime: 0
    });

// Current User
export const usePost = () =>
    useQuery({
        queryKey: ["post"],
        queryFn: async () => {
            // const res = await apiClient.get("/auth/me");
            // const res = await apiRequest({ url: "/auth/me", method: requestMethod.GET, data });
            const res = await apiClient.request({ url: 'https://jsonplaceholder.typicode.com/posts', method: requestMethod.GET });
            return res.data;
        },
        // staleTime: 1000 * 60 * 10,
        staleTime: 0,
        gcTime: 0
    });