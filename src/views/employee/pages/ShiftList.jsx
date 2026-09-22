import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Clock, Plus, Users, Edit3, Trash2 } from 'lucide-react';
import { useShifts, useDeleteShift, useShiftAssignments } from '../hooks/useEmployeeApi';
import ShiftModal from '../components/ShiftModal';
import ShiftAssignModal from '../components/ShiftAssignModal';
import '../employee.css';

const ShiftList = () => {
    const currentUser = useSelector((state) => state.authReducer?.user);
    const firmId = currentUser?.firmId;

    const [showShiftModal, setShowShiftModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const { data: shiftsRaw, isLoading: loadingShifts } = useShifts({ firmId });
    const { data: assignmentsRaw, isLoading: loadingAssignments } = useShiftAssignments({ firmId });
    const shifts = Array.isArray(shiftsRaw) ? shiftsRaw : (Array.isArray(shiftsRaw?.data) ? shiftsRaw.data : []);
    const assignments = Array.isArray(assignmentsRaw) ? assignmentsRaw : (Array.isArray(assignmentsRaw?.data) ? assignmentsRaw.data : []);
    const deleteMutation = useDeleteShift();

    const handleCreate = () => {
        setSelectedShift(null);
        setShowShiftModal(true);
    };

    const handleEdit = (shift) => {
        setSelectedShift(shift);
        setShowShiftModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this shift?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    return (
        <div className="container-fluid p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Shifts & Rosters</h4>
                    <span className="text-muted small">
                        Configure company working shifts, break timings, and employee roster assignments.
                    </span>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => setShowAssignModal(true)}>
                        <Users size={16} className="me-1" /> Assign Shift to Staff
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleCreate}>
                        <Plus size={16} className="me-1" /> Create Shift
                    </Button>
                </div>
            </div>

            <Row className="g-4">
                {/* Defined Shifts Card */}
                <Col md={12}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-white border-0 py-3">
                            <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                <Clock size={18} /> Configured Shifts
                            </h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Shift Name</th>
                                            <th>Code</th>
                                            <th>Timings</th>
                                            <th>Break Minutes</th>
                                            <th>Default</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingShifts ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    <Spinner size="sm" className="me-2" /> Loading shifts...
                                                </td>
                                            </tr>
                                        ) : shifts.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    No shifts defined yet. Click <strong>Create Shift</strong> above.
                                                </td>
                                            </tr>
                                        ) : (
                                            shifts.map(s => (
                                                <tr key={s.id}>
                                                    <td className="fw-semibold text-dark">{s.shiftName}</td>
                                                    <td>
                                                        <Badge bg="primary" className="font-monospace">{s.shiftCode}</Badge>
                                                    </td>
                                                    <td>
                                                        <span className="shift-time-badge">
                                                            <Clock size={13} /> {s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}
                                                        </span>
                                                    </td>
                                                    <td>{s.breakMinutes} mins</td>
                                                    <td>
                                                        {s.isDefault ? (
                                                            <Badge bg="success">Default</Badge>
                                                        ) : (
                                                            <span className="text-muted">—</span>
                                                        )}
                                                    </td>
                                                    <td className="text-end">
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="p-1 px-2 me-1"
                                                            onClick={() => handleEdit(s)}
                                                            title="Edit Shift"
                                                        >
                                                            <Edit3 size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="p-1 px-2 text-danger"
                                                            onClick={() => handleDelete(s.id)}
                                                            title="Delete Shift"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Active Shift Rosters / Assignments */}
                <Col md={12}>
                    <Card className="border-0 shadow-sm rounded-3">
                        <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                <Users size={18} /> Active Employee Shift Assignments
                            </h6>
                            <span className="text-muted small">
                                Total Assigned: <strong>{assignments.length}</strong>
                            </span>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive">
                                <Table hover className="align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Employee</th>
                                            <th>Department</th>
                                            <th>Assigned Shift</th>
                                            <th>Timings</th>
                                            <th>Effective From</th>
                                            <th>Effective To</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingAssignments ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    <Spinner size="sm" className="me-2" /> Loading shift assignments...
                                                </td>
                                            </tr>
                                        ) : assignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 text-muted">
                                                    No employees currently assigned to shifts.
                                                </td>
                                            </tr>
                                        ) : (
                                            assignments.map(a => (
                                                <tr key={a.id}>
                                                    <td>
                                                        <div className="fw-semibold text-dark">
                                                            {a.firstName} {a.lastName || ''}
                                                        </div>
                                                        <span className="text-primary font-monospace small">{a.empCode}</span>
                                                    </td>
                                                    <td>{a.department || '—'}</td>
                                                    <td>
                                                        <span className="fw-medium text-dark">{a.shiftName} ({a.shiftCode})</span>
                                                    </td>
                                                    <td>
                                                        <span className="shift-time-badge">
                                                            <Clock size={13} /> {a.startTime?.substring(0, 5)} - {a.endTime?.substring(0, 5)}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(a.effectiveFrom).toLocaleDateString()}</td>
                                                    <td>{a.effectiveTo ? new Date(a.effectiveTo).toLocaleDateString() : 'Ongoing'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Shift Modal */}
            <ShiftModal
                show={showShiftModal}
                onHide={() => setShowShiftModal(false)}
                shift={selectedShift}
                firmId={firmId}
            />

            {/* Shift Assign Modal */}
            <ShiftAssignModal
                show={showAssignModal}
                onHide={() => setShowAssignModal(false)}
                firmId={firmId}
            />
        </div>
    );
};

export default ShiftList;
