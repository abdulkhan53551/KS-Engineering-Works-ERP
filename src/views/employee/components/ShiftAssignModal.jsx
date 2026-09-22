import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useAssignShift, useShifts, useEmployeesDropdown } from '../hooks/useEmployeeApi';

const ShiftAssignModal = ({ show, onHide, firmId, preSelectedEmployeeId = null }) => {
    const today = new Date().toISOString().split('T')[0];
    const [shiftId, setShiftId] = useState('');
    const [employeeIds, setEmployeeIds] = useState(preSelectedEmployeeId ? [preSelectedEmployeeId] : []);
    const [effectiveFrom, setEffectiveFrom] = useState(today);
    const [effectiveTo, setEffectiveTo] = useState('');

    const { data: shiftsRaw } = useShifts({ firmId });
    const { data: employeesRaw } = useEmployeesDropdown({ firmId });
    const shifts = Array.isArray(shiftsRaw) ? shiftsRaw : (Array.isArray(shiftsRaw?.data) ? shiftsRaw.data : []);
    const employees = Array.isArray(employeesRaw) ? employeesRaw : (Array.isArray(employeesRaw?.data) ? employeesRaw.data : []);
    const assignMutation = useAssignShift();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!shiftId) return;
        if (employeeIds.length === 0) return;

        try {
            await assignMutation.mutateAsync({
                shiftId: parseInt(shiftId, 10),
                employeeIds: employeeIds.map(id => parseInt(id, 10)),
                effectiveFrom,
                effectiveTo: effectiveTo || null
            });
            onHide();
        } catch (err) {
            // Handled in hook
        }
    };

    const handleSelectAll = () => {
        if (employeeIds.length === employees.length) {
            setEmployeeIds([]);
        } else {
            setEmployeeIds(employees.map(e => e.id));
        }
    };

    const toggleEmployee = (id) => {
        if (employeeIds.includes(id)) {
            setEmployeeIds(employeeIds.filter(e => e !== id));
        } else {
            setEmployeeIds([...employeeIds, id]);
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Assign Shift to Employees</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Select Shift <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    value={shiftId}
                                    onChange={(e) => setShiftId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Shift --</option>
                                    {shifts.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.shiftName} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Effective From <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    value={effectiveFrom}
                                    onChange={(e) => setEffectiveFrom(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Effective To (Optional)</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={effectiveTo}
                                    onChange={(e) => setEffectiveTo(e.target.value)}
                                />
                            </Form.Group>
                        </Col>

                        <Col md={12}>
                            <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                                <Form.Label className="mb-0 fw-semibold">
                                    Select Employees ({employeeIds.length} of {employees.length} selected)
                                </Form.Label>
                                <Button variant="outline-primary" size="sm" onClick={handleSelectAll}>
                                    {employeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                                <Row className="g-2">
                                    {employees.map(emp => (
                                        <Col md={6} key={emp.id}>
                                            <Form.Check
                                                type="checkbox"
                                                id={`emp-${emp.id}`}
                                                label={`${emp.empCode} - ${emp.firstName} ${emp.lastName || ''} (${emp.department || 'General'})`}
                                                checked={employeeIds.includes(emp.id)}
                                                onChange={() => toggleEmployee(emp.id)}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={assignMutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={assignMutation.isPending || !shiftId || employeeIds.length === 0}
                    >
                        {assignMutation.isPending ? 'Assigning...' : `Assign to ${employeeIds.length} Employees`}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ShiftAssignModal;
