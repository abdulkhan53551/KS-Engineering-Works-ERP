import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { Controller, useWatch } from 'react-hook-form';
import BootstrapSwitchButton from 'bootstrap-switch-button-react';
import { FaShieldAlt } from 'react-icons/fa';

const StatutoryTaxSection = ({ register, errors, control, setValue }) => {
    const watchIsGstRegistered = useWatch({ control, name: "isGstRegistered" });

    return (
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
    );
};

export default React.memo(StatutoryTaxSection);
