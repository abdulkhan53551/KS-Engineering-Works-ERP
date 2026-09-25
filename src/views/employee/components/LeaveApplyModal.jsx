import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { useApplyLeave } from '../hooks/useEmployeeApi';
import EmployeeAutocompleteInput from './EmployeeAutocompleteInput';
import { toast } from 'react-toastify';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import '../employee.css';

/**
 * Calculates total leave days based on calendar dates and work sessions (Session 1 & Session 2).
 */
const calculateLeaveDays = (fromDate, toDate, fromSession, toSession) => {
    if (!fromDate || !toDate) return 0;
    if (fromDate > toDate) return 0;

    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) return 0;

    if (diffDays === 1) {
        // Single Day Leave
        if (fromSession === 'SESSION_1' && toSession === 'SESSION_2') {
            return 1.0;
        } else if (fromSession === 'SESSION_1' && toSession === 'SESSION_1') {
            return 0.5;
        } else if (fromSession === 'SESSION_2' && toSession === 'SESSION_2') {
            return 0.5;
        } else {
            // Cannot start in Session 2 and end in Session 1 on the same date
            return 0;
        }
    } else {
        // Multi-Day Leave
        let days = diffDays;
        if (fromSession === 'SESSION_2') {
            days -= 0.5; // Afternoon start
        }
        if (toSession === 'SESSION_1') {
            days -= 0.5; // Morning end
        }
        return Math.max(0.5, days);
    }
};

