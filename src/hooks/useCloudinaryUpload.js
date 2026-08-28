import { useState, useCallback } from 'react';
import axios from 'axios';
import api from '../lib/axios';
import { validateFileBeforeUpload } from '../utils/fileValidator';

/**
 * Custom hook to upload files directly to Cloudinary using pre-signed backend signatures
 */
export const useCloudinaryUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState(null);

    const uploadFile = useCallback(async (file, { folder = 'ks-erp/attachments', tags = 'ks-erp', category = 'DOCUMENT', onProgress } = {}) => {
        setIsUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            // 0. Pre-validate file size, extension, and magic bytes before any network call
            const validation = await validateFileBeforeUpload(file, category);
            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            // 1. Get pre-signed signature from backend
            let signData = null;
            try {
                const sigRes = await api.get('/uploads/signature', {
                    params: { folder, tags }
                });
                signData = sigRes.data?.data || sigRes.data;
            } catch (sigErr) {
                console.warn('Could not fetch signature from /uploads/signature, checking response:', sigErr);
                throw new Error(sigErr.response?.data?.message || 'Failed to authenticate upload with backend');
            }

            const { signature, timestamp, apiKey, cloudName, tags: signedTags } = signData;

            if (!signature || !apiKey || !cloudName) {
                throw new Error('Incomplete Cloudinary credentials received from server');
            }

            // 2. Determine resource_type ('image' or 'raw')
            const isRaw = file.name.match(/\.(dxf|dwg|step|zip|rar|csv|xlsx|docx)$/i);
            const resourceType = isRaw ? 'raw' : 'auto';

            // 3. Prepare FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('folder', signData.folder || folder);
            if (signedTags || tags) {
                formData.append('tags', signedTags || tags);
            }

            // 4. Direct Upload to Cloudinary API using standalone Axios (no auth headers sent to Cloudinary)
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

            const res = await axios.post(cloudinaryUrl, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                        if (onProgress) onProgress(percent);
                    }
                }
            });

            setIsUploading(false);

            // Normalized response object
            return {
                publicId: res.data.public_id,
                secureUrl: res.data.secure_url,
                format: res.data.format || file.name.split('.').pop(),
                bytes: res.data.bytes || file.size,
                resourceType: res.data.resource_type || (isRaw ? 'raw' : 'image'),
                originalName: file.name,
                mimeType: file.type || (isRaw ? 'application/octet-stream' : 'image/jpeg'),
                createdAt: res.data.created_at || new Date().toISOString()
            };
        } catch (err) {
            setIsUploading(false);
            const message = err.response?.data?.error?.message || err.message || 'File upload failed';
            setError(message);
            throw new Error(message);
        }
    }, []);

    const resetUpload = useCallback(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setError(null);
    }, []);

    return {
        uploadFile,
        isUploading,
        uploadProgress,
        error,
        resetUpload
    };
};

export default useCloudinaryUpload;
