import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useApplyLeave, useEmployeesDropdown } from '../hooks/useEmployeeApi';

const LeaveApplyModal = ({ show, onHide, firmId, preSelectedEmployeeId = null }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        employeeId: preSelectedEmployeeId || '',
        leaveType: 'CASUAL',
        fromDate: today,
        toDate: today,
        totalDays: 1,
        halfDayOn: '',
        reason: ''
    });

    const { data: employeesRaw } = useEmployeesDropdown({ firmId });
    const employees = Array.isArray(employeesRaw) ? employeesRaw : (Array.isArray(employeesRaw?.data) ? employeesRaw.data : []);
    const applyMutation = useApplyLeave();

    const handleDatesChange = (field, val) => {
        const next = { ...formData, [field]: val };
        // Auto compute total days
        if (next.fromDate && next.toDate) {
            const d1 = new Date(next.fromDate);
            const d2 = new Date(next.toDate);
            const diffTime = d2.getTime() - d1.getTime();
            const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24))) + 1;
            next.totalDays = next.halfDayOn ? diffDays - 0.5 : diffDays;
        }
        setFormData(next);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await applyMutation.mutateAsync({
                ...formData,
                firmId,
                employeeId: parseInt(formData.employeeId, 10),
                totalDays: parseFloat(formData.totalDays)
            });
            onHide();
        } catch (err) {
            // Handled in hook
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Apply for Leave</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Employee <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Choose Employee --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.empCode} - {emp.firstName} {emp.lastName || ''} ({emp.department || 'General'})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Leave Type <span className="text-danger">*</span></Form.Label>
                                <Form.Select
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
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Half Day Option</Form.Label>
                                <Form.Select
                                    value={formData.halfDayOn}
                                    onChange={(e) => {
                                        const half = e.target.value;
                                        setFormData({
                                            ...formData,
                                            halfDayOn: half,
                                            totalDays: half ? Math.max(0.5, formData.totalDays - 0.5) : Math.ceil(formData.totalDays)
                                        });
                                    }}
                                >
                                    <option value="">Full Day</option>
                                    <option value="FROM">Half Day (Start Date)</option>
                                    <option value="TO">Half Day (End Date)</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>From Date <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.fromDate}
                                    onChange={(e) => handleDatesChange('fromDate', e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>To Date <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    value={formData.toDate}
                                    onChange={(e) => handleDatesChange('toDate', e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Total Days</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={formData.totalDays}
                                    onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Reason / Remarks</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Enter reason for leave..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={applyMutation.isPending}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={applyMutation.isPending || !formData.employeeId}>
                        {applyMutation.isPending ? 'Submitting...' : 'Apply Leave'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default LeaveApplyModal;
