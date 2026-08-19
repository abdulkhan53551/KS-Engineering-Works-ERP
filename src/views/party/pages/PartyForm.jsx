import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Tab, Nav, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { createPartyValidationSchema } from '../../../validation/party.validation';
import {
    useCreateParty,
    usePartyById,
    usePartyRoles,
    useUpdateParty,
    useUpdatePartyRoles
} from '../hooks/usePartyApi';
import PartyRoleSelector from '../components/PartyRoleSelector';
import PartyAddressSection from '../components/sections/PartyAddressSection';
import PartyContactSection from '../components/sections/PartyContactSection';
import PartyBankAccountSection from '../components/sections/PartyBankAccountSection';
import PartyStatusBadge from '../components/PartyStatusBadge';
import FloatingLabelDropdown from '../components/FloatingLabelDropdown';
import { FaArrowLeft, FaSave, FaBuilding, FaPhoneAlt, FaFileInvoiceDollar, FaMapMarkerAlt, FaUserCheck, FaUniversity, FaInfoCircle } from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import { toast } from 'react-toastify';

const PartyForm = ({ mode = 'create' }) => {
    const { id: routePartyId } = useParams();
    const isEditMode = mode === 'edit' && Boolean(routePartyId);
    const partyId = isEditMode ? Number(routePartyId) : null;

    // Sub-section active tab state
    const [activeTab, setActiveTab] = useState('addresses');

    // Party Roles state
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);

    // Queries
    const { data: party = {}, isLoading: isLoadingParty, isFetching: isFetchingParty } = usePartyById(partyId);
    const { data: partyRoles = [] } = usePartyRoles(partyId);

    // Mutations
    const { mutate: createPartyMutate, isPending: isCreatingParty } = useCreateParty();
    const { mutate: updatePartyMutate, isPending: isUpdatingParty } = useUpdateParty(partyId);
    const { mutate: updateRolesMutate, isPending: isUpdatingRoles } = useUpdatePartyRoles(partyId);

    const isSubmitting = isCreatingParty || isUpdatingParty || isUpdatingRoles;

    const {
        register,
        handleSubmit,
        reset,
        resetField,
        control,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(createPartyValidationSchema),
        mode: 'onBlur',
        reValidateMode: 'onChange',
        defaultValues: {
            partyCode: '',
            legalName: '',
            displayName: '',
            mobile: '',
            email: '',
            gstRegistered: false,
            gstin: '',
            panNumber: '',
            cinNumber: '',
            tanNumber: '',
            website: '',
            remarks: '',
            status: 'ACTIVE'
        }
    });

    const watchGstRegistered = useWatch({ control, name: 'gstRegistered' });

    // Populate party form data when in edit mode
    useEffect(() => {
        if (isEditMode && party && Object.keys(party).length > 0) {
            reset({
                partyCode: party.partyCode || '',
                legalName: party.legalName || '',
                displayName: party.displayName || '',
                mobile: party.mobile || '',
                email: party.email || '',
                gstRegistered: Boolean(party.gstRegistered),
                gstin: party.gstin || '',
                panNumber: party.panNumber || '',
                cinNumber: party.cinNumber || '',
                tanNumber: party.tanNumber || '',
                website: party.website || '',
                remarks: party.remarks || '',
                status: party.status || 'ACTIVE'
            });
        }
    }, [isEditMode, party, reset]);

    // Populate party roles when loaded
    useEffect(() => {
        if (partyRoles && partyRoles.length > 0) {
            const roleIds = partyRoles.map((r) => r.roleId || r.id);
            setSelectedRoleIds(roleIds);
        }
    }, [partyRoles]);

    // Auto-clear GSTIN when GST is toggled off
    useEffect(() => {
        if (!watchGstRegistered) {
            resetField('gstin');
        }
    }, [watchGstRegistered, resetField]);

    // Handle Form Submit
    const onSubmit = (formData) => {
        if (selectedRoleIds.length === 0) {
            toast.warn('Please select at least one party role.');
            return;
        }

        const payload = {
            partyCode: formData.partyCode.trim(),
            legalName: formData.legalName.trim(),
            displayName: formData.displayName.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email ? formData.email.trim() : null,
            gstRegistered: Boolean(formData.gstRegistered),
            gstin: formData.gstRegistered && formData.gstin ? formData.gstin.trim() : null,
            panNumber: formData.panNumber ? formData.panNumber.trim().toUpperCase() : null,
            cinNumber: formData.cinNumber ? formData.cinNumber.trim() : null,
            tanNumber: formData.tanNumber ? formData.tanNumber.trim() : null,
            website: formData.website ? formData.website.trim() : null,
            remarks: formData.remarks ? formData.remarks.trim() : null,
            status: formData.status || 'ACTIVE'
        };

        if (isEditMode) {
            updatePartyMutate(payload, {
                onSuccess: () => {
                    updateRolesMutate({ partyRoleIds: selectedRoleIds });
                }
            });
        } else {
            createPartyMutate(payload, {
                onSuccess: (res) => {
                    const newPartyId = res?.data?.id || res?.id;
                    if (newPartyId && selectedRoleIds.length > 0) {
                        updateRolesMutate({ partyRoleIds: selectedRoleIds });
                    }
                }
            });
        }
    };

    if (isEditMode && isLoadingParty) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <div className="text-muted mt-2 small">Loading party information...</div>
            </div>
        );
    }

    return (
        <>
            <PageLoader loading={isFetchingParty && !isLoadingParty} />

            {/* Top Navigation & Page Title Bar */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2 bg-white p-3 rounded border shadow-sm">
                <div className="d-flex align-items-center gap-3">
                    <Link to="/parties" className="btn btn-outline-secondary btn-sm p-1.5 px-3 d-flex align-items-center gap-2 shadow-none">
                        <FaArrowLeft size={11} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Back to List</span>
                    </Link>
                    <div className="vr d-none d-sm-block my-1" />
                    <h5 className="mb-0 text-dark fw-bold" style={{ fontSize: '1.15rem' }}>
                        {isEditMode ? 'Update Party' : 'Create New Party'}
                    </h5>
                    {isEditMode && party?.partyCode && (
                        <Badge bg="primary" className="text-white font-monospace ms-1 px-2.5 py-1" style={{ fontSize: '0.78rem' }}>
                            {party.partyCode}
                        </Badge>
                    )}
                    {isEditMode && party?.status && (
                        <PartyStatusBadge status={party.status} />
                    )}
                </div>
            </div>

            {/* Main Party Form */}
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* 1. Basic & Organization Details Card */}
                <Card className="mb-4 shadow-sm border">
                    <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                        <div className="d-flex align-items-center gap-3">
                            <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px' }}>
                                <FaBuilding className="text-primary" size={15} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                    1. Basic & Organization Details
                                </h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    Core legal entity, display name, and role associations
                                </span>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-4 pt-3.5">
                        <Row className="g-3">
                            {/* Party Code */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="partyCode"
                                        placeholder="Party Code"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.partyCode}
                                        {...register('partyCode')}
                                    />
                                    <Form.Label htmlFor="partyCode" style={{ fontSize: '0.78rem' }}>
                                        Party Code <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.partyCode?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Status Dropdown (Floating Label Pattern) */}
                            <Col lg={4} md={6}>
                                <FloatingLabelDropdown
                                    id="status"
                                    label="Status"
                                    required
                                    isInvalid={!!errors.status}
                                    errorMessage={errors.status?.message}
                                    {...register('status')}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </FloatingLabelDropdown>
                            </Col>

                            {/* Display Name */}
                            <Col lg={4} md={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="displayName"
                                        placeholder="Display Name"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.displayName}
                                        {...register('displayName')}
                                    />
                                    <Form.Label htmlFor="displayName" style={{ fontSize: '0.78rem' }}>
                                        Display Name (Trade Name) <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.displayName?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Legal Name */}
                            <Col xs={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="legalName"
                                        placeholder="Legal Name"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.legalName}
                                        {...register('legalName')}
                                    />
                                    <Form.Label htmlFor="legalName" style={{ fontSize: '0.78rem' }}>
                                        Legal / Registered Entity Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.legalName?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Embedded Party Roles Selection with Professional Check Chips */}
                            <Col xs={12}>
                                <PartyRoleSelector
                                    selectedRoleIds={selectedRoleIds}
                                    onChange={(ids) => setSelectedRoleIds(ids)}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 2. Contact & Digital Channels Card */}
                <Card className="mb-4 shadow-sm border">
                    <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                        <div className="d-flex align-items-center gap-3">
                            <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px' }}>
                                <FaPhoneAlt className="text-primary" size={14} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                    2. Contact & Digital Channels
                                </h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    Official communication numbers, email, and digital presence
                                </span>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-4 pt-3.5">
                        <Row className="g-3">
                            {/* Mobile Number (Only Numbers Allowed) */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="mobile"
                                        placeholder="Mobile Number"
                                        maxLength={10}
                                        inputMode="numeric"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.mobile}
                                        {...register('mobile')}
                                        onChange={(e) => {
                                            const numericOnly = e.target.value.replace(/[^0-9]/g, '');
                                            e.target.value = numericOnly;
                                            setValue('mobile', numericOnly, { shouldValidate: true });
                                        }}
                                    />
                                    <Form.Label htmlFor="mobile" style={{ fontSize: '0.78rem' }}>
                                        Primary Mobile Number <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.mobile?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Email */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="email"
                                        id="email"
                                        placeholder="Email Address"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.email}
                                        {...register('email')}
                                    />
                                    <Form.Label htmlFor="email" style={{ fontSize: '0.78rem' }}>Email Address</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Website */}
                            <Col lg={4} md={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="url"
                                        id="website"
                                        placeholder="Website URL"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.website}
                                        {...register('website')}
                                    />
                                    <Form.Label htmlFor="website" style={{ fontSize: '0.78rem' }}>Website URL (e.g. https://abc.com)</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.website?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Remarks */}
                            <Col lg={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        as="textarea"
                                        id="remarks"
                                        placeholder="Remarks / Notes"
                                        style={{ height: '76px', fontSize: '0.84rem' }}
                                        isInvalid={!!errors.remarks}
                                        {...register('remarks')}
                                    />
                                    <Form.Label htmlFor="remarks" style={{ fontSize: '0.78rem' }}>Remarks / Special Notes</Form.Label>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 3. Statutory & Tax Identifiers Card */}
                <Card className="mb-4 shadow-sm border">
                    <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                        <div className="d-flex align-items-center gap-3">
                            <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px' }}>
                                <FaFileInvoiceDollar className="text-primary" size={15} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                    3. Statutory & Tax Identification
                                </h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    GST compliance, PAN, CIN, and TAN records
                                </span>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-4 pt-3.5">
                        <Row className="g-3">
                            {/* GST Registered Toggle */}
                            <Col lg={12}>
                                <div className="p-2.5 px-3 rounded bg-light border d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                                    <div>
                                        <span className="fw-semibold text-dark d-block" style={{ fontSize: '0.83rem' }}>GST Registration Status</span>
                                        <span className="text-muted" style={{ fontSize: '0.74rem' }}>Enable if the party is registered under Goods and Services Tax (GST).</span>
                                    </div>
                                    <Form.Check
                                        type="switch"
                                        id="gst-registered-switch"
                                        label={watchGstRegistered ? 'GST Registered (Regular / Composition)' : 'Unregistered / Non-GST'}
                                        className="fw-semibold text-primary"
                                        style={{ fontSize: '0.82rem' }}
                                        {...register('gstRegistered')}
                                    />
                                </div>
                            </Col>

                            {/* GSTIN */}
                            <Col lg={6} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="gstin"
                                        placeholder="GSTIN Number"
                                        maxLength={15}
                                        className="font-monospace text-uppercase"
                                        style={{ fontSize: '0.84rem' }}
                                        disabled={!watchGstRegistered}
                                        isInvalid={!!errors.gstin}
                                        {...register('gstin')}
                                    />
                                    <Form.Label htmlFor="gstin" style={{ fontSize: '0.78rem' }}>
                                        GSTIN No. {watchGstRegistered && <span className="text-danger label-required">*</span>}
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.gstin?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* PAN Number */}
                            <Col lg={6} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="panNumber"
                                        placeholder="PAN Number"
                                        maxLength={10}
                                        className="font-monospace text-uppercase"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.panNumber}
                                        {...register('panNumber')}
                                    />
                                    <Form.Label htmlFor="panNumber" style={{ fontSize: '0.78rem' }}>PAN Number</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.panNumber?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* CIN Number */}
                            <Col lg={6} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="cinNumber"
                                        placeholder="CIN Number"
                                        maxLength={21}
                                        className="font-monospace text-uppercase"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.cinNumber}
                                        {...register('cinNumber')}
                                    />
                                    <Form.Label htmlFor="cinNumber" style={{ fontSize: '0.78rem' }}>CIN Number (Corporate ID)</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.cinNumber?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* TAN Number */}
                            <Col lg={6} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="tanNumber"
                                        placeholder="TAN Number"
                                        maxLength={10}
                                        className="font-monospace text-uppercase"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.tanNumber}
                                        {...register('tanNumber')}
                                    />
                                    <Form.Label htmlFor="tanNumber" style={{ fontSize: '0.78rem' }}>TAN Number (Tax Deduction)</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.tanNumber?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Bottom Action Bar (Cancel button removed from update mode) */}
                <div className="d-flex align-items-center justify-content-end gap-2.5 mb-4 p-3 bg-white rounded border shadow-sm">
                    {!isEditMode && (
                        <Link to="/parties" className="btn btn-outline-secondary btn-sm px-3.5" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                            Cancel
                        </Link>
                    )}
                    <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        className="px-4 py-2 d-flex align-items-center gap-2 shadow-sm"
                        disabled={isSubmitting}
                        style={{ fontSize: '0.84rem', fontWeight: 600 }}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" />
                                <span>Saving Party...</span>
                            </>
                        ) : (
                            <>
                                <FaSave size={13} />
                                <span>{isEditMode ? 'Update Party' : 'Create & Proceed'}</span>
                            </>
                        )}
                    </Button>
                </div>
            </Form>

            {/* 4. Sub-Sections (Addresses, Contacts, Bank Accounts) */}
            <Card className="mb-4 shadow-sm border">
                <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                4. Associated Party Details
                            </h6>
                            <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                Manage branch addresses, contact persons, and settlement bank accounts
                            </span>
                        </div>
                        {!isEditMode && (
                            <Badge bg="soft-warning" className="text-warning px-2.5 py-1" style={{ fontSize: '0.75rem' }}>
                                Unlocked upon Party Creation
                            </Badge>
                        )}
                    </div>
                </Card.Header>

                <Card.Body className="p-4 pt-3.5">
                    {!isEditMode ? (
                        <div className="text-center py-5 px-3 bg-light rounded border border-dashed my-2">
                            <FaInfoCircle className="text-primary mb-2.5" size={24} />
                            <h6 className="fw-semibold text-dark mb-1" style={{ fontSize: '0.92rem' }}>Party Sub-Sections are Locked</h6>
                            <p className="text-muted small mb-0" style={{ maxWidth: '500px', margin: '0 auto', fontSize: '0.80rem' }}>
                                Please fill in the basic details and click <strong>"Create & Proceed"</strong> above.
                                Once the party record is created, you will be able to manage Addresses, Contacts, and Bank Accounts in separate transactions.
                            </p>
                        </div>
                    ) : (
                        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                            <Nav variant="pills" className="mb-3.5 gap-2 border-bottom pb-2.5">
                                <Nav.Item>
                                    <Nav.Link eventKey="addresses" className="d-flex align-items-center gap-2 px-3 py-1.5" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                        <FaMapMarkerAlt size={12} />
                                        <span>Party Addresses</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="contacts" className="d-flex align-items-center gap-2 px-3 py-1.5" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                        <FaUserCheck size={12} />
                                        <span>Party Contacts</span>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="banks" className="d-flex align-items-center gap-2 px-3 py-1.5" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                        <FaUniversity size={12} />
                                        <span>Bank Accounts</span>
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            <Tab.Content className="pt-2">
                                <Tab.Pane eventKey="addresses">
                                    <PartyAddressSection partyId={partyId} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="contacts">
                                    <PartyContactSection partyId={partyId} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="banks">
                                    <PartyBankAccountSection partyId={partyId} />
                                </Tab.Pane>
                            </Tab.Content>
                        </Tab.Container>
                    )}
                </Card.Body>
            </Card>
        </>
    );
};

export default PartyForm;
