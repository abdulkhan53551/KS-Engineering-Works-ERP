import React, { useState } from 'react';
import { Offcanvas, Row, Col, Card, Badge, OverlayTrigger, Tooltip, Image, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import {
    FaBox,
    FaPen,
    FaExternalLinkAlt,
    FaCopy,
    FaCheck,
    FaDraftingCompass,
    FaPercent,
    FaTag,
    FaWeightHanging,
    FaRulerCombined,
    FaLayerGroup,
    FaCogs,
    FaInfoCircle,
    FaFileAlt,
    FaClock,
    FaHistory
} from 'react-icons/fa';
import defaultProductImage from '../../../assets/images/shapes/01.png';
import { toast } from 'react-toastify';
import moment from 'moment';

/**
 * CopyableField Helper
 */
const CopyableField = ({ label, value, monospace = false }) => {
    const [copied, setCopied] = useState(false);

    if (!value) {
        return (
            <div className="mb-2.5">
                <span className="text-muted small d-block mb-0.5" style={{ fontSize: '0.74rem' }}>{label}</span>
                <span className="text-secondary small">—</span>
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
        <div className="mb-2.5">
            <span className="text-muted small d-block mb-0.5" style={{ fontSize: '0.74rem' }}>{label}</span>
            <div className="d-flex align-items-center justify-content-between p-2 rounded bg-light border">
                <span className={`text-dark ${monospace ? 'font-monospace fw-semibold' : 'fw-medium'}`} style={{ fontSize: '0.84rem' }}>
                    {value}
                </span>
                <OverlayTrigger placement="top" overlay={<Tooltip>{copied ? 'Copied!' : 'Copy'}</Tooltip>}>
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="btn btn-sm btn-link p-0 text-muted hover-primary ms-2"
                        style={{ border: 'none', background: 'transparent' }}
                    >
                        {copied ? <FaCheck size={11} className="text-success" /> : <FaCopy size={11} />}
                    </button>
                </OverlayTrigger>
            </div>
        </div>
    );
};

const getItemTypeBadge = (type) => {
    switch (type) {
        case 'FINISHED_GOODS':
            return <Badge bg="soft-primary" className="text-primary border border-primary-subtle px-2 py-1">Finished Good</Badge>;
        case 'RAW_MATERIAL':
            return <Badge bg="soft-warning" className="text-warning border border-warning-subtle px-2 py-1">Raw Material</Badge>;
        case 'SERVICE':
            return <Badge bg="soft-info" className="text-info border border-info-subtle px-2 py-1">Machining Service</Badge>;
        case 'CONSUMABLE':
            return <Badge bg="soft-secondary" className="text-secondary border border-secondary-subtle px-2 py-1">Consumable</Badge>;
        default:
            return <Badge bg="light" className="text-dark border px-2 py-1">{type || '—'}</Badge>;
    }
};

const ProductDetailsDrawer = ({ show, onHide, product }) => {
    if (!product) return null;

    const sellingPrice = Number(product.sellingPrice || 0);
    const purchasePrice = Number(product.purchasePrice || 0);
    const margin = sellingPrice > 0 ? sellingPrice - purchasePrice : 0;
    const marginPercent = sellingPrice > 0 && purchasePrice > 0 ? ((margin / sellingPrice) * 100).toFixed(1) : null;

    const createdAt = product.createdAt || product.created_at;
    const updatedAt = product.updatedAt || product.updated_at;
    const createdAtFormatted = createdAt ? moment(createdAt).format('DD/MM/YYYY, hh:mm A') : '—';
    const updatedAtFormatted = updatedAt ? moment(updatedAt).format('DD/MM/YYYY, hh:mm A') : '—';

    return (
        <Offcanvas
            show={show}
            onHide={onHide}
            placement="end"
            style={{ width: '480px', maxWidth: '100vw' }}
        >
            <Offcanvas.Header closeButton className="border-bottom bg-light py-3 px-4">
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-3 border overflow-hidden bg-white flex-shrink-0 d-flex align-items-center justify-content-center shadow-xs"
                        style={{ width: '44px', height: '44px' }}
                    >
                        <Image
                            src={product.imageUrl || defaultProductImage}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-light text-dark font-monospace border px-2 py-0.5" style={{ fontSize: '0.74rem' }}>
                                #{product.id}
                            </span>
                            {getItemTypeBadge(product.itemType)}
                            <Badge bg={product.status === 'ACTIVE' ? 'soft-success' : 'soft-danger'} className={product.status === 'ACTIVE' ? 'text-success' : 'text-danger'}>
                                {product.status || 'ACTIVE'}
                            </Badge>
                        </div>
                        <Offcanvas.Title className="h6 mb-0 text-dark fw-bold text-truncate" style={{ maxWidth: '280px' }}>
                            {product.name}
                        </Offcanvas.Title>
                    </div>
                </div>
            </Offcanvas.Header>

            <Offcanvas.Body className="p-4">
                {/* 1. Pricing & Commercial Summary Card */}
                <Card className="mb-3 border shadow-none bg-soft-primary-subtle bg-opacity-25">
                    <Card.Body className="p-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>Commercial Rates</span>
                            <span className="badge bg-white text-dark border font-monospace">
                                {product.unitName || product.itemUnitName || 'NOS'}
                            </span>
                        </div>
                        <Row className="g-2">
                            <Col xs={6}>
                                <div className="p-2 rounded bg-white border">
                                    <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>Selling Price</span>
                                    <span className="fw-bold text-dark fs-6">
                                        ₹{sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="p-2 rounded bg-white border">
                                    <span className="text-muted small d-block" style={{ fontSize: '0.72rem' }}>Purchase / Cost</span>
                                    <span className="fw-semibold text-secondary fs-6">
                                        {purchasePrice > 0 ? `₹${purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                                    </span>
                                </div>
                            </Col>
                        </Row>
                        {marginPercent !== null && (
                            <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top small">
                                <span className="text-muted" style={{ fontSize: '0.76rem' }}>Gross Margin:</span>
                                <span className={`fw-bold ${margin >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.78rem' }}>
                                    ₹{margin.toFixed(2)} ({marginPercent}%)
                                </span>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* 2. Identification & Codes */}
                <Card className="mb-3 border shadow-none">
                    <Card.Header className="bg-transparent py-2 px-3 border-bottom d-flex align-items-center gap-2">
                        <FaTag className="text-primary" size={13} />
                        <span className="fw-semibold text-dark small text-uppercase" style={{ fontSize: '0.76rem' }}>Part Identification</span>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <Row className="g-2">
                            <Col xs={6}>
                                <CopyableField label="Part Code / SKU" value={product.itemCode} monospace />
                            </Col>
                            <Col xs={6}>
                                <CopyableField label="HSN / SAC Code" value={product.hsnSacCode} monospace />
                            </Col>
                            <Col xs={6}>
                                <div className="mb-2">
                                    <span className="text-muted small d-block mb-0.5" style={{ fontSize: '0.74rem' }}>GST Tax Rate</span>
                                    <span className="badge bg-soft-info text-info border border-info-subtle px-2 py-1 font-monospace">
                                        {product.gstRate !== undefined && product.gstRate !== null ? `GST ${product.gstRate}%` : 'GST 0% / None'}
                                    </span>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="mb-2">
                                    <span className="text-muted small d-block mb-0.5" style={{ fontSize: '0.74rem' }}>Unit (UOM)</span>
                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.84rem' }}>
                                        {product.unitName || product.itemUnitName || 'NOS'}
                                    </span>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 3. Engineering & Technical Specs */}
                <Card className="mb-3 border shadow-none">
                    <Card.Header className="bg-transparent py-2 px-3 border-bottom d-flex align-items-center gap-2">
                        <FaDraftingCompass className="text-primary" size={13} />
                        <span className="fw-semibold text-dark small text-uppercase" style={{ fontSize: '0.76rem' }}>Engineering Specifications</span>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <Row className="g-2">
                            <Col xs={6}>
                                <CopyableField label="Drawing Number" value={product.drawingNumber} monospace />
                            </Col>
                            <Col xs={6}>
                                <CopyableField label="Material Grade / Metallurgy" value={product.materialGrade} />
                            </Col>
                            <Col xs={12}>
                                <div className="mb-2.5">
                                    <span className="text-muted small d-block mb-0.5" style={{ fontSize: '0.74rem' }}>Dimensions / Geometry</span>
                                    <div className="p-2 rounded bg-light border text-dark fw-medium" style={{ fontSize: '0.84rem' }}>
                                        {product.dimensions || '—'}
                                    </div>
                                </div>
                            </Col>
                            <Col xs={6}>
                                <div className="mb-2">
                                    <span className="text-muted small d-block mb-0.5" style={{ fontSize: '0.74rem' }}>Unit Weight (Kg)</span>
                                    <span className="fw-semibold text-dark" style={{ fontSize: '0.84rem' }}>
                                        {product.unitWeightKg ? `${Number(product.unitWeightKg).toFixed(3)} Kg` : '—'}
                                    </span>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 4. Description & Internal Notes */}
                {(product.description || product.notes) && (
                    <Card className="mb-3 border shadow-none">
                        <Card.Header className="bg-transparent py-2 px-3 border-bottom d-flex align-items-center gap-2">
                            <FaFileAlt className="text-primary" size={13} />
                            <span className="fw-semibold text-dark small text-uppercase" style={{ fontSize: '0.76rem' }}>Description & Notes</span>
                        </Card.Header>
                        <Card.Body className="p-3">
                            {product.description && (
                                <div className="mb-2.5">
                                    <span className="text-muted small d-block mb-1" style={{ fontSize: '0.74rem' }}>Invoice Description</span>
                                    <div className="p-2 rounded bg-light border small text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>
                                        {product.description}
                                    </div>
                                </div>
                            )}
                            {product.notes && (
                                <div>
                                    <span className="text-muted small d-block mb-1" style={{ fontSize: '0.74rem' }}>Workshop / Internal Notes</span>
                                    <div className="p-2 rounded bg-soft-warning-subtle bg-opacity-25 border border-warning-subtle small text-dark" style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>
                                        {product.notes}
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                )}

                {/* 5. Audit Details */}
                <div className="p-2.5 rounded bg-light border small text-muted d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                        <FaClock size={11} className="text-muted" />
                        <span>Created: {createdAtFormatted}</span>
                    </div>
                    {updatedAt && updatedAt !== createdAt && (
                        <div className="d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                            <FaHistory size={10} className="text-muted" />
                            <span>Updated: {updatedAtFormatted}</span>
                        </div>
                    )}
                </div>

                {/* Footer Action Buttons */}
                <div className="d-flex align-items-center gap-2 pt-2 border-top">
                    <Link to={`/masters/products/${product.id}/edit`} className="flex-grow-1">
                        <Button variant="primary" size="sm" className="w-100 d-flex align-items-center justify-content-center gap-2">
                            <FaPen size={11} />
                            <span>Edit Product</span>
                        </Button>
                    </Link>
                    <Link to={`/masters/products/${product.id}`} className="flex-grow-1">
                        <Button variant="outline-secondary" size="sm" className="w-100 d-flex align-items-center justify-content-center gap-2">
                            <FaExternalLinkAlt size={11} />
                            <span>Full Details</span>
                        </Button>
                    </Link>
                </div>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default ProductDetailsDrawer;
