import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { 
    fetchRolesList, 
    fetchPermissionMatrix, 
    saveRolePermissions, 
    createRoleApi, 
    deleteRoleApi,
    updateRoleDetailsApi 
} from "./api";
import { toast } from "react-toastify";

export const useRolesQuery = () => {
    return useQuery({
        queryKey: ["admin", "roles"],
        queryFn: fetchRolesList,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
};

export const usePermissionMatrixQuery = (firmId) => {
    return useQuery({
        queryKey: ["admin", "permissions", "matrix", firmId],
        queryFn: () => fetchPermissionMatrix(firmId),
        staleTime: 1000 * 60 * 5,
        enabled: Boolean(firmId)
    });
};

export const useSaveRolePermissionsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roleId, permissionIds, firmId, firmIds }) => saveRolePermissions(roleId, permissionIds, firmId, firmIds),
        onSuccess: (data, variables) => {
            const count = variables.firmIds ? variables.firmIds.length : 1;
            toast.success(`Role permissions updated successfully across ${count} firm(s)`);
            queryClient.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || "Failed to update permissions";
            toast.error(msg);
        }
    });
};

export const useCreateRoleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRoleApi,
        onSuccess: () => {
            toast.success("New role created successfully");
            queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || "Failed to create role";
            toast.error(msg);
        }
    });
};

export const useUpdateRoleDetailsMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ roleId, roleData }) => updateRoleDetailsApi(roleId, roleData),
        onSuccess: () => {
            toast.success("Role hierarchy and scope updated successfully");
            queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || "Failed to update role details";
            toast.error(msg);
        }
    });
};

export const useDeleteRoleMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteRoleApi,
        onSuccess: () => {
            toast.success("Role deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "permissions", "matrix"] });
        },
        onError: (err) => {
            const msg = err.response?.data?.message || err.message || "Failed to delete role";
            toast.error(msg);
        }
    });
};

/**
 * Custom hook managing all business logic, state, and permission
 * dependencies for RolesPermissionStudio.
 */
