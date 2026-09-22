import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Spinner, Dropdown, Modal } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import {
    Calendar,
    Save,
    CheckCircle2,
    XCircle,
    Coffee,
    Clock,
    Users,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    useEmployees,
    useAttendance,
    useBulkMarkAttendance,
    useMarkDateStatus,
    useAttendanceSummary
} from '../hooks/useEmployeeApi';
import '../employee.css';

const STATUS_CYCLE = ['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'WEEKLY_OFF', 'HOLIDAY'];

const STATUS_LABELS = {
    PRESENT: { short: 'P', class: 'att-P', label: 'Present' },
    ABSENT: { short: 'A', class: 'att-A', label: 'Absent' },
    HALF_DAY: { short: '½', class: 'att-HD', label: 'Half Day' },
    LEAVE: { short: 'L', class: 'att-L', label: 'Leave' },
    HOLIDAY: { short: 'H', class: 'att-H', label: 'Holiday' },
    WEEKLY_OFF: { short: 'WO', class: 'att-WO', label: 'Weekly Off' }
};

const AttendanceSheet = () => {
    const currentUser = useSelector((state) => state.authReducer?.user);
    const firmId = currentUser?.firmId;

    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    // Grid local state: { [employeeId_day]: { status, overtimeHours, checkIn, checkOut } }
    const [matrix, setMatrix] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Fetch active employees
    const { data: empResult, isLoading: loadingEmployees } = useEmployees({
        firmId,
        pageSize: 500,
        status: 'ACTIVE'
    });
    const employees = Array.isArray(empResult?.employees)
        ? empResult.employees
        : (Array.isArray(empResult?.data?.employees)
            ? empResult.data.employees
            : (Array.isArray(empResult) ? empResult : []));

    // Fetch monthly attendance from backend
    const { data: attendanceLogsRaw, isLoading: loadingAttendance } = useAttendance({
        firmId,
        month: currentMonth,
        year: currentYear
    });
    const attendanceLogs = Array.isArray(attendanceLogsRaw)
        ? attendanceLogsRaw
        : (Array.isArray(attendanceLogsRaw?.data)
            ? attendanceLogsRaw.data
            : []);

    // Monthly summary query
    const { data: summaryData } = useAttendanceSummary({
        firmId,
        month: currentMonth,
        year: currentYear
    });

    const bulkMarkMutation = useBulkMarkAttendance();
    const markDateStatusMutation = useMarkDateStatus();

    // Days in selected month
    const daysInMonth = useMemo(() => {
        return new Date(currentYear, currentMonth, 0).getDate();
    }, [currentYear, currentMonth]);

    const daysArray = useMemo(() => {
        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(currentYear, currentMonth - 1, d);
            const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
            const isSunday = dateObj.getDay() === 0;
            days.push({ day: d, dayOfWeek, isSunday, dateStr: dateObj.toISOString().split('T')[0] });
        }
        return days;
    }, [daysInMonth, currentMonth, currentYear]);

    // Populate matrix from backend attendance records
    useEffect(() => {
        const initialMatrix = {};
        if (Array.isArray(attendanceLogs)) {
            attendanceLogs.forEach(rec => {
                const day = new Date(rec.attendanceDate).getDate();
                const key = `${rec.employeeId}_${day}`;
                initialMatrix[key] = {
                    status: rec.status,
                    overtimeHours: parseFloat(rec.overtimeHours || 0),
                    checkIn: rec.checkIn,
                    checkOut: rec.checkOut,
                    remarks: rec.remarks
                };
            });
        }
        setMatrix(initialMatrix);
        setHasUnsavedChanges(false);
    }, [attendanceLogs]);

    // Toggle status on cell click
    const handleCellClick = (empId, day) => {
        const key = `${empId}_${day}`;
        const currentStatus = matrix[key]?.status || 'EMPTY';
        const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
        const nextStatus = currentIndex === -1 ? 'PRESENT' : STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

        setMatrix(prev => ({
            ...prev,
            [key]: {
                ...(prev[key] || {}),
                status: nextStatus
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Quick bulk mark a day column
    const handleMarkDay = (dayObj, status) => {
        const newEntries = {};
        employees.forEach(emp => {
            const key = `${emp.id}_${dayObj.day}`;
            newEntries[key] = {
                ...(matrix[key] || {}),
                status
            };
        });
        setMatrix(prev => ({ ...prev, ...newEntries }));
        setHasUnsavedChanges(true);
    };

    // Save changes to backend
    const handleSave = async () => {
        try {
            // Group changed entries by date
            const recordsByDate = {};

            Object.entries(matrix).forEach(([key, val]) => {
                const [empIdStr, dayStr] = key.split('_');
                const empId = parseInt(empIdStr, 10);
                const day = parseInt(dayStr, 10);
                const dateStr = new Date(currentYear, currentMonth - 1, day).toISOString().split('T')[0];

                if (!recordsByDate[dateStr]) {
                    recordsByDate[dateStr] = [];
                }

                recordsByDate[dateStr].push({
                    employeeId: empId,
                    status: val.status,
                    overtimeHours: val.overtimeHours || 0,
                    checkIn: val.checkIn || null,
                    checkOut: val.checkOut || null,
                    remarks: val.remarks || null
                });
            });

            // Save each date batch
            for (const [dateStr, records] of Object.entries(recordsByDate)) {
                if (records.length > 0) {
                    await bulkMarkMutation.mutateAsync({
                        firmId,
                        attendanceDate: dateStr,
                        records
                    });
                }
            }

            toast.success("All attendance records saved successfully.");
            setHasUnsavedChanges(false);
        } catch (err) {
            toast.error("Failed to save attendance.");
        }
    };

    // Quick actions: Mark entire day as Holiday or Weekly Off
    const handleApplyDateStatus = async (dateStr, status) => {
        try {
            await markDateStatusMutation.mutateAsync({
                firmId,
                attendanceDate: dateStr,
                status
            });
            // Update local matrix
            const day = new Date(dateStr).getDate();
            const newEntries = {};
            employees.forEach(emp => {
                const key = `${emp.id}_${day}`;
                newEntries[key] = { ...(matrix[key] || {}), status };
            });
            setMatrix(prev => ({ ...prev, ...newEntries }));
        } catch (err) {
            // Handled in hook
        }
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="container-fluid p-3">
            {/* Header & Controls */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Attendance Register</h4>
                    <span className="text-muted small">
                        Monthly attendance grid — click any cell to toggle (P → A → ½ → L → WO → H).
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* Month Picker */}
                    <div className="d-flex align-items-center bg-white border rounded px-2 py-1 shadow-sm">
                        <Button variant="link" className="p-0 text-dark" onClick={handlePrevMonth}>
                            <ChevronLeft size={18} />
                        </Button>
                        <span className="mx-3 fw-bold text-primary">{monthName}</span>
                        <Button variant="link" className="p-0 text-dark" onClick={handleNextMonth}>
                            <ChevronRight size={18} />
                        </Button>
                    </div>

                    <Button
                        variant={hasUnsavedChanges ? 'success' : 'primary'}
                        size="sm"
                        onClick={handleSave}
                        disabled={bulkMarkMutation.isPending || !hasUnsavedChanges}
                        className="d-flex align-items-center gap-1 shadow-sm"
                    >
                        <Save size={15} />
                        {bulkMarkMutation.isPending ? 'Saving...' : (hasUnsavedChanges ? 'Save Changes *' : 'Saved')}
                    </Button>
                </div>
            </div>

            {/* Quick Status Legend Bar */}
            <Card className="border-0 shadow-sm rounded-3 mb-3">
                <Card.Body className="py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex flex-wrap align-items-center gap-3 small">
                        <span className="fw-semibold text-dark">Legend:</span>
                        <div className="d-flex align-items-center gap-1">
                            <span className="att-cell att-P" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>P</span>
                            <span>Present</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="att-cell att-A" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>A</span>
                            <span>Absent</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="att-cell att-HD" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>½</span>
                            <span>Half Day</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="att-cell att-L" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>L</span>
                            <span>Leave</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="att-cell att-WO" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>WO</span>
                            <span>Weekly Off</span>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <span className="att-cell att-H" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>H</span>
                            <span>Holiday</span>
                        </div>
                    </div>

                    <div className="text-muted small">
                        Total Staff: <strong>{employees.length}</strong>
                    </div>
                </Card.Body>
            </Card>

            {/* Attendance Matrix Calendar Grid */}
            <div className="attendance-sheet-wrapper">
                {loadingEmployees || loadingAttendance ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-muted small">Loading attendance sheet...</div>
                    </div>
                ) : (
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th className="sticky-emp-col">Employee Details</th>
                                {daysArray.map(d => (
                                    <th
                                        key={d.day}
                                        className={`day-header-clickable ${d.isSunday ? 'col-weekend' : ''}`}
                                        title={`Day ${d.day} (${d.dayOfWeek}) - Click to bulk mark`}
                                    >
                                        <Dropdown>
                                            <Dropdown.Toggle as="span" className="cursor-pointer text-decoration-none text-dark fw-bold">
                                                <div>{d.day}</div>
                                                <div style={{ fontSize: '0.68rem', color: d.isSunday ? '#dc2626' : '#64748b' }}>
                                                    {d.dayOfWeek}
                                                </div>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu size="sm">
                                                <Dropdown.Header>Day {d.day} Actions</Dropdown.Header>
                                                <Dropdown.Item onClick={() => handleMarkDay(d, 'PRESENT')}>
                                                    Mark All Present (P)
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleMarkDay(d, 'ABSENT')}>
                                                    Mark All Absent (A)
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleApplyDateStatus(d.dateStr, 'WEEKLY_OFF')}>
                                                    Set Day as Weekly Off (WO)
                                                </Dropdown.Item>
                                                <Dropdown.Item onClick={() => handleApplyDateStatus(d.dateStr, 'HOLIDAY')}>
                                                    Set Day as Firm Holiday (H)
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </th>
                                ))}
                                <th style={{ minWidth: '70px' }}>P</th>
                                <th style={{ minWidth: '70px' }}>A</th>
                                <th style={{ minWidth: '70px' }}>½</th>
                                <th style={{ minWidth: '70px' }}>L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 5} className="text-center py-4 text-muted">
                                        No active employees found. Please add employees first.
                                    </td>
                                </tr>
                            ) : (
                                employees.map(emp => {
                                    let pCount = 0;
                                    let aCount = 0;
                                    let hdCount = 0;
                                    let lCount = 0;

                                    return (
                                        <tr key={emp.id}>
                                            <td className="sticky-emp-col">
                                                <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '180px' }}>
                                                    {emp.firstName} {emp.lastName || ''}
                                                </div>
                                                <div className="d-flex gap-1 align-items-center">
                                                    <span className="text-primary font-monospace" style={{ fontSize: '0.72rem' }}>
                                                        {emp.empCode}
                                                    </span>
                                                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                        • {emp.department || 'Staff'}
                                                    </span>
                                                </div>
                                            </td>

                                            {daysArray.map(d => {
                                                const key = `${emp.id}_${d.day}`;
                                                const val = matrix[key];
                                                const status = val?.status;

                                                if (status === 'PRESENT') pCount++;
                                                else if (status === 'ABSENT') aCount++;
                                                else if (status === 'HALF_DAY') hdCount++;
                                                else if (status === 'LEAVE') lCount++;

                                                const badgeInfo = STATUS_LABELS[status];

                                                return (
                                                    <td
                                                        key={d.day}
                                                        className={d.isSunday ? 'col-weekend' : ''}
                                                        onClick={() => handleCellClick(emp.id, d.day)}
                                                    >
                                                        {badgeInfo ? (
                                                            <span className={`att-cell ${badgeInfo.class}`} title={`${badgeInfo.label} (Click to change)`}>
                                                                {badgeInfo.short}
                                                            </span>
                                                        ) : (
                                                            <span className="att-cell att-empty" title="Not marked (Click to mark Present)">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            <td className="fw-bold text-success">{pCount}</td>
                                            <td className="fw-bold text-danger">{aCount}</td>
                                            <td className="fw-bold text-warning">{hdCount}</td>
                                            <td className="fw-bold text-primary">{lCount}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AttendanceSheet;
