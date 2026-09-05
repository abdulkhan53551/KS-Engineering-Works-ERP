import React, { useEffect, useMemo } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { partyBranchValidationSchema } from '../../../../validation/party.validation';
import { useCreatePartyBranch, useUpdatePartyBranch } from '../../hooks/usePartyApi';
import { useCountryState, useStateCity } from '../../../dashboard/hooks/api.hooks';
import FloatingLabelDropdown from '../FloatingLabelDropdown';
import { findDbStateByGstCode } from '../../../../utilities/gstStateHelper';
import { toast } from 'react-toastify';

/**
 * PartyBranchModal Component
 * Popup modal for Adding, Editing, and Viewing Party Branches.
 */
const PartyBranchModal = ({ show, onHide, partyId, mode = 'create', initialData = null }) => {
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    const { data: states = [], isLoading: isLoadingStates } = useCountryState();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(partyBranchValidationSchema),
        defaultValues: {
            branchName: '',
            branchCode: '',
            gstin: '',
            stateId: '',
            cityId: '',
            address: '',
            pincode: '',
            mobile: '',
            email: '',
            remarks: '',
            isDefault: false,
            isHeadOffice: false
        }
    });

    const selectedStateId = useWatch({ control, name: 'stateId' });
    const watchedGstin = useWatch({ control, name: 'gstin' });
    const { data: cities = [], isFetching: isFetchingCities } = useStateCity(selectedStateId);

    const { mutate: createBranch, isPending: isCreating } = useCreatePartyBranch(partyId);
    const { mutate: updateBranch, isPending: isUpdating } = useUpdatePartyBranch(partyId);
    const isSaving = isCreating || isUpdating;

    // Check for GSTIN state mismatch warning
    const gstinStateWarning = useMemo(() => {
        if (!watchedGstin || watchedGstin.length < 2 || !selectedStateId) return null;
        const code = watchedGstin.substring(0, 2);
        const derivedState = findDbStateByGstCode(code, states);
        if (derivedState && Number(derivedState.id) !== Number(selectedStateId)) {
            return `GSTIN prefix '${code}' is registered for ${derivedState.name}, but selected state is different.`;
        }
        return null;
    }, [watchedGstin, selectedStateId, states]);

    useEffect(() => {
        if (initialData && (isEditMode || isViewMode)) {
            const addr = initialData.billingAddress || {};
            const resolvedAddress = initialData.address || (typeof addr === 'string' ? addr : addr.address) || '';
            const resolvedCityId = initialData.cityId || addr.cityId || '';
            const resolvedStateId = initialData.stateId || addr.stateId || '';
            const resolvedPincode = initialData.pincode || addr.pincode || '';
            const resolvedCountry = initialData.country || addr.country || 'India';

            reset({
                branchName: initialData.branchName || '',
                branchCode: initialData.branchCode || '',
                gstin: initialData.gstin || '',
                stateId: resolvedStateId,
                cityId: resolvedCityId,
                address: resolvedAddress,
                pincode: String(resolvedPincode),
                country: resolvedCountry,
                mobile: initialData.mobile || '',
                email: initialData.email || '',
                remarks: initialData.remarks || '',
                isDefault: Boolean(initialData.isDefault),
                isHeadOffice: Boolean(initialData.isHeadOffice)
            });
        } else {
            reset({
                branchName: '',
                branchCode: '',
                gstin: '',
                stateId: '',
                cityId: '',
                address: '',
                pincode: '',
                country: 'India',
                mobile: '',
                email: '',
                remarks: '',
                isDefault: false,
                isHeadOffice: false
            });
        }
    }, [initialData, mode, reset, show, isEditMode, isViewMode]);

    useEffect(() => {
        const targetCityId = initialData?.cityId || initialData?.billingAddress?.cityId;
        if (targetCityId && cities.length > 0 && (isEditMode || isViewMode)) {
            setValue('cityId', targetCityId);
        }
    }, [cities, initialData, isEditMode, isViewMode, setValue]);

    const onSubmit = (formData) => {
        if (isViewMode) {
            onHide();
            return;
        }

        const effectivePartyId = partyId || initialData?.partyId;
        const branchId = initialData?.id || initialData?.branchId;

        const payload = {
            branchName: formData.branchName ? formData.branchName.trim() : undefined,
            branchCode: formData.branchCode?.trim() || null,
            gstin: formData.gstin?.trim() ? formData.gstin.trim().toUpperCase() : null,
            stateId: formData.stateId ? Number(formData.stateId) : undefined,
            cityId: formData.cityId ? Number(formData.cityId) : null,
            address: formData.address ? formData.address.trim() : undefined,
            pincode: formData.pincode ? String(formData.pincode).trim() : null,
            country: formData.country?.trim() || 'India',
            mobile: formData.mobile?.trim() || null,
            email: formData.email?.trim() || null,
            remarks: formData.remarks?.trim() || null,
            isDefault: Boolean(formData.isDefault),
            isHeadOffice: Boolean(formData.isHeadOffice)
        };

        if (isEditMode) {
            if (!branchId) {
                toast.error("Branch ID not found for updating.");
                return;
            }
            updateBranch(
                { partyId: effectivePartyId, branchId, data: payload },
                {
                    onSuccess: () => onHide()
                }
            );
        } else {
            createBranch(
                { partyId: effectivePartyId, data: payload },
                {
                    onSuccess: () => onHide()
                }
            );
        }
    };

    const onFormError = (formErrors) => {
        console.error("PartyBranchModal validation errors:", formErrors);
        const firstErr = Object.values(formErrors)[0]?.message;
        if (firstErr) {
            toast.error(firstErr);
        }
    };

    const modalTitle = isViewMode
        ? 'View Branch Details'
        : isEditMode
            ? 'Edit Party Branch'
            : 'Add New Party Branch';

    return (
        <Modal show={show} onHide={onHide} size="lg" backdrop="static" centered>
            <Modal.Header closeButton className="border-bottom py-3">
                <Modal.Title className="h6 mb-0 fw-bold">{modalTitle}</Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit(onSubmit, onFormError)}>
                <Modal.Body className="p-4">
                    {gstinStateWarning && (
                        <Alert variant="warning" className="py-2 px-3 mb-3 small d-flex align-items-center gap-2">
                            <span>⚠️ {gstinStateWarning}</span>
                        </Alert>
                    )}

                    <Row className="g-3">
                        {/* Branch Name */}
                        <Col md={6}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">
                                    Branch / Facility Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Head Office, Pune Plant, Sanand Warehouse"
                                    disabled={isViewMode}
                                    isInvalid={!!errors.branchName}
                                    {...register('branchName')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.branchName?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Branch Code */}
                        <Col md={3}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">Branch Code</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. BR-01 / HO"
                                    disabled={isViewMode}
                                    isInvalid={!!errors.branchCode}
                                    {...register('branchCode')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.branchCode?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Branch-Specific GSTIN */}
                        <Col md={3}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">Branch GSTIN</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="15-digit GSTIN"
                                    maxLength={15}
                                    className="text-uppercase font-monospace"
                                    disabled={isViewMode}
                                    isInvalid={!!errors.gstin}
                                    {...register('gstin', {
                                        onChange: (e) => {
                                            const val = (e.target.value || '').toUpperCase();
                                            setValue('gstin', val);
                                            if (val.length >= 2) {
                                                const code = val.substring(0, 2);
                                                const foundState = findDbStateByGstCode(code, states);
                                                if (foundState?.id && !selectedStateId) {
                                                    setValue('stateId', foundState.id, { shouldValidate: true });
                                                }
                                            }
                                        }
                                    })}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.gstin?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* State Dropdown */}
                        <Col md={6}>
                            <FloatingLabelDropdown
                                id="branch-stateId"
                                label="State"
                                required
                                disabled={isViewMode || isLoadingStates}
                                isInvalid={!!errors.stateId}
                                errorMessage={errors.stateId?.message}
                                options={states.map((s) => ({
                                    value: s.id || s.stateId,
                                    label: s.name || s.stateName
                                }))}
                                {...register('stateId', {
                                    onChange: () => setValue('cityId', '')
                                })}
                            />
                        </Col>

                        {/* City Dropdown */}
                        <Col md={6}>
                            <FloatingLabelDropdown
                                id="branch-cityId"
                                label="City"
                                required
                                disabled={isViewMode || !selectedStateId || isFetchingCities}
                                isInvalid={!!errors.cityId}
                                errorMessage={errors.cityId?.message}
                                options={cities.map((c) => ({
                                    value: c.id || c.cityId,
                                    label: c.name || c.cityName
                                }))}
                                {...register('cityId')}
                            />
                        </Col>

                        {/* Address Line */}
                        <Col md={9}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">
                                    Street / Facility Address <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Complete street address, plot number, industrial area..."
                                    disabled={isViewMode}
                                    isInvalid={!!errors.address}
                                    {...register('address')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.address?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Pincode */}
                        <Col md={3}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">
                                    Pincode <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="6-digit PIN"
                                    maxLength={6}
                                    disabled={isViewMode}
                                    isInvalid={!!errors.pincode}
                                    {...register('pincode')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.pincode?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Mobile / Site Phone */}
                        <Col md={4}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">Site Phone / Mobile</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Contact number"
                                    disabled={isViewMode}
                                    isInvalid={!!errors.mobile}
                                    {...register('mobile')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.mobile?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Site Email */}
                        <Col md={4}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">Site / Branch Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="branch@company.com"
                                    disabled={isViewMode}
                                    isInvalid={!!errors.email}
                                    {...register('email')}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email?.message}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        {/* Remarks */}
                        <Col md={4}>
                            <Form.Group className="form-group mb-0">
                                <Form.Label className="small fw-semibold">Internal Remarks</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Gate 2 / Delivery note"
                                    disabled={isViewMode}
                                    {...register('remarks')}
                                />
                            </Form.Group>
                        </Col>

                        {/* Branch Flags */}
                        {!isViewMode && (
                            <Col md={12} className="pt-2">
                                <div className="d-flex align-items-center gap-4 p-3 bg-light rounded border">
                                    <Form.Check
                                        type="switch"
                                        id="branch-isDefault"
                                        label={<span className="small fw-semibold">Set as Primary / Default Billing Branch</span>}
                                        {...register('isDefault')}
                                    />
                                    <Form.Check
                                        type="switch"
                                        id="branch-isHeadOffice"
                                        label={<span className="small fw-semibold">Head Office / Corporate HQ</span>}
                                        {...register('isHeadOffice')}
                                    />
                                </div>
                            </Col>
                        )}
                    </Row>
                </Modal.Body>

                <Modal.Footer className="border-top py-2.5 px-4 d-flex justify-content-between">
                    <Button variant="outline-secondary" size="sm" onClick={onHide}>
                        {isViewMode ? 'Close' : 'Cancel'}
                    </Button>

                    {!isViewMode && (
                        <Button variant="primary" size="sm" type="submit" disabled={isSaving} className="px-4">
                            {isSaving ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                                    Saving...
                                </>
                            ) : isEditMode ? (
                                'Update Branch'
                            ) : (
                                'Save Branch'
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PartyBranchModal;
