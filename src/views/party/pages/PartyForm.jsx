import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Tab, Nav, Badge } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { createPartyValidationSchema } from '../../../validation/party.validation';
import {
    useCreateParty,
    usePartyById,
    useUpdateParty
} from '../hooks/usePartyApi';
import PartyRoleSelector from '../components/PartyRoleSelector';
import PartyBranchSection from '../components/sections/PartyBranchSection';
import PartyContactSection from '../components/sections/PartyContactSection';
import PartyBankAccountSection from '../components/sections/PartyBankAccountSection';
import PartyDocumentSection from '../components/sections/PartyDocumentSection';
import PartyStatusBadge from '../components/PartyStatusBadge';
import FloatingLabelDropdown from '../components/FloatingLabelDropdown';
import LogoUploadDropZone from '../../../components/upload/LogoUploadDropZone';
import {
    FaArrowLeft,
    FaSave,
    FaBuilding,
    FaPhoneAlt,
    FaFileInvoiceDollar,
    FaMapMarkerAlt,
    FaUserCheck,
    FaUniversity,
    FaFileAlt,
    FaInfoCircle
} from 'react-icons/fa';
import PageLoader from '../../../components/PageLoader';
import { toast } from 'react-toastify';

const PartyForm = ({ mode = 'create' }) => {
    const { id: routePartyId } = useParams();
    const isEditMode = mode === 'edit' && Boolean(routePartyId);
    const partyId = isEditMode ? Number(routePartyId) : null;

    // Sub-section active tab state
    const [activeTab, setActiveTab] = useState('branches');

    // Party Roles state
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);

    // Queries
    const { data: party = {}, isLoading: isLoadingParty, isFetching: isFetchingParty } = usePartyById(partyId);

    // Mutations
    const { mutate: createPartyMutate, isPending: isCreatingParty } = useCreateParty();
    const { mutate: updatePartyMutate, isPending: isUpdatingParty } = useUpdateParty(partyId);

    const isSubmitting = isCreatingParty || isUpdatingParty;

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
            partyRoleIds: [],
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
            logoUrl: '',
            logoPublicId: '',
            status: 'ACTIVE'
        }
    });

    const watchGstRegistered = useWatch({ control, name: 'gstRegistered' });
    const watchLogoUrl = useWatch({ control, name: 'logoUrl' });
    const watchLogoPublicId = useWatch({ control, name: 'logoPublicId' });

    // Populate party form data and roles when in edit mode
    useEffect(() => {
        if (isEditMode && party && Object.keys(party).length > 0) {
            reset({
                partyRoleIds: party.partyRoleIds || (Array.isArray(party.roles) ? party.roles.map(r => r.roleId || r.id) : []),
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
                logoUrl: party.logoUrl || party.logo || '',
                logoPublicId: party.logoPublicId || '',
                status: party.status || 'ACTIVE'
            });

            // Populate partyRoleIds from party.partyRoleIds or party.roles
            let roleIds = [];
            if (Array.isArray(party.partyRoleIds)) {
                roleIds = party.partyRoleIds.map(Number);
            } else if (Array.isArray(party.roles)) {
                roleIds = party.roles.map((r) => Number(r.roleId || r.id));
            }
            setSelectedRoleIds(roleIds);
            setValue('partyRoleIds', roleIds);
        }
    }, [isEditMode, party, reset, setValue]);

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
            partyRoleIds: selectedRoleIds,
            partyCode: formData.partyCode.trim(),
            legalName: formData.legalName.trim(),
            displayName: formData.displayName.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email ? formData.email.trim() : null,
            gstRegistered: Boolean(formData.gstRegistered),
            gstin: formData.gstRegistered && formData.gstin ? formData.gstin.trim() : null,
            panNumber: formData.panNumber ? formData.panNumber.trim().toUpperCase() : null,
            cinNumber: formData.cinNumber ? formData.cinNumber.trim() : null,
            tanNumber: formData.tanNumber ? formData.tanNumber.trim().toUpperCase() : null,
            website: formData.website ? formData.website.trim() : null,
            remarks: formData.remarks ? formData.remarks.trim() : null,
            logoUrl: formData.logoUrl || null,
            logoPublicId: formData.logoPublicId || null,
            status: formData.status || 'ACTIVE'
        };

        if (isEditMode) {
            updatePartyMutate(payload);
        } else {
            createPartyMutate(payload);
        }
    };

    return (
        <>
            <PageLoader loading={isLoadingParty || isFetchingParty} />

            {/* Page Header Card with White Background */}
            <Card className="mb-4 shadow-sm border bg-white">
                <Card.Body className="py-3 px-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <Link
                                to="/parties"
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
                                title="Back to Parties List"
                            >
                                <FaArrowLeft size={14} />
                            </Link>
                            <div>
                                <h5 className="mb-0 fw-bold text-dark">
                                    {isEditMode ? `Edit Party: ${party.displayName || party.legalName || 'Party'}` : 'Create New Party'}
                                </h5>
                                <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                                    {isEditMode ? 'Update party information, logos, KYC documents, addresses, and contacts' : 'Register a new customer, vendor, or supplier profile'}
                                </span>
                            </div>
                        </div>

                        {isEditMode && party.status && (
                            <div className="d-flex align-items-center gap-2">
                                <span className="text-muted small fw-medium">Status:</span>
                                <PartyStatusBadge status={party.status} />
                            </div>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {/* Main Form */}
            <Form onSubmit={handleSubmit(onSubmit)}>
                {/* 1. General & Brand Information Card */}
                <Card className="mb-4 shadow-sm border bg-white">
                    <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                        <div className="d-flex align-items-center gap-3">
                            <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px' }}>
                                <FaBuilding className="text-primary" size={14} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                    1. General & Brand Information
                                </h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    Basic identity, trade name, company logo, and party role categorization
                                </span>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-4 pt-3.5">
                        <Row className="g-3">
                            {isEditMode ? (
                                <>
                                    {/* Edit Mode: Compact Auto-width Logo Column */}
                                    <Col xs="auto" className="d-flex align-items-center mb-2">
                                        <LogoUploadDropZone
                                            value={watchLogoUrl}
                                            publicId={watchLogoPublicId}
                                            folder="parties/logos"
                                            tags="ks-erp,party,logo"
                                            onChange={({ logoUrl, logoPublicId }) => {
                                                setValue('logoUrl', logoUrl, { shouldValidate: true });
                                                setValue('logoPublicId', logoPublicId, { shouldValidate: true });
                                            }}
                                            disabled={isSubmitting}
                                        />
                                    </Col>

                                    {/* Edit Mode: Key Identity Fields Column */}
                                    <Col className="flex-grow-1">
                                        <Row className="g-2">
                                            {/* Party Code */}
                                            <Col md={4} sm={12}>
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

                                            {/* Status Dropdown */}
                                            <Col md={4} sm={12}>
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
                                            <Col md={4} sm={12}>
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
                                        </Row>
                                    </Col>
                                </>
                            ) : (
                                <>
                                    {/* Create Mode: Clean Top Row without Logo */}
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

                                    {/* Status Dropdown */}
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
                                </>
                            )}

                            {/* Embedded Party Roles Selection with Professional Check Chips */}
                            <Col xs={12}>
                                <PartyRoleSelector
                                    selectedRoleIds={selectedRoleIds}
                                    onChange={(ids) => {
                                        setSelectedRoleIds(ids);
                                        setValue('partyRoleIds', ids, { shouldValidate: true });
                                    }}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 2. Contact & Digital Channels Card */}
                <Card className="mb-4 shadow-sm border bg-white">
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
                                        placeholder="Mobile, Landline or 1800 No."
                                        maxLength={15}
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
                                        Primary Phone / Mobile Number <span className="text-danger label-required">*</span>
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
                                        placeholder="https://example.com"
                                        style={{ fontSize: '0.84rem' }}
                                        isInvalid={!!errors.website}
                                        {...register('website')}
                                    />
                                    <Form.Label htmlFor="website" style={{ fontSize: '0.78rem' }}>Website URL (https://...)</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.website?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Remarks */}
                            <Col xs={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-1">
                                    <Form.Control
                                        as="textarea"
                                        id="remarks"
                                        placeholder="Remarks or internal notes..."
                                        style={{ height: '76px', fontSize: '0.84rem' }}
                                        isInvalid={!!errors.remarks}
                                        {...register('remarks')}
                                    />
                                    <Form.Label htmlFor="remarks" style={{ fontSize: '0.78rem' }}>Internal Remarks / Notes</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.remarks?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 3. Statutory & Tax Registration Card */}
                <Card className="mb-4 shadow-sm border bg-white">
                    <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                        <div className="d-flex align-items-center gap-3">
                            <div className="avatar-35 bg-soft-primary rounded d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px' }}>
                                <FaFileInvoiceDollar className="text-primary" size={14} />
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                    3. Statutory & Tax Registration
                                </h6>
                                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                    GST compliance, PAN, CIN, and corporate tax identification details
                                </span>
                            </div>
                        </div>
                    </Card.Header>

                    <Card.Body className="p-4 pt-3.5">
                        {/* GST Registration Switch */}
                        <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded border mb-3">
                            <div>
                                <span className="fw-semibold text-dark d-block" style={{ fontSize: '0.86rem' }}>
                                    GST Registered Entity
                                </span>
                                <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                                    Enable if this party has a registered GST identification number in India
                                </span>
                            </div>
                            <Form.Check
                                type="switch"
                                id="gstRegisteredSwitch"
                                className="fs-5"
                                {...register('gstRegistered')}
                            />
                        </div>

                        <Row className="g-3">
                            {/* GSTIN (Only if GST is enabled) */}
                            {watchGstRegistered && (
                                <Col lg={6} md={12}>
                                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                        <Form.Control
                                            type="text"
                                            id="gstin"
                                            placeholder="GSTIN"
                                            maxLength={15}
                                            className="font-monospace text-uppercase"
                                            style={{ fontSize: '0.84rem', letterSpacing: '0.04em' }}
                                            isInvalid={!!errors.gstin}
                                            {...register('gstin')}
                                            onChange={(e) => {
                                                const upper = e.target.value.toUpperCase();
                                                e.target.value = upper;
                                                setValue('gstin', upper, { shouldValidate: true });

                                                // Auto-derive PAN from GSTIN (Characters 3 to 12)
                                                if (upper.length >= 12 && !party.panNumber) {
                                                    const derivedPan = upper.substring(2, 12);
                                                    setValue('panNumber', derivedPan, { shouldValidate: true });
                                                }
                                            }}
                                        />
                                        <Form.Label htmlFor="gstin" style={{ fontSize: '0.78rem' }}>
                                            GST Identification Number (GSTIN) <span className="text-danger label-required">*</span>
                                        </Form.Label>
                                        <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                            {errors.gstin?.message}
                                        </Form.Control.Feedback>
                                    </Form.Floating>
                                </Col>
                            )}

                            {/* PAN Number */}
                            <Col lg={watchGstRegistered ? 6 : 4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                    <Form.Control
                                        type="text"
                                        id="panNumber"
                                        placeholder="PAN Number"
                                        maxLength={10}
                                        className="font-monospace text-uppercase"
                                        style={{ fontSize: '0.84rem', letterSpacing: '0.04em' }}
                                        isInvalid={!!errors.panNumber}
                                        {...register('panNumber')}
                                        onChange={(e) => {
                                            const upper = e.target.value.toUpperCase();
                                            e.target.value = upper;
                                            setValue('panNumber', upper, { shouldValidate: true });
                                        }}
                                    />
                                    <Form.Label htmlFor="panNumber" style={{ fontSize: '0.78rem' }}>Permanent Account Number (PAN)</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.panNumber?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* CIN Number */}
                            <Col lg={watchGstRegistered ? 6 : 4} md={6}>
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
                                    <Form.Label htmlFor="cinNumber" style={{ fontSize: '0.78rem' }}>CIN (Corporate Identification)</Form.Label>
                                    <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                                        {errors.cinNumber?.message}
                                    </Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* TAN Number */}
                            <Col lg={watchGstRegistered ? 6 : 4} md={12}>
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

                {/* Bottom Action Bar */}
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

            {/* 4. Sub-Sections (Addresses, Contacts, Bank Accounts, KYC & Documents) */}
            <Card className="mb-4 shadow-sm border bg-white">
                <Card.Header className="bg-transparent py-3 px-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                4. Associated Party Details
                            </h6>
                            <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                                Manage branch addresses, contact persons, bank accounts, and KYC/compliance documents
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
                                Once the party record is created, you will be able to manage Addresses, Contacts, Bank Accounts, and KYC Documents in separate transactions.
                            </p>
                        </div>
                    ) : (
                        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                            <Nav variant="pills" className="mb-3.5 gap-2 border-bottom pb-2.5 flex-wrap">
                                <Nav.Item>
                                    <Nav.Link eventKey="branches" className="d-flex align-items-center gap-2 px-3 py-1.5" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                        <FaBuilding size={12} />
                                        <span>Party Branches / Locations</span>
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
                                <Nav.Item>
                                    <Nav.Link eventKey="documents" className="d-flex align-items-center gap-2 px-3 py-1.5" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                        <FaFileAlt size={12} />
                                        <span>Documents & KYC</span>
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>

                            <Tab.Content className="pt-2">
                                <Tab.Pane eventKey="branches">
                                    <PartyBranchSection partyId={partyId} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="contacts">
                                    <PartyContactSection partyId={partyId} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="banks">
                                    <PartyBankAccountSection partyId={partyId} />
                                </Tab.Pane>
                                <Tab.Pane eventKey="documents">
                                    <PartyDocumentSection partyId={partyId} />
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
