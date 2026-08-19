import React, { useState } from 'react';
import { Offcanvas, Row, Col, Card, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaBuilding, FaIdCard, FaPhoneAlt, FaEnvelope, FaGlobe, FaStickyNote, FaCopy, FaCheck, FaExternalLinkAlt, FaClock } from 'react-icons/fa';
import PartyStatusBadge from './PartyStatusBadge';
import defaultLogo from '../../../assets/images/shapes/01.png';
import { toast } from 'react-toastify';

/**
 * Helper to copy text to clipboard with toast notification
 */
const CopyableField = ({ label, value, monospace = false }) => {
    const [copied, setCopied] = useState(false);

    if (!value) {
        return (
            <div className="mb-3">
                <span className="text-muted small d-block mb-1">{label}</span>
                <span className="text-secondary">—</span>
            </div>
        );
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.info(`${label} copied!`, { autoClose: 1500 });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mb-3">
            <span className="text-muted small d-block mb-1">{label}</span>
            <div className="d-flex align-items-center justify-content-between p-2 rounded bg-soft-light border">
                <span className={`text-dark ${monospace ? 'font-monospace fw-semibold' : 'fw-medium'}`} style={{ fontSize: '0.88rem' }}>
                    {value}
                </span>
                <OverlayTrigger placement="top" overlay={<Tooltip>{copied ? 'Copied!' : 'Copy'}</Tooltip>}>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="btn btn-sm btn-link p-0 text-muted hover-primary ms-2"
                        style={{ border: 'none', background: 'transparent' }}
                    >
                        {copied ? <FaCheck size={12} className="text-success" /> : <FaCopy size={12} />}
                    </button>
                </OverlayTrigger>
            </div>
        </div>
    );
};

