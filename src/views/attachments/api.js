import api from '../../lib/axios';

/**
 * Fetch attachments for any entity polymorphically
 * @param {Object} params - { entityType: 'PARTY', entityId: 18, docType?: 'GST_CERT' }
 */
export const getAttachmentsApi = async ({ entityType, entityId, docType }) => {
    const params = { entityType, entityId };
    if (docType) params.docType = docType;
    const response = await api.get('/attachments', { params });
    return response.data?.data || response.data || [];
};

/**
 * Save new attachment metadata in the database
 */
export const createAttachmentApi = async (data) => {
    const response = await api.post('/attachments', data);
    return response.data?.data || response.data;
};

/**
 * Soft delete or remove attachment by database ID
 */
export const deleteAttachmentApi = async (id) => {
    const response = await api.delete(`/attachments/${id}`);
    return response.data?.data || response.data;
};

/**
 * Destroy an unlinked or removed asset directly from Cloudinary by publicId
 * Used for Logo removal, replaced files, or discarded uploads
 */
export const destroyCloudinaryAssetApi = async ({ publicId, resourceType = 'image' }) => {
    if (!publicId) return null;
    const response = await api.delete('/uploads/cloudinary-asset', {
        data: { publicId, resourceType }
    });
    return response.data?.data || response.data;
};