const LeaveApplyModal = ({ show, onHide, firmId, preSelectedEmployeeId = null }) => {
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        employeeId: preSelectedEmployeeId || '',
        leaveType: 'CASUAL',
        fromDate: today,
        fromSession: 'SESSION_1',
        toDate: today,
        toSession: 'SESSION_2',
        reason: ''
    });
    const [errors, setErrors] = useState({});

    const applyMutation = useApplyLeave();

    useEffect(() => {
        if (show) {
            setFormData({
                employeeId: preSelectedEmployeeId || '',
                leaveType: 'CASUAL',
                fromDate: today,
                fromSession: 'SESSION_1',
                toDate: today,
                toSession: 'SESSION_2',
                reason: ''
            });
            setErrors({});
        }
    }, [show, preSelectedEmployeeId, today]);

    // Compute total days reactively
    const computedTotalDays = useMemo(() => {
        return calculateLeaveDays(
            formData.fromDate,
            formData.toDate,
            formData.fromSession,
            formData.toSession
        );
    }, [formData.fromDate, formData.toDate, formData.fromSession, formData.toSession]);

    const isSameDaySessionInvalid = Boolean(
        formData.fromDate &&
        formData.toDate &&
        formData.fromDate === formData.toDate &&
        formData.fromSession === 'SESSION_2' &&
        formData.toSession === 'SESSION_1'
    );

    const isDateRangeInvalid = Boolean(
        formData.fromDate &&
        formData.toDate &&
        formData.fromDate > formData.toDate
    );

    const handleFromDateChange = (newFrom) => {
        setFormData(prev => {
            const next = { ...prev, fromDate: newFrom };
            if (prev.toDate && newFrom > prev.toDate) {
                next.toDate = newFrom;
            }
            return next;
        });
        if (errors.fromDate) setErrors(prev => ({ ...prev, fromDate: null }));
    };

    const handleToDateChange = (newTo) => {
        setFormData(prev => ({ ...prev, toDate: newTo }));
        if (errors.toDate) setErrors(prev => ({ ...prev, toDate: null }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.employeeId) {
            errs.employeeId = 'Please select an employee.';
        }
        if (!formData.fromDate) {
            errs.fromDate = 'From date is required.';
        }
        if (!formData.toDate) {
            errs.toDate = 'To date is required.';
        }
        if (formData.fromDate && formData.toDate && formData.fromDate > formData.toDate) {
            errs.toDate = 'To date cannot be earlier than from date.';
        }
        if (isSameDaySessionInvalid) {
            errs.session = 'End session cannot be earlier than start session on the same day.';
        }
        if (computedTotalDays <= 0 && !errs.toDate && !errs.session) {
            errs.totalDays = 'Total leave days must be at least 0.5 days.';
        }
        setErrors(errs);
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            toast.error(errs.session || errs.toDate || 'Please fix the errors in the leave form.');
            return;
        }

        // Map halfDayOn for database backwards compatibility
        let halfDayOn = null;
        if (computedTotalDays % 1 !== 0) {
            if (formData.fromSession === 'SESSION_2' && formData.toSession === 'SESSION_2') {
                halfDayOn = 'FROM';
            } else if (formData.fromSession === 'SESSION_1' && formData.toSession === 'SESSION_1') {
                halfDayOn = 'TO';
            } else if (formData.fromSession === 'SESSION_2') {
                halfDayOn = 'FROM';
            } else if (formData.toSession === 'SESSION_1') {
                halfDayOn = 'TO';
            }
        }

        try {
            await applyMutation.mutateAsync({
                firmId,
                employeeId: parseInt(formData.employeeId, 10),
                leaveType: formData.leaveType,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                totalDays: computedTotalDays,
                halfDayOn,
                reason: formData.reason
            });
            onHide();
        } catch (err) {
            // Handled in hook
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
                        <Calendar size={20} className="text-primary" /> Apply for Leave
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Row className="g-3">
                        {/* Employee Autocomplete */}
                        <Col md={8}>
                            <EmployeeAutocompleteInput
                                value={formData.employeeId}
                                onChange={(empId) => {
                                    setFormData(prev => ({ ...prev, employeeId: empId }));
                                    if (errors.employeeId) setErrors(prev => ({ ...prev, employeeId: null }));
                                }}
                                firmId={firmId}
                                label="Employee"
                                required
                                isInvalid={!!errors.employeeId}
                                errorMessage={errors.employeeId}
                                placeholder="Search employee name or code..."
                            />
                        </Col>

                        {/* Leave Type */}
                        <Col md={4}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Select
                                    id="leaveType"
                                    value={formData.leaveType}
                                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                                    required
                                >
                                    <option value="CASUAL">Casual Leave (CL)</option>
                                    <option value="SICK">Sick Leave (SL)</option>
                                    <option value="EARNED">Earned Leave (EL)</option>
                                    <option value="UNPAID">Unpaid / Loss of Pay</option>
                                    <option value="COMP_OFF">Compensatory Off</option>
                                </Form.Select>
                                <Form.Label htmlFor="leaveType">Leave Type <span className="text-danger">*</span></Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* Start Date & Session 1 / 2 */}
                        <Col md={6}>
                            <div className="p-3 rounded-3 border bg-light">
                                <div className="fw-semibold text-primary mb-2 small d-flex align-items-center gap-1">
                                    <Clock size={14} /> Start Date & Session
                                </div>
                                <Row className="g-2">
                                    <Col sm={7}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                id="fromDate"
                                                type="date"
                                                placeholder="From Date"
                                                value={formData.fromDate}
                                                onChange={(e) => handleFromDateChange(e.target.value)}
                                                isInvalid={!!errors.fromDate}
                                                required
                                            />
                                            <Form.Label htmlFor="fromDate">From Date <span className="text-danger">*</span></Form.Label>
                                            <Form.Control.Feedback type="invalid">{errors.fromDate}</Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>
                                    <Col sm={5}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Select
                                                id="fromSession"
                                                value={formData.fromSession}
                                                onChange={(e) => setFormData({ ...formData, fromSession: e.target.value })}
                                            >
                                                <option value="SESSION_1">Session 1 (Morning)</option>
                                                <option value="SESSION_2">Session 2 (Afternoon)</option>
                                            </Form.Select>
                                            <Form.Label htmlFor="fromSession">Session</Form.Label>
                                        </Form.Floating>
                                    </Col>
                                </Row>
                            </div>
                        </Col>

                        {/* End Date & Session 1 / 2 */}
                        <Col md={6}>
                            <div className="p-3 rounded-3 border bg-light">
                                <div className="fw-semibold text-primary mb-2 small d-flex align-items-center gap-1">
                                    <Clock size={14} /> End Date & Session
                                </div>
                                <Row className="g-2">
                                    <Col sm={7}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Control
                                                id="toDate"
                                                type="date"
                                                placeholder="To Date"
                                                min={formData.fromDate}
                                                value={formData.toDate}
                                                onChange={(e) => handleToDateChange(e.target.value)}
                                                isInvalid={isDateRangeInvalid || !!errors.toDate}
                                                required
                                            />
                                            <Form.Label htmlFor="toDate">To Date <span className="text-danger">*</span></Form.Label>
                                            <Form.Control.Feedback type="invalid">
                                                {errors.toDate || 'Cannot be earlier than From Date'}
                                            </Form.Control.Feedback>
                                        </Form.Floating>
                                    </Col>
                                    <Col sm={5}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                            <Form.Select
                                                id="toSession"
                                                value={formData.toSession}
                                                onChange={(e) => setFormData({ ...formData, toSession: e.target.value })}
                                            >
                                                <option value="SESSION_1">Session 1 (Lunch)</option>
                                                <option value="SESSION_2">Session 2 (Evening)</option>
                                            </Form.Select>
                                            <Form.Label htmlFor="toSession">Session</Form.Label>
                                        </Form.Floating>
                                    </Col>
                                </Row>
                            </div>
                        </Col>

                        {/* Same day session warning */}
                        {isSameDaySessionInvalid && (
                            <Col md={12}>
                                <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                                    <AlertCircle size={16} />
                                    <span>On the same day, leave cannot start in Session 2 (Afternoon) and end in Session 1 (Morning).</span>
                                </div>
                            </Col>
                        )}

                        {/* Total Days Computed Badge Card */}
                        <Col md={12}>
                            <div className="d-flex justify-content-between align-items-center p-3 rounded-3 bg-primary-subtle border border-primary-subtle">
                                <div>
                                    <div className="fw-bold text-primary small">Total Leave Calculation</div>
                                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                        {formData.fromSession === 'SESSION_1' ? 'Session 1 (Full Day)' : 'Session 2 (Half Day start)'} →{' '}
                                        {formData.toSession === 'SESSION_2' ? 'Session 2 (Full Day)' : 'Session 1 (Half Day end)'}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Badge bg="primary" className="fs-6 px-3 py-2 fw-bold">
                                        {computedTotalDays} {computedTotalDays === 1 ? 'Day' : 'Days'}
                                    </Badge>
                                </div>
                            </div>
                        </Col>

                        {/* Reason */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="reason"
                                    as="textarea"
                                    placeholder="Enter reason for leave..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    style={{ height: '75px' }}
                                />
                                <Form.Label htmlFor="reason">Reason / Remarks</Form.Label>
                            </Form.Floating>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" size="sm" onClick={onHide} disabled={applyMutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={applyMutation.isPending || !formData.employeeId || computedTotalDays <= 0 || isSameDaySessionInvalid || isDateRangeInvalid}
                    >
                        {applyMutation.isPending ? 'Submitting...' : `Apply for ${computedTotalDays} Days Leave`}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default LeaveApplyModal;