export const useRolesPermissionStudio = () => {
    const activeFirm = useSelector((state) => state.firmReducer?.activeFirm);
    const userFirms = useSelector((state) => state.firmReducer?.userFirms || []);
    const currentUser = useSelector((state) => state.authReducer?.user);
    const isCallerSuperAdmin = Boolean(
        currentUser?.isSuperAdmin ||
        (currentUser?.role || currentUser?.roleSlug || '').toLowerCase() === 'super-admin'
    );

    // Derive selected firm ID synchronously from header activeFirm scope (0 lag, 0 extra render pass)
    const selectedFirmId = useMemo(() => {
        if (activeFirm?.id && activeFirm.id !== 'all') {
            const num = Number(activeFirm.id);
            if (!isNaN(num) && num > 0) return num;
        }
        if (userFirms && userFirms.length > 0) {
            const firstValid = userFirms.find(f => f.id !== 'all');
            if (firstValid) return Number(firstValid.id);
        }
        return 1;
    }, [activeFirm?.id, userFirms]);

    const setSelectedFirmId = () => {}; // Backward compatibility for any consumers

    const { data: matrixData, isLoading, isError } = usePermissionMatrixQuery(selectedFirmId);
    const saveMutation = useSaveRolePermissionsMutation();
    const createRoleMutation = useCreateRoleMutation();
    const updateRoleDetailsMutation = useUpdateRoleDetailsMutation();
    const deleteRoleMutation = useDeleteRoleMutation();

    const rawRoles = matrixData?.data?.roles || [];
    const roles = useMemo(() => {
        if (isCallerSuperAdmin) return rawRoles;
        return rawRoles.filter(r => (r.slug || '').toLowerCase() !== 'super-admin');
    }, [rawRoles, isCallerSuperAdmin]);

    const modules = matrixData?.data?.modules || [];
    const allPermissions = matrixData?.data?.allPermissions || [];
    const rolePermissionsMap = matrixData?.data?.rolePermissionsMap || {};

    const isAllFirmsMode = isCallerSuperAdmin && activeFirm?.id === 'all';
    const availableFirms = useMemo(() => {
        return (userFirms || []).filter(f => f.id !== 'all');
    }, [userFirms]);

    // Target firms selected for multi-firm broadcast in "All Firms" mode
    const [selectedTargetFirmIds, setSelectedTargetFirmIds] = useState(new Set());

    // When availableFirms loads, default to all available firms checked
    useEffect(() => {
        if (availableFirms.length > 0) {
            setSelectedTargetFirmIds(new Set(availableFirms.map(f => f.id)));
        }
    }, [availableFirms]);

    const toggleTargetFirmId = (firmId) => {
        setSelectedTargetFirmIds(prev => {
            const next = new Set(prev);
            if (next.has(firmId)) next.delete(firmId);
            else next.add(firmId);
            return next;
        });
    };

    const selectAllTargetFirms = () => {
        setSelectedTargetFirmIds(new Set(availableFirms.map(f => f.id)));
    };

    const deselectAllTargetFirms = () => {
        setSelectedTargetFirmIds(new Set());
    };

    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [selectedPermIds, setSelectedPermIds] = useState(new Set());
    const [savedPermIds, setSavedPermIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    // Modals & Forms
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');
    const [newRoleParentId, setNewRoleParentId] = useState('');
    const [newRoleIsIndependent, setNewRoleIsIndependent] = useState(false);

    // Edit Role Hierarchy Modal
    const [showRoleSettingsModal, setShowRoleSettingsModal] = useState(false);
    const [editRoleParentId, setEditRoleParentId] = useState('');
    const [editRoleIsIndependent, setEditRoleIsIndependent] = useState(false);

    const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState(null);

    // Default select first editable role (or first role)
    useEffect(() => {
        if (roles.length > 0 && !selectedRoleId) {
            const defaultRole = roles.find(r => r.slug === 'administrator') || roles[0];
            setSelectedRoleId(defaultRole.id);
        }
    }, [roles, selectedRoleId]);

    const selectedRole = useMemo(() => {
        return roles.find(r => r.id === selectedRoleId) || null;
    }, [roles, selectedRoleId]);

    const isSuperAdmin = selectedRole?.slug === 'super-admin';

    // Map: `object:action` -> permissionId
    const permMap = useMemo(() => {
        const map = {};
        allPermissions.forEach(p => {
            map[`${p.object}:${p.action}`] = p.id;
        });
        return map;
    }, [allPermissions]);

    // Group modules by category
    const groupedModules = useMemo(() => {
        const groups = {};
        modules.forEach(mod => {
            const cat = mod.category || 'General';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(mod);
        });
        return groups;
    }, [modules]);

    // When selectedRoleId changes or matrixData updates, sync selected permissions
    useEffect(() => {
        if (selectedRoleId && rolePermissionsMap[selectedRoleId]) {
            const permSet = new Set(rolePermissionsMap[selectedRoleId]);
            setSelectedPermIds(permSet);
            setSavedPermIds(new Set(rolePermissionsMap[selectedRoleId]));
        } else if (selectedRole?.slug === 'super-admin') {
            // Super admin has all permissions
            const allIds = new Set(allPermissions.map(p => p.id));
            setSelectedPermIds(allIds);
            setSavedPermIds(allIds);
        } else {
            setSelectedPermIds(new Set());
            setSavedPermIds(new Set());
        }
    }, [selectedRoleId, matrixData, selectedRole?.slug]);

    // Track dirty state and precise diff (+added, -removed)
    const permissionDiff = useMemo(() => {
        let added = 0;
        let removed = 0;
        if (isSuperAdmin) return { added: 0, removed: 0, totalChanges: 0 };
        for (const id of selectedPermIds) {
            if (!savedPermIds.has(id)) added++;
        }
        for (const id of savedPermIds) {
            if (!selectedPermIds.has(id)) removed++;
        }
        return { added, removed, totalChanges: added + removed };
    }, [selectedPermIds, savedPermIds, isSuperAdmin]);

    const isDirty = useMemo(() => {
        if (isSuperAdmin) return false;
        return permissionDiff.totalChanges > 0;
    }, [permissionDiff, isSuperAdmin]);

    const filteredRoles = useMemo(() => {
        return roles.filter(r => 
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            r.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [roles, searchTerm]);

    // Module search term in matrix
    const [moduleSearchTerm, setModuleSearchTerm] = useState('');

    // Filtered grouped modules by module search term
    const filteredGroupedModules = useMemo(() => {
        if (!moduleSearchTerm.trim()) return groupedModules;
        const term = moduleSearchTerm.toLowerCase().trim();
        const result = {};

        Object.entries(groupedModules).forEach(([category, modList]) => {
            const matchingMods = modList.filter(m => 
                m.name.toLowerCase().includes(term) ||
                m.slug.toLowerCase().includes(term) ||
                m.description.toLowerCase().includes(term) ||
                category.toLowerCase().includes(term) ||
                m.actions.some(a => a.toLowerCase().includes(term))
            );
            if (matchingMods.length > 0) {
                result[category] = matchingMods;
            }
        });

        return result;
    }, [groupedModules, moduleSearchTerm]);

    // Collapsed categories state for accordion UX
    const [collapsedCategories, setCollapsedCategories] = useState(new Set());

    const toggleCategoryCollapse = (category) => {
        setCollapsedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) next.delete(category);
            else next.add(category);
            return next;
        });
    };

    const expandAllCategories = () => setCollapsedCategories(new Set());
    const collapseAllCategories = () => setCollapsedCategories(new Set(Object.keys(groupedModules)));

    // Coverage statistics for selected role
    const coverageStats = useMemo(() => {
        const total = allPermissions.length || 1;
        const active = isSuperAdmin ? total : selectedPermIds.size;
        const percentage = Math.min(100, Math.round((active / total) * 100));
        return { active, total, percentage };
    }, [allPermissions, selectedPermIds, isSuperAdmin]);

    // Handle category-level master switch (e.g., enable all Sales modules at once)
    const handleCategoryMasterSwitch = (categoryName, mode) => {
        if (isSuperAdmin) return;
        const catModules = groupedModules[categoryName] || [];
        if (!catModules.length) return;

        const next = new Set(selectedPermIds);
        catModules.forEach(mod => {
            if (mode === 'none') {
                mod.actions.forEach(act => {
                    const id = permMap[`${mod.slug}:${act}`];
                    if (id) next.delete(id);
                });
            } else if (mode === 'read') {
                mod.actions.forEach(act => {
                    const id = permMap[`${mod.slug}:${act}`];
                    if (id) {
                        if (act === 'read') next.add(id);
                        else next.delete(id);
                    }
                });
            } else if (mode === 'full') {
                mod.actions.forEach(act => {
                    const id = permMap[`${mod.slug}:${act}`];
                    if (id) next.add(id);
                });
            }
        });

        setSelectedPermIds(next);
    };

    // Handle single action toggle with dependency auto-checking
    const handleToggleAction = (moduleSlug, action) => {
        if (isSuperAdmin) return;
        const permId = permMap[`${moduleSlug}:${action}`];
        if (!permId) return;

        const next = new Set(selectedPermIds);

        if (next.has(permId)) {
            // Unchecking
            next.delete(permId);

            // If unchecking 'read', auto-uncheck all dependent actions for this module!
            if (action === 'read') {
                const targetMod = modules.find(m => m.slug === moduleSlug);
                if (targetMod) {
                    targetMod.actions.forEach(act => {
                        const depId = permMap[`${moduleSlug}:${act}`];
                        if (depId) next.delete(depId);
                    });
                }
            }
        } else {
            // Checking
            next.add(permId);

            // If checking any action other than 'read', auto-check 'read' for this module!
            if (action !== 'read') {
                const readPermId = permMap[`${moduleSlug}:read`];
                if (readPermId) next.add(readPermId);
            }
        }

        setSelectedPermIds(next);
    };

    // Master module switch: "full", "read", "none"
    const handleModuleMasterSwitch = (moduleSlug, mode) => {
        if (isSuperAdmin) return;
        const targetMod = modules.find(m => m.slug === moduleSlug);
        if (!targetMod) return;

        const next = new Set(selectedPermIds);

        if (mode === 'none') {
            targetMod.actions.forEach(act => {
                const id = permMap[`${moduleSlug}:${act}`];
                if (id) next.delete(id);
            });
        } else if (mode === 'read') {
            targetMod.actions.forEach(act => {
                const id = permMap[`${moduleSlug}:${act}`];
                if (id) {
                    if (act === 'read') next.add(id);
                    else next.delete(id);
                }
            });
        } else if (mode === 'full') {
            targetMod.actions.forEach(act => {
                const id = permMap[`${moduleSlug}:${act}`];
                if (id) next.add(id);
            });
        }

        setSelectedPermIds(next);
    };

    // Quick presets across all modules
    const handleApplyPreset = (preset) => {
        if (isSuperAdmin) return;
        const next = new Set();

        if (preset === 'all') {
            allPermissions.forEach(p => next.add(p.id));
        } else if (preset === 'readonly') {
            allPermissions.filter(p => p.action === 'read' || p.action === 'print').forEach(p => next.add(p.id));
        } else if (preset === 'clear') {
            // empty set
        } else if (preset === 'reset') {
            setSelectedPermIds(new Set(savedPermIds));
            return;
        }

        setSelectedPermIds(next);
    };

    // Save permissions
    const handleConfirmSave = () => {
        if (!selectedRoleId || isSuperAdmin) return;

        const targetIds = isAllFirmsMode 
            ? Array.from(selectedTargetFirmIds) 
            : [selectedFirmId];

        if (targetIds.length === 0) {
            toast.error("Please select at least one firm to apply permissions to");
            return;
        }

        saveMutation.mutate(
            { 
                roleId: selectedRoleId, 
                permissionIds: Array.from(selectedPermIds), 
                firmId: targetIds[0],
                firmIds: targetIds 
            },
            {
                onSuccess: () => {
                    setSavedPermIds(new Set(selectedPermIds));
                    setShowConfirmSaveModal(false);
                }
            }
        );
    };

    // Sync edit hierarchy state when selected role changes
    useEffect(() => {
        if (selectedRole) {
            setEditRoleParentId(selectedRole.parentRoleId || '');
            setEditRoleIsIndependent(Boolean(selectedRole.isIndependent));
        }
    }, [selectedRole?.id, selectedRole?.parentRoleId, selectedRole?.isIndependent]);

    // Create role handler
    const handleCreateRole = (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) {
            toast.error("Role name is required");
            return;
        }

        createRoleMutation.mutate(
            { 
                name: newRoleName.trim(), 
                description: newRoleDesc.trim(),
                parentRoleId: newRoleParentId ? parseInt(newRoleParentId, 10) : null,
                isIndependent: newRoleIsIndependent
            },
            {
                onSuccess: (res) => {
                    setShowCreateModal(false);
                    setNewRoleName('');
                    setNewRoleDesc('');
                    setNewRoleParentId('');
                    setNewRoleIsIndependent(false);
                    const createdId = res?.data?.id || res?.id;
                    if (createdId) setSelectedRoleId(createdId);
                }
            }
        );
    };

    // Update role hierarchy & scope handler
    const handleUpdateRoleHierarchy = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!selectedRoleId || isSuperAdmin) return;

        updateRoleDetailsMutation.mutate({
            roleId: selectedRoleId,
            roleData: {
                parentRoleId: editRoleParentId ? parseInt(editRoleParentId, 10) : null,
                isIndependent: editRoleIsIndependent
            }
        }, {
            onSuccess: () => {
                setShowRoleSettingsModal(false);
            }
        });
    };

    // Delete role handler
    const handleDeleteRole = () => {
        if (!roleToDelete) return;
        deleteRoleMutation.mutate(roleToDelete.id, {
            onSuccess: () => {
                setRoleToDelete(null);
                setSelectedRoleId(roles[0]?.id || null);
            }
        });
    };

    const handleDiscardChanges = () => {
        setSelectedPermIds(new Set(savedPermIds));
    };

    return {
        // Data & Loading
        isLoading,
        isError,
        roles,
        filteredRoles,
        modules,
        groupedModules,
        allPermissions,
        permMap,

        // Selection & Role State
        selectedRoleId,
        setSelectedRoleId,
        selectedRole,
        isSuperAdmin,
        selectedPermIds,
        savedPermIds,
        searchTerm,
        setSearchTerm,
        isDirty,

        // Hierarchy Form State
        newRoleParentId,
        setNewRoleParentId,
        newRoleIsIndependent,
        setNewRoleIsIndependent,

        showRoleSettingsModal,
        setShowRoleSettingsModal,
        editRoleParentId,
        setEditRoleParentId,
        editRoleIsIndependent,
        setEditRoleIsIndependent,
        handleUpdateRoleHierarchy,
        isUpdatingRoleDetails: updateRoleDetailsMutation.isPending,

        // Modals
        showCreateModal,
        setShowCreateModal,
        newRoleName,
        setNewRoleName,
        newRoleDesc,
        setNewRoleDesc,
        showConfirmSaveModal,
        setShowConfirmSaveModal,
        roleToDelete,
        setRoleToDelete,

        // Scoped Firm state
        selectedFirmId,
        setSelectedFirmId,
        userFirms,
        activeFirm,
        isAllFirmsMode,
        availableFirms,
        selectedTargetFirmIds,
        toggleTargetFirmId,
        selectAllTargetFirms,
        deselectAllTargetFirms,
        // Matrix filtering, category batching & accordion
        moduleSearchTerm,
        setModuleSearchTerm,
        filteredGroupedModules,
        collapsedCategories,
        toggleCategoryCollapse,
        expandAllCategories,
        collapseAllCategories,
        coverageStats,
        permissionDiff,
        handleCategoryMasterSwitch,

        // Handlers
        handleToggleAction,
        handleModuleMasterSwitch,
        handleApplyPreset,
        handleConfirmSave,
        handleCreateRole,
        handleDeleteRole,
        handleDiscardChanges,

        // Pending states
        isSaving: saveMutation.isPending,
        isCreatingRole: createRoleMutation.isPending,
        isDeletingRole: deleteRoleMutation.isPending,
        isCallerSuperAdmin
    };
};


