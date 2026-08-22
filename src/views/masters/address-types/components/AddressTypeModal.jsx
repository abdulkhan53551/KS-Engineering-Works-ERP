import React, { useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { addressTypeValidationSchema } from '../../../../validation/master.validation';
import { useCreateAddressType, useUpdateAddressType } from '../../hooks/useMastersApi';

/**
 * AddressTypeModal Component
 * Add / Edit / View modal for Address Types Master
 */
const AddressTypeModal = ({ show, onHide, mode = 'create', initialData = null }) => {
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(addressTypeValidationSchema),
        defaultValues: {
            typeCode: '',
            typeName: '',
            description: ''
        }
    });

    const { mutate: createType, isPending: isCreating } = useCreateAddressType();
    const { mutate: updateType, isPending: isUpdating } = useUpdateAddressType();
    const isSaving = isCreating || isUpdating;

    useEffect(() => {
        if (initialData && (isEditMode || isViewMode)) {
            reset({
                typeCode: initialData.code || initialData.typeCode || '',
                typeName: initialData.name || initialData.typeName || '',
                description: initialData.description || ''
            });
        } else {
            reset({
                typeCode: '',
                typeName: '',
                description: ''
            });
        }
    }, [initialData, mode, reset, show, isEditMode, isViewMode]);

    const onSubmit = (formData) => {
        if (isViewMode) {
            onHide();
            return;
        }

        const payload = {
            typeCode: formData.typeCode.trim().toUpperCase(),
            typeName: formData.typeName.trim(),
            description: formData.description ? formData.description.trim() : null
        };

        if (isEditMode) {
            updateType(
                { id: initialData.id, data: payload },
                {
                    onSuccess: () => onHide()
                }
            );
        } else {
            createType(payload, {
                onSuccess: () => onHide()
            });
        }
    };

    const modalTitle = isViewMode
        ? 'View Address Type'
        : isEditMode
        ? 'Edit Address Type'
        : 'Add Address Type';

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered size="md">
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Modal.Header closeButton className="py-2.5 px-3.5 border-bottom">
                    <Modal.Title className="h6 mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>
                        {modalTitle}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-3.5">
                    <Row className="g-3">
                        {/* Type Code */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="typeCode"
                                    placeholder="Type Code (e.g. BILLING)"
                                    style={{ fontSize: '0.84rem', textTransform: 'uppercase' }}
                                    isInvalid={!!errors.typeCode}
                                    disabled={isViewMode}
                                    {...register('typeCode')}
                                    onChange={(e) => {
                                        const upper = e.target.value.toUpperCase().replace(/\s+/g, '_');
                                        e.target.value = upper;
                                        setValue('typeCode', upper, { shouldValidate: true });
                                    }}
                                />
                                <Form.Label htmlFor="typeCode" style={{ fontSize: '0.78rem' }}>
                                    Type Code <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.typeCode?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                            <span className="text-muted d-block" style={{ fontSize: '0.72rem', marginTop: '-4px' }}>
                                e.g., BILLING, SHIPPING, WAREHOUSE
                            </span>
                        </Col>

                        {/* Type Name */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="typeName"
                                    placeholder="Type Name (e.g. Billing Address)"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.typeName}
                                    disabled={isViewMode}
                                    {...register('typeName')}
                                />
                                <Form.Label htmlFor="typeName" style={{ fontSize: '0.78rem' }}>
                                    Type Name <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.typeName?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Description */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    as="textarea"
                                    id="description"
                                    placeholder="Description"
                                    style={{ fontSize: '0.84rem', height: '80px' }}
                                    isInvalid={!!errors.description}
                                    disabled={isViewMode}
                                    {...register('description')}
                                />
                                <Form.Label htmlFor="description" style={{ fontSize: '0.78rem' }}>
                                    Description (Optional)
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.description?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer className="bg-light py-2 px-3.5">
                    <Button variant="secondary" size="sm" onClick={onHide} style={{ fontSize: '0.82rem' }}>
                        {isViewMode ? 'Close' : 'Cancel'}
                    </Button>
                    {!isViewMode && (
                        <Button variant="primary" size="sm" type="submit" disabled={isSaving} style={{ fontSize: '0.82rem' }}>
                            {isSaving ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-1" />
                                    <span>Saving...</span>
                                </>
                            ) : isEditMode ? (
                                'Update Type'
                            ) : (
                                'Save Type'
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AddressTypeModal;
