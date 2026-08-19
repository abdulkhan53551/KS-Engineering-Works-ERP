import React, { useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { partyBankAccountValidationSchema } from '../../../../validation/party.validation';
import { useCreatePartyBankAccount, useUpdatePartyBankAccount } from '../../hooks/usePartyApi';

/**
 * PartyBankAccountModal Component
 * Popup modal for Adding, Editing, and Viewing Party Bank Accounts with sleek floating fields.
 */
const PartyBankAccountModal = ({ show, onHide, partyId, mode = 'create', initialData = null }) => {
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(partyBankAccountValidationSchema),
        defaultValues: {
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            branchName: '',
            accountHolderName: '',
            upiId: '',
            isPrimary: false
        }
    });

    const { mutate: createBankAccount, isPending: isCreating } = useCreatePartyBankAccount(partyId);
    const { mutate: updateBankAccount, isPending: isUpdating } = useUpdatePartyBankAccount(partyId);
    const isSaving = isCreating || isUpdating;

    useEffect(() => {
        if (initialData && (isEditMode || isViewMode)) {
            reset({
                bankName: initialData.bankName || '',
                accountNumber: initialData.accountNumber || '',
                ifscCode: initialData.ifscCode || '',
                branchName: initialData.branchName || '',
                accountHolderName: initialData.accountHolderName || '',
                upiId: initialData.upiId || '',
                isPrimary: Boolean(initialData.isPrimary)
            });
        } else {
            reset({
                bankName: '',
                accountNumber: '',
                ifscCode: '',
                branchName: '',
                accountHolderName: '',
                upiId: '',
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
            bankName: formData.bankName.trim(),
            accountNumber: String(formData.accountNumber).trim(),
            ifscCode: formData.ifscCode.trim().toUpperCase(),
            branchName: formData.branchName.trim(),
            accountHolderName: formData.accountHolderName.trim(),
            upiId: formData.upiId ? formData.upiId.trim() : null,
            isPrimary: Boolean(formData.isPrimary)
        };

        if (isEditMode) {
            updateBankAccount(
                { bankAccountId: initialData.id, data: payload },
                {
                    onSuccess: () => onHide()
                }
            );
        } else {
            createBankAccount(payload, {
                onSuccess: () => onHide()
            });
        }
    };

    const modalTitle = isViewMode
        ? 'View Party Bank Account'
        : isEditMode
        ? 'Edit Party Bank Account'
        : 'Add Party Bank Account';

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered size="lg">
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Modal.Header closeButton className="py-2.5 px-3.5 border-bottom">
                    <Modal.Title className="h6 mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>{modalTitle}</Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-3.5">
                    <Row className="g-3">
                        {/* Bank Name */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="bankName"
                                    placeholder="Bank Name"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.bankName}
                                    disabled={isViewMode}
                                    {...register('bankName')}
                                />
                                <Form.Label htmlFor="bankName" style={{ fontSize: '0.78rem' }}>
                                    Bank Name <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.bankName?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Account Holder Name */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="accountHolderName"
                                    placeholder="Account Holder Name"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.accountHolderName}
                                    disabled={isViewMode}
                                    {...register('accountHolderName')}
                                />
                                <Form.Label htmlFor="accountHolderName" style={{ fontSize: '0.78rem' }}>
                                    Account Holder Name <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.accountHolderName?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Account Number */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="accountNumber"
                                    placeholder="Account Number"
                                    maxLength={18}
                                    inputMode="numeric"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.accountNumber}
                                    disabled={isViewMode}
                                    {...register('accountNumber')}
                                    onChange={(e) => {
                                        const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                                        e.target.value = numericOnly;
                                        setValue('accountNumber', numericOnly, { shouldValidate: true });
                                    }}
                                />
                                <Form.Label htmlFor="accountNumber" style={{ fontSize: '0.78rem' }}>
                                    Account Number <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.accountNumber?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* IFSC Code */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="ifscCode"
                                    placeholder="IFSC Code"
                                    maxLength={11}
                                    className="font-monospace text-uppercase"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.ifscCode}
                                    disabled={isViewMode}
                                    {...register('ifscCode')}
                                />
                                <Form.Label htmlFor="ifscCode" style={{ fontSize: '0.78rem' }}>
                                    IFSC Code <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.ifscCode?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Branch Name */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="branchName"
                                    placeholder="Branch Name"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.branchName}
                                    disabled={isViewMode}
                                    {...register('branchName')}
                                />
                                <Form.Label htmlFor="branchName" style={{ fontSize: '0.78rem' }}>
                                    Branch Name <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.branchName?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* UPI ID */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="upiId"
                                    placeholder="UPI ID"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.upiId}
                                    disabled={isViewMode}
                                    {...register('upiId')}
                                />
                                <Form.Label htmlFor="upiId" style={{ fontSize: '0.78rem' }}>UPI ID (e.g. name@bank)</Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.upiId?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Primary Checkbox */}
                        <Col md={12}>
                            <div className="p-2.5 px-3 rounded bg-light border d-flex align-items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is-primary-bank-account"
                                    className="form-check-input mt-0"
                                    style={{ width: '14px', height: '14px' }}
                                    disabled={isViewMode}
                                    {...register('isPrimary')}
                                />
                                <label htmlFor="is-primary-bank-account" className="fw-semibold text-dark mb-0 user-select-none" style={{ fontSize: '0.82rem', cursor: isViewMode ? 'default' : 'pointer' }}>
                                    Set as Primary Bank Account for Settlements
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
                                'Update Bank Account'
                            ) : (
                                'Save Bank Account'
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PartyBankAccountModal;
