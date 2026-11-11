import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaBuilding, FaCheck, FaMapMarkerAlt } from 'react-icons/fa';
import FirmBranchManager from './FirmBranchManager';
import '../FirmModule.css';

const FirmBranchModal = ({ show, onClose, firm }) => {
    const firmId = firm?.firmId || firm?.id;

    if (!firm) return null;

    const firmInitials = (firm.firmName || 'Firm')
        .split(' ')
        .map(w => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <Modal
            show={show}
            onHide={onClose}
            size="xl"
            centered
            backdrop="static"
            className="firm-module-root firm-branch-modal"
        >
            {/* Enhanced Premium Modal Header */}
            <div className="firm-branch-modal-header d-flex justify-content-between align-items-center py-3 px-4 bg-white border-bottom">
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
                        style={{
                            width: '46px',
                            height: '46px',
                            background: 'linear-gradient(135deg, #3a57e8 0%, #4f46e5 100%)',
                            color: '#ffffff',
                            fontSize: '1.1rem'
                        }}
                    >
                        {firm.logoUrl ? (
                            <img
                                src={firm.logoUrl}
                                alt={firm.firmName}
                                className="w-100 h-100 rounded-3"
                                style={{ objectFit: 'contain', padding: '3px', background: '#fff' }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement.innerText = firmInitials;
                                }}
                            />
                        ) : (
                            firmInitials
                        )}
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-1.5">
                                Branch Network: {firm.firmName}
                            </h5>
                            {firm.tradeName && firm.tradeName !== firm.firmName && (
                                <span className="badge bg-light text-secondary border fw-medium" style={{ fontSize: '0.74rem' }}>
                                    Trade: {firm.tradeName}
                                </span>
                            )}
                            <span className="badge bg-soft-primary text-primary fw-semibold" style={{ fontSize: '0.72rem' }}>
                                {firm.firmType || 'Firm Entity'}
                            </span>
                            {firm.gstin ? (
                                <span className="gstin-pill" style={{ fontSize: '0.72rem' }}>
                                    GSTIN: {firm.gstin}
                                </span>
                            ) : null}
                        </div>
                        <div className="text-muted small mt-1 d-flex align-items-center gap-3 flex-wrap">
                            <span>📍 Registered: {firm.city && firm.state ? `${firm.city}, ${firm.state}` : (firm.city || firm.state || 'India')}</span>
                            <span>•</span>
                            <span>Multi-facility logistics, plant allocation, Head Office routing, and localized GST billing</span>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={onClose}
                />
            </div>

            <Modal.Body className="p-0">
                <FirmBranchManager firmId={firmId} firm={firm} noCard={true} readOnly={true} />
            </Modal.Body>

            <Modal.Footer className="py-2.5 px-4 d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                    View-only directory. To register, update, or remove branches, please navigate to <strong>Edit Firm</strong>.
                </div>
                <Button variant="primary" size="sm" onClick={onClose} className="px-4 fw-semibold d-inline-flex align-items-center gap-1.5 shadow-sm">
                    <FaCheck size={11} /> Done
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default React.memo(FirmBranchModal);
