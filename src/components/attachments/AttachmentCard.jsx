import React, { useState } from 'react';
import { Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    FaEye,
    FaDownload,
    FaTrash,
    FaFilePdf,
    FaFileImage,
    FaFileAlt,
    FaFileContract,
    FaIdCard,
    FaCertificate,
    FaMoneyCheckAlt,
    FaFileSignature,
    FaBuilding,
    FaFileInvoiceDollar,
    FaCogs,
    FaTruckLoading,
    FaTruck
} from 'react-icons/fa';
import {
    getCloudinaryThumb,
    isPdfFile,
    isImageFile,
    formatBytes,
    downloadFileFromUrl,
    getFileExtension
} from '../../utils/cloudinary';
import moment from 'moment';

const DOC_CONFIGS = {
    // Statutory & KYC
    GST_CERT: { label: 'GST Certificate', icon: FaFileContract, color: 'text-success' },
    PAN_CARD: { label: 'PAN Card', icon: FaIdCard, color: 'text-warning' },
    MSME_CERT: { label: 'MSME / Udyam', icon: FaCertificate, color: 'text-info' },
    CHEQUE: { label: 'Bank Proof / Cheque', icon: FaMoneyCheckAlt, color: 'text-primary' },
    AGREEMENT: { label: 'Agreement / Contract', icon: FaFileSignature, color: 'text-dark' },

    // Firm & Branding
    FIRM_LOGO: { label: 'Firm Logo', icon: FaBuilding, color: 'text-primary' },
    LOGO: { label: 'Brand Logo', icon: FaFileImage, color: 'text-info' },
    LETTERHEAD_HEADER: { label: 'Letterhead Header', icon: FaFileAlt, color: 'text-dark' },

    // Purchase Orders
    SIGNED_PO: { label: 'Signed PO', icon: FaFileSignature, color: 'text-primary' },
    VENDOR_QUOTATION: { label: 'Vendor Quotation', icon: FaFileInvoiceDollar, color: 'text-success' },
    ORDER_SPEC: { label: 'Order / Technical Spec', icon: FaFileAlt, color: 'text-dark' },

    // Delivery Challans & E-Way Bills
    SIGNED_CHALLAN: { label: 'Signed Challan / Gate Pass', icon: FaTruckLoading, color: 'text-primary' },
    EWAY_BILL_PDF: { label: 'E-Way Bill (PDF)', icon: FaTruck, color: 'text-danger' },

    // Fallback
    OTHER: { label: 'Document', icon: FaFileAlt, color: 'text-secondary' }
};

