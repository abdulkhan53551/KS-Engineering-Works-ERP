import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Spinner, Dropdown, Nav } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import {
    Calendar,
    Save,
    Clock,
    Users,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Download,
    Edit3
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
    useEmployees,
    useAttendance,
    useBulkMarkAttendance,
    useMarkDateStatus,
    useAttendanceSummary
} from '../hooks/useEmployeeApi';
import DailyAttendanceRegister from '../components/DailyAttendanceRegister';
import AttendanceHoursModal from '../components/AttendanceHoursModal';
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
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    // View mode: 'daily' (Shop Floor Muster with Hours/OT) or 'monthly' (Calendar Matrix Grid)
    const [activeView, setActiveView] = useState('daily');

    // Month & Year for Monthly Grid
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    // Grid local state: { [employeeId_day]: { status, totalHours, overtimeHours, overtimeType, checkIn, checkOut, remarks } }
    const [matrix, setMatrix] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Modal state for editing a specific day's hours
    const [modalState, setModalState] = useState({
        show: false,
        employee: null,
        date: null,
        data: null
    });

    // Timer ref to distinguish single-click vs double-click
    const clickTimerRef = useRef(null);

    // Clean up timer on unmount
    useEffect(() => {
        return () => {
            if (clickTimerRef.current) {
                clearTimeout(clickTimerRef.current);
            }
        };
    }, []);

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

    // Fetch monthly attendance from backend
    const { data: attendanceLogsRaw, isLoading: loadingAttendance, refetch: refetchAttendance } = useAttendance({
        firmId,
        month: currentMonth,
        year: currentYear
    });
    const attendanceLogs = useMemo(() => {
        if (Array.isArray(attendanceLogsRaw)) return attendanceLogsRaw;
        if (Array.isArray(attendanceLogsRaw?.data)) return attendanceLogsRaw.data;
        return [];
    }, [attendanceLogsRaw]);

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
                    totalHours: rec.totalHours !== undefined && rec.totalHours !== null ? parseFloat(rec.totalHours) : null,
                    overtimeHours: parseFloat(rec.overtimeHours || 0),
                    overtimeType: rec.overtimeType || 'NORMAL',
                    checkIn: rec.checkIn,
                    checkOut: rec.checkOut,
                    remarks: rec.remarks
                };
            });
        }
        setMatrix(initialMatrix);
        setHasUnsavedChanges(false);
    }, [attendanceLogs]);

    // Executes status cycle after 250ms debounce confirms it was a single click
    const executeStatusToggle = (empId, day) => {
        const key = `${empId}_${day}`;
        const current = matrix[key] || {};
        const currentStatus = current.status || 'EMPTY';
        const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
        const nextStatus = currentIndex === -1 ? 'PRESENT' : STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];

        let totalHours = current.totalHours;
        let overtimeHours = current.overtimeHours;
        if (nextStatus === 'PRESENT' && (!totalHours || totalHours === 0)) {
            totalHours = 8.0;
            overtimeHours = 0.0;
        } else if (nextStatus === 'HALF_DAY') {
            totalHours = 4.0;
            overtimeHours = 0.0;
        } else if (nextStatus === 'ABSENT' || nextStatus === 'LEAVE' || nextStatus === 'WEEKLY_OFF' || nextStatus === 'HOLIDAY') {
            totalHours = 0.0;
            overtimeHours = 0.0;
        }

        setMatrix(prev => ({
            ...prev,
            [key]: {
                ...current,
                status: nextStatus,
                totalHours,
                overtimeHours
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Single-click handler: debounces with 250ms so a double-click cancels it
    const handleCellClick = (empId, day) => {
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
        }

        clickTimerRef.current = setTimeout(() => {
            executeStatusToggle(empId, day);
            clickTimerRef.current = null;
        }, 250);
    };

    // Double-click handler: immediately cancels the pending single click, ensuring status never changes!
    const handleCellDoubleClick = (e, emp, dateStr, day) => {
        e.preventDefault();
        e.stopPropagation();

        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
            clickTimerRef.current = null;
        }

        handleOpenHoursModal(emp, dateStr, day);
    };

    // Open detailed Hours modal for specific cell
    const handleOpenHoursModal = (emp, dateStr, day) => {
        const key = `${emp.id}_${day}`;
        const data = matrix[key] || {};
        setModalState({
            show: true,
            employee: emp,
            date: dateStr,
            data
        });
    };

    // Modal saved callback
    const handleModalSaved = (savedRecord) => {
        const day = new Date(savedRecord.attendanceDate).getDate();
        const key = `${savedRecord.employeeId}_${day}`;
        setMatrix(prev => ({
            ...prev,
            [key]: {
                status: savedRecord.status,
                checkIn: savedRecord.checkIn,
                checkOut: savedRecord.checkOut,
                totalHours: savedRecord.totalHours,
                overtimeHours: savedRecord.overtimeHours,
                overtimeType: savedRecord.overtimeType,
                remarks: savedRecord.remarks
            }
        }));
        refetchAttendance();
    };

    // Quick bulk mark a day column
    const handleMarkDay = (dayObj, status) => {
        const newEntries = {};
        employees.forEach(emp => {
            const key = `${emp.id}_${dayObj.day}`;
            const isPresent = status === 'PRESENT';
            newEntries[key] = {
                ...(matrix[key] || {}),
                status,
                totalHours: isPresent ? 8.0 : (status === 'HALF_DAY' ? 4.0 : 0.0),
                overtimeHours: 0.0
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
                    totalHours: val.totalHours !== undefined && val.totalHours !== null ? parseFloat(val.totalHours) : 0,
                    overtimeHours: val.overtimeHours || 0,
                    overtimeType: val.overtimeType || 'NORMAL',
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
            refetchAttendance();
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
                newEntries[key] = {
                    ...(matrix[key] || {}),
                    status,
                    totalHours: 0,
                    overtimeHours: 0
                };
            });
            setMatrix(prev => ({ ...prev, ...newEntries }));
            refetchAttendance();
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
            {/* Header with Navigation Switcher (Daily vs Monthly) */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Staff Attendance & Time Tracker</h4>
                    <span className="text-muted small">
                        Log worker check-in/out, hours worked (10h, 11h), and overtime calculations.
                    </span>
                </div>

                {/* Primary Mode Switcher Tab */}
                <Nav variant="pills" className="emp-form-tabs p-1 bg-white border rounded-3 shadow-sm d-inline-flex">
                    <Nav.Item>
                        <Nav.Link
                            active={activeView === 'daily'}
                            onClick={() => setActiveView('daily')}
                            className="d-flex align-items-center gap-2 cursor-pointer py-1 px-3"
                        >
                            <Clock size={16} /> Daily Time Register
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link
                            active={activeView === 'monthly'}
                            onClick={() => setActiveView('monthly')}
                            className="d-flex align-items-center gap-2 cursor-pointer py-1 px-3"
                        >
                            <Calendar size={16} /> Monthly Calendar Sheet
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </div>

            {/* TAB CONTENT 1: DAILY TIME & MUSTER REGISTER */}
            {activeView === 'daily' && (
                <DailyAttendanceRegister firmId={firmId} />
            )}

            {/* TAB CONTENT 2: MONTHLY CALENDAR MATRIX SHEET */}
            {activeView === 'monthly' && (
                <div>
                    {/* Controls Bar */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
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
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted small d-none d-md-inline">
                                💡 Double-click any cell or hover to edit exact hours & OT
                            </span>
                            <Button
                                variant={hasUnsavedChanges ? 'success' : 'primary'}
                                size="sm"
                                onClick={handleSave}
                                disabled={bulkMarkMutation.isPending || !hasUnsavedChanges}
                                className="d-flex align-items-center gap-1 shadow-sm px-3"
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
                                <div className="d-flex align-items-center gap-1 ms-2">
                                    <span className="att-cell-sub att-cell-sub-ot">+2h</span>
                                    <span>Overtime Badge</span>
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
                                                            Mark All Present (8h)
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
                                        <th style={{ minWidth: '60px' }} title="Total Present Days">P</th>
                                        <th style={{ minWidth: '60px' }} title="Total Absent Days">A</th>
                                        <th style={{ minWidth: '60px' }} title="Total Half Days">½</th>
                                        <th style={{ minWidth: '70px' }} title="Total Overtime Hours">OT (h)</th>
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
                                            let totalOT = 0;

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
                                                                &bull; {emp.department || 'Staff'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {daysArray.map(d => {
                                                        const key = `${emp.id}_${d.day}`;
                                                        const val = matrix[key];
                                                        const status = val?.status;
                                                        const ot = parseFloat(val?.overtimeHours || 0);
                                                        const th = parseFloat(val?.totalHours || 0);

                                                        if (status === 'PRESENT') pCount++;
                                                        else if (status === 'ABSENT') aCount++;
                                                        else if (status === 'HALF_DAY') hdCount++;

                                                        if (ot > 0) totalOT += ot;

                                                        const badgeInfo = STATUS_LABELS[status];

                                                        return (
                                                            <td
                                                                key={d.day}
                                                                className={`${d.isSunday ? 'col-weekend' : ''} att-td-cell`}
                                                                onClick={() => handleCellClick(emp.id, d.day)}
                                                                onDoubleClick={(e) => handleCellDoubleClick(e, emp, d.dateStr, d.day)}
                                                                title={`${badgeInfo?.label || 'Not marked'} ${th > 0 ? `(${th} hrs)` : ''} ${ot > 0 ? `• +${ot}h Overtime` : ''}\nClick: toggle status • Double-click: edit hours • Click ✎: edit`}
                                                            >
                                                                <div className="att-cell-container position-relative">
                                                                    {/* Quick edit icon button visible on hover */}
                                                                    <button
                                                                        type="button"
                                                                        className="att-cell-edit-btn"
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            if (clickTimerRef.current) {
                                                                                clearTimeout(clickTimerRef.current);
                                                                                clickTimerRef.current = null;
                                                                            }
                                                                            handleOpenHoursModal(emp, d.dateStr, d.day);
                                                                        }}
                                                                        title="Edit daily hours and overtime"
                                                                    >
                                                                        <Edit3 size={10} />
                                                                    </button>

                                                                    {badgeInfo ? (
                                                                        <span className={`att-cell ${badgeInfo.class}`}>
                                                                            {badgeInfo.short}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="att-cell att-empty">
                                                                            -
                                                                        </span>
                                                                    )}

                                                                    {/* Overtime or custom hours badge under status */}
                                                                    {ot > 0 ? (
                                                                        <span
                                                                            className="att-cell-sub att-cell-sub-ot"
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (clickTimerRef.current) {
                                                                                    clearTimeout(clickTimerRef.current);
                                                                                    clickTimerRef.current = null;
                                                                                }
                                                                                handleOpenHoursModal(emp, d.dateStr, d.day);
                                                                            }}
                                                                            title="Click to view/edit overtime"
                                                                        >
                                                                            +{ot}h
                                                                        </span>
                                                                    ) : (th > 0 && th !== 8 ? (
                                                                        <span
                                                                            className={`att-cell-sub ${th <= 4 ? 'att-cell-sub-hd' : 'att-cell-sub-hours'}`}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                if (clickTimerRef.current) {
                                                                                    clearTimeout(clickTimerRef.current);
                                                                                    clickTimerRef.current = null;
                                                                                }
                                                                                handleOpenHoursModal(emp, d.dateStr, d.day);
                                                                            }}
                                                                        >
                                                                            {th}h
                                                                        </span>
                                                                    ) : null)}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}

                                                    <td className="fw-bold text-success">{pCount}</td>
                                                    <td className="fw-bold text-danger">{aCount}</td>
                                                    <td className="fw-bold text-warning">{hdCount}</td>
                                                    <td className="fw-bold text-primary font-monospace">
                                                        {totalOT > 0 ? `${totalOT}h` : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Hours & Overtime Edit Modal (triggered on double click from Monthly Grid) */}
            <AttendanceHoursModal
                show={modalState.show}
                onHide={() => setModalState({ show: false, employee: null, date: null, data: null })}
                employee={modalState.employee}
                date={modalState.date}
                initialData={modalState.data}
                onSaved={handleModalSaved}
            />
        </div>
    );
};

export default AttendanceSheet;