const PartyDetailsDrawer = ({ show, onHide, party }) => {
    if (!party) return null;

    // Safe website URL formatting
    const websiteUrl = party.website
        ? party.website.startsWith('http://') || party.website.startsWith('https://')
            ? party.website
            : `https://${party.website}`
        : null;

    return (
        <Offcanvas
            show={show}
            onHide={onHide}
            placement="end"
            style={{ width: '450px', maxWidth: '100vw' }}
        >
            <Offcanvas.Header closeButton className="border-bottom bg-light py-3">
                <div className="d-flex align-items-center gap-3">
                    <img
                        className="bg-soft-primary rounded img-fluid avatar-40 p-1"
                        src={party.logoUrl || party.logo || defaultLogo}
                        alt="Party Logo"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultLogo;
                        }}
                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                    />
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <Badge bg="primary" className="font-monospace px-2 py-1" style={{ fontSize: '0.78rem' }}>
                                {party.partyCode || 'NO CODE'}
                            </Badge>
                            <PartyStatusBadge status={party.status} />
                        </div>
                        <Offcanvas.Title className="h6 mb-0 text-dark fw-bold">
                            {party.displayName || party.legalName || 'Party Details'}
                        </Offcanvas.Title>
                    </div>
                </div>
            </Offcanvas.Header>

            <Offcanvas.Body className="p-3">
                {/* 1. Identity / General Info */}
                <Card className="mb-3 border shadow-none">
                    <Card.Header className="bg-transparent py-2 border-bottom d-flex align-items-center gap-2">
                        <FaBuilding className="text-primary" />
                        <span className="fw-semibold text-dark small text-uppercase">Company Identity</span>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <div className="mb-2">
                            <span className="text-muted small d-block">Display Name</span>
                            <span className="fw-semibold text-dark">{party.displayName || '—'}</span>
                        </div>
                        <div className="mb-2">
                            <span className="text-muted small d-block">Legal Name</span>
                            <span className="text-dark">{party.legalName || '—'}</span>
                        </div>
                        <Row className="g-2">
                            <Col xs={6}>
                                <div className="mb-2">
                                    <span className="text-muted small d-block">Firm ID</span>
                                    <span className="badge bg-soft-info text-info font-monospace">
                                        {party.firmId ?? '—'}
                                    </span>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="mb-2">
                                    <span className="text-muted small d-block">Website</span>
                                    {websiteUrl ? (
                                        <a
                                            href={websiteUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary d-inline-flex align-items-center gap-1 small text-decoration-none hover-underline text-truncate"
                                            style={{ maxWidth: '100%' }}
                                        >
                                            <FaGlobe size={11} />
                                            <span>Visit Website</span>
                                            <FaExternalLinkAlt size={10} />
                                        </a>
                                    ) : (
                                        <span className="text-secondary small">—</span>
                                    )}
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 2. Tax & Compliance */}
                <Card className="mb-3 border shadow-none">
                    <Card.Header className="bg-transparent py-2 border-bottom d-flex align-items-center gap-2">
                        <FaIdCard className="text-primary" />
                        <span className="fw-semibold text-dark small text-uppercase">Tax & Compliance</span>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <div className="mb-3 d-flex justify-content-between align-items-center pb-2 border-bottom">
                            <span className="text-muted small">GST Status</span>
                            {party.gstRegistered ? (
                                <Badge bg="soft-success" className="text-success px-2 py-1 fw-semibold">
                                    GST Registered
                                </Badge>
                            ) : (
                                <Badge bg="soft-warning" className="text-warning px-2 py-1 fw-semibold">
                                    Unregistered
                                </Badge>
                            )}
                        </div>

                        <CopyableField label="GSTIN" value={party.gstin} monospace />
                        <CopyableField label="PAN Number" value={party.panNumber} monospace />

                        <Row className="g-2">
                            <Col xs={6}>
                                <div className="mb-2">
                                    <span className="text-muted small d-block">CIN Number</span>
                                    <span className="font-monospace small text-dark">{party.cinNumber || '—'}</span>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="mb-2">
                                    <span className="text-muted small d-block">TAN Number</span>
                                    <span className="font-monospace small text-dark">{party.tanNumber || '—'}</span>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 3. Contact & Communication */}
                <Card className="mb-3 border shadow-none">
                    <Card.Header className="bg-transparent py-2 border-bottom d-flex align-items-center gap-2">
                        <FaPhoneAlt className="text-primary" />
                        <span className="fw-semibold text-dark small text-uppercase">Contact Details</span>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <div className="mb-3">
                            <span className="text-muted small d-block mb-1">Mobile Number</span>
                            {party.mobile ? (
                                <div className="d-flex align-items-center justify-content-between p-2 rounded bg-soft-light border">
                                    <a
                                        href={`tel:${party.mobile}`}
                                        className="text-primary fw-medium text-decoration-none d-flex align-items-center gap-1.5"
                                        style={{ fontSize: '0.88rem' }}
                                    >
                                        <FaPhoneAlt size={12} />
                                        <span>{party.mobile}</span>
                                    </a>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>Copy Phone</Tooltip>}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(party.mobile);
                                                toast.info('Mobile number copied!', { autoClose: 1500 });
                                            }}
                                            className="btn btn-sm btn-link p-0 text-muted hover-primary ms-2"
                                            style={{ border: 'none', background: 'transparent' }}
                                        >
                                            <FaCopy size={12} />
                                        </button>
                                    </OverlayTrigger>
                                </div>
                            ) : (
                                <span className="text-secondary">—</span>
                            )}
                        </div>

                        <div className="mb-2">
                            <span className="text-muted small d-block mb-1">Email Address</span>
                            {party.email ? (
                                <div className="d-flex align-items-center justify-content-between p-2 rounded bg-soft-light border">
                                    <a
                                        href={`mailto:${party.email}`}
                                        className="text-primary fw-medium text-decoration-none d-flex align-items-center gap-1.5 text-truncate"
                                        style={{ fontSize: '0.88rem', maxWidth: '85%' }}
                                    >
                                        <FaEnvelope size={12} />
                                        <span className="text-truncate">{party.email}</span>
                                    </a>
                                    <OverlayTrigger placement="top" overlay={<Tooltip>Copy Email</Tooltip>}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(party.email);
                                                toast.info('Email address copied!', { autoClose: 1500 });
                                            }}
                                            className="btn btn-sm btn-link p-0 text-muted hover-primary ms-2"
                                            style={{ border: 'none', background: 'transparent' }}
                                        >
                                            <FaCopy size={12} />
                                        </button>
                                    </OverlayTrigger>
                                </div>
                            ) : (
                                <span className="text-secondary">—</span>
                            )}
                        </div>
                    </Card.Body>
                </Card>

                {/* 4. Remarks */}
                <Card className="mb-3 border shadow-none">
                    <Card.Header className="bg-transparent py-2 border-bottom d-flex align-items-center gap-2">
                        <FaStickyNote className="text-primary" />
                        <span className="fw-semibold text-dark small text-uppercase">Remarks & Notes</span>
                    </Card.Header>
                    <Card.Body className="p-3">
                        {party.remarks ? (
                            <div className="p-2.5 rounded bg-soft-warning border border-warning-subtle text-dark small">
                                {party.remarks}
                            </div>
                        ) : (
                            <span className="text-muted small font-italic">No remarks provided for this party.</span>
                        )}
                    </Card.Body>
                </Card>

                {/* 5. Audit & Activity */}
                <Card className="border shadow-none">
                    <Card.Header className="bg-transparent py-2 border-bottom d-flex align-items-center gap-2">
                        <FaClock className="text-primary" />
                        <span className="fw-semibold text-dark small text-uppercase">Audit & Activity</span>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <div className="mb-2">
                            <span className="text-muted small d-block">Added By</span>
                            <span className="fw-semibold text-dark small">{party.createdBy || '—'}</span>
                        </div>
                        <Row className="g-2">
                            <Col xs={6}>
                                <div className="mb-1">
                                    <span className="text-muted small d-block">Created At</span>
                                    <span className="small text-dark font-monospace">
                                        {party.createdAt ? new Date(party.createdAt).toLocaleDateString('en-GB') : '—'}
                                    </span>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="mb-1">
                                    <span className="text-muted small d-block">Last Modified</span>
                                    <span className="small text-dark font-monospace">
                                        {party.updatedAt ? new Date(party.updatedAt).toLocaleDateString('en-GB') : '—'}
                                    </span>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default PartyDetailsDrawer;
