/**
 * Cloudinary URL formatting, dynamic thumbnail generation, download and file utilities
 */

/**
 * Format bytes to human readable format (KB, MB, GB)
 */
export const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generate a dynamic Cloudinary thumbnail URL
 * For PDFs: Extracts Page 1 as an image thumbnail (pg_1,w_300,h_400,c_fill,f_jpg)
 * For Images: Generates resized WebP/Auto thumbnail with smart cropping
 */
export const getCloudinaryThumb = (url, { width = 280, height = 280, isPdf = false, crop = 'fill' } = {}) => {
    if (!url || typeof url !== 'string') return '';
    if (!url.includes('cloudinary.com')) return url;

    // Check if it's a PDF
    const isPdfFile = isPdf || url.toLowerCase().includes('.pdf');

    if (isPdfFile) {
        // Transform PDF Page 1 to JPG thumbnail
        return url
            .replace(/\/upload\/(?:v\d+\/)?/, `/upload/pg_1,w_${width},h_${height},c_${crop},f_jpg,q_auto/`)
            .replace(/\.pdf$/i, '.jpg');
    }

    // Standard Image Thumbnail
    return url.replace(/\/upload\/(?:v\d+\/)?/, `/upload/w_${width},h_${height},c_${crop},f_auto,q_auto/`);
};

/**
 * Force Cloudinary to serve with Content-Disposition: attachment for direct download
 */
export const getCloudinaryDownloadUrl = (url, originalName = '') => {
    if (!url || typeof url !== 'string') return '';
    if (!url.includes('cloudinary.com')) return url;

    // Sanitize filename to avoid header issues
    const cleanName = (originalName || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
    return url.replace(/\/upload\/(?:v\d+\/)?/, `/upload/fl_attachment:${cleanName}/`);
};

/**
 * Force Cloudinary to serve PDF with Content-Disposition: inline
 */
export const getCloudinaryInlinePdfUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (!url.includes('cloudinary.com')) return url;

    // Inject fl_inline flag into Cloudinary delivery URL
    return url.replace(/\/upload\/(?:v\d+\/)?/, '/upload/fl_inline/');
};

/**
 * Generate Google Docs Embedded Viewer URL for 100% universal browser PDF support
 */
export const getGoogleDocsPdfViewerUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const cleanUrl = getCloudinaryInlinePdfUrl(url);
    return `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true`;
};

/**
 * Generate a high-resolution preview URL for Lightbox
 */
export const getCloudinaryLightboxUrl = (url, isPdf = false) => {
    if (!url || typeof url !== 'string') return '';
    if (!url.includes('cloudinary.com')) return url;

    const isPdfFile = isPdf || url.toLowerCase().includes('.pdf');
    if (isPdfFile) return getCloudinaryInlinePdfUrl(url);

    return url.replace(/\/upload\/(?:v\d+\/)?/, '/upload/w_1600,c_limit,f_auto,q_auto/');
};

/**
 * Trigger direct file download reliably across all browsers (handling cross-origin CORS)
 */
export const downloadFileFromUrl = async (url, originalName = 'document') => {
    if (!url) return;

    try {
        // Fetch as blob to force browser download dialog
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response not ok');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = originalName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
        // Fallback using Cloudinary fl_attachment header
        const downloadUrl = getCloudinaryDownloadUrl(url, originalName);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = originalName || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

/**
 * Extract clean file extension from filename or URL
 */
export const getFileExtension = (filename = '') => {
    if (!filename) return '';
    const cleanName = filename.split('?')[0];
    const parts = cleanName.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Check if a file/mimeType is an image
 */
export const isImageFile = (mimeType = '', filename = '') => {
    if (mimeType && mimeType.startsWith('image/')) return true;
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext);
};

/**
 * Check if a file/mimeType is a PDF
 */
export const isPdfFile = (mimeType = '', filename = '') => {
    if (mimeType && mimeType === 'application/pdf') return true;
    const ext = getFileExtension(filename);
    return ext === 'pdf';
};
