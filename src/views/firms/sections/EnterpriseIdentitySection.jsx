import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { useWatch } from 'react-hook-form';
import LogoUploadDropZone from '../../../components/upload/LogoUploadDropZone';
import { FaInfoCircle } from 'react-icons/fa';

const firmType = ['Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'Other'];

const EnterpriseIdentitySection = ({ register, errors, control, setValue, isSubmitting }) => {
    const logoUrl = useWatch({ control, name: "logoUrl" });
    const logoPublicId = useWatch({ control, name: "logoPublicId" });

    return (
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
    );
};

export default React.memo(EnterpriseIdentitySection);
