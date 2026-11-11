import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Form, Badge, Dropdown, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Users,
    CheckCircle,
    Clock,
    AlertCircle,
    Plus,
    Filter,
    List,
    LayoutGrid
} from 'lucide-react';
import { useLeaves, useEmployees } from '../../common/hooks/useEmployeeApi';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LeaveCalendar = ({ firmId, onApplyLeave, onReviewLeave }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [calendarMode, setCalendarMode] = useState('timeline'); // 'timeline' or 'grid'

    // Filters
    const [deptFilter, setDeptFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    // Calculate dates for current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const monthStartDay = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 (Sun) - 6 (Sat)

    // Calculate range for query
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    // Fetch leaves for this month
    const { data: leavesResult, isLoading: loadingLeaves } = useLeaves({
        firmId,
        startDate,
        endDate,
        pageSize: 500,
        status: statusFilter || undefined,
        leaveType: typeFilter || undefined
    });

    // Fetch active employees
    const { data: empResult, isLoading: loadingEmps } = useEmployees({
        firmId,
        pageSize: 500,
        status: 'ACTIVE'
    });

    const leaves = useMemo(() => {
        if (Array.isArray(leavesResult?.leaves)) return leavesResult.leaves;
        if (Array.isArray(leavesResult?.data?.leaves)) return leavesResult.data.leaves;
        if (Array.isArray(leavesResult)) return leavesResult;
        return [];
    }, [leavesResult]);

    const employees = useMemo(() => {
        const raw = Array.isArray(empResult?.employees)
            ? empResult.employees
            : (Array.isArray(empResult?.data?.employees) ? empResult.data.employees : []);
        if (!deptFilter) return raw;
        return raw.filter(e => e.department === deptFilter);
    }, [empResult, deptFilter]);

    // Unique departments
    const departments = useMemo(() => {
        const raw = Array.isArray(empResult?.employees)
            ? empResult.employees
            : (Array.isArray(empResult?.data?.employees) ? empResult.data.employees : []);
        return Array.from(new Set(raw.map(e => e.department).filter(Boolean))).sort();
    }, [empResult]);

    // Navigate months
    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const handleToday = () => {
        setCurrentMonth(today.getMonth() + 1);
        setCurrentYear(today.getFullYear());
    };

    // Calculate month stats
    const stats = useMemo(() => {
        let totalDays = 0;
        let approvedCount = 0;
        let pendingCount = 0;
        let activeTodayCount = 0;

        const todayStr = today.toISOString().split('T')[0];

        leaves.forEach(l => {
            totalDays += Number(l.totalDays || 1);
            if (l.status === 'APPROVED') approvedCount++;
            if (l.status === 'PENDING') pendingCount++;

            const fDate = l.fromDate?.split('T')[0] || l.fromDate;
            const tDate = l.toDate?.split('T')[0] || l.toDate;
            if (todayStr >= fDate && todayStr <= tDate && l.status === 'APPROVED') {
                activeTodayCount++;
            }
        });

        return {
            totalDays,
            approvedCount,
            pendingCount,
            activeTodayCount
        };
    }, [leaves, today]);

    // Helper: check if employee has leave on day (day = 1..daysInMonth)
    const getLeaveForEmployeeOnDay = (empId, day) => {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return leaves.find(l => {
            if (Number(l.employeeId) !== Number(empId)) return false;
            const fDate = l.fromDate?.split('T')[0] || l.fromDate;
            const tDate = l.toDate?.split('T')[0] || l.toDate;
            return dateStr >= fDate && dateStr <= tDate;
        });
    };

    // Helper: get all leaves on a specific day
    const getLeavesOnDate = (day) => {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return leaves.filter(l => {
            const fDate = l.fromDate?.split('T')[0] || l.fromDate;
            const tDate = l.toDate?.split('T')[0] || l.toDate;
            return dateStr >= fDate && dateStr <= tDate;
        });
    };

    const isToday = (day) => {
        return today.getFullYear() === currentYear &&
            (today.getMonth() + 1) === currentMonth &&
            today.getDate() === day;
    };

    const isWeekend = (day) => {
        const dow = new Date(currentYear, currentMonth - 1, day).getDay();
        return dow === 0; // Sunday
    };

    return (
        <div className="leave-calendar-wrapper">
            {/* Header Control Bar */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                {/* Month Navigator */}
                <div className="d-flex align-items-center gap-2">
                    <div className="btn-group shadow-sm">
                        <Button variant="outline-secondary" size="sm" onClick={handlePrevMonth} title="Previous Month">
                            <ChevronLeft size={16} />
                        </Button>
                        <Button variant="light" size="sm" className="fw-bold px-3 text-dark border-secondary border-opacity-25">
                            {MONTH_NAMES[currentMonth - 1]} {currentYear}
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={handleNextMonth} title="Next Month">
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                    <Button variant="outline-primary" size="sm" onClick={handleToday}>
                        Today
                    </Button>
                </div>

                {/* Filters & View Switcher */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    {departments.length > 0 && (
                        <Form.Select
                            size="sm"
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            style={{ width: '150px' }}
                        >
                            <option value="">All Departments</option>
                            {departments.map((d, i) => (
                                <option key={i} value={d}>{d}</option>
                            ))}
                        </Form.Select>
                    )}

                    <Form.Select
                        size="sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: '130px' }}
                    >
                        <option value="">All Statuses</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING">Pending</option>
                        <option value="REJECTED">Rejected</option>
                    </Form.Select>

                    <div className="btn-group shadow-sm">
                        <Button
                            variant={calendarMode === 'timeline' ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setCalendarMode('timeline')}
                            title="Employee Timeline Matrix"
                        >
                            <List size={15} className="me-1" /> Timeline
                        </Button>
                        <Button
                            variant={calendarMode === 'grid' ? 'primary' : 'outline-secondary'}
                            size="sm"
                            onClick={() => setCalendarMode('grid')}
                            title="Monthly Calendar Grid"
                        >
                            <LayoutGrid size={15} className="me-1" /> Monthly
                        </Button>
                    </div>

                    <Button variant="primary" size="sm" onClick={onApplyLeave}>
                        <Plus size={15} className="me-1" /> Apply
                    </Button>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <Row className="g-3 mb-4">
                <Col xl={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center">
                                <CalendarIcon size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Total Leave Days</div>
                                <h4 className="fw-bold mb-0 text-dark">{stats.totalDays}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 bg-success-subtle text-success p-2 d-flex align-items-center justify-content-center">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Approved Leaves</div>
                                <h4 className="fw-bold mb-0 text-success">{stats.approvedCount}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 bg-warning-subtle text-warning-emphasis p-2 d-flex align-items-center justify-content-center">
                                <Clock size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Pending Review</div>
                                <h4 className="fw-bold mb-0 text-warning-emphasis">{stats.pendingCount}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xl={3} sm={6}>
                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div className="rounded-3 bg-danger-subtle text-danger p-2 d-flex align-items-center justify-content-center">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">On Leave Today</div>
                                <h4 className="fw-bold mb-0 text-danger">{stats.activeTodayCount}</h4>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* View Mode 1: Employee Timeline Matrix */}
            {calendarMode === 'timeline' && (
                <Card className="border-0 shadow-sm rounded-3">
                    <Card.Body className="p-0">
                        <div className="leave-cal-container">
                            <table className="leave-cal-table">
                                <thead>
                                    <tr>
                                        <th className="leave-cal-th-emp p-2">Employee</th>
                                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                                            const day = idx + 1;
                                            const dow = new Date(currentYear, currentMonth - 1, day).getDay();
                                            const todayClass = isToday(day) ? 'leave-cal-today' : '';
                                            const weekendClass = isWeekend(day) ? 'leave-cal-weekend' : '';

                                            return (
                                                <th
                                                    key={day}
                                                    className={`leave-cal-day-col ${todayClass} ${weekendClass}`}
                                                >
                                                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                                        {WEEKDAY_NAMES[dow]}
                                                    </div>
                                                    <div className="fw-bold">{day}</div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingEmps || loadingLeaves ? (
                                        <tr>
                                            <td colSpan={daysInMonth + 1} className="text-center py-5 text-muted">
                                                <div className="spinner-border spinner-border-sm me-2 text-primary" />
                                                Loading calendar leaves...
                                            </td>
                                        </tr>
                                    ) : employees.length === 0 ? (
                                        <tr>
                                            <td colSpan={daysInMonth + 1} className="text-center py-5 text-muted">
                                                No active employees found.
                                            </td>
                                        </tr>
                                    ) : (
                                        employees.map(emp => (
                                            <tr key={emp.id} className="border-bottom">
                                                <td className="leave-cal-td-emp p-2">
                                                    <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '160px' }}>
                                                        {emp.firstName} {emp.lastName || ''}
                                                    </div>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="text-primary font-monospace small" style={{ fontSize: '0.72rem' }}>
                                                            {emp.empCode}
                                                        </span>
                                                        {emp.department && (
                                                            <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                                                                • {emp.department}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {Array.from({ length: daysInMonth }).map((_, idx) => {
                                                    const day = idx + 1;
                                                    const leave = getLeaveForEmployeeOnDay(emp.id, day);
                                                    const weekend = isWeekend(day);
                                                    const isTodayCell = isToday(day);

                                                    let cellBg = weekend ? '#f8fafc' : (isTodayCell ? '#f0f9ff' : '#ffffff');

                                                    return (
                                                        <td
                                                            key={day}
                                                            className="text-center p-1"
                                                            style={{
                                                                backgroundColor: cellBg,
                                                                borderRight: '1px solid #f1f5f9',
                                                                height: '42px',
                                                                verticalAlign: 'middle'
                                                            }}
                                                        >
                                                            {leave && (
                                                                <OverlayTrigger
                                                                    placement="top"
                                                                    overlay={
                                                                        <Tooltip id={`tooltip-${emp.id}-${day}`}>
                                                                            <strong>{emp.firstName} — {leave.leaveType}</strong><br />
                                                                            Status: {leave.status}<br />
                                                                            Dates: {new Date(leave.fromDate).toLocaleDateString()} to {new Date(leave.toDate).toLocaleDateString()}<br />
                                                                            Reason: {leave.reason || 'Not specified'}
                                                                        </Tooltip>
                                                                    }
                                                                >
                                                                    <div
                                                                        className={`leave-bar ${
                                                                            leave.status === 'APPROVED'
                                                                                ? 'leave-bar-approved'
                                                                                : (leave.status === 'PENDING' ? 'leave-bar-pending' : 'leave-bar-rejected')
                                                                        }`}
                                                                        onClick={() => onReviewLeave && onReviewLeave(leave)}
                                                                    >
                                                                        {leave.leaveType?.substring(0, 2)}
                                                                        {leave.halfDayOn ? ' ½' : ''}
                                                                    </div>
                                                                </OverlayTrigger>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* View Mode 2: Traditional 7-Day Calendar Grid */}
            {calendarMode === 'grid' && (
                <Card className="border-0 shadow-sm rounded-3">
                    <Card.Body className="p-3">
                        <div className="table-responsive">
                            <Table bordered className="mb-0" style={{ tableLayout: 'fixed' }}>
                                <thead>
                                    <tr className="table-light text-center">
                                        {WEEKDAY_NAMES.map(d => (
                                            <th key={d} style={{ width: '14.28%', fontSize: '0.85rem' }}>{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const rows = [];
                                        let currentDay = 1 - monthStartDay;

                                        while (currentDay <= daysInMonth) {
                                            const week = [];
                                            for (let i = 0; i < 7; i++) {
                                                const dayNumber = currentDay;
                                                const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
                                                const dayLeaves = isValidDay ? getLeavesOnDate(dayNumber) : [];
                                                const isTodayTile = isValidDay && isToday(dayNumber);

                                                week.push(
                                                    <td
                                                        key={i}
                                                        className={`leave-grid-cell ${isTodayTile ? 'leave-cal-today' : ''} ${!isValidDay ? 'bg-light bg-opacity-50' : ''}`}
                                                    >
                                                        {isValidDay && (
                                                            <div>
                                                                <div className="d-flex justify-content-between align-items-center mb-1">
                                                                    <span className={`fw-bold small ${isTodayTile ? 'text-primary' : 'text-dark'}`}>
                                                                        {dayNumber}
                                                                    </span>
                                                                    {dayLeaves.length > 0 && (
                                                                        <Badge bg="primary-subtle" className="text-primary" style={{ fontSize: '0.65rem' }}>
                                                                            {dayLeaves.length} on leave
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                <div className="d-flex flex-column gap-1" style={{ maxHeight: '90px', overflowY: 'auto' }}>
                                                                    {dayLeaves.map(l => (
                                                                        <div
                                                                            key={l.id}
                                                                            className={`leave-chip ${
                                                                                l.status === 'APPROVED'
                                                                                    ? 'leave-bar-approved'
                                                                                    : (l.status === 'PENDING' ? 'leave-bar-pending' : 'leave-bar-rejected')
                                                                            }`}
                                                                            onClick={() => onReviewLeave && onReviewLeave(l)}
                                                                            title={`${l.firstName}: ${l.leaveType} (${l.status})`}
                                                                        >
                                                                            <strong>{l.firstName}</strong> ({l.leaveType})
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                                currentDay++;
                                            }
                                            rows.push(<tr key={currentDay}>{week}</tr>);
                                        }

                                        return rows;
                                    })()}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default React.memo(LeaveCalendar);
