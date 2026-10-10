import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';

const bankAccountType = ['Savings', 'Current'];

const BankingSection = ({ register, errors, setValue }) => {
    return (
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
    );
};

export default React.memo(BankingSection);
