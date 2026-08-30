import React, { useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { productValidationSchema } from '../../../validation/product.validation';
import { useQuickCreateProduct } from '../hooks/useApi';
import { useGstSlab, useProductUnit } from '../../dashboard/hooks/api.hooks';
import { FaPlus, FaBox } from 'react-icons/fa';

const QuickAddProductModal = ({
    show,
    onHide,
    initialName = '',
    onProductCreated
}) => {
    const { data: gstSlabs = [] } = useGstSlab();
    const { data: productUnits = [] } = useProductUnit();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
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
            drawingNumber: '',
            materialGrade: '',
            dimensions: '',
            unitWeightKg: '',
            status: 'ACTIVE'
        }
    });

    useEffect(() => {
        if (show) {
            reset({
                name: initialName || '',
                itemCode: '',
                itemType: 'FINISHED_GOODS',
                hsnSacCode: '',
                gstSlabId: '',
                itemUnitId: '',
                sellingPrice: 0,
                purchasePrice: 0,
                drawingNumber: '',
                materialGrade: '',
                dimensions: '',
                unitWeightKg: '',
                status: 'ACTIVE'
            });
        }
    }, [show, initialName, reset]);

    const { mutate: createProductMutate, isPending: isLoading } = useQuickCreateProduct({
        onSuccessCallback: (createdProduct) => {
            if (onProductCreated) {
                onProductCreated(createdProduct);
            }
            onHide();
        }
    });

    const onSubmit = (formData) => {
        const cleanedData = {
            ...formData,
            sellingPrice: Number(formData.sellingPrice || 0),
            purchasePrice: Number(formData.purchasePrice || 0),
            gstSlabId: formData.gstSlabId ? Number(formData.gstSlabId) : null,
            itemUnitId: formData.itemUnitId ? Number(formData.itemUnitId) : null,
            unitWeightKg: formData.unitWeightKg ? Number(formData.unitWeightKg) : null
        };
        createProductMutate(cleanedData);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton className="bg-light py-2 px-3">
                <Modal.Title className="fs-6 d-flex align-items-center gap-2">
                    <FaBox className="text-primary" />
                    <span>Quick Add New Product</span>
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Modal.Body className="p-3">
                    <Row className="g-2">
                        {/* Product / Part Name */}
                        <Col md={8} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="quickProductName"
                                    placeholder="Product / Part Name"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.name}
                                    {...register('name')}
                                />
                                <Form.Label htmlFor="quickProductName" style={{ fontSize: '0.78rem' }}>
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
                                    id="quickItemCode"
                                    placeholder="Part Code / SKU"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.itemCode}
                                    {...register('itemCode')}
                                />
                                <Form.Label htmlFor="quickItemCode" style={{ fontSize: '0.78rem' }}>
                                    Part Code / SKU <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.itemCode?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Item Type */}
                        <Col md={4} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Select id="quickItemType" style={{ fontSize: '0.84rem' }} {...register('itemType')}>
                                    <option value="FINISHED_GOODS">Finished Goods</option>
                                    <option value="RAW_MATERIAL">Raw Material</option>
                                    <option value="SERVICE">Service / Job Work</option>
                                    <option value="CONSUMABLE">Consumable</option>
                                </Form.Select>
                                <Form.Label htmlFor="quickItemType" style={{ fontSize: '0.78rem' }}>
                                    Product Category
                                </Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* HSN/SAC Code */}
                        <Col md={4} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="quickHsnSacCode"
                                    placeholder="HSN / SAC Code"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.hsnSacCode}
                                    {...register('hsnSacCode')}
                                />
                                <Form.Label htmlFor="quickHsnSacCode" style={{ fontSize: '0.78rem' }}>
                                    HSN / SAC Code
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.hsnSacCode?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Unit (UOM) */}
                        <Col md={4} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Select id="quickItemUnitId" style={{ fontSize: '0.84rem' }} isInvalid={!!errors.itemUnitId} {...register('itemUnitId')}>
                                    <option value="">-- Select Unit --</option>
                                    {productUnits.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.uqc} {u.name ? `(${u.name})` : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Label htmlFor="quickItemUnitId" style={{ fontSize: '0.78rem' }}>
                                    Unit of Measurement <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.itemUnitId?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Selling Price */}
                        <Col md={6} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    id="quickSellingPrice"
                                    placeholder="Selling Rate (₹)"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.sellingPrice}
                                    {...register('sellingPrice')}
                                />
                                <Form.Label htmlFor="quickSellingPrice" style={{ fontSize: '0.78rem' }}>
                                    Selling Rate (₹) — Sales / Invoice
                                </Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* GST Slab (Repaired) */}
                        <Col md={6} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Select id="quickGstSlabId" style={{ fontSize: '0.84rem' }} {...register('gstSlabId')}>
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
                                <Form.Label htmlFor="quickGstSlabId" style={{ fontSize: '0.78rem' }}>
                                    GST Slab
                                </Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* Drawing Number */}
                        <Col md={6} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="quickDrawingNumber"
                                    placeholder="Drawing Number"
                                    style={{ fontSize: '0.84rem' }}
                                    {...register('drawingNumber')}
                                />
                                <Form.Label htmlFor="quickDrawingNumber" style={{ fontSize: '0.78rem' }}>
                                    Drawing No.
                                </Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* Material Grade */}
                        <Col md={6} sm={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="quickMaterialGrade"
                                    placeholder="Material Grade"
                                    style={{ fontSize: '0.84rem' }}
                                    {...register('materialGrade')}
                                />
                                <Form.Label htmlFor="quickMaterialGrade" style={{ fontSize: '0.78rem' }}>
                                    Material Grade (e.g. SS 304 / EN8)
                                </Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* Dimensions */}
                        <Col xs={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="quickDimensions"
                                    placeholder="Dimensions"
                                    style={{ fontSize: '0.84rem' }}
                                    {...register('dimensions')}
                                />
                                <Form.Label htmlFor="quickDimensions" style={{ fontSize: '0.78rem' }}>
                                    Dimensions & Size (e.g. OD 220mm x ID 115mm x Thk 24mm)
                                </Form.Label>
                            </Form.Floating>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer className="bg-light py-2 px-3 justify-content-between">
                    <Button variant="secondary" size="sm" onClick={onHide} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isLoading} className="d-flex align-items-center gap-2">
                        {isLoading ? (
                            <>
                                <Spinner animation="border" size="sm" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <FaPlus size={11} />
                                <span>Save & Select Product</span>
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default QuickAddProductModal;
