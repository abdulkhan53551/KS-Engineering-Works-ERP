import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';
import { Clock, Calendar, User, Save, X, AlertCircle } from 'lucide-react';
import { useMarkAttendance } from '../hooks/useEmployeeApi';

const STANDARD_SHIFT_HOURS = 8.0;

const AttendanceHoursModal = ({ show, onHide, employee, date, initialData, onSaved }) => {
    const markAttendanceMutation = useMarkAttendance();

    const [status, setStatus] = useState('PRESENT');
    const [checkIn, setCheckIn] = useState('09:00');
    const [checkOut, setCheckOut] = useState('17:00');
    const [totalHours, setTotalHours] = useState(8.0);
    const [overtimeHours, setOvertimeHours] = useState(0.0);
    const [overtimeType, setOvertimeType] = useState('NORMAL');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (show && employee && date) {
            const data = initialData || {};
            const initialStatus = data.status || 'PRESENT';
            setStatus(initialStatus);

            const inTime = data.checkIn ? data.checkIn.substring(0, 5) : (initialStatus === 'PRESENT' ? '09:00' : '');
            const outTime = data.checkOut ? data.checkOut.substring(0, 5) : (initialStatus === 'PRESENT' ? '17:00' : '');
            setCheckIn(inTime);
            setCheckOut(outTime);

            const th = data.totalHours !== undefined && data.totalHours !== null
                ? parseFloat(data.totalHours)
                : (initialStatus === 'PRESENT' ? 8.0 : (initialStatus === 'HALF_DAY' ? 4.0 : 0.0));
            setTotalHours(th);

            const ot = data.overtimeHours !== undefined && data.overtimeHours !== null
                ? parseFloat(data.overtimeHours)
                : Math.max(0, Math.round((th - STANDARD_SHIFT_HOURS) * 100) / 100);
            setOvertimeHours(ot);

            setOvertimeType(data.overtimeType || 'NORMAL');
            setRemarks(data.remarks || '');
        }
    }, [show, employee, date, initialData]);

    // Auto-calculate total hours and OT when In/Out change
    const handleTimeChange = (newIn, newOut) => {
        setCheckIn(newIn);
        setCheckOut(newOut);

        if (newIn && newOut) {
            const [inH, inM] = newIn.split(':').map(Number);
            const [outH, outM] = newOut.split(':').map(Number);
            let inMin = inH * 60 + inM;
            let outMin = outH * 60 + outM;
            if (outMin < inMin) outMin += 24 * 60; // Crosses midnight

            const diffHours = Math.round(((outMin - inMin) / 60) * 100) / 100;
            setTotalHours(diffHours);

            const ot = Math.max(0, Math.round((diffHours - STANDARD_SHIFT_HOURS) * 100) / 100);
            setOvertimeHours(ot);

            if (diffHours <= 4 && diffHours > 0) {
                setStatus('HALF_DAY');
            } else if (diffHours > 0) {
                setStatus('PRESENT');
            }
        }
    };

    // Auto-calculate OT when Total Hours is directly typed (e.g. 10 or 11 hrs)
    const handleTotalHoursChange = (val) => {
        const parsed = val === '' ? '' : parseFloat(val);
        setTotalHours(parsed);

        const num = parseFloat(parsed) || 0;
        const ot = Math.max(0, Math.round((num - STANDARD_SHIFT_HOURS) * 100) / 100);
        setOvertimeHours(ot);

        if (num <= 4 && num > 0) {
            setStatus('HALF_DAY');
        } else if (num > 0) {
            setStatus('PRESENT');
        }
    };

    // Status change handler
    const handleStatusChange = (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'ABSENT' || newStatus === 'LEAVE' || newStatus === 'WEEKLY_OFF' || newStatus === 'HOLIDAY') {
            setCheckIn('');
            setCheckOut('');
            setTotalHours(0);
            setOvertimeHours(0);
        } else if (newStatus === 'HALF_DAY') {
            setCheckIn('09:00');
            setCheckOut('13:00');
            setTotalHours(4.0);
            setOvertimeHours(0);
        } else if (newStatus === 'PRESENT') {
            setCheckIn('09:00');
            setCheckOut('17:00');
            setTotalHours(8.0);
            setOvertimeHours(0);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!employee || !date) return;

        const payload = {
            employeeId: employee.id,
            firmId: employee.firmId || employee.firm_id,
            branchId: employee.branchId || employee.branch_id || null,
            attendanceDate: date,
            status,
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            totalHours: totalHours === '' ? 0 : parseFloat(totalHours),
            overtimeHours: overtimeHours === '' ? 0 : parseFloat(overtimeHours),
            overtimeType: overtimeHours > 0 ? overtimeType : 'NORMAL',
            remarks: remarks || null
        };

        try {
            await markAttendanceMutation.mutateAsync(payload);
            if (onSaved) {
                onSaved(payload);
            }
            onHide();
        } catch (err) {
            // Handled in mutation hook
        }
    };

    const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }) : '';

    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="d-flex align-items-center gap-2 fs-5 fw-bold text-dark">
                    <Clock size={20} className="text-primary" />
                    Log Daily Hours & Overtime
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={handleSave}>
                <Modal.Body className="pt-3">
                    {/* Worker & Date Info Bar */}
                    <div className="bg-light p-3 rounded-3 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-2 border">
                        <div className="d-flex align-items-center gap-3">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '42px', height: '42px' }}>
                                {(employee?.firstName || employee?.first_name || 'E').charAt(0)}
                            </div>
                            <div>
                                <div className="fw-bold text-dark fs-6">
                                    {employee?.firstName || employee?.first_name} {employee?.lastName || employee?.last_name || ''}
                                </div>
                                <div className="text-muted small">
                                    <span className="font-monospace text-primary fw-semibold">{employee?.empCode || employee?.emp_code}</span>
                                    {' '}&bull; {employee?.department || 'Staff'} &bull; {employee?.designation || 'Worker'}
                                </div>
                            </div>
                        </div>

                        <div className="text-end">
                            <div className="text-muted small">Attendance Date</div>
                            <div className="fw-bold text-dark">{formattedDate}</div>
                        </div>
                    </div>

                    <Row className="g-3">
                        {/* Attendance Status */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Select
                                    id="modalAttStatus"
                                    value={status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    required
                                >
                                    <option value="PRESENT">Present (P)</option>
                                    <option value="HALF_DAY">Half Day (½)</option>
                                    <option value="ABSENT">Absent (A)</option>
                                    <option value="LEAVE">On Leave (L)</option>
                                    <option value="WEEKLY_OFF">Weekly Off (WO)</option>
                                    <option value="HOLIDAY">Holiday (H)</option>
                                </Form.Select>
                                <Form.Label htmlFor="modalAttStatus">Attendance Status <span className="text-danger">*</span></Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* Shift Reference */}
                        <Col md={6}>
                            <div className="p-2 border rounded bg-white text-muted small d-flex align-items-center justify-content-between h-100 mb-3">
                                <div>
                                    <div className="fw-semibold text-dark">Standard Shift Duration:</div>
                                    <span>{STANDARD_SHIFT_HOURS} Hours / day</span>
                                </div>
                                <Badge bg={overtimeHours > 0 ? "warning" : "success"} className="text-dark py-2 px-3">
                                    {overtimeHours > 0 ? `+${overtimeHours} hrs Overtime` : 'Normal Hours'}
                                </Badge>
                            </div>
                        </Col>

                        {/* Check-In & Check-Out Times */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="modalCheckIn"
                                    type="time"
                                    placeholder="Check In"
                                    value={checkIn}
                                    onChange={(e) => handleTimeChange(e.target.value, checkOut)}
                                    disabled={status === 'ABSENT' || status === 'LEAVE' || status === 'WEEKLY_OFF' || status === 'HOLIDAY'}
                                />
                                <Form.Label htmlFor="modalCheckIn">Check-In Time</Form.Label>
                            </Form.Floating>
                        </Col>

                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="modalCheckOut"
                                    type="time"
                                    placeholder="Check Out"
                                    value={checkOut}
                                    onChange={(e) => handleTimeChange(checkIn, e.target.value)}
                                    disabled={status === 'ABSENT' || status === 'LEAVE' || status === 'WEEKLY_OFF' || status === 'HOLIDAY'}
                                />
                                <Form.Label htmlFor="modalCheckOut">Check-Out Time</Form.Label>
                            </Form.Floating>
                        </Col>

                        {/* Total Hours Worked (Direct Entry Supported!) */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-1">
                                <Form.Control
                                    id="modalTotalHours"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                    placeholder="Total Hours Worked"
                                    value={totalHours}
                                    onChange={(e) => handleTotalHoursChange(e.target.value)}
                                    disabled={status === 'ABSENT' || status === 'LEAVE' || status === 'WEEKLY_OFF' || status === 'HOLIDAY'}
                                    required={status === 'PRESENT' || status === 'HALF_DAY'}
                                />
                                <Form.Label htmlFor="modalTotalHours">Total Hours Worked (e.g. 10, 11) <span className="text-danger">*</span></Form.Label>
                            </Form.Floating>
                            <div className="text-muted small ps-1 mb-2">
                                Auto-calculated from times OR type directly (e.g. 10 or 11 hrs).
                            </div>
                        </Col>

                        {/* Overtime Hours */}
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-1">
                                <Form.Control
                                    id="modalOvertimeHours"
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="24"
                                    placeholder="Overtime Hours"
                                    value={overtimeHours}
                                    onChange={(e) => setOvertimeHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    disabled={status === 'ABSENT' || status === 'LEAVE' || status === 'WEEKLY_OFF' || status === 'HOLIDAY'}
                                />
                                <Form.Label htmlFor="modalOvertimeHours">Overtime Hours (Beyond 8 hrs)</Form.Label>
                            </Form.Floating>
                            <div className="text-muted small ps-1 mb-2">
                                Auto-calculated: Total Hours ({totalHours || 0}h) - 8h = <strong>{overtimeHours || 0}h OT</strong>
                            </div>
                        </Col>

                        {/* Overtime Type */}
                        {parseFloat(overtimeHours || 0) > 0 && (
                            <Col md={6}>
                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                    <Form.Select
                                        id="modalOvertimeType"
                                        value={overtimeType}
                                        onChange={(e) => setOvertimeType(e.target.value)}
                                    >
                                        <option value="NORMAL">Normal Workday (1.5x Rate)</option>
                                        <option value="HOLIDAY">Holiday Work (2.0x Rate)</option>
                                        <option value="WEEKEND">Weekend / Off Day (2.0x Rate)</option>
                                    </Form.Select>
                                    <Form.Label htmlFor="modalOvertimeType">Overtime Rate Type</Form.Label>
                                </Form.Floating>
                            </Col>
                        )}

                        {/* Remarks */}
                        <Col md={parseFloat(overtimeHours || 0) > 0 ? 6 : 12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="modalRemarks"
                                    type="text"
                                    placeholder="Remarks / Job description"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                                <Form.Label htmlFor="modalRemarks">Remarks / Job Note (e.g. Job #401 Overtime)</Form.Label>
                            </Form.Floating>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer className="border-0 pt-0">
                    <Button variant="outline-secondary" size="sm" onClick={onHide}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={markAttendanceMutation.isPending}
                        className="d-flex align-items-center gap-1 shadow-sm px-3"
                    >
                        <Save size={15} />
                        {markAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AttendanceHoursModal;
