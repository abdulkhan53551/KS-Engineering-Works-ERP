import React, { useState, useMemo } from 'react';
import { Row, Col, Button, Badge, Spinner, Form } from 'react-bootstrap';
import {
    FaPlus,
    FaFolderOpen,
    FaSearch,
    FaTimes
} from 'react-icons/fa';
import AttachmentDropZone from './AttachmentDropZone';
import AttachmentCard from './AttachmentCard';
import DocumentPreviewModal from './DocumentPreviewModal';
import { useAttachments, useDeleteAttachment } from '../../hooks/useAttachments';
import Swal from 'sweetalert2';

const DEFAULT_DOC_TYPES = [
    { value: 'GST_CERT', label: 'GST Certificate' },
    { value: 'PAN_CARD', label: 'PAN Card' },
    { value: 'MSME_CERT', label: 'MSME / Udyam' },
    { value: 'CHEQUE', label: 'Bank Proof' },
    { value: 'AGREEMENT', label: 'Agreement' },
    { value: 'LOGO', label: 'Brand Logo' },
    { value: 'OTHER', label: 'Other' }
];

const AttachmentManager = ({
    entityType = 'PARTY',
    entityId,
    docTypeOptions = DEFAULT_DOC_TYPES,
    readOnly = false,
    folder
}) => {
    const [selectedDocTypeFilter, setSelectedDocTypeFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewAttachment, setPreviewAttachment] = useState(null);
    const [showUploadZone, setShowUploadZone] = useState(!readOnly);

    // Fetch attachments polymorphically
    const {
        data: attachments = [],
        isLoading,
        refetch
    } = useAttachments({ entityType, entityId, enabled: Boolean(entityId) });

    const { mutate: deleteAttachment, isPending: isDeleting } = useDeleteAttachment();

    // Filter attachments by selected category and search query
    const filteredAttachments = useMemo(() => {
        return attachments.filter((att) => {
            const matchesCategory = !selectedDocTypeFilter || att.docType === selectedDocTypeFilter;
            const matchesSearch = !searchQuery ||
                (att.title && att.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (att.originalName && att.originalName.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [attachments, selectedDocTypeFilter, searchQuery]);

    // Handle Delete Confirmation
    const handleDelete = (id, fileName) => {
        Swal.fire({
            title: 'Delete Document?',
            text: `Permanently delete "${fileName}" from database and Cloudinary storage?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Delete Permanently',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAttachment(id);
            }
        });
    };

    return (
        <div className="attachment-manager-container">
            {/* Header: Title, Total Badge & Upload Toggle */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.90rem' }}>
                        Attached Documents
                    </h6>
                    <Badge bg="soft-primary" className="text-primary px-2 py-0.5 rounded-pill fw-semibold" style={{ fontSize: '0.72rem' }}>
                        {attachments.length} {attachments.length === 1 ? 'File' : 'Files'}
                    </Badge>
                </div>

                {!readOnly && (
                    <Button
                        variant={showUploadZone ? 'outline-secondary' : 'primary'}
                        size="sm"
                        className="d-flex align-items-center gap-1.5 py-1 px-3 shadow-sm rounded-2"
                        style={{ fontSize: '0.78rem', fontWeight: 500 }}
                        onClick={() => setShowUploadZone((prev) => !prev)}
                    >
                        <FaPlus size={10} />
                        <span>{showUploadZone ? 'Hide Uploader' : 'Add Document'}</span>
                    </Button>
                )}
            </div>

            {/* DropZone Section */}
            {!readOnly && showUploadZone && (
                <AttachmentDropZone
                    entityType={entityType}
                    entityId={entityId}
                    docTypeOptions={docTypeOptions}
                    folder={folder || `ks-erp/${entityType.toLowerCase()}/attachments`}
                    onUploadSuccess={() => refetch()}
                />
            )}

            {/* Clean Underline Navigation Tabs & Quick Search */}
            {attachments.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 border-bottom" style={{ borderColor: '#e5e7eb' }}>
                    {/* Left: Underline Tab Links */}
                    <div className="d-flex align-items-center gap-1 overflow-auto flex-nowrap" style={{ marginBottom: '-1px' }}>
                        {/* 'All' Tab */}
                        <button
                            type="button"
                            className="bg-transparent border-0 py-2 px-3 d-flex align-items-center gap-1.5 transition-all"
                            style={{
                                fontSize: '0.80rem',
                                fontWeight: selectedDocTypeFilter === '' ? 600 : 500,
                                color: selectedDocTypeFilter === '' ? '#3a57e8' : '#6c757d',
                                borderBottom: selectedDocTypeFilter === '' ? '2px solid #3a57e8' : '2px solid transparent',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={() => setSelectedDocTypeFilter('')}
                        >
                            <span>All Documents</span>
                            <span
                                className={`badge rounded-pill px-1.5 py-0.5 ms-0.5 ${
                                    selectedDocTypeFilter === '' ? 'bg-soft-primary text-primary' : 'bg-light text-muted border'
                                }`}
                                style={{ fontSize: '0.65rem' }}
                            >
                                {attachments.length}
                            </span>
                        </button>

                        {/* Category Specific Tabs */}
                        {docTypeOptions.map((opt) => {
                            const count = attachments.filter((a) => a.docType === opt.value).length;
                            if (count === 0) return null;

                            const isSelected = selectedDocTypeFilter === opt.value;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className="bg-transparent border-0 py-2 px-3 d-flex align-items-center gap-1.5 transition-all"
                                    style={{
                                        fontSize: '0.80rem',
                                        fontWeight: isSelected ? 600 : 500,
                                        color: isSelected ? '#3a57e8' : '#6c757d',
                                        borderBottom: isSelected ? '2px solid #3a57e8' : '2px solid transparent',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onClick={() => setSelectedDocTypeFilter(opt.value)}
                                >
                                    <span>{opt.label}</span>
                                    <span
                                        className={`badge rounded-pill px-1.5 py-0.5 ms-0.5 ${
                                            isSelected ? 'bg-soft-primary text-primary' : 'bg-light text-muted border'
                                        }`}
                                        style={{ fontSize: '0.65rem' }}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right: Quick Search Input */}
                    {attachments.length > 2 && (
                        <div className="position-relative mb-1" style={{ width: '180px' }}>
                            <Form.Control
                                size="sm"
                                type="text"
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ps-4 pe-4 rounded-pill bg-light border-0"
                                style={{ fontSize: '0.75rem' }}
                            />
                            <FaSearch className="position-absolute text-muted" size={11} style={{ left: '10px', top: '9px' }} />
                            {searchQuery && (
                                <FaTimes
                                    className="position-absolute text-muted cursor-pointer hover-text-dark"
                                    size={11}
                                    style={{ right: '10px', top: '9px' }}
                                    onClick={() => setSearchQuery('')}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isLoading ? (
                <div className="text-center py-5 text-muted">
                    <Spinner animation="border" size="sm" className="text-primary me-2" />
                    <span style={{ fontSize: '0.84rem' }}>Loading documents...</span>
                </div>
            ) : filteredAttachments.length === 0 ? (
                /* Empty State */
                <div className="text-center py-4 px-3 bg-light rounded-3 border border-dashed my-2">
                    <FaFolderOpen className="text-muted mb-2 opacity-50" size={32} />
                    <h6 className="fw-semibold text-dark mb-1" style={{ fontSize: '0.86rem' }}>
                        {selectedDocTypeFilter || searchQuery ? 'No documents match your filter' : 'No documents attached yet'}
                    </h6>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.76rem' }}>
                        {readOnly
                            ? 'No files are associated with this record.'
                            : 'Upload registration certificates, PAN cards, or legal agreements above.'}
                    </p>
                </div>
            ) : (
                /* Attachments Responsive Grid */
                <Row className="g-3">
                    {filteredAttachments.map((att) => (
                        <Col key={att.id || att.publicId} xl={3} lg={4} md={6} sm={12}>
                            <AttachmentCard
                                attachment={att}
                                onPreview={(item) => setPreviewAttachment(item)}
                                onDelete={readOnly ? null : handleDelete}
                                isDeleting={isDeleting}
                            />
                        </Col>
                    ))}
                </Row>
            )}

            {/* Universal Document Lightbox & PDF Viewer Modal */}
            <DocumentPreviewModal
                show={Boolean(previewAttachment)}
                onHide={() => setPreviewAttachment(null)}
                attachment={previewAttachment}
            />
        </div>
    );
};

export default AttachmentManager;
