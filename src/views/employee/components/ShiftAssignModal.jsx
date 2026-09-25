import React, { useState, useMemo } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup, Badge } from 'react-bootstrap';
import { Search, UserCheck, X } from 'lucide-react';
import { useAssignShift, useShifts, useEmployeesDropdown } from '../hooks/useEmployeeApi';
import '../employee.css';

const ShiftAssignModal = ({ show, onHide, firmId, preSelectedEmployeeId = null }) => {
    const today = new Date().toISOString().split('T')[0];
    const [shiftId, setShiftId] = useState('');
    const [employeeIds, setEmployeeIds] = useState(preSelectedEmployeeId ? [preSelectedEmployeeId] : []);
    const [effectiveFrom, setEffectiveFrom] = useState(today);
    const [effectiveTo, setEffectiveTo] = useState('');
    const [searchEmp, setSearchEmp] = useState('');

    const { data: shiftsRaw } = useShifts({ firmId });
    const { data: employeesRaw } = useEmployeesDropdown({ firmId });
    const shifts = Array.isArray(shiftsRaw) ? shiftsRaw : (Array.isArray(shiftsRaw?.data) ? shiftsRaw.data : []);
    const employees = Array.isArray(employeesRaw) ? employeesRaw : (Array.isArray(employeesRaw?.data) ? employeesRaw.data : []);
    const assignMutation = useAssignShift();

    const filteredEmployees = useMemo(() => {
        if (!searchEmp.trim()) return employees;
        const q = searchEmp.toLowerCase().trim();
        return employees.filter(e => {
            const fullName = `${e.firstName} ${e.lastName || ''}`.toLowerCase();
            const code = (e.empCode || '').toLowerCase();
            const dept = (e.department || '').toLowerCase();
            return fullName.includes(q) || code.includes(q) || dept.includes(q);
        });
    }, [employees, searchEmp]);

    const handleEffectiveFromChange = (newFrom) => {
        setEffectiveFrom(newFrom);
        if (effectiveTo && newFrom && effectiveTo < newFrom) {
            setEffectiveTo('');
        }
    };

    const isDateRangeInvalid = Boolean(effectiveTo && effectiveFrom && effectiveTo < effectiveFrom);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!shiftId) return;
        if (employeeIds.length === 0) return;
        if (isDateRangeInvalid) {
            alert('Effective To date cannot be earlier than Effective From date.');
            return;
        }

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
                    <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
                        <UserCheck size={20} className="text-primary" /> Assign Shift to Employees
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Select
                                    id="assignShiftSelect"
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
                                <Form.Label htmlFor="assignShiftSelect">Select Shift <span className="text-danger">*</span></Form.Label>
                            </Form.Floating>
                        </Col>
                        <Col md={3}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="effectiveFrom"
                                    type="date"
                                    placeholder="Effective From"
                                    value={effectiveFrom}
                                    onChange={(e) => handleEffectiveFromChange(e.target.value)}
                                    required
                                />
                                <Form.Label htmlFor="effectiveFrom">Effective From <span className="text-danger">*</span></Form.Label>
                            </Form.Floating>
                        </Col>
                        <Col md={3}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="effectiveTo"
                                    type="date"
                                    placeholder="Effective To"
                                    min={effectiveFrom}
                                    value={effectiveTo}
                                    onChange={(e) => setEffectiveTo(e.target.value)}
                                    isInvalid={isDateRangeInvalid}
                                />
                                <Form.Label htmlFor="effectiveTo">Effective To (Optional)</Form.Label>
                                {isDateRangeInvalid && (
                                    <Form.Control.Feedback type="invalid">
                                        Cannot be earlier than Effective From.
                                    </Form.Control.Feedback>
                                )}
                            </Form.Floating>
                        </Col>

                        <Col md={12}>
                            <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
                                <div>
                                    <Form.Label className="mb-0 fw-semibold">
                                        Select Staff Members
                                    </Form.Label>
                                    <span className="text-muted small ms-2">
                                        ({employeeIds.length} of {employees.length} selected)
                                    </span>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button variant="outline-primary" size="sm" onClick={handleSelectAll}>
                                        {employeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                            </div>

                            {/* Search Filter for staff */}
                            <div className="position-relative mb-2">
                                <InputGroup size="sm">
                                    <InputGroup.Text className="bg-light border-end-0">
                                        <Search size={14} className="text-muted" />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search employee by name, code or department..."
                                        value={searchEmp}
                                        onChange={(e) => setSearchEmp(e.target.value)}
                                        className="border-start-0"
                                    />
                                    {searchEmp && (
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => setSearchEmp('')}
                                            className="border-start-0"
                                        >
                                            <X size={14} />
                                        </Button>
                                    )}
                                </InputGroup>
                            </div>

                            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#fafbfc' }}>
                                {filteredEmployees.length === 0 ? (
                                    <div className="text-center text-muted py-4 small">
                                        No staff members match &quot;{searchEmp}&quot;
                                    </div>
                                ) : (
                                    <Row className="g-2">
                                        {filteredEmployees.map(emp => (
                                            <Col md={6} key={emp.id}>
                                                <div
                                                    className={`p-2 rounded border bg-white d-flex align-items-center justify-content-between ${employeeIds.includes(emp.id) ? 'border-primary bg-primary-subtle' : ''}`}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => toggleEmployee(emp.id)}
                                                >
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`emp-${emp.id}`}
                                                            checked={employeeIds.includes(emp.id)}
                                                            onChange={() => {}} // handled by div click
                                                            className="mb-0"
                                                        />
                                                        <div>
                                                            <div className="fw-semibold text-dark small">
                                                                {emp.firstName} {emp.lastName || ''}
                                                            </div>
                                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                                {emp.department || 'General'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge bg="light" className="text-dark border font-monospace" style={{ fontSize: '0.72rem' }}>
                                                        {emp.empCode}
                                                    </Badge>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" size="sm" onClick={onHide} disabled={assignMutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        type="submit"
                        disabled={assignMutation.isPending || !shiftId || employeeIds.length === 0}
                    >
                        {assignMutation.isPending ? 'Assigning...' : `Assign to ${employeeIds.length} Staff`}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ShiftAssignModal;
