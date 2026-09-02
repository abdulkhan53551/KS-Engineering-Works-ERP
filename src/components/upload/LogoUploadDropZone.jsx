import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, Button, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCamera, FaTrash, FaPen } from 'react-icons/fa';
import useCloudinaryUpload from '../../hooks/useCloudinaryUpload';
import { destroyCloudinaryAssetApi } from '../../views/attachments/api';
import defaultLogo from '../../assets/images/shapes/01.png';
import { validateFileBeforeUpload, FILE_LIMITS } from '../../utils/fileValidator';
import { toast } from 'react-toastify';

const LogoUploadDropZone = ({
    value, // logoUrl
    publicId, // logoPublicId
    onChange, // ({ logoUrl, logoPublicId }) => void
    disabled = false,
    folder = 'parties/logos',
    tags = 'ks-erp,logo'
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const { uploadFile, isUploading, uploadProgress, resetUpload } = useCloudinaryUpload();

    const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
        if (fileRejections && fileRejections.length > 0) {
            const rejection = fileRejections[0];
            const file = rejection.file;
            const error = rejection.errors[0];

            let errMsg = `Logo file "${file.name}" was rejected.`;
            if (error?.code === 'file-too-large') {
                errMsg = `Logo exceeds 5 MB limit.`;
            } else if (error?.code === 'file-invalid-type') {
                errMsg = `Invalid image format. Allowed: JPG, PNG, WebP, SVG.`;
            } else if (error?.message) {
                errMsg = error.message;
            }

            toast.error(errMsg);
            return;
        }

        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const oldPublicId = publicId;

            const validation = await validateFileBeforeUpload(file, 'LOGO');
            if (!validation.isValid) {
                toast.error(validation.error);
                return;
            }

            try {
                const res = await uploadFile(file, {
                    folder,
                    tags,
                    category: 'LOGO'
                });

                if (oldPublicId && oldPublicId !== res.publicId) {
                    try {
                        await destroyCloudinaryAssetApi({ publicId: oldPublicId, resourceType: 'image' });
                    } catch (cleanErr) {
                        console.warn('Could not clean previous Cloudinary logo:', cleanErr);
                        const cleanMsg = cleanErr.response?.data?.message || cleanErr.message;
                        if (cleanMsg) {
                            toast.warning(`Cloud storage notice: ${cleanMsg}`);
                        }
                    }
                }

                if (onChange) {
                    onChange({
                        logoUrl: res.secureUrl,
                        logoPublicId: res.publicId
                    });
                }
                toast.success('Logo updated!');
            } catch (err) {
                console.error('Logo upload error:', err);
                toast.error(err.response?.data?.message || err.message || 'Failed to upload logo');
            }
        }
    }, [folder, onChange, publicId, uploadFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        disabled: disabled || isUploading || isDeleting,
        maxSize: FILE_LIMITS.LOGO, // 5 MB max
        accept: 'image/jpeg, image/png, image/webp, image/svg+xml, .jpg, .jpeg, .png, .webp, .svg'
    });

    const handleRemove = async (e) => {
        e.stopPropagation();
        const currentPublicId = publicId;

        setIsDeleting(true);
        resetUpload();

        if (currentPublicId) {
            try {
                await destroyCloudinaryAssetApi({ publicId: currentPublicId, resourceType: 'image' });
                toast.info('Logo removed successfully');
            } catch (err) {
                console.warn('Failed to destroy Cloudinary logo asset:', err);
                const errMsg = err.response?.data?.message || err.message || 'Could not delete logo from cloud storage';
                toast.warning(errMsg);
            }
        } else {
            toast.info('Logo removed');
        }

        if (onChange) {
            onChange({
                logoUrl: '',
                logoPublicId: ''
            });
        }

        setIsDeleting(false);
    };

    const isBusy = isUploading || isDeleting;

    return (
        <div className="d-flex flex-column align-items-center justify-content-center p-2 rounded bg-light border" style={{ minWidth: '100px' }}>
            {/* Compact Avatar Frame with Badges */}
            <div className="position-relative" style={{ width: '74px', height: '74px' }}>
                <div
                    {...getRootProps()}
                    className={`w-100 h-100 rounded-circle border border-2 border-dashed d-flex align-items-center justify-content-center overflow-hidden cursor-pointer shadow-sm ${
                        isDragActive ? 'border-primary bg-soft-primary' : 'border-secondary bg-white hover-border-primary'
                    }`}
                    title="Click or drop to change logo"
                    style={{ transition: 'all 0.2s ease' }}
                >
                    <input {...getInputProps()} />

                    {/* Logo Image */}
                    <Image
                        src={value || defaultLogo}
                        alt="Logo"
                        className="w-100 h-100 object-fit-contain p-1 rounded-circle"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultLogo;
                        }}
                    />

                    {/* Progress / Spinner Overlay */}
                    {isBusy && (
                        <div className="position-absolute inset-0 bg-dark bg-opacity-75 d-flex flex-column align-items-center justify-content-center w-100 h-100 text-white rounded-circle">
                            <Spinner animation="border" size="sm" style={{ width: '1rem', height: '1rem' }} />
                            <span style={{ fontSize: '0.58rem' }}>
                                {isDeleting ? '...' : `${uploadProgress}%`}
                            </span>
                        </div>
                    )}

                    {/* Hover Camera Icon */}
                    {!isBusy && (
                        <div className="position-absolute inset-0 bg-dark bg-opacity-40 d-flex align-items-center justify-content-center w-100 h-100 opacity-0 hover-opacity-100 transition-all text-white rounded-circle">
                            <FaCamera size={14} />
                        </div>
                    )}
                </div>

                {/* Floating Bottom-Right Change/Upload Icon Button */}
                <OverlayTrigger placement="top" overlay={<Tooltip id="tt-upload-logo">{value ? 'Change Logo' : 'Upload Logo'}</Tooltip>}>
                    <div
                        {...getRootProps()}
                        className="position-absolute d-flex align-items-center justify-content-center bg-primary text-white rounded-circle shadow cursor-pointer"
                        style={{
                            bottom: '-2px',
                            right: '-2px',
                            width: '24px',
                            height: '24px',
                            zIndex: 3,
                            border: '2px solid #fff'
                        }}
                    >
                        <input {...getInputProps()} />
                        {value ? <FaPen size={9} /> : <FaCamera size={10} />}
                    </div>
                </OverlayTrigger>

                {/* Floating Top-Right Remove Icon Button (if logo exists) */}
                {value && !disabled && !isBusy && (
                    <OverlayTrigger placement="top" overlay={<Tooltip id="tt-remove-logo">Remove Logo</Tooltip>}>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="position-absolute d-flex align-items-center justify-content-center bg-danger text-white rounded-circle shadow border-0 cursor-pointer p-0"
                            style={{
                                top: '-3px',
                                right: '-3px',
                                width: '22px',
                                height: '22px',
                                zIndex: 4,
                                border: '2px solid #fff'
                            }}
                        >
                            <FaTrash size={8} />
                        </button>
                    </OverlayTrigger>
                )}
            </div>

            <span className="text-muted text-center mt-1" style={{ fontSize: '0.66rem', fontWeight: 500, lineHeight: 1.2 }}>
                Logo (5MB)
            </span>
        </div>
    );
};

export default LogoUploadDropZone;
