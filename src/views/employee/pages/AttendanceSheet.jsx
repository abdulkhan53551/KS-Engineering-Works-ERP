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
    Edit3,
    CalendarCheck,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import moment from 'moment';
import {
    useEmployees,
    useAttendance,
    useBulkMarkAttendance,
    useMarkDateStatus,
    useAttendanceSummary
} from '../hooks/useEmployeeApi';
import DailyAttendanceRegister from '../components/DailyAttendanceRegister';
import AttendanceHoursModal from '../components/AttendanceHoursModal';
import ExportMusterModal from '../components/ExportMusterModal';
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

// Safely extract day of month (1-31) from date string (YYYY-MM-DD or ISO string)
const extractDay = (val) => {
    if (!val) return null;
    if (typeof val === 'string' && val.length === 10 && val.includes('-')) {
        const d = parseInt(val.split('-')[2], 10);
        if (!isNaN(d)) return d;
    }
    return moment(val).date();
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
    const [dirtyRecords, setDirtyRecords] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

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

    // Fetch monthly attendance from backend (only when monthly tab is active)
    const { data: attendanceLogsRaw, isLoading: loadingAttendance } = useAttendance({
        firmId,
        month: currentMonth,
        year: currentYear
    }, {
        enabled: activeView === 'monthly'
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
        return moment([currentYear, currentMonth - 1]).daysInMonth();
    }, [currentYear, currentMonth]);

    const daysArray = useMemo(() => {
        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const m = moment([currentYear, currentMonth - 1, d]);
            const dayOfWeek = m.format('dd')[0]; // Narrow single letter e.g. 'M', 'T', 'W'...
            const isSunday = m.day() === 0;
            const dateStr = m.format('YYYY-MM-DD');
            days.push({ day: d, dayOfWeek, isSunday, dateStr });
        }
        return days;
    }, [daysInMonth, currentMonth, currentYear]);

    // Populate matrix from backend attendance records
    useEffect(() => {
        const initialMatrix = {};
        if (Array.isArray(attendanceLogs)) {
            attendanceLogs.forEach(rec => {
                if (!rec.attendanceDate) return;
                const day = extractDay(rec.attendanceDate);
                if (!day) return;
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
        setDirtyRecords({});
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

        const dateStr = moment([currentYear, currentMonth - 1, day]).format('YYYY-MM-DD');

        setMatrix(prev => ({
            ...prev,
            [key]: {
                ...current,
                status: nextStatus,
                totalHours,
                overtimeHours
            }
        }));

        setDirtyRecords(prev => ({
            ...prev,
            [key]: {
                employeeId: parseInt(empId, 10),
                attendanceDate: dateStr,
                status: nextStatus,
                totalHours: totalHours !== undefined && totalHours !== null ? parseFloat(totalHours) : 0,
                overtimeHours: overtimeHours !== undefined && overtimeHours !== null ? parseFloat(overtimeHours) : 0,
                overtimeType: current.overtimeType || 'NORMAL',
                checkIn: current.checkIn || null,
                checkOut: current.checkOut || null,
                remarks: current.remarks || null
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
        const day = extractDay(savedRecord.attendanceDate);
        if (!day) return;
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
        // Remove from dirtyRecords since it was already saved directly by modal
        setDirtyRecords(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    // Quick bulk mark a day column
    const handleMarkDay = (dayObj, status) => {
        const newEntries = {};
        const newDirty = {};
        const isPresent = status === 'PRESENT';
        const totalHours = isPresent ? 8.0 : (status === 'HALF_DAY' ? 4.0 : 0.0);

        employees.forEach(emp => {
            const key = `${emp.id}_${dayObj.day}`;
            const current = matrix[key] || {};
            newEntries[key] = {
                ...current,
                status,
                totalHours,
                overtimeHours: 0.0
            };
            newDirty[key] = {
                employeeId: emp.id,
                attendanceDate: dayObj.dateStr,
                status,
                totalHours,
                overtimeHours: 0.0,
                overtimeType: 'NORMAL',
                checkIn: null,
                checkOut: null,
                remarks: null
            };
        });

        setMatrix(prev => ({ ...prev, ...newEntries }));
        setDirtyRecords(prev => ({ ...prev, ...newDirty }));
        setHasUnsavedChanges(true);
    };

    // Save changes to backend in a single atomic API call
    const handleSave = async () => {
        const recordsToSave = Object.values(dirtyRecords);
        if (recordsToSave.length === 0) {
            toast.info("No changes to save.");
            setHasUnsavedChanges(false);
            return;
        }

        try {
            await bulkMarkMutation.mutateAsync({
                firmId,
                records: recordsToSave
            });

            toast.success(`Saved ${recordsToSave.length} attendance record${recordsToSave.length > 1 ? 's' : ''} successfully.`);
            setDirtyRecords({});
            setHasUnsavedChanges(false);
        } catch (err) {
            // Error notification is handled by the mutation hook
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
            const day = extractDay(dateStr);
            if (!day) return;
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
            // Remove affected day's records from dirtyRecords since they're already persisted
            setDirtyRecords(prev => {
                const next = { ...prev };
                employees.forEach(emp => {
                    delete next[`${emp.id}_${day}`];
                });
                return next;
            });
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

    const monthName = moment([currentYear, currentMonth - 1]).format('MMMM YYYY');

    return (
        <div className="container-fluid p-3">
            {/* Header Hero Card with Segmented Switcher (Daily vs Monthly) */}
            <Card className="attendance-hero-card border-0 shadow-sm rounded-4 mb-3">
                <Card.Body className="p-3 p-md-4">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <div className="header-icon-box">
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="fw-bold mb-0 text-dark">Staff Attendance & Time Tracker</h4>
                                    <Badge bg="primary-subtle" className="text-primary border border-primary-subtle rounded-pill px-2 py-1 small fw-semibold">
                                        Live Muster
                                    </Badge>
                                </div>
                                <p className="text-muted small mb-0">
                                    Log worker check-in/out, hours worked (10h, 11h), and overtime calculations.
                                </p>
                            </div>
                        </div>

                        {/* Segmented Mode Switcher */}
                        <div className="segmented-nav-control shadow-none">
                            <button
                                type="button"
                                className={`segmented-nav-btn ${activeView === 'daily' ? 'active' : ''}`}
                                onClick={() => setActiveView('daily')}
                            >
                                <Clock size={15} /> Daily Time Register
                            </button>
                            <button
                                type="button"
                                className={`segmented-nav-btn ${activeView === 'monthly' ? 'active' : ''}`}
                                onClick={() => setActiveView('monthly')}
                            >
                                <Calendar size={15} /> Monthly Calendar Sheet
                            </button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* TAB CONTENT 1: DAILY TIME & MUSTER REGISTER */}
            {activeView === 'daily' && (
                <DailyAttendanceRegister 
                    firmId={firmId} 
                    employees={employees} 
                    loadingEmployees={loadingEmployees} 
                />
            )}

            {/* TAB CONTENT 2: MONTHLY CALENDAR MATRIX SHEET */}
            {activeView === 'monthly' && (
                <div>
                    {/* Controls Bar */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                        <div className="d-flex align-items-center gap-2">
                            {/* Month Picker */}
                            <div className="d-flex align-items-center bg-white border rounded-pill px-3 py-1 shadow-sm">
                                <Button variant="link" className="p-0 text-dark" onClick={handlePrevMonth} title="Previous Month">
                                    <ChevronLeft size={18} />
                                </Button>
                                <span className="mx-3 fw-bold text-primary">{monthName}</span>
                                <Button variant="link" className="p-0 text-dark" onClick={handleNextMonth} title="Next Month">
                                    <ChevronRight size={18} />
                                </Button>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <span className="text-muted small d-none d-md-inline">
                                💡 Double-click any cell or hover to edit exact hours & OT
                            </span>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => setShowExportModal(true)}
                                className="rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-sm"
                            >
                                <Download size={15} /> Export Muster Roll
                            </Button>
                            <Button
                                variant={hasUnsavedChanges ? 'success' : 'light'}
                                size="sm"
                                onClick={handleSave}
                                disabled={bulkMarkMutation.isPending || !hasUnsavedChanges}
                                className={`rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-sm ${
                                    hasUnsavedChanges ? 'btn-save-pulse' : 'text-muted border'
                                }`}
                            >
                                {bulkMarkMutation.isPending ? (
                                    <>
                                        <Spinner size="sm" animation="border" className="me-1" />
                                        Saving...
                                    </>
                                ) : hasUnsavedChanges ? (
                                    <>
                                        <Save size={15} />
                                        Save Changes *
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={15} className="text-success" />
                                        All Saved
                                    </>
                                )}
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

            {/* Attendance Muster Export Modal */}
            <ExportMusterModal
                show={showExportModal}
                onHide={() => setShowExportModal(false)}
                month={currentMonth}
                year={currentYear}
                firmId={firmId}
                previewEmployees={employees}
            />
        </div>
    );
};

export default AttendanceSheet;
