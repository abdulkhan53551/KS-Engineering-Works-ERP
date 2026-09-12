import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Button, Card, Breadcrumb, Spinner, Badge, Nav, Tab } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { productValidationSchema } from '../../../validation/product.validation';
import { useProductById, useCreateProduct, useUpdateProduct } from '../hooks/useApi';
import { useGstSlab, useProductUnit } from '../../dashboard/hooks/api.hooks';
import LogoUploadDropZone from '../../../components/upload/LogoUploadDropZone';
import AttachmentManager from '../../../components/attachments/AttachmentManager';
import {
    FaSave,
    FaArrowLeft,
    FaBox,
    FaDraftingCompass,
    FaPercent,
    FaInfoCircle,
    FaFileAlt,
    FaPaperclip,
    FaImage,
    FaEye
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';

const PRODUCT_DOC_TYPES = [
    { value: 'DRAWING', label: 'Engineering Drawing / Blueprint' },
    { value: 'SPEC_SHEET', label: 'Technical Spec Sheet / TDS' },
    { value: 'CAD_MODEL', label: 'CAD / 3D Model' },
    { value: 'TEST_REPORT', label: 'Material Test Certificate (MTC)' },
    { value: 'IMAGE', label: 'Part Photo' },
    { value: 'OTHER', label: 'Other Document' }
];

const ProductForm = ({ mode = 'create' }) => {
    const isEditMode = mode === 'edit';
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');

    // 1. Master queries
    const { data: gstSlabs = [], isLoading: isLoadingGst } = useGstSlab();
    const { data: productUnits = [], isLoading: isLoadingUnits } = useProductUnit();

    // 2. Fetch single product if edit mode
    const { data: existingProduct, isLoading: isLoadingProduct } = useProductById(id);

    // 3. React Hook Form setup
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors, isDirty }
    } = useForm({
        resolver: joiResolver(productValidationSchema()),
        defaultValues: {
            name: '',
            itemCode: '',
            itemType: 'FINISHED_GOODS',
            hsnSacCode: '',
            gstSlabId: '',
            itemUnitId: '',
            sellingPrice: 0,
            purchasePrice: 0,
            imageUrl: '',
            imagePublicId: '',
            drawingNumber: '',
            materialGrade: '',
            dimensions: '',
            unitWeightKg: '',
            description: '',
            notes: '',
            status: 'ACTIVE'
        }
    });

    const watchImageUrl = useWatch({ control, name: 'imageUrl' });
    const watchImagePublicId = useWatch({ control, name: 'imagePublicId' });
    const watchStatus = useWatch({ control, name: 'status' });
    const watchItemType = useWatch({ control, name: 'itemType' });

    // Populate form on edit
    useEffect(() => {
        if (isEditMode && existingProduct) {
            reset({
                name: existingProduct.name || '',
                itemCode: existingProduct.itemCode || '',
                itemType: existingProduct.itemType || 'FINISHED_GOODS',
                hsnSacCode: existingProduct.hsnSacCode || '',
                gstSlabId: existingProduct.gstSlabId ? String(existingProduct.gstSlabId) : '',
                itemUnitId: existingProduct.itemUnitId ? String(existingProduct.itemUnitId) : '',
                sellingPrice: existingProduct.sellingPrice || 0,
                purchasePrice: existingProduct.purchasePrice || 0,
                imageUrl: existingProduct.imageUrl || '',
                imagePublicId: existingProduct.imagePublicId || '',
                drawingNumber: existingProduct.drawingNumber || '',
                materialGrade: existingProduct.materialGrade || '',
                dimensions: existingProduct.dimensions || '',
                unitWeightKg: existingProduct.unitWeightKg || '',
                description: existingProduct.description || '',
                notes: existingProduct.notes || '',
                status: existingProduct.status || 'ACTIVE'
            });
        }
    }, [isEditMode, existingProduct, reset]);

    // 4. Mutations
    const { mutate: createProductMutate, isPending: isCreating } = useCreateProduct();
    const { mutate: updateProductMutate, isPending: isUpdating } = useUpdateProduct();

    const isSubmitting = isCreating || isUpdating;

    const onSubmit = (formData) => {
        const payload = {
            ...formData,
            sellingPrice: Number(formData.sellingPrice || 0),
            purchasePrice: Number(formData.purchasePrice || 0),
            gstSlabId: formData.gstSlabId ? Number(formData.gstSlabId) : null,
            itemUnitId: formData.itemUnitId ? Number(formData.itemUnitId) : null,
            unitWeightKg: formData.unitWeightKg ? Number(formData.unitWeightKg) : null,
            imageUrl: formData.imageUrl || null,
            imagePublicId: formData.imagePublicId || null
        };

        if (isEditMode) {
            updateProductMutate({ id, data: payload });
        } else {
            createProductMutate(payload);
        }
    };

    if (isEditMode && isLoadingProduct) {
        return <PageLoader />;
    }

    return (
        <div className="product-form-page">
            {/* Header & Breadcrumb */}
            <Card className="mb-3 shadow-sm border bg-white">
                <Card.Body className="py-3 px-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <Link
                                to="/masters/products"
                                className="btn btn-sm p-0 rounded-circle d-flex align-items-center justify-content-center shadow-sm text-dark border bg-light"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderColor: '#cbd5e1'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#3a57e8';
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.borderColor = '#3a57e8';
                                    e.currentTarget.style.transform = 'translateX(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#f8fafc';
                                    e.currentTarget.style.color = '#1e293b';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                                title="Back to Products List"
                            >
                                <FaArrowLeft size={13} />
                            </Link>
                            <div>
                                <h5 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                                    <FaBox className="text-primary" size={16} />
                                    <span>{isEditMode ? `Edit Product: ${existingProduct?.name || ''}` : 'Add New Product'}</span>
                                </h5>
                                <Breadcrumb className="mb-0 small mt-0.5">
                                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/dashboard' }}>Dashboard</Breadcrumb.Item>
                                    <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/masters/products' }}>Products</Breadcrumb.Item>
                                    <Breadcrumb.Item active>{isEditMode ? 'Edit' : 'Create'}</Breadcrumb.Item>
                                </Breadcrumb>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            {isEditMode && (
                                <Link to={`/masters/products/${id}`}>
                                    <Button variant="outline-info" size="sm" className="d-flex align-items-center gap-1.5">
                                        <FaEye size={12} />
                                        <span>View Details</span>
                                    </Button>
                                </Link>
                            )}

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="d-flex align-items-center gap-2 px-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaSave size={12} />
                                        <span>{isEditMode ? 'Update Product' : 'Save Product'}</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Edit Mode Tabs Navigation */}
            {isEditMode && (
                <div className="mb-3">
                    <Nav variant="tabs" className="border-bottom" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav.Item>
                            <Nav.Link eventKey="details" className="d-flex align-items-center gap-2 py-2 px-3">
                                <FaInfoCircle size={13} />
                                <span className="fw-semibold">Product Specifications</span>
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="documents" className="d-flex align-items-center gap-2 py-2 px-3">
                                <FaPaperclip size={13} />
                                <span className="fw-semibold">Drawings & Attachments</span>
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>
            )}

            {/* Tab 1: Product Specifications Form */}
            {(!isEditMode || activeTab === 'details') && (
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row className="g-3">
                        {/* Left Column: Core Info & Technical Specs */}
                        <Col lg={8} md={12}>
                            {/* Card 1: Basic Information */}
                            <Card className="border-0 shadow-sm mb-3">
                                <Card.Header className="bg-transparent py-3 border-bottom d-flex align-items-center justify-content-between">
                                    <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                        <FaInfoCircle className="text-primary" />
                                        <span>1. General Information</span>
                                    </h6>
                                    <Badge bg={watchStatus === 'ACTIVE' ? 'soft-success' : 'soft-danger'} className={watchStatus === 'ACTIVE' ? 'text-success' : 'text-danger'}>
                                        {watchStatus || 'ACTIVE'}
                                    </Badge>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-2">
                                        {/* Product / Part Name */}
                                        <Col md={8} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="text"
                                                    id="productName"
                                                    placeholder="Product / Part Name"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.name}
                                                    {...register('name')}
                                                />
                                                <Form.Label htmlFor="productName" style={{ fontSize: '0.78rem' }}>
                                                    Product / Part Name <span className="text-danger label-required">*</span>
                                                </Form.Label>
                                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                                    {errors.name?.message}
                                                </Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        {/* Part Code / SKU */}
                                        <Col md={4} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="text"
                                                    id="itemCode"
                                                    placeholder="Part Code / SKU"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.itemCode}
                                                    {...register('itemCode')}
                                                />
                                                <Form.Label htmlFor="itemCode" style={{ fontSize: '0.78rem' }}>
                                                    Part Code / SKU
                                                </Form.Label>
                                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                                    {errors.itemCode?.message}
                                                </Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        {/* Item Category */}
                                        <Col md={6} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Select
                                                    id="itemType"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.itemType}
                                                    {...register('itemType')}
                                                >
                                                    <option value="FINISHED_GOODS">Finished Goods (Manufactured Part)</option>
                                                    <option value="RAW_MATERIAL">Raw Material (Metal Bar, Plate, Pipe)</option>
                                                    <option value="SERVICE">Service (Job Work / Machining)</option>
                                                    <option value="CONSUMABLE">Consumable (Tooling, Oil, Hardware)</option>
                                                </Form.Select>
                                                <Form.Label htmlFor="itemType" style={{ fontSize: '0.78rem' }}>
                                                    Product Category <span className="text-danger label-required">*</span>
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {/* Catalog Status */}
                                        <Col md={6} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Select
                                                    id="productStatus"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.status}
                                                    {...register('status')}
                                                >
                                                    <option value="ACTIVE">ACTIVE (Available for Invoicing)</option>
                                                    <option value="INACTIVE">INACTIVE (Hidden from Dropdowns)</option>
                                                </Form.Select>
                                                <Form.Label htmlFor="productStatus" style={{ fontSize: '0.78rem' }}>
                                                    Status <span className="text-danger label-required">*</span>
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Card 2: Engineering & Technical Specifications */}
                            <Card className="border-0 shadow-sm mb-3">
                                <Card.Header className="bg-transparent py-3 border-bottom">
                                    <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                        <FaDraftingCompass className="text-primary" />
                                        <span>2. Engineering & Technical Specifications</span>
                                    </h6>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-2">
                                        {/* Drawing Number */}
                                        <Col md={6} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="text"
                                                    id="drawingNumber"
                                                    placeholder="Drawing Number"
                                                    style={{ fontSize: '0.84rem' }}
                                                    {...register('drawingNumber')}
                                                />
                                                <Form.Label htmlFor="drawingNumber" style={{ fontSize: '0.78rem' }}>
                                                    Engineering Drawing No.
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {/* Material Grade */}
                                        <Col md={6} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="text"
                                                    id="materialGrade"
                                                    placeholder="Material Grade"
                                                    style={{ fontSize: '0.84rem' }}
                                                    {...register('materialGrade')}
                                                />
                                                <Form.Label htmlFor="materialGrade" style={{ fontSize: '0.78rem' }}>
                                                    Material Grade / Metallurgy
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {/* Dimensions */}
                                        <Col md={8} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="text"
                                                    id="dimensions"
                                                    placeholder="Dimensions"
                                                    style={{ fontSize: '0.84rem' }}
                                                    {...register('dimensions')}
                                                />
                                                <Form.Label htmlFor="dimensions" style={{ fontSize: '0.78rem' }}>
                                                    Dimensions / Specifications (e.g. OD x ID x Length)
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {/* Unit Weight */}
                                        <Col md={4} sm={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="number"
                                                    step="0.001"
                                                    id="unitWeightKg"
                                                    placeholder="Unit Weight (Kg)"
                                                    style={{ fontSize: '0.84rem' }}
                                                    {...register('unitWeightKg')}
                                                />
                                                <Form.Label htmlFor="unitWeightKg" style={{ fontSize: '0.78rem' }}>
                                                    Unit Weight (Kg)
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Card 3: Description & Notes */}
                            <Card className="border-0 shadow-sm mb-3">
                                <Card.Header className="bg-transparent py-3 border-bottom">
                                    <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                        <FaFileAlt className="text-primary" />
                                        <span>3. Description & Workshop Instructions</span>
                                    </h6>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-2">
                                        <Col xs={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    as="textarea"
                                                    id="description"
                                                    placeholder="Item Description"
                                                    style={{ height: '75px', fontSize: '0.84rem' }}
                                                    {...register('description')}
                                                />
                                                <Form.Label htmlFor="description" style={{ fontSize: '0.78rem' }}>
                                                    Invoice Printing Description
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col xs={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    as="textarea"
                                                    id="notes"
                                                    placeholder="Internal Notes"
                                                    style={{ height: '70px', fontSize: '0.84rem' }}
                                                    {...register('notes')}
                                                />
                                                <Form.Label htmlFor="notes" style={{ fontSize: '0.78rem' }}>
                                                    Internal Workshop & Production Notes
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Right Column: Image, Pricing & Taxes */}
                        <Col lg={4} md={12}>
                            {/* Product Photo / Image */}
                            <Card className="border-0 shadow-sm mb-3">
                                <Card.Header className="bg-transparent py-3 border-bottom">
                                    <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                        <FaImage className="text-primary" />
                                        <span>Product Image</span>
                                    </h6>
                                </Card.Header>
                                <Card.Body className="p-3 text-center">
                                    {isEditMode && id ? (
                                        <>
                                            <LogoUploadDropZone
                                                value={watchImageUrl}
                                                publicId={watchImagePublicId}
                                                folder={`ks-erp/products/${id}/images`}
                                                tags="ks-erp,product,image"
                                                category="IMAGE"
                                                label="Product Image"
                                                onChange={({ logoUrl, logoPublicId }) => {
                                                    setValue('imageUrl', logoUrl, { shouldValidate: true, shouldDirty: true });
                                                    setValue('imagePublicId', logoPublicId, { shouldValidate: true, shouldDirty: true });
                                                }}
                                                disabled={isSubmitting}
                                            />
                                            <div className="text-muted small mt-2" style={{ fontSize: '0.74rem' }}>
                                                Upload component photo or 3D rendering (JPG, PNG, WebP &bull; Max 2 MB)
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-4 px-3 border border-dashed rounded bg-light text-center">
                                            <div className="avatar-45 bg-soft-primary rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                                <FaImage className="text-primary" size={18} />
                                            </div>
                                            <div className="text-dark fw-semibold small mb-1">Image & File Upload</div>
                                            <div className="text-muted" style={{ fontSize: '0.74rem' }}>
                                                Save product first to generate a Product ID and upload component photos, CAD models & drawings.
                                            </div>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Pricing & Tax Setup */}
                            <Card className="border-0 shadow-sm mb-3">
                                <Card.Header className="bg-transparent py-3 border-bottom">
                                    <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                        <FaPercent className="text-primary" />
                                        <span>Pricing & Taxes</span>
                                    </h6>
                                </Card.Header>
                                <Card.Body className="p-3">
                                    <Row className="g-2">
                                        {/* Selling Price */}
                                        <Col xs={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="number"
                                                    step="0.01"
                                                    id="sellingPrice"
                                                    placeholder="Selling Rate (₹)"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.sellingPrice}
                                                    {...register('sellingPrice')}
                                                />
                                                <Form.Label htmlFor="sellingPrice" style={{ fontSize: '0.78rem' }}>
                                                    Selling Rate (₹) — (Sales / Invoice)
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {/* Purchase Price */}
                                        <Col xs={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="number"
                                                    step="0.01"
                                                    id="purchasePrice"
                                                    placeholder="Purchase Rate (₹)"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.purchasePrice}
                                                    {...register('purchasePrice')}
                                                />
                                                <Form.Label htmlFor="purchasePrice" style={{ fontSize: '0.78rem' }}>
                                                    Purchase Rate (₹) — (PO / Cost)
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {/* HSN / SAC Code */}
                                        <Col xs={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Control
                                                    type="text"
                                                    id="hsnSacCode"
                                                    placeholder="HSN / SAC Code"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.hsnSacCode}
                                                    {...register('hsnSacCode')}
                                                />
                                                <Form.Label htmlFor="hsnSacCode" style={{ fontSize: '0.78rem' }}>
                                                    HSN / SAC Code (4, 6, 8 digits)
                                                </Form.Label>
                                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                                    {errors.hsnSacCode?.message}
                                                </Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        {/* Unit of Measurement */}
                                        <Col xs={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Select
                                                    id="itemUnitId"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.itemUnitId}
                                                    {...register('itemUnitId')}
                                                >
                                                    <option value="">-- Select Unit --</option>
                                                    {productUnits.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.uqc} {u.name ? `(${u.name})` : ''}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <Form.Label htmlFor="itemUnitId" style={{ fontSize: '0.78rem' }}>
                                                    Unit of Measurement (UOM) <span className="text-danger label-required">*</span>
                                                </Form.Label>
                                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                                    {errors.itemUnitId?.message}
                                                </Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        {/* GST Slab (Repaired) */}
                                        <Col xs={12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                                <Form.Select
                                                    id="gstSlabId"
                                                    style={{ fontSize: '0.84rem' }}
                                                    isInvalid={!!errors.gstSlabId}
                                                    {...register('gstSlabId')}
                                                >
                                                    <option value="">-- Select GST Slab --</option>
                                                    {gstSlabs.map((g) => {
                                                        const rate = g.gstRate !== undefined ? g.gstRate : (g.rate !== undefined ? g.rate : 0);
                                                        const label = g.name ? `${g.name} (${rate}%)` : `GST ${rate}%`;
                                                        return (
                                                            <option key={g.id} value={g.id}>
                                                                {label}
                                                            </option>
                                                        );
                                                    })}
                                                </Form.Select>
                                                <Form.Label htmlFor="gstSlabId" style={{ fontSize: '0.78rem' }}>
                                                    Applicable GST Rate
                                                </Form.Label>
                                            </Form.Floating>
                                        </Col>
                                    </Row>
                                </Card.Body>

                                <Card.Footer className="bg-light py-3 border-top d-flex justify-content-end gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => navigate('/masters/products')} disabled={isSubmitting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="d-flex align-items-center gap-2 px-3"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Spinner animation="border" size="sm" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaSave size={12} />
                                                <span>{isEditMode ? 'Update' : 'Save'}</span>
                                            </>
                                        )}
                                    </Button>
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>
                </Form>
            )}

            {/* Tab 2: Document & Drawing Attachments (Available in Edit Mode) */}
            {isEditMode && activeTab === 'documents' && (
                <Card className="border-0 shadow-sm">
                    <Card.Header className="bg-transparent py-3 border-bottom">
                        <div className="d-flex align-items-center justify-content-between">
                            <h6 className="card-title mb-0 d-flex align-items-center gap-2">
                                <FaPaperclip className="text-primary" />
                                <span>Attached Engineering Drawings & Support Documents</span>
                            </h6>
                            <span className="text-muted small">
                                Upload blueprint PDFs, CAD models, TDS sheets, or material test certificates
                            </span>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-3">
                        <AttachmentManager
                            entityType="PRODUCT"
                            entityId={Number(id)}
                            docTypeOptions={PRODUCT_DOC_TYPES}
                            folder={`ks-erp/products/${id}/documents`}
                        />
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default ProductForm;
