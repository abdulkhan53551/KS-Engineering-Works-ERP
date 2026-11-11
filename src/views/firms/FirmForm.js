import React, { useEffect, useState } from 'react';
import { Form, Button, Spinner, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaBuilding,
    FaFileInvoiceDollar,
    FaMapMarkerAlt,
    FaUniversity,
    FaCheck,
    FaSave,
    FaFolderOpen
} from 'react-icons/fa';
import { useForm, useWatch } from 'react-hook-form';
import { createFirmValidationSchema } from '../../validation/firm.validation';
import { joiResolver } from '@hookform/resolvers/joi';
import { useCountryState, useStateCity } from '../dashboard/hooks/api.hooks';
import { useGetFirmById } from './hooks/api.hooks';
import useHandleSubmit from './hooks/useHandleSubmit';
import EnterpriseIdentitySection from './sections/EnterpriseIdentitySection';
import StatutoryTaxSection from './sections/StatutoryTaxSection';
import AddressContactSection from './sections/AddressContactSection';
import BankingSection from './sections/BankingSection';
import FirmBranchManager from './components/FirmBranchManager';
import AttachmentManager from '../../components/attachments/AttachmentManager';
import './FirmModule.css';

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
    const watchFirmType = useWatch({ control, name: "firmType" });
    const watchIsGstRegistered = useWatch({ control, name: "isGstRegistered" });
    const selectedState = useWatch({ control, name: "stateId" });

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

    // Shared props for section components
    const sectionProps = { register, errors, control, setValue };

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
                    <EnterpriseIdentitySection {...sectionProps} isSubmitting={isSubmitting} />
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
                    <StatutoryTaxSection {...sectionProps} />
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
                    <AddressContactSection
                        {...sectionProps}
                        countryStates={countryStates}
                        cities={cities}
                        isFetchingCities={isFetchingCities}
                    />
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
                    <BankingSection {...sectionProps} />
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