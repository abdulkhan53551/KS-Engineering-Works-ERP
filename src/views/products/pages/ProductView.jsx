import React from 'react';
import { Row, Col, Card, Button, Badge, Breadcrumb, Table, Image } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useProductById } from '../hooks/useApi';
import AttachmentManager from '../../../components/attachments/AttachmentManager';
import {
    FaArrowLeft,
    FaPen,
    FaBox,
    FaDraftingCompass,
    FaPercent,
    FaFileAlt,
    FaPaperclip,
    FaCalendarAlt,
    FaUser,
    FaTag,
    FaWeightHanging,
    FaRulerCombined,
    FaLayerGroup,
    FaCogs
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import defaultProductImage from '../../../assets/images/shapes/01.png';
import moment from 'moment';

const PRODUCT_DOC_TYPES = [
    { value: 'DRAWING', label: 'Engineering Drawing / Blueprint' },
    { value: 'SPEC_SHEET', label: 'Technical Spec Sheet / TDS' },
    { value: 'CAD_MODEL', label: 'CAD / 3D Model' },
    { value: 'TEST_REPORT', label: 'Material Test Certificate (MTC)' },
    { value: 'IMAGE', label: 'Part Photo' },
    { value: 'OTHER', label: 'Other Document' }
];

const getItemTypeBadge = (type) => {
    switch (type) {
        case 'FINISHED_GOODS':
            return <Badge bg="soft-primary" className="text-primary border border-primary-subtle px-2.5 py-1.5">Finished Good</Badge>;
        case 'RAW_MATERIAL':
            return <Badge bg="soft-warning" className="text-warning border border-warning-subtle px-2.5 py-1.5">Raw Material</Badge>;
        case 'SERVICE':
            return <Badge bg="soft-info" className="text-info border border-info-subtle px-2.5 py-1.5">Machining Service</Badge>;
        case 'CONSUMABLE':
            return <Badge bg="soft-secondary" className="text-secondary border border-secondary-subtle px-2.5 py-1.5">Consumable</Badge>;
        default:
            return <Badge bg="light" className="text-dark border">{type || '—'}</Badge>;
    }
};

const ProductView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: product, isLoading } = useProductById(id);

    if (isLoading) {
        return <PageLoader />;
    }

    if (!product) {
        return (
            <div className="text-center py-5">
                <FaBox size={40} className="text-muted mb-3" />
                <h5>Product Not Found</h5>
                <p className="text-muted small mb-3">The requested product does not exist or has been removed.</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/masters/products')}>
                    Back to Products List
                </Button>
            </div>
        );
    }

    const sellingPrice = Number(product.sellingPrice || 0);
    const purchasePrice = Number(product.purchasePrice || 0);
    const margin = sellingPrice > 0 ? sellingPrice - purchasePrice : 0;
    const marginPercent = sellingPrice > 0 && purchasePrice > 0 ? ((margin / sellingPrice) * 100).toFixed(1) : null;

    const createdAtFormatted = product.createdAt || product.created_at
        ? moment(product.createdAt || product.created_at).format('DD/MM/YYYY, hh:mm A')
        : '—';
    const updatedAtFormatted = product.updatedAt || product.updated_at
        ? moment(product.updatedAt || product.updated_at).format('DD/MM/YYYY, hh:mm A')
        : '—';

    return (
        <div className="product-view-page">
            {/* Header & Actions with White Card Background */}
            <Card className="mb-3 shadow-sm border bg-white">
                <Card.Body className="py-3 px-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <Button
                                variant="outline-secondary"
                                size="sm"
                                className="btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm text-dark border bg-light"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderColor: '#cbd5e1'
                                }}
                                onClick={() => navigate('/masters/products')}
                                title="Back to Products List"
                            >
                                <FaArrowLeft size={13} />
                            </Button>
                            <div>
                                <div className="d-flex align-items-center gap-2">
                                    <h4 className="mb-0 fw-bold text-dark">{product.name}</h4>
                                    <span className="badge bg-light text-dark font-monospace border px-2 py-1">
                                        #{product.id}
                                    </span>
                                </div>
                                <Breadcrumb className="mb-0 small mt-1">
                                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/dashboard' }}>Dashboard</Breadcrumb.Item>
                                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/masters/products' }}>Products</Breadcrumb.Item>
                                    <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
                                </Breadcrumb>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Link to={`/masters/products/${id}/edit`}>
                                <Button variant="primary" size="sm" className="d-flex align-items-center gap-2 px-3">
                                    <FaPen size={11} />
                                    <span>Edit Product</span>
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Hero Profile Card */}
            <Card className="border-0 shadow-sm mb-3 overflow-hidden">
                <Card.Body className="p-4">
                    <Row className="align-items-center g-3">
                        {/* Product Image Thumbnail */}
                        <Col xs="auto">
                            <div
                                className="rounded-3 border overflow-hidden bg-light d-flex align-items-center justify-content-center shadow-xs"
                                style={{ width: '90px', height: '90px', objectFit: 'cover' }}
                            >
                                <Image
                                    src={product.imageUrl || defaultProductImage}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        </Col>

                        {/* Title & Key Badges */}
                        <Col className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 flex-wrap mb-1.5">
                                <h4 className="mb-0 fw-bold text-dark">{product.name}</h4>
                                {product.itemCode && (
                                    <span className="badge bg-light text-dark font-monospace border px-2 py-1">
                                        SKU: {product.itemCode}
                                    </span>
                                )}
                                {getItemTypeBadge(product.itemType)}
                                <Badge bg={product.status === 'ACTIVE' ? 'soft-success' : 'soft-danger'} className={product.status === 'ACTIVE' ? 'text-success' : 'text-danger'}>
                                    {product.status || 'ACTIVE'}
                                </Badge>
                            </div>

                            <p className="text-muted small mb-0">
                                {product.description || 'No formal description provided for this catalog product.'}
                            </p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Key Commercial Metrics Row */}
            <Row className="g-3 mb-3">
                <Col lg={3} sm={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <span className="text-muted small fw-semibold text-uppercase">Selling Rate (Sales / Inv)</span>
                            <div className="d-flex align-items-baseline gap-2 mt-1">
                                <h3 className="mb-0 fw-bold text-primary">
                                    ₹{sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h3>
                                <span className="text-muted small">/ {product.unitName || product.itemUnitName || 'Unit'}</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} sm={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <span className="text-muted small fw-semibold text-uppercase">Purchase Cost (PO / GRN)</span>
                            <div className="d-flex align-items-baseline gap-2 mt-1">
                                <h3 className="mb-0 fw-bold text-dark">
                                    ₹{purchasePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h3>
                                <span className="text-muted small">/ {product.unitName || product.itemUnitName || 'Unit'}</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} sm={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <span className="text-muted small fw-semibold text-uppercase">Applicable GST & HSN</span>
                            <div className="d-flex align-items-baseline gap-2 mt-1">
                                <h3 className="mb-0 fw-bold text-info">
                                    {product.gstRate !== undefined && product.gstRate !== null ? `${product.gstRate}%` : '—'}
                                </h3>
                                <span className="text-muted small">
                                    {product.hsnSacCode ? `(HSN: ${product.hsnSacCode})` : ''}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={3} sm={6}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body className="p-3">
                            <span className="text-muted small fw-semibold text-uppercase">Gross Margin</span>
                            <div className="d-flex align-items-baseline gap-2 mt-1">
                                <h3 className={`mb-0 fw-bold ${margin >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {marginPercent ? `${marginPercent}%` : `₹${margin.toFixed(2)}`}
                                </h3>
                                <span className="text-muted small">
                                    {margin > 0 ? `(+₹${margin.toFixed(2)})` : ''}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-3">
                {/* Left Column: Engineering Specs & Notes */}
                <Col lg={7} md={12}>
                    {/* Engineering & Workshop Specs */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Header className="bg-transparent py-3 border-bottom">
                            <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                <FaDraftingCompass className="text-primary" />
                                <span>Engineering & Workshop Specifications</span>
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-3">
                            <Table responsive borderless className="mb-0 small" style={{ fontSize: '0.86rem' }}>
                                <tbody>
                                    <tr>
                                        <td className="text-muted fw-semibold py-2" style={{ width: '220px' }}>
                                            <FaDraftingCompass className="me-2 text-secondary" />
                                            Engineering Drawing No:
                                        </td>
                                        <td className="fw-bold py-2">
                                            {product.drawingNumber ? (
                                                <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                                                    {product.drawingNumber}
                                                </span>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted fw-semibold py-2">
                                            <FaLayerGroup className="me-2 text-secondary" />
                                            Material Grade / Metallurgy:
                                        </td>
                                        <td className="fw-bold py-2">
                                            {product.materialGrade || <span className="text-muted">—</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted fw-semibold py-2">
                                            <FaRulerCombined className="me-2 text-secondary" />
                                            Dimensions & Size:
                                        </td>
                                        <td className="fw-bold py-2">
                                            {product.dimensions || <span className="text-muted">—</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted fw-semibold py-2">
                                            <FaWeightHanging className="me-2 text-secondary" />
                                            Unit Weight (Kg):
                                        </td>
                                        <td className="fw-bold py-2">
                                            {product.unitWeightKg ? `${Number(product.unitWeightKg).toFixed(3)} kg` : <span className="text-muted">—</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted fw-semibold py-2">
                                            <FaTag className="me-2 text-secondary" />
                                            HSN / SAC Code:
                                        </td>
                                        <td className="fw-bold py-2 font-monospace">
                                            {product.hsnSacCode || <span className="text-muted">—</span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* Workshop & Production Notes */}
                    {product.notes && (
                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Header className="bg-transparent py-3 border-bottom">
                                <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                    <FaFileAlt className="text-primary" />
                                    <span>Internal Workshop & Production Notes</span>
                                </h6>
                            </Card.Header>
                            <Card.Body className="p-3">
                                <p className="text-dark small mb-0 white-space-pre-line">
                                    {product.notes}
                                </p>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                {/* Right Column: System Audit & Log Details */}
                <Col lg={5} md={12}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Header className="bg-transparent py-3 border-bottom">
                            <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                <FaCalendarAlt className="text-primary" />
                                <span>Audit & System Log Details</span>
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-3">
                            <div className="d-flex flex-column gap-2.5 small">
                                <div className="d-flex justify-content-between align-items-center py-1.5 border-bottom">
                                    <span className="text-muted">Database Product ID:</span>
                                    <span className="fw-bold font-monospace">#{product.id}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-1.5 border-bottom">
                                    <span className="text-muted">Record Created On:</span>
                                    <span className="fw-semibold text-dark">{createdAtFormatted}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-1.5 border-bottom">
                                    <span className="text-muted">Last Modified Date:</span>
                                    <span className="fw-semibold text-dark">{updatedAtFormatted}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center py-1.5">
                                    <span className="text-muted">Catalog Status:</span>
                                    <Badge bg={product.status === 'ACTIVE' ? 'soft-success' : 'soft-danger'} className={product.status === 'ACTIVE' ? 'text-success' : 'text-danger'}>
                                        {product.status || 'ACTIVE'}
                                    </Badge>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Attached Drawings & Documents Section */}
            <Card className="border-0 shadow-sm mb-3">
                <Card.Header className="bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
                    <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                        <FaPaperclip className="text-primary" />
                        <span>Attached Engineering Drawings & Support Documents</span>
                    </h6>
                    <span className="text-muted small">
                        Blueprints, CAD models, TDS spec sheets, and material test certificates
                    </span>
                </Card.Header>
                <Card.Body className="p-3">
                    <AttachmentManager
                        entityType="PRODUCT"
                        entityId={Number(id)}
                        docTypeOptions={PRODUCT_DOC_TYPES}
                        folder={`ks-erp/products/${id}/documents`}
                        readOnly={true}
                    />
                </Card.Body>
            </Card>
        </div>
    );
};

export default ProductView;
