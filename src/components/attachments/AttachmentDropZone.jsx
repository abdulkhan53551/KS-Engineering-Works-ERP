import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Form, Button, ProgressBar, Row, Col, Alert } from 'react-bootstrap';
import {
    FaCloudUploadAlt,
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaTimes,
    FaCheckCircle,
    FaPaste
} from 'react-icons/fa';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';
import { useCreateAttachment } from '../../hooks/useAttachments';
import { formatBytes } from '../../utils/cloudinary';
import { validateFileBeforeUpload, FILE_LIMITS } from '../../utils/fileValidator';
import { toast } from 'react-toastify';

const DEFAULT_DOC_TYPES = [
    { value: 'GST_CERT', label: 'GST Registration Certificate' },
    { value: 'PAN_CARD', label: 'PAN Card Copy' },
    { value: 'LOGO', label: 'Company Logo / Avatar' },
    { value: 'MSME_CERT', label: 'MSME / Udyam Certificate' },
    { value: 'CHEQUE', label: 'Cancelled Cheque / Bank Proof' },
    { value: 'AGREEMENT', label: 'Contract / Agreement' },
    { value: 'OTHER', label: 'General / Other Document' }
];

const AttachmentDropZone = ({
    entityType,
    entityId,
    docTypeOptions = DEFAULT_DOC_TYPES,
    defaultDocType = 'GST_CERT',
    folder = `ks-erp/${(entityType || 'general').toLowerCase()}/attachments`,
    onUploadSuccess
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [docType, setDocType] = useState(defaultDocType);
    const [title, setTitle] = useState('');
    const [validationError, setValidationError] = useState('');

    const { uploadFile, isUploading, uploadProgress, error: uploadError, resetUpload } = useCloudinaryUpload();
    const { mutateAsync: createAttachment, isPending: isSavingRecord } = useCreateAttachment();

    // Reset when entity changes
    useEffect(() => {
        setDocType(defaultDocType);
    }, [defaultDocType]);

    // Handle File Drop & Rejections
    const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
        setValidationError('');

        // Handle Rejections first (file too large or invalid type)
        if (fileRejections && fileRejections.length > 0) {
            const rejection = fileRejections[0];
            const file = rejection.file;
            const error = rejection.errors[0];

            let errMsg = `File "${file.name}" was rejected.`;
            if (error?.code === 'file-too-large') {
                errMsg = `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB maximum limit.`;
            } else if (error?.code === 'file-invalid-type') {
                errMsg = `File "${file.name}" has an unsupported format. Allowed: PDF, JPG, PNG, WebP.`;
            } else if (error?.message) {
                errMsg = error.message;
            }

            setValidationError(errMsg);
            toast.error(errMsg);
            return;
        }

        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];

            // Perform deep pre-validation (size + magic bytes)
            const validation = await validateFileBeforeUpload(file, 'DOCUMENT');
            if (!validation.isValid) {
                setValidationError(validation.error);
                toast.error(validation.error);
                return;
            }

            setSelectedFile(file);
            if (!title) {
                const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
                setTitle(cleanTitle);
            }
            resetUpload();
        }
    }, [title, resetUpload]);

    // Handle Paste from Clipboard (Ctrl+V)
    useEffect(() => {
        const handlePaste = async (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        const file = new File([blob], `Screenshot_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`, { type: blob.type });

                        const validation = await validateFileBeforeUpload(file, 'DOCUMENT');
                        if (!validation.isValid) {
                            setValidationError(validation.error);
                            toast.error(validation.error);
                            return;
                        }

                        setSelectedFile(file);
                        setTitle(`Pasted Screenshot ${new Date().toLocaleTimeString()}`);
                        toast.info('Screenshot captured from clipboard!');
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        maxSize: FILE_LIMITS.DOCUMENT, // 5 MB
        accept: 'image/jpeg, image/png, image/webp, application/pdf, .pdf, .jpg, .jpeg, .png, .webp'
    });

    const handleClearSelected = () => {
        setSelectedFile(null);
        setTitle('');
        setValidationError('');
        resetUpload();
    };

    // Execute Upload & Save
    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            // 1. Upload to Cloudinary with category validation
            const uploadRes = await uploadFile(selectedFile, {
                folder,
                tags: `ks-erp,${entityType?.toLowerCase() || 'general'}`,
                category: 'DOCUMENT'
            });

            // 2. Save attachment record in ERP database
            const payload = {
                entityType,
                entityId: Number(entityId) || entityId,
                docType,
                title: title.trim() || selectedFile.name,
                originalName: uploadRes.originalName,
                fileSizeBytes: uploadRes.bytes,
                mimeType: uploadRes.mimeType,
                publicId: uploadRes.publicId,
                secureUrl: uploadRes.secureUrl,
                resourceType: uploadRes.resourceType
            };

            await createAttachment(payload);

            // 3. Clear file selection
            handleClearSelected();
            if (onUploadSuccess) onUploadSuccess(uploadRes);
        } catch (err) {
            console.error('Upload flow error:', err);
            toast.error(err.response?.data?.message || err.message || 'Upload failed');
        }
    };

    const isProcessing = isUploading || isSavingRecord;
    const activeError = validationError || uploadError;

    return (
        <div className="attachment-dropzone-wrapper p-3.5 bg-white border rounded shadow-sm mb-4">
            <h6 className="fw-bold text-dark mb-2 d-flex align-items-center justify-content-between" style={{ fontSize: '0.88rem' }}>
                <span>Upload New Document</span>
                <span className="text-muted fw-normal small" style={{ fontSize: '0.72rem' }}>
                    <FaPaste className="me-1 text-primary" /> Paste (Ctrl+V) supported
                </span>
            </h6>

            {activeError && (
                <Alert variant="danger" className="py-2 px-3 small mb-3 d-flex align-items-center justify-content-between">
                    <span>{activeError}</span>
                    <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => setValidationError('')}>
                        <FaTimes size={12} />
                    </Button>
                </Alert>
            )}

            {!selectedFile ? (
                /* Dropzone Area */
                <div
                    {...getRootProps()}
                    className={`border border-2 border-dashed rounded p-4 text-center cursor-pointer transition-all ${isDragActive ? 'border-primary bg-soft-primary' : 'border-secondary bg-light bg-opacity-50 hover-border-primary'
                        }`}
                    style={{ transition: 'all 0.2s ease', minHeight: '130px' }}
                >
                    <input {...getInputProps()} />
                    <FaCloudUploadAlt className={isDragActive ? 'text-primary' : 'text-muted'} size={38} />
                    <p className="mb-1 mt-2 fw-semibold text-dark" style={{ fontSize: '0.84rem' }}>
                        {isDragActive ? 'Drop file here...' : 'Drag & drop document here, or click to browse'}
                    </p>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Supported formats: PDF, JPG, PNG, WebP (Max 5MB)
                    </span>
                </div>
            ) : (
                /* File Selected Stage */
                <div className="p-3 bg-light rounded border">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                            {selectedFile.type === 'application/pdf' ? (
                                <FaFilePdf className="text-danger flex-shrink-0" size={26} />
                            ) : selectedFile.type.startsWith('image/') ? (
                                <FaFileImage className="text-primary flex-shrink-0" size={26} />
                            ) : (
                                <FaFileAlt className="text-warning flex-shrink-0" size={26} />
                            )}
                            <div className="text-truncate">
                                <span className="fw-semibold text-dark d-block text-truncate" style={{ fontSize: '0.85rem' }}>
                                    {selectedFile.name}
                                </span>
                                <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                    {formatBytes(selectedFile.size)}
                                </span>
                            </div>
                        </div>

                        {!isProcessing && (
                            <Button variant="outline-danger" size="sm" className="p-1 px-2" onClick={handleClearSelected} title="Remove selected file">
                                <FaTimes size={12} />
                            </Button>
                        )}
                    </div>

                    <Row className="g-2 mb-3">
                        <Col md={5}>
                            <Form.Label className="mb-1 text-muted small" style={{ fontSize: '0.74rem' }}>
                                Document Category <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                                size="sm"
                                value={docType}
                                onChange={(e) => setDocType(e.target.value)}
                                disabled={isProcessing}
                                style={{ fontSize: '0.82rem' }}
                            >
                                {docTypeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={7}>
                            <Form.Label className="mb-1 text-muted small" style={{ fontSize: '0.74rem' }}>
                                Document Title / Remarks
                            </Form.Label>
                            <Form.Control
                                size="sm"
                                type="text"
                                placeholder="e.g. GST Registration Certificate 2026"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isProcessing}
                                style={{ fontSize: '0.82rem' }}
                            />
                        </Col>
                    </Row>

                    {isProcessing && (
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1 small">
                                <span className="text-primary fw-medium" style={{ fontSize: '0.74rem' }}>
                                    {isUploading ? `Uploading to Cloudinary... ${uploadProgress}%` : 'Saving attachment record...'}
                                </span>
                                <span className="text-muted font-monospace" style={{ fontSize: '0.74rem' }}>
                                    {uploadProgress}%
                                </span>
                            </div>
                            <ProgressBar
                                animated
                                now={uploadProgress}
                                variant={uploadProgress === 100 ? 'success' : 'primary'}
                                style={{ height: '6px' }}
                            />
                        </div>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handleClearSelected}
                            disabled={isProcessing}
                            style={{ fontSize: '0.80rem' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleUpload}
                            disabled={isProcessing}
                            className="d-flex align-items-center gap-1.5 px-3"
                            style={{ fontSize: '0.80rem', fontWeight: 600 }}
                        >
                            <FaCheckCircle size={12} />
                            <span>{isProcessing ? 'Processing...' : 'Upload & Attach'}</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttachmentDropZone;