const AttachmentCard = ({
    attachment,
    onPreview,
    onDelete,
    isDeleting = false
}) => {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    if (!attachment) return null;

    const {
        id,
        title,
        originalName,
        secureUrl,
        fileSizeBytes,
        mimeType,
        docType = 'OTHER',
        createdAt
    } = attachment;

    const isPdf = isPdfFile(mimeType, originalName || secureUrl);
    const isImage = isImageFile(mimeType, originalName || secureUrl);
    const ext = getFileExtension(originalName || secureUrl).toUpperCase() || (isPdf ? 'PDF' : 'DOC');

    // High-res thumbnail
    const thumbUrl = getCloudinaryThumb(secureUrl, {
        width: 400,
        height: 280,
        isPdf,
        crop: 'fill'
    });

    const config = DOC_CONFIGS[docType] || DOC_CONFIGS.OTHER;
    const CategoryIcon = config.icon || FaFileAlt;

    return (
        <Card
            className="h-100 shadow-sm border rounded-3 overflow-hidden bg-white"
            style={{
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                borderColor: isHovered ? '#3a57e8' : '#e5e7eb',
                transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: isHovered ? '0 10px 20px -5px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 1. Header Bar: Clean Category Title & Icon on Left, Actions on Right */}
            <div
                className="d-flex align-items-center justify-content-between px-3 border-bottom bg-light bg-opacity-40"
                style={{ height: '38px', minHeight: '38px' }}
            >
                {/* Left: Category Icon & Label */}
                <div className="d-flex align-items-center gap-1.5 overflow-hidden me-2" style={{ maxWidth: '60%' }}>
                    <CategoryIcon className={`${config.color} flex-shrink-0`} size={13} />
                    <span className="fw-semibold text-dark small text-truncate ms-1" style={{ fontSize: '0.76rem', letterSpacing: '0.01em' }}>
                        {config.label}
                    </span>
                </div>

                {/* Right: Micro Action Buttons with Colored Hover States */}
                <div className="d-flex align-items-center gap-1 flex-shrink-0">
                    {/* Preview Button */}
                    <OverlayTrigger placement="top" overlay={<Tooltip id={`tt-prev-${id}`}>Preview Document</Tooltip>}>
                        <button
                            type="button"
                            className="btn btn-sm p-0 rounded-circle border-0 d-flex align-items-center justify-content-center text-muted"
                            onClick={() => onPreview(attachment)}
                            style={{
                                width: '26px',
                                height: '26px',
                                transition: 'all 0.15s ease',
                                background: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ebf3fe';
                                e.currentTarget.style.color = '#3a57e8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6c757d';
                            }}
                        >
                            <FaEye size={12} />
                        </button>
                    </OverlayTrigger>

                    {/* Download Button */}
                    <OverlayTrigger placement="top" overlay={<Tooltip id={`tt-dl-${id}`}>Download File</Tooltip>}>
                        <button
                            type="button"
                            className="btn btn-sm p-0 rounded-circle border-0 d-flex align-items-center justify-content-center text-muted"
                            onClick={() => downloadFileFromUrl(secureUrl, originalName)}
                            style={{
                                width: '26px',
                                height: '26px',
                                transition: 'all 0.15s ease',
                                background: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#e8f7f0';
                                e.currentTarget.style.color = '#1aa053';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#6c757d';
                            }}
                        >
                            <FaDownload size={11} />
                        </button>
                    </OverlayTrigger>

                    {/* Delete Button */}
                    {onDelete && (
                        <OverlayTrigger placement="top" overlay={<Tooltip id={`tt-del-${id}`}>Delete File</Tooltip>}>
                            <button
                                type="button"
                                className="btn btn-sm p-0 rounded-circle border-0 d-flex align-items-center justify-content-center text-muted"
                                onClick={() => onDelete(id, title || originalName)}
                                disabled={isDeleting}
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    transition: 'all 0.15s ease',
                                    background: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#fde8e8';
                                    e.currentTarget.style.color = '#c03221';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = '#6c757d';
                                }}
                            >
                                <FaTrash size={11} />
                            </button>
                        </OverlayTrigger>
                    )}
                </div>
            </div>

            {/* 2. Enhanced High-Visibility Thumbnail Canvas */}
            <div
                className="position-relative d-flex align-items-center justify-content-center cursor-pointer overflow-hidden p-2"
                style={{
                    height: '130px',
                    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
                }}
                onClick={() => onPreview(attachment)}
                title="Click to preview document"
            >
                {/* Framed High-Visibility Document Sheet */}
                <div
                    className="w-100 h-100 bg-white rounded-2 shadow-sm border d-flex align-items-center justify-content-center overflow-hidden position-relative"
                    style={{
                        transition: 'transform 0.2s ease',
                        transform: isHovered ? 'scale(1.02)' : 'scale(1)'
                    }}
                >
                    {(isImage || isPdf) && !imgError ? (
                        <img
                            src={thumbUrl}
                            alt={title || originalName}
                            className="w-100 h-100 object-fit-cover"
                            onLoad={() => setImgLoaded(true)}
                            onError={() => setImgError(true)}
                            style={{
                                opacity: imgLoaded ? 1 : 0,
                                transition: 'opacity 0.2s ease'
                            }}
                        />
                    ) : null}

                    {/* Fallback Graphic */}
                    {(!isImage && !isPdf) || imgError || !imgLoaded ? (
                        <div className="d-flex flex-column align-items-center justify-content-center text-center p-2">
                            {isPdf ? (
                                <FaFilePdf className="text-danger mb-1" size={28} />
                            ) : isImage ? (
                                <FaFileImage className="text-primary mb-1" size={28} />
                            ) : (
                                <FaFileAlt className="text-secondary mb-1" size={28} />
                            )}
                            <span className="font-monospace text-muted fw-bold" style={{ fontSize: '0.66rem' }}>
                                {ext}
                            </span>
                        </div>
                    ) : null}

                    {/* Corner Tag */}
                    <span
                        className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white font-monospace px-1.5 py-0.5"
                        style={{ fontSize: '0.55rem', borderTopLeftRadius: '4px' }}
                    >
                        {ext}
                    </span>
                </div>
            </div>

            {/* 3. Compact Streamlined Footer */}
            <Card.Body className="px-3 py-2 border-top bg-white d-flex flex-column justify-content-center">
                {/* Title */}
                <span
                    className="fw-bold text-dark text-truncate cursor-pointer hover-primary mb-0.5 d-block ps-1"
                    onClick={() => onPreview(attachment)}
                    title={title || originalName}
                    style={{ fontSize: '0.82rem', lineHeight: '1.25' }}
                >
                    {title || originalName}
                </span>

                {/* Compact Meta Line: Size & Date */}
                <div className="d-flex align-items-center justify-content-between text-muted ps-1" style={{ fontSize: '0.68rem' }}>
                    <span className="font-monospace fw-medium text-secondary">
                        {formatBytes(fileSizeBytes)}
                    </span>
                    <span>
                        {createdAt ? moment(createdAt).format('DD MMM YYYY') : '—'}
                    </span>
                </div>
            </Card.Body>
        </Card>
    );
};

export default AttachmentCard;
