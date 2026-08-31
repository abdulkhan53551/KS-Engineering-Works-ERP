import React, { useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { partyContactValidationSchema } from '../../../../validation/party.validation';
import { useContactRoles, useCreatePartyContact, useUpdatePartyContact } from '../../hooks/usePartyApi';
import FloatingLabelDropdown from '../FloatingLabelDropdown';

/**
 * PartyContactModal Component
 * Popup modal for Adding, Editing, and Viewing Party Contacts with floating dropdown fields.
 */
const PartyContactModal = ({ show, onHide, partyId, mode = 'create', initialData = null }) => {
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    const { data: contactRoles = [], isLoading: isLoadingContactRoles } = useContactRoles();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(partyContactValidationSchema),
        defaultValues: {
            contactRoleId: '',
            contactName: '',
            designation: '',
            mobile: '',
            email: '',
            isPrimary: false
        }
    });

    const { mutate: createContact, isPending: isCreating } = useCreatePartyContact(partyId);
    const { mutate: updateContact, isPending: isUpdating } = useUpdatePartyContact(partyId);
    const isSaving = isCreating || isUpdating;

    useEffect(() => {
        if (initialData && (isEditMode || isViewMode)) {
            reset({
                contactRoleId: initialData.contactRoleId || '',
                contactName: initialData.contactName || '',
                designation: initialData.designation || '',
                mobile: initialData.mobile || '',
                email: initialData.email || '',
                isPrimary: Boolean(initialData.isPrimary)
            });
        } else {
            reset({
                contactRoleId: '',
                contactName: '',
                designation: '',
                mobile: '',
                email: '',
                isPrimary: false
            });
        }
    }, [initialData, mode, reset, show, isEditMode, isViewMode]);

    const onSubmit = (formData) => {
        if (isViewMode) {
            onHide();
            return;
        }

        const payload = {
            contactRoleId: Number(formData.contactRoleId),
            contactName: formData.contactName.trim(),
            designation: formData.designation ? formData.designation.trim() : null,
            mobile: formData.mobile ? formData.mobile.trim() : null,
            email: formData.email ? formData.email.trim() : null,
            isPrimary: Boolean(formData.isPrimary)
        };

        if (isEditMode) {
            updateContact(
                { contactId: initialData.id, data: payload },
                {
                    onSuccess: () => onHide()
                }
            );
        } else {
            createContact(payload, {
                onSuccess: () => onHide()
            });
        }
    };

    const modalTitle = isViewMode
        ? 'View Party Contact'
        : isEditMode
        ? 'Edit Party Contact'
        : 'Add Party Contact';

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered size="lg">
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Modal.Header closeButton className="py-3 px-4 bg-white border-bottom">
                    <Modal.Title className="h6 mb-0 fw-bold text-dark">{modalTitle}</Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-4 bg-white">
                    <Row className="g-3">
                        {/* Contact Role (Floating Dropdown) */}
                        <Col md={6}>
                            <FloatingLabelDropdown
                                id="contactRoleId"
                                label="Contact Role / Dept"
                                required
                                disabled={isViewMode || isLoadingContactRoles}
                                isInvalid={!!errors.contactRoleId}
                                errorMessage={errors.contactRoleId?.message}
                                {...register('contactRoleId')}
                            >
                                {contactRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name || role.code}
                                    </option>
                                ))}
                            </FloatingLabelDropdown>
                        </Col>

                        {/* Contact Name */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="contactName"
                                    placeholder="Contact Person Name"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.contactName}
                                    disabled={isViewMode}
                                    {...register('contactName')}
                                />
                                <Form.Label htmlFor="contactName" style={{ fontSize: '0.78rem' }}>
                                    Contact Person Name <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.contactName?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Designation */}
                        <Col md={4}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="designation"
                                    placeholder="Designation"
                                    style={{ fontSize: '0.84rem' }}
                                    disabled={isViewMode}
                                    {...register('designation')}
                                />
                                <Form.Label htmlFor="designation" style={{ fontSize: '0.78rem' }}>Designation</Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* Mobile Number */}
                        <Col md={4}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="contactMobile"
                                    placeholder="Mobile, Landline or 1800 No."
                                    maxLength={15}
                                    inputMode="numeric"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.mobile}
                                    disabled={isViewMode}
                                    {...register('mobile')}
                                    onChange={(e) => {
                                        const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                                        e.target.value = numericOnly;
                                        setValue('mobile', numericOnly, { shouldValidate: true });
                                    }}
                                />
                                <Form.Label htmlFor="contactMobile" style={{ fontSize: '0.78rem' }}>
                                    Mobile / Phone Number
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.mobile?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Email */}
                        <Col md={4}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="email"
                                    id="contactEmail"
                                    placeholder="Email Address"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.email}
                                    disabled={isViewMode}
                                    {...register('email')}
                                />
                                <Form.Label htmlFor="contactEmail" style={{ fontSize: '0.78rem' }}>Email Address</Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.email?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Primary Checkbox */}
                        <Col md={12}>
                            <div className="p-2.5 px-3 rounded bg-light border d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is-primary-contact"
                                    className="form-check-input mt-0"
                                    style={{ width: '14px', height: '14px' }}
                                    disabled={isViewMode}
                                    {...register('isPrimary')}
                                />
                                <label htmlFor="is-primary-contact" className="fw-semibold text-dark mb-0 user-select-none" style={{ fontSize: '0.82rem', cursor: isViewMode ? 'default' : 'pointer' }}>
                                    Set as Primary Contact Person for this Party
                                </label>
                            </div>
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
                                'Update Contact'
                            ) : (
                                'Save Contact'
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PartyContactModal;
