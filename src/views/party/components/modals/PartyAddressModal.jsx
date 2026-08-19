import React, { useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { partyAddressValidationSchema } from '../../../../validation/party.validation';
import { useAddressTypes, useCreatePartyAddress, useUpdatePartyAddress } from '../../hooks/usePartyApi';
import { useCountryState, useStateCity } from '../../../dashboard/hooks/api.hooks';
import FloatingLabelDropdown from '../FloatingLabelDropdown';

/**
 * PartyAddressModal Component
 * Popup modal for Adding, Editing, and Viewing Party Addresses with floating dropdown fields.
 */
const PartyAddressModal = ({ show, onHide, partyId, mode = 'create', initialData = null }) => {
    const isViewMode = mode === 'view';
    const isEditMode = mode === 'edit';

    const { data: addressTypes = [], isLoading: isLoadingAddressTypes } = useAddressTypes();
    const { data: states = [], isLoading: isLoadingStates } = useCountryState();

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        control,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(partyAddressValidationSchema),
        defaultValues: {
            addressTypeId: '',
            address: '',
            stateId: '',
            cityId: '',
            country: 'India',
            pincode: ''
        }
    });

    const selectedStateId = useWatch({ control, name: 'stateId' });
    const { data: cities = [], isFetching: isFetchingCities } = useStateCity(selectedStateId);

    const { mutate: createAddress, isPending: isCreating } = useCreatePartyAddress(partyId);
    const { mutate: updateAddress, isPending: isUpdating } = useUpdatePartyAddress(partyId);
    const isSaving = isCreating || isUpdating;

    useEffect(() => {
        if (initialData && (isEditMode || isViewMode)) {
            reset({
                addressTypeId: initialData.addressTypeId || '',
                address: initialData.address || '',
                stateId: initialData.stateId || '',
                cityId: initialData.cityId || '',
                country: initialData.country || 'India',
                pincode: String(initialData.pincode || '')
            });
        } else {
            reset({
                addressTypeId: '',
                address: '',
                stateId: '',
                cityId: '',
                country: 'India',
                pincode: ''
            });
        }
    }, [initialData, mode, reset, show, isEditMode, isViewMode]);

    useEffect(() => {
        if (initialData?.cityId && cities.length > 0 && (isEditMode || isViewMode)) {
            setValue('cityId', initialData.cityId);
        }
    }, [cities, initialData?.cityId, isEditMode, isViewMode, setValue]);

    const onSubmit = (formData) => {
        if (isViewMode) {
            onHide();
            return;
        }

        const payload = {
            addressTypeId: Number(formData.addressTypeId),
            address: formData.address.trim(),
            stateId: Number(formData.stateId),
            cityId: Number(formData.cityId),
            country: formData.country.trim() || 'India',
            pincode: String(formData.pincode).trim()
        };

        if (isEditMode) {
            updateAddress(
                { addressId: initialData.id, data: payload },
                {
                    onSuccess: () => onHide()
                }
            );
        } else {
            createAddress(payload, {
                onSuccess: () => onHide()
            });
        }
    };

    const modalTitle = isViewMode
        ? 'View Party Address'
        : isEditMode
        ? 'Edit Party Address'
        : 'Add Party Address';

    return (
        <Modal show={show} onHide={onHide} backdrop="static" centered size="lg">
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Modal.Header closeButton className="py-2.5 px-3.5 border-bottom">
                    <Modal.Title className="h6 mb-0 fw-bold" style={{ fontSize: '0.95rem' }}>{modalTitle}</Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-3.5">
                    <Row className="g-3">
                        {/* Address Type (Floating Dropdown) */}
                        <Col md={6}>
                            <FloatingLabelDropdown
                                id="addressTypeId"
                                label="Address Type"
                                required
                                disabled={isViewMode || isLoadingAddressTypes}
                                isInvalid={!!errors.addressTypeId}
                                errorMessage={errors.addressTypeId?.message}
                                {...register('addressTypeId')}
                            >
                                {addressTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name || type.code} {type.description ? `(${type.description})` : ''}
                                    </option>
                                ))}
                            </FloatingLabelDropdown>
                        </Col>

                        {/* Pincode */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="pincode"
                                    placeholder="Pincode"
                                    maxLength={6}
                                    inputMode="numeric"
                                    className="font-monospace"
                                    style={{ fontSize: '0.84rem' }}
                                    isInvalid={!!errors.pincode}
                                    disabled={isViewMode}
                                    {...register('pincode')}
                                    onChange={(e) => {
                                        const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                                        e.target.value = numericOnly;
                                        setValue('pincode', numericOnly, { shouldValidate: true });
                                    }}
                                />
                                <Form.Label htmlFor="pincode" style={{ fontSize: '0.78rem' }}>
                                    Pincode <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.pincode?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Address Line */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    as="textarea"
                                    id="address"
                                    placeholder="Address Line"
                                    style={{ height: '70px', fontSize: '0.84rem' }}
                                    isInvalid={!!errors.address}
                                    disabled={isViewMode}
                                    {...register('address')}
                                />
                                <Form.Label htmlFor="address" style={{ fontSize: '0.78rem' }}>
                                    Address (Building / Street / Area) <span className="text-danger label-required">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                    {errors.address?.message}
                                </Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* State (Floating Dropdown) */}
                        <Col md={4}>
                            <FloatingLabelDropdown
                                id="stateId"
                                label="State"
                                required
                                disabled={isViewMode || isLoadingStates}
                                isInvalid={!!errors.stateId}
                                errorMessage={errors.stateId?.message}
                                {...register('stateId')}
                            >
                                {states.map((st) => (
                                    <option key={st.id || st.stateId} value={st.id || st.stateId}>
                                        {st.name || st.stateName}
                                    </option>
                                ))}
                            </FloatingLabelDropdown>
                        </Col>

                        {/* City (Floating Dropdown) */}
                        <Col md={4}>
                            <FloatingLabelDropdown
                                id="cityId"
                                label="City"
                                required
                                disabled={isViewMode || !selectedStateId || isFetchingCities}
                                isInvalid={!!errors.cityId}
                                errorMessage={errors.cityId?.message}
                                {...register('cityId')}
                            >
                                {isFetchingCities ? (
                                    <option value="" disabled>Loading cities...</option>
                                ) : !selectedStateId ? (
                                    <option value="" disabled>-- Select State First --</option>
                                ) : (
                                    cities.map((ct) => (
                                        <option key={ct.id || ct.cityId} value={ct.id || ct.cityId}>
                                            {ct.name || ct.cityName}
                                        </option>
                                    ))
                                )}
                            </FloatingLabelDropdown>
                        </Col>

                        {/* Country */}
                        <Col md={4}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    type="text"
                                    id="country"
                                    placeholder="Country"
                                    style={{ fontSize: '0.84rem' }}
                                    disabled={isViewMode}
                                    {...register('country')}
                                />
                                <Form.Label htmlFor="country" style={{ fontSize: '0.78rem' }}>Country</Form.Label>
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
                                'Update Address'
                            ) : (
                                'Save Address'
                            )}
                        </Button>
                    )}
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default PartyAddressModal;
