import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { DollarSign, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCreateAdvance, useEmployeesDropdown, useEmployeeAdvanceSummary } from '../hooks/useEmployeeApi';
import { disburseAdvanceValidationSchema, validateWithJoi } from '../../../validation/employeeAdvance.validation';
import '../employee.css';

const AdvanceDisburseModal = ({ show, onHide, defaultEmployeeId = null, firmId = null }) => {
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        employeeId: defaultEmployeeId || '',
        advanceDate: today,
        totalAmount: '',
        recoveryType: 'FULL',
        monthlyDeduction: '',
        paymentMode: 'CASH',
        paymentReference: '',
        remarks: ''
    });

    const [errors, setErrors] = useState({});

    const { mutateAsync: disburseAdvance, isPending } = useCreateAdvance();
    const { data: employees = [], isLoading: isLoadingEmployees } = useEmployeesDropdown({
        firmId: firmId && firmId !== 'all' ? firmId : undefined
    });

    const selectedEmpId = formData.employeeId ? parseInt(formData.employeeId, 10) : null;
    const { data: advanceSummary } = useEmployeeAdvanceSummary(selectedEmpId, firmId, {
        enabled: Boolean(selectedEmpId)
    });

    useEffect(() => {
        if (show) {
            setFormData({
                employeeId: defaultEmployeeId || '',
                advanceDate: new Date().toISOString().split('T')[0],
                totalAmount: '',
                recoveryType: 'FULL',
                monthlyDeduction: '',
                paymentMode: 'CASH',
                paymentReference: '',
                remarks: ''
            });
            setErrors({});
        }
    }, [show, defaultEmployeeId]);

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'totalAmount' && updated.recoveryType === 'FULL') {
                updated.monthlyDeduction = value;
            }
            if (field === 'recoveryType' && value === 'FULL') {
                updated.monthlyDeduction = updated.totalAmount;
            }
            return updated;
        });

        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const { errors: validationErrors } = validateWithJoi(
            disburseAdvanceValidationSchema,
            formData
        );
        setErrors(validationErrors);
        return validationErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errs = validate();
        if (Object.keys(errs).length > 0) {
            toast.error('Please fix the errors in the form.');
            return;
        }

        const amountNum = parseFloat(formData.totalAmount);
        let emiNum = amountNum;
        if (formData.recoveryType === 'EMI') {
            emiNum = parseFloat(formData.monthlyDeduction);
        }

        try {
            await disburseAdvance({
                firmId: firmId && firmId !== 'all' ? parseInt(firmId, 10) : undefined,
                employeeId: parseInt(formData.employeeId, 10),
                advanceDate: formData.advanceDate,
                totalAmount: amountNum,
                recoveryType: formData.recoveryType,
                monthlyDeduction: emiNum,
                paymentMode: formData.paymentMode,
                paymentReference: formData.paymentReference.trim() || undefined,
                remarks: formData.remarks.trim() || undefined
            });
            onHide();
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to disburse advance.');
        }
    };

    const calculatedInstallments = formData.recoveryType === 'EMI' && parseFloat(formData.monthlyDeduction) > 0 && parseFloat(formData.totalAmount) > 0
        ? Math.ceil(parseFloat(formData.totalAmount) / parseFloat(formData.monthlyDeduction))
        : 1;

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" size="lg" contentClassName="advance-modal-content">
            <Modal.Header closeButton className="border-0 pb-1 px-4 pt-4">
                <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div className="fw-bold text-dark">Disburse Salary Advance / Loan</div>
                        <div className="text-muted small fw-normal" style={{ fontSize: '0.8rem' }}>
                            Record a new employee loan or wage advance and set up automatic payroll recovery.
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSubmit} noValidate>
                <Modal.Body className="px-4 py-3">
                    {/* Active Balance Warning if employee already has pending advance */}
                    {advanceSummary && advanceSummary.totalOutstanding > 0 && (
                        <Alert variant="warning" className="py-2 px-3 mb-3 border-0 bg-warning-subtle text-warning-emphasis rounded-3">
                            <div className="d-flex align-items-start gap-2">
                                <AlertCircle size={17} className="mt-1 flex-shrink-0" />
                                <div>
                                    <div className="fw-bold" style={{ fontSize: '0.85rem' }}>Active Outstanding Advance Notice</div>
                                    <div className="small" style={{ fontSize: '0.8rem' }}>
                                        This employee currently has an unpaid balance of <strong>₹{advanceSummary.totalOutstanding.toLocaleString('en-IN')}</strong>. This new disbursement will be added to their active debt.
                                    </div>
                                </div>
                            </div>
                        </Alert>
                    )}

                    <Row className="g-3">
                        {/* Employee Selector */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Select
                                    id="disburseEmployeeId"
                                    value={formData.employeeId}
                                    onChange={(e) => handleChange('employeeId', e.target.value)}
                                    disabled={Boolean(defaultEmployeeId) || isLoadingEmployees}
                                    isInvalid={!!errors.employeeId}
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.empCode ? `[${emp.empCode}] ` : ''}{emp.name} {emp.designation ? `(${emp.designation})` : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Label htmlFor="disburseEmployeeId">
                                    Employee <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.employeeId}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Advance Date & Amount */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="disburseAdvanceDate"
                                    type="date"
                                    placeholder="Disbursement Date"
                                    value={formData.advanceDate}
                                    onChange={(e) => handleChange('advanceDate', e.target.value)}
                                    isInvalid={!!errors.advanceDate}
                                    required
                                />
                                <Form.Label htmlFor="disburseAdvanceDate">
                                    Disbursement Date <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.advanceDate}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="disburseTotalAmount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    placeholder="Advance Amount"
                                    value={formData.totalAmount}
                                    onChange={(e) => handleChange('totalAmount', e.target.value)}
                                    isInvalid={!!errors.totalAmount}
                                    required
                                />
                                <Form.Label htmlFor="disburseTotalAmount">
                                    Advance Amount (₹) <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.totalAmount}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Recovery Plan & Monthly Deduction */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Select
                                    id="disburseRecoveryType"
                                    value={formData.recoveryType}
                                    onChange={(e) => handleChange('recoveryType', e.target.value)}
                                >
                                    <option value="FULL">FULL - Deduct Entire Amount in Next Salary</option>
                                    <option value="EMI">EMI - Recover in Monthly Installments</option>
                                </Form.Select>
                                <Form.Label htmlFor="disburseRecoveryType">
                                    Recovery Schedule <span className="text-danger">*</span>
                                </Form.Label>
                            </Form.Floating>
                        </Col>

                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="disburseMonthlyDeduction"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    placeholder="Monthly Recovery (₹)"
                                    value={formData.monthlyDeduction}
                                    onChange={(e) => handleChange('monthlyDeduction', e.target.value)}
                                    disabled={formData.recoveryType === 'FULL'}
                                    isInvalid={!!errors.monthlyDeduction}
                                    required
                                />
                                <Form.Label htmlFor="disburseMonthlyDeduction">
                                    {formData.recoveryType === 'EMI' ? 'Monthly Recovery (₹) *' : 'Deduction Amount (₹)'}
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.monthlyDeduction}</Form.Control.Feedback>
                            </Form.Floating>
                            {formData.recoveryType === 'EMI' && parseFloat(formData.monthlyDeduction) > 0 && parseFloat(formData.totalAmount) > 0 && (
                                <div className="text-muted small mt-1 ps-1" style={{ fontSize: '0.78rem' }}>
                                    Estimated Tenure: <strong className="text-primary">{calculatedInstallments} months</strong> (₹{parseFloat(formData.monthlyDeduction).toLocaleString('en-IN')}/month)
                                </div>
                            )}
                        </Col>

                        {/* Payment Mode & Reference */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Select
                                    id="disbursePaymentMode"
                                    value={formData.paymentMode}
                                    onChange={(e) => handleChange('paymentMode', e.target.value)}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                                    <option value="UPI">UPI / QR Code</option>
                                    <option value="CHEQUE">Cheque</option>
                                </Form.Select>
                                <Form.Label htmlFor="disbursePaymentMode">Payment Mode</Form.Label>
                            </Form.Floating>
                        </Col>

                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="disbursePaymentReference"
                                    type="text"
                                    placeholder="Reference / UTR / Cheque #"
                                    value={formData.paymentReference}
                                    onChange={(e) => handleChange('paymentReference', e.target.value)}
                                    isInvalid={!!errors.paymentReference}
                                />
                                <Form.Label htmlFor="disbursePaymentReference">Reference / UTR / Cheque #</Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.paymentReference}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Purpose / Remarks */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="disburseRemarks"
                                    as="textarea"
                                    placeholder="Purpose / Remarks"
                                    value={formData.remarks}
                                    onChange={(e) => handleChange('remarks', e.target.value)}
                                    style={{ height: '70px' }}
                                />
                                <Form.Label htmlFor="disburseRemarks">Purpose / Remarks (Optional)</Form.Label>
                            </Form.Floating>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer className="border-0 px-4 pb-4 pt-2">
                    <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={isPending} className="px-3">
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isPending} className="px-4 shadow-sm">
                        {isPending ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" /> Disbursing...
                            </>
                        ) : (
                            'Disburse Advance'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AdvanceDisburseModal;
