import React, { useEffect, useState } from 'react';
import { Row, Col, Form, Button, Spinner, Card, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaBuilding,
    FaFileInvoiceDollar,
    FaMapMarkerAlt,
    FaUniversity,
    FaCheck,
    FaSave,
    FaShieldAlt,
    FaInfoCircle,
    FaFolderOpen
} from 'react-icons/fa';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { createFirmValidationSchema } from '../../validation/firm.validation';
import { joiResolver } from '@hookform/resolvers/joi';
import { useCountryState, useStateCity } from '../dashboard/hooks/api.hooks';
import { useGetFirmById } from './hooks/api.hooks';
import useHandleSubmit from './hooks/useHandleSubmit';
import LogoUploadDropZone from '../../components/upload/LogoUploadDropZone';
import AttachmentManager from '../../components/attachments/AttachmentManager';
import FirmBranchManager from './components/FirmBranchManager';
import './FirmModule.css';

const bankAccountType = ['Savings', 'Current'];
const firmType = ['Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'Other'];

const FIRM_DOC_TYPES = [
    { value: 'FIRM_LOGO', label: 'Firm Logo' },
    { value: 'LETTERHEAD_HEADER', label: 'Letterhead Header Banner' },
    { value: 'GST_CERT', label: 'GST Registration Certificate' },
    { value: 'PAN_CARD', label: 'PAN Card Copy' },
    { value: 'MSME_CERT', label: 'MSME / Udyam Certificate' },
    { value: 'OTHER', label: 'General / Other Document' }
];

const FirmForm = ({ mode }) => {
    const navigate = useNavigate();
    const { id: firmId } = useParams();
    const isEditMode = !!(mode === 'edit');
    const [metaIds, setMetaIds] = useState({ firmAddressId: null, firmBankId: null });

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        resetField,
        control,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(createFirmValidationSchema),
        mode: "onBlur",
        reValidateMode: "onChange",
    });

    const watchFirmName = useWatch({ control, name: "firmName" });
    const watchTradeName = useWatch({ control, name: "tradeName" });
    const watchFirmType = useWatch({ control, name: "firmType" });
    const watchIsGstRegistered = useWatch({ control, name: "isGstRegistered" });
    const selectedState = useWatch({ control, name: "stateId" });
    const logoUrl = useWatch({ control, name: "logoUrl" });
    const logoPublicId = useWatch({ control, name: "logoPublicId" });

    const { data: countryStates = [] } = useCountryState();
    const { data: cities = [], isFetching: isFetchingCities } = useStateCity(selectedState);
    const { data: firm = {}, isFetching: isFetchingFirm } = useGetFirmById(firmId);
    const { onSubmit, onError, createFirmIsPending, updateFirmIsPending } = useHandleSubmit({ firmId, isEditMode, metaIds });

    const isSubmitting = createFirmIsPending || updateFirmIsPending;

    // Load initial data in edit mode
    useEffect(() => {
        if (firm && isEditMode) {
            const { firmId: fId, firmAddressId, firmBankAccountId, ...rest } = firm;

            setMetaIds({
                firmAddressId: firmAddressId,
                firmBankId: firmBankAccountId
            });

            reset({
                ...rest,
                logoUrl: firm.logoUrl || firm.logo || '',
                logoPublicId: firm.logoPublicId || '',
                isGstRegistered: Boolean(firm.gstin) || false,
            });
        }
    }, [firm, isEditMode, reset]);

    // Handle city population when state changes
    useEffect(() => {
        if (firm?.cityId && cities.length > 0) {
            setValue("cityId", firm.cityId);
        }
    }, [firm?.cityId, cities, setValue]);

    // Clear GST field automatically when switch turns off
    useEffect(() => {
        if (!watchIsGstRegistered) {
            resetField("gstin");
        }
    }, [watchIsGstRegistered, resetField]);

    // Global keyboard shortcut: Ctrl+S / Cmd+S to submit form
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSubmit(onSubmit, onError)();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSubmit, onSubmit, onError]);

    return (
        <div className="firm-module-root firm-form-container">
            <Form noValidate onSubmit={handleSubmit(onSubmit, onError)}>
                {/* 1. Executive Top Header Bar with White Background */}
                <div className="firm-form-header bg-white rounded-3 p-3 px-4 shadow-sm border mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Back to Firm Directory</Tooltip>}
                        >
                            <Button
                                type="button"
                                variant="light"
                                onClick={() => navigate('/firms')}
                                className="d-inline-flex align-items-center justify-content-center p-0 rounded-circle border shadow-sm flex-shrink-0"
                                style={{ width: '38px', height: '38px', minWidth: '38px' }}
                                aria-label="Back to Firm Directory"
                            >
                                <FaArrowLeft size={13} className="text-secondary" />
                            </Button>
                        </OverlayTrigger>
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <h4 className="fw-bold mb-0 text-dark">
                                    {isEditMode ? (watchFirmName || 'Update Firm Entity') : 'New Enterprise Firm'}
                                </h4>
                                {isEditMode ? (
                                    <Badge bg="light" text="dark" className="border fw-semibold" style={{ fontSize: '0.72rem' }}>
                                        Firm ID #{firmId}
                                    </Badge>
                                ) : (
                                    <Badge bg="primary" className="fw-semibold" style={{ fontSize: '0.72rem' }}>
                                        New Registration
                                    </Badge>
                                )}
                                {watchFirmType && (
                                    <Badge bg="soft-primary" text="primary" className="fw-semibold" style={{ fontSize: '0.72rem' }}>
                                        {watchFirmType}
                                    </Badge>
                                )}
                                {watchIsGstRegistered ? (
                                    <Badge bg="soft-success" text="success" className="fw-semibold" style={{ fontSize: '0.72rem' }}>
                                        GST Active
                                    </Badge>
                                ) : (
                                    <Badge bg="soft-secondary" text="secondary" className="fw-medium" style={{ fontSize: '0.72rem' }}>
                                        Unregistered / Composition
                                    </Badge>
                                )}
                            </div>
                            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                {isEditMode
                                    ? `Editing legal entity profile, statutory registrations, primary banking, and multi-location branch networks`
                                    : `Register a new corporate entity, tax identifiers, banking details, and default billing parameters`}
                            </span>
                        </div>
                    </div>

                    {/* Quick Top Actions */}
                    <div className="d-flex align-items-center gap-2">
                        <Button
                            type="button"
                            variant="light"
                            size="sm"
                            onClick={() => navigate('/firms')}
                            className="px-3 py-2 fw-semibold border"
                            disabled={isSubmitting}
                        >
                            Discard
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting}
                            className="px-4 py-2 fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
                        >
                            {isSubmitting ? (
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            ) : (
                                <FaSave size={12} />
                            )}
                            <span>{isEditMode ? 'Save Changes' : 'Create Firm'}</span>
                        </Button>
                    </div>
                </div>

                {/* 2. Section 1: Enterprise Profile & Identity */}
                <div className="firm-section-card">
                    <div className="firm-section-header">
                        <div className="firm-section-title-wrap">
                            <div className="firm-section-icon icon-blue">
                                <FaBuilding />
                            </div>
                            <div>
                                <h5 className="firm-section-title">Enterprise Identity & Legal Profile</h5>
                                <p className="firm-section-subtitle">
                                    Legal entity trade name, corporate branding asset, and business classification
                                </p>
                            </div>
                        </div>
                        <span className="firm-section-badge">Part 1 • Identity</span>
                    </div>

                    <div className="p-4">
                        <Row>
                            {/* Left: Dedicated Brand Logo Upload Tile */}
                            <Col lg={4} className="mb-4 mb-lg-0 border-end-lg pe-lg-4">
                                <div className="p-3 bg-light rounded-3 border text-center h-100 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="text-dark fw-bold mb-1 small text-uppercase letter-spacing-1">
                                            Corporate Logo & Brand Mark
                                        </div>
                                        <p className="text-muted small mb-3" style={{ fontSize: '0.73rem' }}>
                                            Used on Tax Invoices, Delivery Challans, Quotations, and Header Switcher.
                                        </p>
                                        <div className="d-flex justify-content-center my-2">
                                            <LogoUploadDropZone
                                                value={logoUrl}
                                                publicId={logoPublicId}
                                                folder="firms/logos"
                                                tags="ks-erp,firm,logo"
                                                onChange={({ logoUrl: newUrl, logoPublicId: newPid }) => {
                                                    setValue('logoUrl', newUrl, { shouldValidate: true });
                                                    setValue('logoPublicId', newPid, { shouldValidate: true });
                                                }}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-top text-muted small" style={{ fontSize: '0.7rem' }}>
                                        <FaInfoCircle size={10} className="me-1 text-primary" />
                                        Recommended: Transparent PNG or SVG (max 5MB).
                                    </div>
                                </div>
                            </Col>

                            {/* Right: Legal & Trade Names, Structure, Business Scope */}
                            <Col lg={8} className="ps-lg-4">
                                <Row>
                                    {/* Legal Firm Name */}
                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                            <Form.Control
                                                type="text"
                                                id="firmName"
                                                placeholder="Firm Legal Name"
                                                isInvalid={!!errors.firmName}
                                                {...register("firmName")}
                                            />
                                            <Form.Label htmlFor="firmName">
                                                Legal Entity Name <span className="text-danger label-required">*</span>
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.firmName?.message}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>

                                    {/* Trade Name */}
                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                            <Form.Control
                                                type="text"
                                                id="tradeName"
                                                placeholder="Trade Name (DBA)"
                                                isInvalid={!!errors.tradeName}
                                                {...register("tradeName")}
                                            />
                                            <Form.Label htmlFor="tradeName">
                                                Trade Name (DBA)
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.tradeName?.message}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>

                                    {/* Firm Legal Structure / Type */}
                                    <Col md={12}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                            <Form.Select
                                                id="firmType"
                                                isInvalid={!!errors.firmType}
                                                {...register("firmType")}
                                            >
                                                <option value="">-- Select Legal Structure --</option>
                                                {firmType.map((item) => (
                                                    <option key={item} value={item}>{item}</option>
                                                ))}
                                            </Form.Select>
                                            <Form.Label htmlFor="firmType">
                                                Entity Type / Legal Structure <span className="text-danger label-required">*</span>
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.firmType?.message}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>

                                    {/* Core Business Activity Scope */}
                                    <Col md={12}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                as="textarea"
                                                id="businessActivity"
                                                placeholder="Core Business Scope / Activities"
                                                style={{ height: '88px' }}
                                                maxLength={1000}
                                                isInvalid={!!errors.businessActivity}
                                                {...register("businessActivity")}
                                            />
                                            <Form.Label htmlFor="businessActivity">
                                                Primary Business Scope / Activity <span className="text-danger label-required">*</span>
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.businessActivity?.message}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* 3. Section 2: Statutory Tax Registrations & Invoicing Setup */}
                <div className="firm-section-card">
                    <div className="firm-section-header">
                        <div className="firm-section-title-wrap">
                            <div className="firm-section-icon icon-emerald">
                                <FaFileInvoiceDollar />
                            </div>
                            <div>
                                <h5 className="firm-section-title">Statutory Tax & Invoicing Registry</h5>
                                <p className="firm-section-subtitle">
                                    GSTIN, PAN, CIN, TAN, and sequential invoice series numbering
                                </p>
                            </div>
                        </div>
                        <span className="firm-section-badge">Part 2 • Compliance</span>
                    </div>

                    <div className="p-4">
                        {/* GST Registration Interactive Banner */}
                        <div className="firm-highlight-box mb-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                        <FaShieldAlt className="text-success" size={15} />
                                        <span>Registered under GST (Goods and Services Tax)</span>
                                    </div>
                                    <div className="text-muted small" style={{ fontSize: '0.735rem' }}>
                                        Toggle on if this firm is registered under the Regular or Composition Scheme with a valid 15-digit GSTIN.
                                    </div>
                                </div>
                                <div>
                                    <Controller
                                        name="isGstRegistered"
                                        control={control}
                                        defaultValue={false}
                                        render={({ field: { value, onChange } }) => (
                                            <BootstrapSwitchButton
                                                checked={Boolean(value)}
                                                onChange={onChange}
                                                width={90}
                                                height={36}
                                                onlabel="Active"
                                                offlabel="No"
                                                onstyle="success"
                                                offstyle="secondary"
                                                size="sm"
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Conditional GSTIN Field */}
                            {watchIsGstRegistered && (
                                <div className="mt-3 pt-3 border-top">
                                    <Row>
                                        <Col lg={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                                <Form.Control
                                                    type="text"
                                                    id="gstin"
                                                    placeholder="15-digit GSTIN"
                                                    maxLength={15}
                                                    isInvalid={!!errors.gstin}
                                                    {...register("gstin", {
                                                        onChange: (e) => {
                                                            setValue("gstin", e.target.value.toUpperCase(), { shouldValidate: true });
                                                        }
                                                    })}
                                                />
                                                <Form.Label htmlFor="gstin">
                                                    GSTIN (GST Identification Number) <span className="text-danger label-required">*</span>
                                                </Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.gstin?.message}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>
                                        <Col lg={6} className="d-flex align-items-center">
                                            <div className="text-muted small">
                                                <span className="fw-semibold text-dark">Format: </span>
                                                <code className="px-1 bg-white border rounded">27AAAAA0000A1Z5</code>
                                                <div className="mt-0.5" style={{ fontSize: '0.71rem' }}>
                                                    State code + 10-digit PAN + Entity code + Check digit.
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            )}
                        </div>

                        {/* Corporate Identifiers Grid */}
                        <Row>
                            {/* PAN Number */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="panNumber"
                                        placeholder="PAN No."
                                        maxLength={10}
                                        isInvalid={!!errors.panNumber}
                                        {...register("panNumber", {
                                            onChange: (e) => {
                                                setValue("panNumber", e.target.value.toUpperCase(), { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="panNumber">
                                        PAN No. (Permanent Account Number) <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.panNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* CIN Number */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="cinNumber"
                                        placeholder="CIN No."
                                        maxLength={21}
                                        isInvalid={!!errors.cinNumber}
                                        {...register("cinNumber", {
                                            onChange: (e) => {
                                                setValue("cinNumber", e.target.value.toUpperCase(), { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="cinNumber">
                                        CIN No. (Corporate Identification Number)
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.cinNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* TAN Number */}
                            <Col lg={4} md={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="tanNumber"
                                        placeholder="TAN No."
                                        maxLength={10}
                                        isInvalid={!!errors.tanNumber}
                                        {...register("tanNumber", {
                                            onChange: (e) => {
                                                setValue("tanNumber", e.target.value.toUpperCase(), { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="tanNumber">
                                        TAN No. (Tax Deduction Account Number)
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.tanNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>
                        </Row>

                        {/* Subsection: Sequential Invoicing Setup */}
                        <div className="firm-subsection-divider">
                            <span>Sequential Invoice Setup & Billing Terms</span>
                            <hr />
                        </div>

                        <Row>
                            {/* Invoice Prefix */}
                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="invoicePrefix"
                                        placeholder="Invoice Prefix"
                                        maxLength={10}
                                        isInvalid={!!errors.invoicePrefix}
                                        {...register("invoicePrefix")}
                                    />
                                    <Form.Label htmlFor="invoicePrefix">
                                        Invoice Prefix <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.invoicePrefix?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Invoice Starting Number */}
                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        id="invoiceStartNumber"
                                        placeholder="Invoice Starting Number"
                                        maxLength={6}
                                        isInvalid={!!errors.invoiceStartNumber}
                                        {...register("invoiceStartNumber", {
                                            onChange: (e) => {
                                                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="invoiceStartNumber">
                                        Invoice Starting Sequence Number <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.invoiceStartNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Notes Footer / Invoice Terms */}
                            <Col md={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        as="textarea"
                                        id="notesFooter"
                                        placeholder="Default Invoice & Challan Footer Terms"
                                        style={{ height: '95px' }}
                                        isInvalid={!!errors.notesFooter}
                                        {...register("notesFooter")}
                                    />
                                    <Form.Label htmlFor="notesFooter">
                                        Default Invoicing Footer Note / Legal Declarations
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.notesFooter?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* 4. Section 3: Registered Corporate Office & Communications */}
                <div className="firm-section-card">
                    <div className="firm-section-header">
                        <div className="firm-section-title-wrap">
                            <div className="firm-section-icon icon-amber">
                                <FaMapMarkerAlt />
                            </div>
                            <div>
                                <h5 className="firm-section-title">Corporate Registered Office & Communications</h5>
                                <p className="firm-section-subtitle">
                                    Official communication channels and legal registered office address
                                </p>
                            </div>
                        </div>
                        <span className="firm-section-badge">Part 3 • Location</span>
                    </div>

                    <div className="p-4">
                        {/* Digital Channels (Email, Phone, Website) */}
                        <Row>
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="email"
                                        id="email"
                                        placeholder="Official Email Address"
                                        isInvalid={!!errors.email}
                                        {...register("email")}
                                    />
                                    <Form.Label htmlFor="email">Official Email Address</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="phoneNumber"
                                        placeholder="Primary Phone Number"
                                        maxLength={10}
                                        isInvalid={!!errors.phoneNumber}
                                        {...register("phoneNumber", {
                                            onChange: (e) => {
                                                const numericOnly = e.target.value.replace(/\D/g, "");
                                                setValue("phoneNumber", numericOnly, { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="phoneNumber">
                                        Primary Phone Number (10 digits) <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.phoneNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col lg={4} md={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="website"
                                        placeholder="Corporate Website (e.g. https://company.com)"
                                        isInvalid={!!errors.website}
                                        {...register("website")}
                                    />
                                    <Form.Label htmlFor="website">Corporate Website</Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.website?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>
                        </Row>

                        {/* Physical Address Grid */}
                        <Row>
                            <Col lg={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        as="textarea"
                                        id="addressLine1"
                                        placeholder="Registered Street Address"
                                        style={{ height: '118px' }}
                                        isInvalid={!!errors.addressLine1}
                                        {...register("addressLine1")}
                                    />
                                    <Form.Label htmlFor="addressLine1">
                                        Registered Street Address <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.addressLine1?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            <Col lg={6}>
                                <Row>
                                    {/* State Dropdown */}
                                    <Col sm={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                            <Form.Select
                                                id="stateId"
                                                isInvalid={!!errors.stateId}
                                                {...register("stateId", { required: "Please select a state" })}
                                            >
                                                <option value="">-- Select State --</option>
                                                {countryStates.map((st) => (
                                                    <option key={st.id} value={st.id}>{st.name}</option>
                                                ))}
                                            </Form.Select>
                                            <Form.Label htmlFor="stateId">
                                                State <span className="text-danger label-required">*</span>
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.stateId?.message}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>

                                    {/* City Dropdown */}
                                    <Col sm={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                            <Form.Select
                                                id="cityId"
                                                disabled={!selectedState || isFetchingCities}
                                                isInvalid={!!errors.cityId}
                                                {...register("cityId")}
                                            >
                                                <option value="">{isFetchingCities ? "Loading..." : "-- Select City --"}</option>
                                                {cities.map((ct) => (
                                                    <option key={ct.id} value={ct.id}>{ct.name}</option>
                                                ))}
                                            </Form.Select>
                                            <Form.Label htmlFor="cityId">
                                                City <span className="text-danger label-required">*</span>
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.cityId?.message}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>

                                    {/* Pincode */}
                                    <Col sm={12}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                type="text"
                                                id="pincode"
                                                placeholder="6-digit Pincode"
                                                maxLength={6}
                                                isInvalid={!!errors.pincode}
                                                {...register("pincode", {
                                                    onChange: (e) => {
                                                        e.target.value = e.target.value.replace(/\D/g, "");
                                                    }
                                                })}
                                            />
                                            <Form.Label htmlFor="pincode">
                                                Postal Pincode <span className="text-danger label-required">*</span>
                                            </Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.pincode?.message}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* 5. Section 4: Primary Banking & Settlement */}
                <div className="firm-section-card">
                    <div className="firm-section-header">
                        <div className="firm-section-title-wrap">
                            <div className="firm-section-icon icon-violet">
                                <FaUniversity />
                            </div>
                            <div>
                                <h5 className="firm-section-title">Primary Banking & Financial Settlement</h5>
                                <p className="firm-section-subtitle">
                                    Primary bank account details used for customer remittances and UPI QR settlement
                                </p>
                            </div>
                        </div>
                        <span className="firm-section-badge">Part 4 • Banking</span>
                    </div>

                    <div className="p-4">
                        <Row>
                            {/* Bank Name */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="bankName"
                                        placeholder="Bank Name"
                                        isInvalid={!!errors.bankName}
                                        {...register("bankName")}
                                    />
                                    <Form.Label htmlFor="bankName">
                                        Bank Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.bankName?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Account Holder Name */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="accountHolderName"
                                        placeholder="Account Holder Name"
                                        isInvalid={!!errors.accountHolderName}
                                        {...register("accountHolderName")}
                                    />
                                    <Form.Label htmlFor="accountHolderName">
                                        Account Holder Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.accountHolderName?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Account Number */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="accountNumber"
                                        inputMode="numeric"
                                        placeholder="Account Number"
                                        isInvalid={!!errors.accountNumber}
                                        {...register("accountNumber", {
                                            onChange: (e) => {
                                                const numericOnly = e.target.value.replace(/\D/g, "");
                                                setValue("accountNumber", numericOnly, { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="accountNumber">
                                        Account Number <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.accountNumber?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* IFSC Code */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="ifscCode"
                                        placeholder="IFSC Code"
                                        maxLength={11}
                                        isInvalid={!!errors.ifscCode}
                                        {...register("ifscCode", {
                                            onChange: (e) => {
                                                setValue("ifscCode", e.target.value.toUpperCase(), { shouldValidate: true });
                                            }
                                        })}
                                    />
                                    <Form.Label htmlFor="ifscCode">
                                        IFSC Code <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.ifscCode?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Branch Name */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Control
                                        type="text"
                                        id="branchName"
                                        placeholder="Branch Name"
                                        isInvalid={!!errors.branchName}
                                        {...register("branchName")}
                                    />
                                    <Form.Label htmlFor="branchName">
                                        Branch Name <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.branchName?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* Account Type */}
                            <Col lg={4} md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                                    <Form.Select
                                        id="accountType"
                                        isInvalid={!!errors.accountType}
                                        {...register("accountType")}
                                    >
                                        <option value="">-- Select Account Type --</option>
                                        {bankAccountType.map((item) => (
                                            <option key={item} value={item.toLowerCase()}>{item}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Label htmlFor="accountType">
                                        Account Type <span className="text-danger label-required">*</span>
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.accountType?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>

                            {/* UPI ID */}
                            <Col lg={12} md={12}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                    <Form.Control
                                        type="text"
                                        id="upiId"
                                        placeholder="UPI ID (e.g. company@icici)"
                                        isInvalid={!!errors.upiId}
                                        {...register("upiId")}
                                    />
                                    <Form.Label htmlFor="upiId">
                                        Virtual Payment Address (UPI ID)
                                    </Form.Label>
                                    <Form.Control.Feedback type="invalid">{errors.upiId?.message}</Form.Control.Feedback>
                                </Form.Floating>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="firm-sticky-footer">
                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                            {watchFirmName ? watchFirmName : (isEditMode ? 'Firm Profile' : 'New Enterprise Firm')}
                        </span>
                        <span className="text-muted small">•</span>
                        <span className="text-muted small" style={{ fontSize: '0.74rem' }}>
                            Fields marked with <span className="text-danger font-monospace">*</span> are required.
                        </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <Button
                            type="button"
                            variant="light"
                            size="sm"
                            onClick={() => navigate('/firms')}
                            className="px-3 py-2 fw-semibold border"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting}
                            className="px-4 py-2 fw-semibold shadow-sm d-inline-flex align-items-center gap-2"
                        >
                            {isSubmitting ? (
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            ) : (
                                <FaCheck size={11} />
                            )}
                            <span>{isEditMode ? 'Save Changes' : 'Create Firm'}</span>
                        </Button>
                    </div>
                </div>
            </Form>

            {/* 6. Section 5: Internal Branch Network & Multi-Facility Logistics (Edit Mode only) */}
            {isEditMode && firmId && (
                <div className="mt-4">
                    <FirmBranchManager firmId={firmId} readOnly={false} />
                </div>
            )}

            {/* 7. Section 6: Compliance Document Vault & Attachments (Edit Mode only) */}
            {isEditMode && firmId && (
                <div className="firm-section-card mt-4">
                    <div className="firm-section-header">
                        <div className="firm-section-title-wrap">
                            <div className="firm-section-icon icon-blue">
                                <FaFolderOpen />
                            </div>
                            <div>
                                <h5 className="firm-section-title">Associated Firm Documents & Compliance Vault</h5>
                                <p className="firm-section-subtitle">
                                    Upload firm logos, letterhead banners, GST & PAN certificates, or legal incorporation papers
                                </p>
                            </div>
                        </div>
                        <span className="firm-section-badge">Part 6 • Vault</span>
                    </div>
                    <div className="p-4">
                        <AttachmentManager
                            entityType="FIRM"
                            entityId={firmId}
                            docTypeOptions={FIRM_DOC_TYPES}
                            folder="ks-erp/firms/documents"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FirmForm;