import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../lib/axios";
import { requestMethod } from "../../../utilities/api/constants";
import { apiRequest } from "../../../utilities/api";
import {
    login,
    logout,
    register,
    forgotPassword,
    validateResetToken,
    resetPassword,
    fetchPendingRegistrations,
    fetchRejectedRegistrations,
    approveUserRegistration,
    rejectUserRegistration,
    fetchPendingPasswordResets,
    approveUserPasswordReset,
    rejectUserPasswordReset,
    fetchRoles
} from "../api";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { loginSuccess, logout as logoutRedux } from "../../../store/auth.slice";
import { setUserFirms, setActiveFirm, setActiveBranch, clearFirmState } from "../../../store/firm.slice";
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
                    user: res.data.user,
                    accessToken: res.data.accessToken,
                };

                dispatch(loginSuccess(authData));
                localStorage.setItem(localStorageKey.ACCESS_TOKEN_KEY, res.data.accessToken);

                // Populate available firms & active context
                if (res.data.firms && res.data.firms.length > 0) {
                    dispatch(setUserFirms(res.data.firms));

                    const defaultFirm = res.data.firms.find(f => f.id === res.data.defaultContext?.firmId) || res.data.firms[0];
                    if (defaultFirm) {
                        dispatch(setActiveFirm(defaultFirm));
                        const defaultBranch = defaultFirm.branches?.find(b => b.id === res.data.defaultContext?.branchId) ||
                            defaultFirm.branches?.find(b => b.isHeadOffice) ||
                            defaultFirm.branches?.[0] || null;
                        dispatch(setActiveBranch(defaultBranch));
                    }
                }

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
                dispatch(clearFirmState());
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
            const res = await apiClient.get("/auth/me");
            return res.data?.data?.user;
        },
        staleTime: 1000 * 60 * 5,
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

// Register User
export const useRegister = () => {
    return useMutation({
        mutationKey: ["register"],
        mutationFn: register,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Registration submitted successfully");
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Registration failed");
        }
    });
};

// Forgot Password Request
export const useForgotPassword = () => {
    return useMutation({
        mutationKey: ["forgotPassword"],
        mutationFn: forgotPassword,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Password reset request submitted");
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to submit request");
        }
    });
};

// Validate Reset Token
export const useValidateResetToken = (token) => {
    return useQuery({
        queryKey: ["validateResetToken", token],
        queryFn: async () => {
            const res = await validateResetToken(token);
            return res.data;
        },
        enabled: Boolean(token),
        retry: false,
        staleTime: 0
    });
};

// Reset Password
export const useResetPassword = () => {
    return useMutation({
        mutationKey: ["resetPassword"],
        mutationFn: resetPassword,
        onSuccess: (res) => {
            if (res.success) {
                toast.success(res.message || "Password reset successfully! You can now log in.");
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Failed to reset password");
        }
    });
};

// Super Admin: Pending Registrations
export const usePendingRegistrations = () => {
    return useQuery({
        queryKey: ["pendingRegistrations"],
        queryFn: async () => {
            const res = await fetchPendingRegistrations();
            return res.data || [];
        }
    });
};

// Super Admin: Approve Registration
export const useApproveRegistration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["approveRegistration"],
        mutationFn: approveUserRegistration,
        onSuccess: (res) => {
            queryClient.invalidateQueries(["pendingRegistrations"]);
            queryClient.invalidateQueries(["rejectedRegistrations"]);
            queryClient.invalidateQueries(["usersList"]);
            queryClient.invalidateQueries(["usersPagination"]);
            toast.success(res.message || "User approved successfully");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Approval failed");
        }
    });
};

// Super Admin: Reject Registration
export const useRejectRegistration = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["rejectRegistration"],
        mutationFn: rejectUserRegistration,
        onSuccess: (res) => {
            queryClient.invalidateQueries(["pendingRegistrations"]);
            queryClient.invalidateQueries(["rejectedRegistrations"]);
            queryClient.invalidateQueries(["usersList"]);
            queryClient.invalidateQueries(["usersPagination"]);
            toast.success(res.message || "Registration rejected");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Rejection failed");
        }
    });
};

// Super Admin: Rejected Registrations
export const useRejectedRegistrations = () => {
    return useQuery({
        queryKey: ["rejectedRegistrations"],
        queryFn: async () => {
            const res = await fetchRejectedRegistrations();
            return res.data || [];
        }
    });
};

// Super Admin: Pending Password Resets
export const usePendingPasswordResets = () => {
    return useQuery({
        queryKey: ["pendingPasswordResets"],
        queryFn: async () => {
            const res = await fetchPendingPasswordResets();
            return res.data || [];
        }
    });
};

// Super Admin: Approve Password Reset
export const useApprovePasswordReset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["approvePasswordReset"],
        mutationFn: approveUserPasswordReset,
        onSuccess: (res) => {
            queryClient.invalidateQueries(["pendingPasswordResets"]);
            toast.success(res.message || "Password reset approved");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Approval failed");
        }
    });
};

// Super Admin: Reject Password Reset
export const useRejectPasswordReset = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: ["rejectPasswordReset"],
        mutationFn: rejectUserPasswordReset,
        onSuccess: (res) => {
            queryClient.invalidateQueries(["pendingPasswordResets"]);
            toast.success(res.message || "Reset request rejected");
        },
        onError: (err) => {
            toast.error(err.response?.data?.message || "Rejection failed");
        }
    });
};

// Roles List
export const useRolesList = () => {
    return useQuery({
        queryKey: ["rolesList"],
        queryFn: async () => {
            const res = await fetchRoles();
            return res.data || [];
        },
        staleTime: 1000 * 60 * 10
    });
};