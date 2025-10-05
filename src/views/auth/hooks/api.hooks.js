import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../lib/axios";
import { requestMethod } from "../../../utilities/api/constants";
import { apiRequest } from "../../../utilities/api";
import { login, logout } from "../api";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { loginSuccess, logout as logoutRedux } from "../../../store/auth.slice";
import { localStorageKey } from "../../../utilities/constant/constants";
import { useNavigate } from "react-router-dom";

// Login
export const useLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    return useMutation({
        mutationKey: ["login"],
        mutationFn: login,
        onSuccess: (res) => {
            if (res.success) {
                const authData = {
                    user: {
                        role: 'admin'
                    },
                    accessToken: res.data.accessToken,
                }

                dispatch(loginSuccess(authData));
                localStorage.setItem(localStorageKey.ACCESS_TOKEN_KEY, res.data.accessToken);

                // Redirect to dashboard
                navigate("/dashboard", { replace: true });
                toast.success(res.message || "Login successful");
            }
        }
    });
}

// Logout
export const useLogout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["logout"],
        mutationFn: logout,
        onSuccess: (res) => {
            if (res.success) {
                // Clear React Query cache completely
                queryClient.removeQueries(); // removes all queries
                queryClient.clear();         // optional, clears mutations too

                dispatch(logoutRedux());
                localStorage.removeItem(localStorageKey.ACCESS_TOKEN_KEY);

                // Redirect to dashboard
                navigate("/sign-in", { replace: true });
                toast.success(res.message || "Logout successful");
            }
        }
    });
}

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