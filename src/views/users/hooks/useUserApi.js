import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  fetchUsers,
  fetchUsersPagination,
  deleteUser,
  restoreUser,
  bulkDeleteUsers,
  bulkRestoreUsers,
  updateUserRole,
  toggleUserStatus,
  adminGenerateResetLink,
  adminDirectResetPassword,
  fetchRoles,
  fetchUserAssignments,
  updateUserAssignments
} from "../api";

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

const selectUsersList = (result) => {
  const list = result?.data;
  return Array.isArray(list) ? list : EMPTY_ARRAY;
};

const selectUsersPagination = (result) => {
  const metaData = result?.data ?? result ?? EMPTY_OBJECT;
  const innerPagination = metaData?.pagination ?? metaData ?? EMPTY_OBJECT;
  const total = Number(innerPagination?.total ?? metaData?.total ?? 0);
  const pageSizeNum = Number(innerPagination?.pageSize ?? 10);
  const totalPages = Number(innerPagination?.totalPages ?? metaData?.totalPages ?? (total && pageSizeNum ? Math.ceil(total / pageSizeNum) : 1));
  const activeCount = Number(metaData?.activeCount ?? 0);
  const trashCount = Number(metaData?.trashCount ?? 0);

  const pageNum = Number(innerPagination?.page ?? 1);
  const pageStart = total === 0 ? 0 : (pageNum - 1) * pageSizeNum + 1;
  const pageEnd = Math.min(pageNum * pageSizeNum, total);

  return {
    ...innerPagination,
    page: pageNum,
    pageSize: pageSizeNum,
    total,
    totalPages,
    activeCount,
    trashCount,
    pageStart,
    pageEnd
  };
};

// 1. Fetch Users List
export const useUsers = ({
  page = 1,
  pageSize = 10,
  search = "",
  status = "",
  roleId = null,
  trash = false,
  sortBy = "id",
  sortOrder = "desc"
} = {}) => {
  return useQuery({
    queryKey: ["usersList", page, pageSize, search, status, roleId, trash, sortBy, sortOrder],
    queryFn: () => fetchUsers({ page, pageSize, search, status, roleId, trash, sortBy, sortOrder }),
    placeholderData: (prev) => prev,
    select: selectUsersList
  });
};

// 2. Fetch Users Pagination Meta (includes activeCount and trashCount)
export const useUsersPagination = ({
  page = 1,
  pageSize = 10,
  search = "",
  status = "",
  roleId = null,
  trash = false,
  sortBy = "id",
  sortOrder = "desc"
} = {}) => {
  return useQuery({
    queryKey: ["usersPagination", page, pageSize, search, status, roleId, trash, sortBy, sortOrder],
    queryFn: () => fetchUsersPagination({ page, pageSize, search, status, roleId, trash, sortBy, sortOrder }),
    placeholderData: (prev) => prev,
    select: selectUsersPagination
  });
};

// 3. Delete User (Soft or Permanent)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries(["usersList"]);
      queryClient.invalidateQueries(["usersPagination"]);
      toast.success(
        res?.message || (variables.permanent ? "User permanently deleted" : "User moved to recycle bin")
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  });
};

// 4. Restore User
export const useRestoreUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreUser,
    onSuccess: (res) => {
      queryClient.invalidateQueries(["usersList"]);
      queryClient.invalidateQueries(["usersPagination"]);
      toast.success(res?.message || "User restored successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to restore user");
    }
  });
};

// 5. Bulk Delete Users
export const useBulkDeleteUsers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkDeleteUsers,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries(["usersList"]);
      queryClient.invalidateQueries(["usersPagination"]);
      toast.success(
        res?.message ||
        (variables.permanent ? "Selected users permanently deleted" : "Selected users moved to recycle bin")
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to perform bulk delete");
    }
  });
};

// 6. Bulk Restore Users
export const useBulkRestoreUsers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkRestoreUsers,
    onSuccess: (res) => {
      queryClient.invalidateQueries(["usersList"]);
      queryClient.invalidateQueries(["usersPagination"]);
      toast.success(res?.message || "Selected users restored successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to restore selected users");
    }
  });
};

// 7. Update User Role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: (res) => {
      queryClient.invalidateQueries(["usersList"]);
      toast.success(res?.message || "User role updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user role");
    }
  });
};

// 8. Toggle User Active / Inactive Status
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleUserStatus,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries(["usersList"]);
      toast.success(
        res?.message || (variables.isActive ? "User activated" : "User deactivated")
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user status");
    }
  });
};

// 9. Admin Generate Reset Link
export const useAdminGenerateResetLink = () => {
  return useMutation({
    mutationFn: adminGenerateResetLink,
    onSuccess: (res) => {
      toast.success(res?.message || "Password reset link generated");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to generate reset link");
    }
  });
};

// 10. Roles Query
export const useRoles = () => {
  return useQuery({
    queryKey: ["rolesList"],
    queryFn: async () => {
      const res = await fetchRoles();
      return res.data || [];
    },
    staleTime: 1000 * 60 * 10
  });
};

// 11. Admin Direct Reset Password
export const useAdminDirectResetPassword = () => {
  return useMutation({
    mutationFn: adminDirectResetPassword,
    onSuccess: (res) => {
      toast.success(res?.message || "Password updated successfully");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update password directly");
    }
  });
};

const EMPTY_ASSIGNMENTS = [];

const selectUserAssignments = (result) => Array.isArray(result?.data) ? result.data : EMPTY_ASSIGNMENTS;

// 12. User Scoped Assignments Query & Mutation
export const useUserAssignments = (userId, options = {}) => {
  return useQuery({
    queryKey: ["userAssignments", userId],
    queryFn: () => fetchUserAssignments(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    select: selectUserAssignments,
    ...options
  });
};

export const useUpdateUserAssignments = (userId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignments }) => updateUserAssignments({ userId, assignments }),
    onSuccess: (res) => {
      toast.success(res?.message || "User firm and branch assignments updated successfully");
      queryClient.invalidateQueries({ queryKey: ["userAssignments", userId] });
      queryClient.invalidateQueries({ queryKey: ["usersList"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update user assignments");
    }
  });
};

