import React from 'react';
import usePermission from '../../hooks/usePermission';

/**
 * Declarative component to conditionally render elements based on user permissions.
 * 
 * Usage:
 * <Can I="create" this="invoices">
 *   <Button to="/sales/invoice/create">+ New Invoice</Button>
 * </Can>
 */
export const Can = ({ I, this: moduleName, children, fallback = null }) => {
    const { can } = usePermission();

    if (can(moduleName, I)) {
        return <>{children}</>;
    }

    return fallback;
};

export default Can;
