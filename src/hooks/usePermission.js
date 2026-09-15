import { useSelector } from 'react-redux';

/**
 * Hook to evaluate permissions for the currently authenticated user.
 */
export const usePermission = () => {
    const user = useSelector((state) => state.authReducer?.user);
    const role = user?.role?.toLowerCase();
    const isSuperAdmin = role === 'super-admin';
    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

    /**
     * Check if user can perform action on module
     * @param {string} module E.g., 'invoices', 'challans', 'parties'
     * @param {string} action E.g., 'read', 'create', 'update', 'delete', 'approve', 'print'
     */
    const can = (module, action) => {
        if (!user) return false;
        if (isSuperAdmin || permissions.includes('*')) return true;

        const normalizedModule = (module || '').toLowerCase();
        const normalizedAction = (action || '').toLowerCase();

        // Check module-level wildcard: 'invoices:*'
        if (permissions.includes(`${normalizedModule}:*`)) return true;

        // Check exact atomic permission: 'invoices:create'
        if (permissions.includes(`${normalizedModule}:${normalizedAction}`)) return true;

        return false;
    };

    return {
        user,
        role,
        isSuperAdmin,
        permissions,
        can
    };
};

export default usePermission;
