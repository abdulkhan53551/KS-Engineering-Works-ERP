import React, { useState } from 'react';
import { Modal, Button, Badge, Spinner, ButtonGroup } from 'react-bootstrap';
import {
    FaTimes,
    FaDownload,
    FaExternalLinkAlt,
    FaSearchPlus,
    FaSearchMinus,
    FaRedo,
    FaFilePdf,
    FaFileAlt,
    FaFileImage,
    FaGlobe,
    FaEye
} from 'react-icons/fa';
import {
    isPdfFile,
    isImageFile,
    formatBytes,
    getCloudinaryInlinePdfUrl,
    getGoogleDocsPdfViewerUrl,
    downloadFileFromUrl
} from '../../utils/cloudinary';
import moment from 'moment';

const DocumentPreviewModal = ({ show, onHide, attachment }) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [pdfViewerMode, setPdfViewerMode] = useState('google'); // 'google' | 'direct'

    if (!attachment) return null;

    const {
        title,
        originalName,
        secureUrl,
        fileSizeBytes,
        mimeType,
        docType,
        createdAt,
        createdBy
    } = attachment;

    const isPdf = isPdfFile(mimeType, originalName || secureUrl);
    const isImage = isImageFile(mimeType, originalName || secureUrl);

    // Get optimized URLs
    const inlinePdfUrl = getCloudinaryInlinePdfUrl(secureUrl);
    const googleDocsPdfUrl = getGoogleDocsPdfViewerUrl(secureUrl);

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const handleRotateCw = () => setRotation((prev) => (prev + 90) % 360);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
    };

    const handleClose = () => {
        handleReset();
        setIsLoading(true);
        onHide();
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="xl"
            centered
            fullscreen="lg-down"
            className="document-preview-modal"
        >
            <Modal.Header className="bg-dark text-white border-bottom border-secondary py-2.5 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2 overflow-hidden me-2" style={{ maxWidth: '45%' }}>
                    {isPdf ? (
                        <FaFilePdf className="text-danger flex-shrink-0" size={18} />
                    ) : isImage ? (
                        <FaFileImage className="text-info flex-shrink-0" size={18} />
                    ) : (
                        <FaFileAlt className="text-warning flex-shrink-0" size={18} />
                    )}
                    <div className="text-truncate">
                        <Modal.Title as="h6" className="text-white mb-0 fw-semibold text-truncate" style={{ fontSize: '0.90rem' }}>
                            {title || originalName || 'Document Preview'}
                        </Modal.Title>
                        <span className="text-muted small text-truncate d-block" style={{ fontSize: '0.70rem' }}>
                            {originalName} • {formatBytes(fileSizeBytes)}
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                    {docType && (
                        <Badge bg="soft-primary" className="text-primary text-uppercase d-none d-md-inline-block" style={{ fontSize: '0.70rem' }}>
                            {docType.replace(/_/g, ' ')}
                        </Badge>
                    )}

                    {/* PDF Viewer Mode Toggle */}
                    {isPdf && (
                        <ButtonGroup size="sm" className="me-1">
                            <Button
                                variant={pdfViewerMode === 'google' ? 'primary' : 'outline-secondary'}
                                className="py-1 px-2 text-white"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => {
                                    setPdfViewerMode('google');
                                    setIsLoading(true);
                                }}
                                title="Use Google Docs PDF Viewer"
                            >
                                <FaGlobe className="me-1" size={11} /> Universal View
                            </Button>
                            <Button
                                variant={pdfViewerMode === 'direct' ? 'primary' : 'outline-secondary'}
                                className="py-1 px-2 text-white"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => {
                                    setPdfViewerMode('direct');
                                    setIsLoading(true);
                                }}
                                title="Use Direct Browser PDF Viewer"
                            >
                                <FaEye className="me-1" size={11} /> Direct PDF
                            </Button>
                        </ButtonGroup>
                    )}

                    {/* Image Controls */}
                    {isImage && (
                        <div className="d-flex align-items-center bg-secondary bg-opacity-25 rounded p-0.5 me-1">
                            <Button variant="link" size="sm" className="text-white p-1" onClick={handleZoomIn} title="Zoom In">
                                <FaSearchPlus size={13} />
                            </Button>
                            <Button variant="link" size="sm" className="text-white p-1" onClick={handleZoomOut} title="Zoom Out">
                                <FaSearchMinus size={13} />
                            </Button>
                            <Button variant="link" size="sm" className="text-white p-1" onClick={handleRotateCw} title="Rotate 90°">
                                <FaRedo size={12} />
                            </Button>
                            {(zoom !== 1 || rotation !== 0) && (
                                <Button variant="link" size="sm" className="text-info p-1" onClick={handleReset} title="Reset View" style={{ fontSize: '0.7rem' }}>
                                    Reset
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Open in New Tab */}
                    <a
                        href={inlinePdfUrl || secureUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-light d-flex align-items-center gap-1 py-1 px-2.5"
                        style={{ fontSize: '0.76rem' }}
                    >
                        <FaExternalLinkAlt size={11} />
                        <span className="d-none d-sm-inline">Open Tab</span>
                    </a>

                    {/* Download */}
                    <Button
                        variant="primary"
                        size="sm"
                        className="d-flex align-items-center gap-1 py-1 px-2.5"
                        style={{ fontSize: '0.76rem' }}
                        onClick={() => downloadFileFromUrl(secureUrl, originalName)}
                        title="Download Document"
                    >
                        <FaDownload size={11} />
                        <span className="d-none d-sm-inline">Download</span>
                    </Button>

                    <Button variant="link" className="text-white p-1 ms-1" onClick={handleClose}>
                        <FaTimes size={16} />
                    </Button>
                </div>
            </Modal.Header>

            <Modal.Body className="p-0 bg-dark d-flex align-items-center justify-content-center position-relative overflow-hidden" style={{ minHeight: '68vh', maxHeight: '82vh' }}>
                {isLoading && (
                    <div className="position-absolute d-flex align-items-center gap-2 text-white bg-dark bg-opacity-75 p-3 rounded shadow" style={{ zIndex: 10 }}>
                        <Spinner animation="border" size="sm" className="text-primary" />
                        <span style={{ fontSize: '0.84rem' }}>Loading preview...</span>
                    </div>
                )}

                {isPdf ? (
                    <iframe
                        key={pdfViewerMode}
                        src={pdfViewerMode === 'google' ? googleDocsPdfUrl : `${inlinePdfUrl}#toolbar=1&navpanes=0`}
                        title={originalName || 'PDF Viewer'}
                        width="100%"
                        height="100%"
                        onLoad={() => setIsLoading(false)}
                        style={{ minHeight: '68vh', border: 'none', background: '#fff' }}
                    />
                ) : isImage ? (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center overflow-auto p-3" style={{ minHeight: '68vh' }}>
                        <img
                            src={secureUrl}
                            alt={originalName || 'Document'}
                            onLoad={() => setIsLoading(false)}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '76vh',
                                objectFit: 'contain',
                                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                transition: 'transform 0.2s ease',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                display: isLoading ? 'none' : 'block'
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-center text-white py-5 px-4">
                        <FaFileAlt size={48} className="text-warning mb-3" />
                        <h6 className="text-white mb-2">Preview not available for this file type</h6>
                        <p className="text-muted small mb-3">You can download this file to inspect it on your computer.</p>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => downloadFileFromUrl(secureUrl, originalName)}
                        >
                            <FaDownload className="me-1" /> Download {originalName}
                        </Button>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="bg-dark text-muted py-2 px-4 border-top border-secondary d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ fontSize: '0.74rem' }}>
                <div>
                    {createdBy && <span>Uploaded by: <strong className="text-light">{createdBy}</strong> • </span>}
                    {createdAt && <span>Date: <strong className="text-light">{moment(createdAt).format('DD/MM/YYYY hh:mm A')}</strong></span>}
                </div>
                <div className="d-flex align-items-center gap-2">
                    {isPdf && (
                        <span className="text-muted small d-none d-md-inline">
                            Tip: If preview doesn't load, switch to <strong>Direct PDF</strong> or click <strong>Open Tab</strong>.
                        </span>
                    )}
                    <Button variant="secondary" size="sm" onClick={handleClose} style={{ fontSize: '0.78rem' }}>
                        Close Preview
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default DocumentPreviewModal;
