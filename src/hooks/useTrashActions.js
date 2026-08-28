import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useUIManager } from '../contexts/UIManagerContext';
import { setModalLoading } from '../store/uiModal.slice';

/**
 * Custom hook to standardise and trigger confirm modals for:
 * - Single soft delete (Move to Bin)
 * - Single restore
 * - Single permanent delete
 * - Bulk soft delete
 * - Bulk restore
 * - Bulk permanent delete
 *
 * @param {Object} options
 * @param {string} [options.entityName='Item'] - Name of the entity (e.g. 'Purchase Order', 'Party', 'Invoice')
 * @param {string} [options.pluralEntityName] - Plural name (defaults to entityName + 's')
 */
export const useTrashActions = ({
    entityName = 'Item',
    pluralEntityName
} = {}) => {
    const dispatch = useDispatch();
    const { showModal } = useUIManager();
    const plural = pluralEntityName || `${entityName}s`;

    // Helper to start loading in confirm modal
    const startLoading = useCallback(() => {
        dispatch(setModalLoading({ key: 'delete', isLoading: true }));
    }, [dispatch]);

    /**
     * 1. Single Soft Delete Confirmation
     */
    const confirmSoftDelete = useCallback((nameOrItem, onConfirm) => {
        const displayName = typeof nameOrItem === 'string' ? nameOrItem : (nameOrItem?.name || nameOrItem?.displayName || `${entityName} #${nameOrItem?.id}`);
        showModal('confirm', {
            show: true,
            title: 'Move to Recycle Bin',
            message: `Are you sure you want to move ${entityName.toLowerCase()} "${displayName}" to the Recycle Bin?`,
            confirmText: 'Move to Bin',
            confirmVariant: 'danger',
            onConfirm: async () => {
                startLoading();
                if (typeof onConfirm === 'function') {
                    await onConfirm();
                }
            }
        });
    }, [entityName, showModal, startLoading]);

    /**
     * 2. Single Restore Confirmation
     */
    const confirmRestore = useCallback((nameOrItem, onConfirm) => {
        const displayName = typeof nameOrItem === 'string' ? nameOrItem : (nameOrItem?.name || nameOrItem?.displayName || `${entityName} #${nameOrItem?.id}`);
        showModal('confirm', {
            show: true,
            title: `Restore ${entityName}`,
            message: `Are you sure you want to restore ${entityName.toLowerCase()} "${displayName}" back to active ${plural.toLowerCase()}?`,
            confirmText: 'Restore',
            confirmVariant: 'success',
            onConfirm: async () => {
                startLoading();
                if (typeof onConfirm === 'function') {
                    await onConfirm();
                }
            }
        });
    }, [entityName, plural, showModal, startLoading]);

    /**
     * 3. Single Permanent Delete Confirmation
     */
    const confirmPermanentDelete = useCallback((nameOrItem, onConfirm) => {
        const displayName = typeof nameOrItem === 'string' ? nameOrItem : (nameOrItem?.name || nameOrItem?.displayName || `${entityName} #${nameOrItem?.id}`);
        showModal('confirm', {
            show: true,
            title: `Permanently Delete ${entityName}`,
            message: `Are you sure you want to PERMANENTLY delete ${entityName.toLowerCase()} "${displayName}"? This action cannot be undone.`,
            confirmText: 'Delete Permanently',
            confirmVariant: 'danger',
            onConfirm: async () => {
                startLoading();
                if (typeof onConfirm === 'function') {
                    await onConfirm();
                }
            }
        });
    }, [entityName, showModal, startLoading]);

    /**
     * 4. Bulk Soft Delete Confirmation
     */
    const confirmBulkSoftDelete = useCallback((count, onConfirm) => {
        showModal('confirm', {
            show: true,
            title: 'Move Selected to Recycle Bin',
            message: `Are you sure you want to move ${count} selected ${plural.toLowerCase()} to the Recycle Bin?`,
            confirmText: 'Move to Bin',
            confirmVariant: 'danger',
            onConfirm: async () => {
                startLoading();
                if (typeof onConfirm === 'function') {
                    await onConfirm();
                }
            }
        });
    }, [plural, showModal, startLoading]);

    /**
     * 5. Bulk Restore Confirmation
     */
    const confirmBulkRestore = useCallback((count, onConfirm) => {
        showModal('confirm', {
            show: true,
            title: `Restore Selected ${plural}`,
            message: `Are you sure you want to restore ${count} selected ${plural.toLowerCase()} back to active?`,
            confirmText: 'Restore All',
            confirmVariant: 'success',
            onConfirm: async () => {
                startLoading();
                if (typeof onConfirm === 'function') {
                    await onConfirm();
                }
            }
        });
    }, [plural, showModal, startLoading]);

    /**
     * 6. Bulk Permanent Delete Confirmation
     */
    const confirmBulkPermanentDelete = useCallback((count, onConfirm) => {
        showModal('confirm', {
            show: true,
            title: `Permanently Delete Selected ${plural}`,
            message: `Are you sure you want to PERMANENTLY delete ${count} selected ${plural.toLowerCase()}? This action CANNOT be undone.`,
            confirmText: 'Delete Permanently',
            confirmVariant: 'danger',
            onConfirm: async () => {
                startLoading();
                if (typeof onConfirm === 'function') {
                    await onConfirm();
                }
            }
        });
    }, [plural, showModal, startLoading]);

    return {
        confirmSoftDelete,
        confirmRestore,
        confirmPermanentDelete,
        confirmBulkSoftDelete,
        confirmBulkRestore,
        confirmBulkPermanentDelete
    };
};

export default useTrashActions;
