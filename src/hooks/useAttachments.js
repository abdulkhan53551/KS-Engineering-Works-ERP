import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttachmentsApi, createAttachmentApi, deleteAttachmentApi } from '../views/attachments/api';
import { toast } from 'react-toastify';

/**
 * Hook to query attachments for an entity
 */
export const useAttachments = ({ entityType, entityId, docType, enabled = true }) => {
    return useQuery({
        queryKey: ['attachments', entityType, entityId, docType],
        queryFn: () => getAttachmentsApi({ entityType, entityId, docType }),
        enabled: Boolean(entityType && entityId && enabled),
        staleTime: 1000 * 60 * 3 // 3 mins cache
    });
};

/**
 * Hook to create a new attachment record
 */
export const useCreateAttachment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAttachmentApi,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['attachments', variables.entityType, variables.entityId]
            });
            toast.success('Document uploaded and attached successfully!');
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to save attachment');
        }
    });
};

/**
 * Hook to delete an attachment
 */
export const useDeleteAttachment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAttachmentApi,
        onSuccess: (data, id, context) => {
            queryClient.invalidateQueries({
                queryKey: ['attachments']
            });
            toast.success('Attachment deleted successfully');
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || error?.message || 'Failed to delete attachment');
        }
    });
};

export default useAttachments;
