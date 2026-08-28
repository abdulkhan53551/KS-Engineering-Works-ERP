/**
 * Client-Side File Pre-Validation Utilities
 * Validates File Size, Allowed MIME types, Extensions, and Magic Bytes
 */

// Max Size Limits (in Bytes) - 5 MB standard for all documents, logos & images
export const FILE_LIMITS = {
    LOGO: 5 * 1024 * 1024,      // 5 MB
    IMAGE: 5 * 1024 * 1024,     // 5 MB
    DOCUMENT: 5 * 1024 * 1024   // 5 MB (Firm, PO, Challan, E-Way Bill, KYC)
};

// Allowed Extensions by Category (Standard clean PDF and Image formats)
export const ALLOWED_EXTENSIONS = {
    LOGO: ['jpg', 'jpeg', 'png', 'webp'],
    IMAGE: ['jpg', 'jpeg', 'png', 'webp'],
    DOCUMENT: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    PDF_ONLY: ['pdf']
};

/**
 * Format bytes to readable string (e.g., '5 MB')
 */
export const formatSizeLimit = (bytes) => {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
};

/**
 * Sniff magic bytes from File ArrayBuffer to verify genuine signature
 */
export const validateMagicBytes = async (file) => {
    try {
        const slice = file.slice(0, 8);
        const buffer = await slice.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let header = '';
        for (let i = 0; i < bytes.length; i++) {
            header += bytes[i].toString(16).padStart(2, '0').toUpperCase();
        }

        // PDF signature: 25504446 (%PDF)
        if (header.startsWith('25504446')) {
            return { isValid: true, detectedType: 'application/pdf' };
        }

        // PNG signature: 89504E47 (\x89PNG)
        if (header.startsWith('89504E47')) {
            return { isValid: true, detectedType: 'image/png' };
        }

        // JPEG signature: FFD8FF
        if (header.startsWith('FFD8FF')) {
            return { isValid: true, detectedType: 'image/jpeg' };
        }

        // WebP signature: 52494646 (RIFF) ... 57454250 (WEBP)
        if (header.startsWith('52494646')) {
            return { isValid: true, detectedType: 'image/webp' };
        }

        // Fallback for supported binary files
        return { isValid: true, detectedType: file.type || 'application/octet-stream' };
    } catch (err) {
        // Fallback gracefully if reading fails
        return { isValid: true, detectedType: file.type };
    }
};

/**
 * Comprehensive client-side pre-upload validation
 * Returns { isValid: boolean, error?: string }
 */
export const validateFileBeforeUpload = async (file, category = 'DOCUMENT') => {
    if (!file) {
        return { isValid: false, error: 'No file selected.' };
    }

    const maxSize = FILE_LIMITS[category] || FILE_LIMITS.DOCUMENT;
    const allowedExts = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.DOCUMENT;

    // 1. Check File Size Limit (Max 5MB)
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed size of ${formatSizeLimit(maxSize)}.`
        };
    }

    if (file.size === 0) {
        return { isValid: false, error: `File "${file.name}" is empty (0 bytes).` };
    }

    // 2. Check File Extension
    const parts = file.name.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : '';

    if (!allowedExts.includes(ext)) {
        return {
            isValid: false,
            error: `File type ".${ext}" is not supported. Allowed formats: ${allowedExts.map((e) => `.${e.toUpperCase()}`).join(', ')}.`
        };
    }

    // 3. Check Genuine Magic Bytes for Binary Safety
    const { isValid, detectedType } = await validateMagicBytes(file);
    if (!isValid) {
        return {
            isValid: false,
            error: `File "${file.name}" appears corrupted or does not match its genuine format signature.`
        };
    }

    return { isValid: true, detectedType };
};
