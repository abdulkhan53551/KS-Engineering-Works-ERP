import React, { useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { partyRoleValidationSchema } from '../../../../validation/master.validation';
import { useCreatePartyRole, useUpdatePartyRole } from '../../hooks/useMastersApi';

/**
 * PartyRoleModal Component
 * Add / Edit / View modal for Party Roles Master
 */
const PartyRoleModal = ({ show, onHide, mode = 'create', initialData = null }) => {
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(partyRoleValidationSchema),
        defaultValues: {
            roleCode: '',
            roleName: '',
            description: ''
        }
    });

    const { mutate: createRole, isPending: isCreating } = useCreatePartyRole();
    const { mutate: updateRole, isPending: isUpdating } = useUpdatePartyRole();
    const isSaving = isCreating || isUpdating;

    useEffect(() => {
        if (initialData && (isEditMode || isViewMode)) {
            reset({
                roleCode: initialData.code || initialData.roleCode || '',
                roleName: initialData.name || initialData.roleName || '',
                description: initialData.description || ''
            });
        } else {
            reset({
                roleCode: '',
                roleName: '',
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
            roleCode: formData.roleCode.trim().toUpperCase(),
            roleName: formData.roleName.trim(),
            description: formData.description ? formData.description.trim() : null
        };

        if (isEditMode) {
            updateRole(
                { id: initialData.id, data: payload },
                {
                    onSuccess: () => onHide()
                }
            );
        } else {
            createRole(payload, {
                onSuccess: () => onHide()
            });
        }
    };

    const modalTitle = isViewMode
        ? 'View Party Role'
        : isEditMode
        ? 'Edit Party Role'
        : 'Add Party Role';

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
                        {/* Role Code */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="roleCode"
                                    placeholder="Role Code (e.g. CUSTOMER)"
                                    style={{ fontSize: '0.84rem', textTransform: 'uppercase' }}
                                    isInvalid={!!errors.roleCode}
                                    disabled={isViewMode}
                                    {...register('roleCode')}
                                    onChange={(e) => {
                                        const upper = e.target.value.toUpperCase().replace(/\s+/g, '_');
                                        e.target.value = upper;
                                        setValue('roleCode', upper, { shouldValidate: true });
                                    }}
                                />
                                <Form.Label htmlFor="roleCode" style={{ fontSize: '0.78rem' }}>
                                    Role Code <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.roleCode?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                            <span className="text-muted d-block" style={{ fontSize: '0.72rem', marginTop: '-4px' }}>
                                e.g., CUSTOMER, VENDOR, SUPPLIER, CONTRACTOR
                            </span>
                        </Col>

                        {/* Role Name */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="roleName"
                                    placeholder="Role Name (e.g. Customer)"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.roleName}
                                    disabled={isViewMode}
                                    {...register('roleName')}
                                />
                                <Form.Label htmlFor="roleName" style={{ fontSize: '0.78rem' }}>
                                    Role Name <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.roleName?.message}
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
                                'Update Role'
                            ) : (
                                'Save Role'
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PartyRoleModal;
