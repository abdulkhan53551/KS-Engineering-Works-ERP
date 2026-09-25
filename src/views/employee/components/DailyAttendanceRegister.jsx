import React, { useState, useEffect, useMemo } from 'react';
import { Card, Table, Button, Form, Badge, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import {
    Calendar,
    Clock,
    Save,
    Search,
    ChevronLeft,
    ChevronRight,
    Users,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Zap,
    RotateCcw
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    useEmployees,
    useAttendance,
    useBulkMarkAttendance,
    useMarkDateStatus
} from '../hooks/useEmployeeApi';

const STANDARD_SHIFT_HOURS = 8.0;

const DailyAttendanceRegister = ({ firmId }) => {
    // Current selected date (YYYY-MM-DD)
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fetch active employees
    const { data: empResult, isLoading: loadingEmployees } = useEmployees({
        firmId,
        pageSize: 500,
        status: 'ACTIVE'
    });
    const employees = useMemo(() => {
        if (Array.isArray(empResult?.employees)) return empResult.employees;
        if (Array.isArray(empResult?.data?.employees)) return empResult.data.employees;
        if (Array.isArray(empResult)) return empResult;
        return [];
    }, [empResult]);

    // Fetch attendance for the specific date
    const { data: attendanceLogsRaw, isLoading: loadingAttendance, refetch } = useAttendance({
        firmId,
        startDate: selectedDate,
        endDate: selectedDate
    });
    const attendanceLogs = useMemo(() => {
        if (Array.isArray(attendanceLogsRaw)) return attendanceLogsRaw;
        if (Array.isArray(attendanceLogsRaw?.data)) return attendanceLogsRaw.data;
        return [];
    }, [attendanceLogsRaw]);

    const bulkMarkMutation = useBulkMarkAttendance();
    const markDateStatusMutation = useMarkDateStatus();

    // Local form state for all employees: { [empId]: { status, checkIn, checkOut, totalHours, overtimeHours, overtimeType, remarks } }
    const [recordsMap, setRecordsMap] = useState({});

    // Sync recordsMap when attendance logs or employees change
    useEffect(() => {
        const newMap = {};

        // Index existing logs by employeeId
        const existingLogsByEmp = {};
        if (Array.isArray(attendanceLogs)) {
            attendanceLogs.forEach(log => {
                existingLogsByEmp[log.employeeId] = log;
            });
        }

        employees.forEach(emp => {
            const existing = existingLogsByEmp[emp.id];
            if (existing) {
                newMap[emp.id] = {
                    status: existing.status || 'PRESENT',
                    checkIn: existing.checkIn ? existing.checkIn.substring(0, 5) : '',
                    checkOut: existing.checkOut ? existing.checkOut.substring(0, 5) : '',
                    totalHours: existing.totalHours !== null && existing.totalHours !== undefined ? parseFloat(existing.totalHours) : 8.0,
                    overtimeHours: existing.overtimeHours !== null && existing.overtimeHours !== undefined ? parseFloat(existing.overtimeHours) : 0.0,
                    overtimeType: existing.overtimeType || 'NORMAL',
                    remarks: existing.remarks || ''
                };
            } else {
                // Default pre-fill for unmarked worker
                newMap[emp.id] = {
                    status: 'PRESENT',
                    checkIn: '09:00',
                    checkOut: '17:00',
                    totalHours: 8.0,
                    overtimeHours: 0.0,
                    overtimeType: 'NORMAL',
                    remarks: ''
                };
            }
        });

        setRecordsMap(newMap);
        setHasUnsavedChanges(false);
    }, [attendanceLogs, employees, selectedDate]);

    // Handle Time changes (Check-In or Check-Out) -> Auto-compute hours
    const handleTimeChange = (empId, field, value) => {
        setRecordsMap(prev => {
            const current = prev[empId] || {};
            const newCheckIn = field === 'checkIn' ? value : current.checkIn;
            const newCheckOut = field === 'checkOut' ? value : current.checkOut;

            let updatedTotalHours = current.totalHours;
            let updatedOT = current.overtimeHours;
            let updatedStatus = current.status;

            if (newCheckIn && newCheckOut) {
                const [inH, inM] = newCheckIn.split(':').map(Number);
                const [outH, outM] = newCheckOut.split(':').map(Number);
                let inMin = inH * 60 + inM;
                let outMin = outH * 60 + outM;
                if (outMin < inMin) outMin += 24 * 60; // Overnight shift

                const diffHours = Math.round(((outMin - inMin) / 60) * 100) / 100;
                updatedTotalHours = diffHours;
                updatedOT = Math.max(0, Math.round((diffHours - STANDARD_SHIFT_HOURS) * 100) / 100);

                if (diffHours <= 4 && diffHours > 0) {
                    updatedStatus = 'HALF_DAY';
                } else if (diffHours > 0) {
                    updatedStatus = 'PRESENT';
                }
            }

            return {
                ...prev,
                [empId]: {
                    ...current,
                    [field]: value,
                    totalHours: updatedTotalHours,
                    overtimeHours: updatedOT,
                    status: updatedStatus
                }
            };
        });
        setHasUnsavedChanges(true);
    };

    // Handle Direct Total Hours Typing (e.g. 10 or 11 hrs)
    const handleTotalHoursChange = (empId, value) => {
        const num = value === '' ? '' : parseFloat(value);

        setRecordsMap(prev => {
            const current = prev[empId] || {};
            const valNum = parseFloat(num) || 0;
            const ot = Math.max(0, Math.round((valNum - STANDARD_SHIFT_HOURS) * 100) / 100);

            let status = current.status;
            if (valNum <= 4 && valNum > 0) {
                status = 'HALF_DAY';
            } else if (valNum > 0) {
                status = 'PRESENT';
            }

            return {
                ...prev,
                [empId]: {
                    ...current,
                    totalHours: num,
                    overtimeHours: ot,
                    status
                }
            };
        });
        setHasUnsavedChanges(true);
    };

    // Handle Direct Overtime Hours Typing
    const handleOvertimeChange = (empId, value) => {
        const val = value === '' ? '' : parseFloat(value);
        setRecordsMap(prev => ({
            ...prev,
            [empId]: {
                ...(prev[empId] || {}),
                overtimeHours: val
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Handle Status Change
    const handleStatusChange = (empId, newStatus) => {
        setRecordsMap(prev => {
            const current = prev[empId] || {};
            let checkIn = current.checkIn;
            let checkOut = current.checkOut;
            let totalHours = current.totalHours;
            let overtimeHours = current.overtimeHours;

            if (newStatus === 'ABSENT' || newStatus === 'LEAVE' || newStatus === 'WEEKLY_OFF' || newStatus === 'HOLIDAY') {
                checkIn = '';
                checkOut = '';
                totalHours = 0;
                overtimeHours = 0;
            } else if (newStatus === 'HALF_DAY') {
                checkIn = checkIn || '09:00';
                checkOut = '13:00';
                totalHours = 4.0;
                overtimeHours = 0;
            } else if (newStatus === 'PRESENT') {
                checkIn = checkIn || '09:00';
                checkOut = checkOut || '17:00';
                totalHours = totalHours && totalHours > 0 ? totalHours : 8.0;
                overtimeHours = Math.max(0, Math.round((totalHours - STANDARD_SHIFT_HOURS) * 100) / 100);
            }

            return {
                ...prev,
                [empId]: {
                    ...current,
                    status: newStatus,
                    checkIn,
                    checkOut,
                    totalHours,
                    overtimeHours
                }
            };
        });
        setHasUnsavedChanges(true);
    };

    // Update other fields (overtimeType, remarks)
    const handleFieldChange = (empId, field, value) => {
        setRecordsMap(prev => ({
            ...prev,
            [empId]: {
                ...(prev[empId] || {}),
                [field]: value
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Quick Fill: Set All Present (8h Standard)
    const handleFillAllPresent = () => {
        const newMap = {};
        employees.forEach(emp => {
            newMap[emp.id] = {
                status: 'PRESENT',
                checkIn: '09:00',
                checkOut: '17:00',
                totalHours: 8.0,
                overtimeHours: 0.0,
                overtimeType: 'NORMAL',
                remarks: ''
            };
        });
        setRecordsMap(newMap);
        setHasUnsavedChanges(true);
        toast.info("All staff set to Present (8h standard). Edit overtime workers as needed.");
    };

    // Save all records for the day via Batch Upsert
    const handleSaveDay = async () => {
        if (!firmId) {
            toast.error("Please select a specific firm to mark attendance.");
            return;
        }

        const records = employees.map(emp => {
            const rec = recordsMap[emp.id] || {};
            const th = rec.totalHours === '' || rec.totalHours === undefined ? 0 : parseFloat(rec.totalHours);
            const ot = rec.overtimeHours === '' || rec.overtimeHours === undefined ? 0 : parseFloat(rec.overtimeHours);

            return {
                employeeId: emp.id,
                branchId: emp.branchId || emp.branch_id || null,
                shiftId: emp.shiftId || emp.shift_id || null,
                status: rec.status || 'PRESENT',
                checkIn: rec.checkIn || null,
                checkOut: rec.checkOut || null,
                totalHours: isNaN(th) ? 0 : th,
                overtimeHours: isNaN(ot) ? 0 : ot,
                overtimeType: ot > 0 ? (rec.overtimeType || 'NORMAL') : 'NORMAL',
                remarks: rec.remarks || null
            };
        });

        try {
            await bulkMarkMutation.mutateAsync({
                firmId,
                attendanceDate: selectedDate,
                records
            });
            toast.success(`Day's attendance saved for ${records.length} staff.`);
            setHasUnsavedChanges(false);
            refetch();
        } catch (err) {
            toast.error("Failed to save daily attendance.");
        }
    };

    // Date navigation
    const handlePrevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleNextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const handleToday = () => {
        setSelectedDate(todayStr);
    };

    // Filter employees by search term
    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        const q = searchTerm.toLowerCase();
        return employees.filter(emp =>
            (emp.firstName || '').toLowerCase().includes(q) ||
            (emp.lastName || '').toLowerCase().includes(q) ||
            (emp.empCode || '').toLowerCase().includes(q) ||
            (emp.department || '').toLowerCase().includes(q)
        );
    }, [employees, searchTerm]);

    // KPI Metrics for selected day
    const metrics = useMemo(() => {
        let present = 0;
        let absent = 0;
        let halfDay = 0;
        let leave = 0;
        let otWorkers = 0;
        let totalOTHours = 0;

        employees.forEach(emp => {
            const r = recordsMap[emp.id];
            if (!r) return;
            if (r.status === 'PRESENT') present++;
            else if (r.status === 'ABSENT') absent++;
            else if (r.status === 'HALF_DAY') halfDay++;
            else if (r.status === 'LEAVE') leave++;

            const ot = parseFloat(r.overtimeHours || 0);
            if (ot > 0) {
                otWorkers++;
                totalOTHours += ot;
            }
        });

        return { present, absent, halfDay, leave, otWorkers, totalOTHours };
    }, [employees, recordsMap]);

    const formattedDateTitle = new Date(selectedDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="daily-attendance-container">
            {/* Top Toolbar: Date Picker & Quick Actions */}
            <Card className="border-0 shadow-sm rounded-3 mb-3">
                <Card.Body className="p-3">
                    <Row className="g-3 align-items-center justify-content-between">
                        {/* Date Navigation */}
                        <Col lg={5} md={6}>
                            <div className="d-flex align-items-center gap-2">
                                <div className="btn-group shadow-sm">
                                    <Button variant="outline-secondary" size="sm" onClick={handlePrevDay} title="Previous Day">
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <Button variant="outline-primary" size="sm" onClick={handleToday} className="fw-semibold">
                                        Today
                                    </Button>
                                    <Button variant="outline-secondary" size="sm" onClick={handleNextDay} title="Next Day">
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>

                                <Form.Control
                                    type="date"
                                    size="sm"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="fw-bold text-primary shadow-sm"
                                    style={{ maxWidth: '160px' }}
                                />

                                <span className="d-none d-xl-inline text-muted small fw-semibold">
                                    {formattedDateTitle}
                                </span>
                            </div>
                        </Col>

                        {/* Search & Actions */}
                        <Col lg={7} md={6} className="d-flex flex-wrap align-items-center justify-content-md-end gap-2">
                            {/* Search Filter */}
                            <InputGroup size="sm" style={{ maxWidth: '220px' }}>
                                <InputGroup.Text className="bg-white border-end-0">
                                    <Search size={14} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search staff..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-start-0"
                                />
                            </InputGroup>

                            {/* Quick Fill Button */}
                            <Button
                                variant="outline-success"
                                size="sm"
                                onClick={handleFillAllPresent}
                                className="d-flex align-items-center gap-1 shadow-sm"
                                title="Set all workers to Present with 8 hours"
                            >
                                <Zap size={14} />
                                Set All (8h)
                            </Button>

                            {/* Save Button */}
                            <Button
                                variant={hasUnsavedChanges ? "success" : "primary"}
                                size="sm"
                                onClick={handleSaveDay}
                                disabled={bulkMarkMutation.isPending || !hasUnsavedChanges}
                                className="d-flex align-items-center gap-1 shadow-sm px-3"
                            >
                                <Save size={15} />
                                {bulkMarkMutation.isPending ? 'Saving...' : (hasUnsavedChanges ? 'Save Day *' : 'Saved')}
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Daily KPI Metric Badges */}
            <Row className="g-2 mb-3">
                <Col xl={2} md={4} xs={6}>
                    <div className="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between shadow-sm">
                        <span className="text-muted small">Total Staff</span>
                        <span className="fw-bold fs-6 text-dark">{employees.length}</span>
                    </div>
                </Col>
                <Col xl={2} md={4} xs={6}>
                    <div className="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between shadow-sm border-start border-success border-3">
                        <span className="text-muted small">Present</span>
                        <span className="fw-bold fs-6 text-success">{metrics.present}</span>
                    </div>
                </Col>
                <Col xl={3} md={4} xs={6}>
                    <div className="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between shadow-sm border-start border-warning border-3">
                        <span className="text-muted small">Overtime Workers</span>
                        <span className="fw-bold fs-6 text-warning">
                            {metrics.otWorkers} <span className="small text-muted font-monospace">({metrics.totalOTHours}h OT)</span>
                        </span>
                    </div>
                </Col>
                <Col xl={2} md={4} xs={6}>
                    <div className="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between shadow-sm border-start border-danger border-3">
                        <span className="text-muted small">Absent</span>
                        <span className="fw-bold fs-6 text-danger">{metrics.absent}</span>
                    </div>
                </Col>
                <Col xl={3} md={4} xs={12}>
                    <div className="p-2 border rounded-3 bg-white d-flex align-items-center justify-content-between shadow-sm border-start border-primary border-3">
                        <span className="text-muted small">Standard Shift</span>
                        <span className="fw-bold fs-6 text-primary">{STANDARD_SHIFT_HOURS} Hours / day</span>
                    </div>
                </Col>
            </Row>

            {/* Daily Staff Attendance Table */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-0">
                    {loadingEmployees || loadingAttendance ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <div className="mt-2 text-muted small">Loading staff muster for {selectedDate}...</div>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            {employees.length === 0 ? "No active staff found in this firm." : "No staff match your search."}
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table hover className="align-middle mb-0 daily-att-table">
                                <thead className="table-light">
                                    <tr style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <th style={{ width: '40px' }} className="text-center">#</th>
                                        <th style={{ minWidth: '180px' }}>Worker / Employee</th>
                                        <th style={{ minWidth: '130px' }}>Status</th>
                                        <th style={{ minWidth: '110px' }}>Check In</th>
                                        <th style={{ minWidth: '110px' }}>Check Out</th>
                                        <th style={{ minWidth: '120px' }} title="Total hours worked today (Standard: 8h)">
                                            Total Hours
                                        </th>
                                        <th style={{ minWidth: '120px' }} title="Overtime hours beyond standard 8 hours">
                                            Overtime (OT)
                                        </th>
                                        <th style={{ minWidth: '130px' }}>OT Type</th>
                                        <th style={{ minWidth: '180px' }}>Remarks / Job Note</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((emp, index) => {
                                        const rec = recordsMap[emp.id] || {};
                                        const isAbsentOrOff = rec.status === 'ABSENT' || rec.status === 'LEAVE' || rec.status === 'WEEKLY_OFF' || rec.status === 'HOLIDAY';
                                        const hasOT = parseFloat(rec.overtimeHours || 0) > 0;

                                        return (
                                            <tr key={emp.id} className={hasOT ? 'row-has-ot' : ''}>
                                                <td className="text-center text-muted small">{index + 1}</td>
                                                <td>
                                                    <div className="fw-semibold text-dark">
                                                        {emp.firstName} {emp.lastName || ''}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="text-primary font-monospace" style={{ fontSize: '0.72rem' }}>
                                                            {emp.empCode}
                                                        </span>
                                                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                            &bull; {emp.department || 'Workshop'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status Dropdown */}
                                                <td>
                                                    <Form.Select
                                                        size="sm"
                                                        value={rec.status || 'PRESENT'}
                                                        onChange={(e) => handleStatusChange(emp.id, e.target.value)}
                                                        className={`fw-semibold status-select status-select-${rec.status}`}
                                                    >
                                                        <option value="PRESENT">Present (P)</option>
                                                        <option value="HALF_DAY">Half Day (½)</option>
                                                        <option value="ABSENT">Absent (A)</option>
                                                        <option value="LEAVE">Leave (L)</option>
                                                        <option value="WEEKLY_OFF">Weekly Off (WO)</option>
                                                        <option value="HOLIDAY">Holiday (H)</option>
                                                    </Form.Select>
                                                </td>

                                                {/* Check In Time */}
                                                <td>
                                                    <Form.Control
                                                        type="time"
                                                        size="sm"
                                                        value={rec.checkIn || ''}
                                                        onChange={(e) => handleTimeChange(emp.id, 'checkIn', e.target.value)}
                                                        disabled={isAbsentOrOff}
                                                        className="text-center"
                                                    />
                                                </td>

                                                {/* Check Out Time */}
                                                <td>
                                                    <Form.Control
                                                        type="time"
                                                        size="sm"
                                                        value={rec.checkOut || ''}
                                                        onChange={(e) => handleTimeChange(emp.id, 'checkOut', e.target.value)}
                                                        disabled={isAbsentOrOff}
                                                        className="text-center"
                                                    />
                                                </td>

                                                {/* Total Hours Worked (Direct Entry or Computed) */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <Form.Control
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="24"
                                                            size="sm"
                                                            value={rec.totalHours !== undefined ? rec.totalHours : ''}
                                                            onChange={(e) => handleTotalHoursChange(emp.id, e.target.value)}
                                                            disabled={isAbsentOrOff}
                                                            className={`fw-bold text-center ${parseFloat(rec.totalHours || 0) > 8 ? 'text-primary' : ''}`}
                                                            style={{ maxWidth: '80px' }}
                                                            placeholder="0"
                                                        />
                                                        <span className="text-muted small">hrs</span>
                                                    </div>
                                                </td>

                                                {/* Overtime Hours (OT) */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <Form.Control
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="24"
                                                            size="sm"
                                                            value={rec.overtimeHours !== undefined ? rec.overtimeHours : ''}
                                                            onChange={(e) => handleOvertimeChange(emp.id, e.target.value)}
                                                            disabled={isAbsentOrOff}
                                                            className={`text-center ${hasOT ? 'fw-bold text-warning border-warning' : 'text-muted'}`}
                                                            style={{ maxWidth: '75px' }}
                                                            placeholder="0"
                                                        />
                                                        {hasOT && (
                                                            <span className="ot-pill font-monospace" title={`${rec.overtimeHours} hours overtime beyond 8h`}>
                                                                +{rec.overtimeHours}h
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Overtime Type */}
                                                <td>
                                                    <Form.Select
                                                        size="sm"
                                                        value={rec.overtimeType || 'NORMAL'}
                                                        onChange={(e) => handleFieldChange(emp.id, 'overtimeType', e.target.value)}
                                                        disabled={isAbsentOrOff || !hasOT}
                                                        style={{ fontSize: '0.78rem' }}
                                                    >
                                                        <option value="NORMAL">Normal (1.5x)</option>
                                                        <option value="HOLIDAY">Holiday (2.0x)</option>
                                                        <option value="WEEKEND">Weekend (2.0x)</option>
                                                    </Form.Select>
                                                </td>

                                                {/* Remarks / Job Note */}
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        size="sm"
                                                        placeholder="e.g. Job #104 Lathe OT"
                                                        value={rec.remarks || ''}
                                                        onChange={(e) => handleFieldChange(emp.id, 'remarks', e.target.value)}
                                                        style={{ fontSize: '0.8rem' }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>

                {/* Footer Bar with Save Notice */}
                {hasUnsavedChanges && (
                    <Card.Footer className="bg-light py-2 px-3 d-flex align-items-center justify-content-between border-top">
                        <div className="d-flex align-items-center gap-2 text-warning fw-semibold small">
                            <AlertTriangle size={16} />
                            <span>You have unsaved attendance changes for {formattedDateTitle}.</span>
                        </div>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={handleSaveDay}
                            disabled={bulkMarkMutation.isPending}
                            className="d-flex align-items-center gap-1 shadow-sm px-3"
                        >
                            <Save size={15} />
                            {bulkMarkMutation.isPending ? 'Saving...' : 'Save Changes Now'}
                        </Button>
                    </Card.Footer>
                )}
            </Card>
        </div>
    );
};

export default DailyAttendanceRegister;
