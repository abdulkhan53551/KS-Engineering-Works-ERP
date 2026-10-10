import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useEditAdvanceDeductionSubmit } from '../hooks/useAdvanceSubmit';
import '../../employee.css';

const EditAdvanceDeductionModal = ({ show, onHide, slip }) => {
    const [advanceDeduction, setAdvanceDeduction] = useState('');

    const grossEarnings = parseFloat(slip?.grossEarnings || slip?.gross_earnings || 0);
    const overtimePay = parseFloat(slip?.overtimePay || slip?.overtime_pay || 0);
    const currentTotalDeductions = parseFloat(slip?.totalDeductions || slip?.total_deductions || 0);
    const currentAdvanceDeduction = parseFloat(slip?.advanceDeduction || slip?.advance_deduction || 0);

    const otherDeductions = Math.max(0, currentTotalDeductions - currentAdvanceDeduction);
    const grossTotal = grossEarnings + overtimePay;
    const maxAllowable = Math.max(0, grossTotal - otherDeductions);

    const {
        handleSubmit,
        errors,
        setErrors,
        isLoading: isPending
    } = useEditAdvanceDeductionSubmit({
        slipId: slip?.id,
        maxAllowable,
        onHide
    });

    useEffect(() => {
        if (show && slip) {
            setAdvanceDeduction(
                slip.advanceDeduction !== undefined
                    ? slip.advanceDeduction.toString()
                    : (slip.advance_deduction !== undefined ? slip.advance_deduction.toString() : '0')
            );
            setErrors({});
        }
    }, [show, slip]);

    if (!slip) return null;

    const enteredDeduction = parseFloat(advanceDeduction || 0);
    const projectedTotalDeductions = otherDeductions + (isNaN(enteredDeduction) ? 0 : enteredDeduction);
    const projectedNetSalary = Math.max(0, Math.round((grossTotal - projectedTotalDeductions) * 100) / 100);

    const handleDeductionChange = (val) => {
        setAdvanceDeduction(val);
        if (errors.advanceDeduction) {
            setErrors(prev => ({ ...prev, advanceDeduction: null }));
        }
    };

    const onSubmit = (e) => {
        handleSubmit(e, advanceDeduction);
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" contentClassName="advance-modal-content">
            <Modal.Header closeButton className="border-0 pb-1 px-4 pt-4">
                <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-warning-subtle text-warning d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <div className="fw-bold text-dark">Adjust Advance Payroll Recovery</div>
                        <div className="text-muted small fw-normal" style={{ fontSize: '0.8rem' }}>
                            Modify the recovery amount deducted from this month's payslip.
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={onSubmit} noValidate>
                <Modal.Body className="px-4 py-3">
                    {/* Financial Context Card with Crisp Typography */}
                    <div className="p-3 rounded-3 mb-3 bg-light border">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-medium">Employee</span>
                            <span className="fw-bold text-dark">{slip.name || `${slip.firstName || ''} ${slip.lastName || ''}`.trim()}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-medium">Total Gross Earnings</span>
                            <span className="fw-semibold text-dark">₹{grossTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small fw-medium">Statutory / Other Deductions</span>
                            <span className="text-muted">₹{otherDeductions.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                            <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                                Max Allowable Recovery
                            </span>
                            <span className="fw-bold text-success fs-6">
                                ₹{maxAllowable.toLocaleString('en-IN')}
                            </span>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end mb-1">
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-decoration-none small text-danger fw-semibold"
                            onClick={() => handleDeductionChange('0')}
                            style={{ fontSize: '0.8rem' }}
                        >
                            Skip Recovery This Month (₹0)
                        </Button>
                    </div>

                    <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                        <Form.Control
                            id="editAdvanceDeduction"
                            type="number"
                            min="0"
                            max={maxAllowable}
                            step="0.01"
                            placeholder="Advance Recovery for this Month"
                            value={advanceDeduction}
                            onChange={(e) => handleDeductionChange(e.target.value)}
                            isInvalid={!!errors.advanceDeduction}
                            required
                        />
                        <Form.Label htmlFor="editAdvanceDeduction">
                            Advance Recovery Amount (₹) <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control.Feedback type="invalid">{errors.advanceDeduction}</Form.Control.Feedback>
                    </Form.Floating>

                    <div className="text-muted small mb-3 ps-1" style={{ fontSize: '0.78rem' }}>
                        You can reduce or set to ₹0. Any unrecovered balance remains in the employee's advance account for subsequent months.
                    </div>

                    {/* Projected Net Salary Impact Card */}
                    <div className="p-3 border rounded-3 bg-white text-center shadow-sm">
                        <div className="text-muted small fw-medium mb-1">Projected Net Take-Home Pay</div>
                        <div className="fs-4 fw-bold text-success">
                            ₹{projectedNetSalary.toLocaleString('en-IN')}
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer className="border-0 px-4 pb-4 pt-2">
                    <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={isPending} className="px-3">
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isPending} className="px-4 shadow-sm">
                        {isPending ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-1" /> Updating...
                            </>
                        ) : (
                            'Save Recovery Amount'
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default EditAdvanceDeductionModal;
