import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { Calendar, Download, Users, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAttendanceSummary } from '../hooks/useEmployeeApi';
import '../employee.css';

const AttendanceSummary = () => {
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());

    const { data: result, isLoading } = useAttendanceSummary({
        firmId,
        month,
        year
    });

    const summaryData = result?.summary ? result : (result?.data || {});
    const summary = summaryData?.summary || {};
    const breakdown = Array.isArray(summaryData?.employeeBreakdown)
        ? summaryData.employeeBreakdown
        : (Array.isArray(summaryData?.data?.employeeBreakdown)
            ? summaryData.data.employeeBreakdown
            : []);

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const handleExportCSV = () => {
        if (breakdown.length === 0) return;

        const headers = ['Emp Code', 'Name', 'Department', 'Type', 'Present', 'Absent', 'Half Days', 'Leaves', 'Holidays', 'Weekly Off', 'OT Hours', 'Effective Days'];
        const rows = breakdown.map(e => [
            e.empCode,
            `"${e.name}"`,
            `"${e.department}"`,
            e.employmentType,
            e.presentDays,
            e.absentDays,
            e.halfDays,
            e.leaveDays,
            e.holidayDays,
            e.weeklyOffDays,
            e.overtimeHours,
            e.effectiveWorkingDays
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Attendance_Report_${month}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="container-fluid p-3">
            {/* Header & Month Selector */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Attendance Summary & Analytics</h4>
                    <span className="text-muted small">
                        Monthly aggregation of staff attendance, overtime hours, and effective working days.
                    </span>
                </div>

                <div className="d-flex align-items-center gap-2">
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
                        variant="outline-secondary"
                        size="sm"
                        onClick={handleExportCSV}
                        disabled={breakdown.length === 0}
                        className="d-flex align-items-center gap-1 shadow-sm"
                    >
                        <Download size={15} /> Export CSV
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <Row className="g-3 mb-4">
                <Col xl={2} sm={4} xs={6}>
                    <div className="emp-kpi-card p-3 text-center">
                        <div className="text-muted small fw-semibold">Staff Count</div>
                        <h4 className="fw-bold mb-0 text-dark">{summaryData.employeeCount || 0}</h4>
                    </div>
                </Col>
                <Col xl={2} sm={4} xs={6}>
                    <div className="emp-kpi-card kpi-success p-3 text-center">
                        <div className="text-muted small fw-semibold">Total Present</div>
                        <h4 className="fw-bold mb-0 text-success">{summary.totalPresent || 0}</h4>
                    </div>
                </Col>
                <Col xl={2} sm={4} xs={6}>
                    <div className="emp-kpi-card kpi-danger p-3 text-center">
                        <div className="text-muted small fw-semibold">Total Absent</div>
                        <h4 className="fw-bold mb-0 text-danger">{summary.totalAbsent || 0}</h4>
                    </div>
                </Col>
                <Col xl={2} sm={4} xs={6}>
                    <div className="emp-kpi-card kpi-warning p-3 text-center">
                        <div className="text-muted small fw-semibold">Half Days</div>
                        <h4 className="fw-bold mb-0 text-warning">{summary.totalHalfDays || 0}</h4>
                    </div>
                </Col>
                <Col xl={2} sm={4} xs={6}>
                    <div className="emp-kpi-card kpi-purple p-3 text-center">
                        <div className="text-muted small fw-semibold">Leaves Taken</div>
                        <h4 className="fw-bold mb-0 text-purple" style={{ color: '#7c3aed' }}>{summary.totalLeaves || 0}</h4>
                    </div>
                </Col>
                <Col xl={2} sm={4} xs={6}>
                    <div className="emp-kpi-card p-3 text-center">
                        <div className="text-muted small fw-semibold">Overtime Hours</div>
                        <h4 className="fw-bold mb-0 text-primary">{summary.totalOTHours || 0} hrs</h4>
                    </div>
                </Col>
            </Row>

            {/* Employee Breakdown Table */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Header className="bg-white border-0 py-3">
                    <h6 className="fw-bold mb-0 text-primary">Monthly Breakdown by Employee</h6>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th>Type</th>
                                    <th className="text-center text-success">Present (P)</th>
                                    <th className="text-center text-danger">Absent (A)</th>
                                    <th className="text-center text-warning">Half Day (½)</th>
                                    <th className="text-center text-primary">Leave (L)</th>
                                    <th className="text-center">Holiday (H)</th>
                                    <th className="text-center">Weekly Off (WO)</th>
                                    <th className="text-center">Overtime</th>
                                    <th className="text-end fw-bold">Effective Days</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="11" className="text-center py-4 text-muted">
                                            <Spinner size="sm" className="me-2" /> Loading monthly summary...
                                        </td>
                                    </tr>
                                ) : breakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="text-center py-4 text-muted">
                                            No attendance logs recorded for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    breakdown.map(emp => (
                                        <tr key={emp.employeeId}>
                                            <td>
                                                <div className="fw-semibold text-dark">{emp.name}</div>
                                                <span className="text-primary font-monospace small">{emp.empCode}</span>
                                            </td>
                                            <td>{emp.department}</td>
                                            <td>
                                                <span className="badge badge-permanent" style={{ fontSize: '0.72rem' }}>
                                                    {emp.employmentType}
                                                </span>
                                            </td>
                                            <td className="text-center fw-bold text-success">{emp.presentDays}</td>
                                            <td className="text-center fw-bold text-danger">{emp.absentDays}</td>
                                            <td className="text-center fw-bold text-warning">{emp.halfDays}</td>
                                            <td className="text-center fw-bold text-primary">{emp.leaveDays}</td>
                                            <td className="text-center">{emp.holidayDays}</td>
                                            <td className="text-center text-muted">{emp.weeklyOffDays}</td>
                                            <td className="text-center">
                                                {emp.overtimeHours > 0 ? (
                                                    <span className="ot-pill">+{emp.overtimeHours} hrs</span>
                                                ) : '—'}
                                            </td>
                                            <td className="text-end fw-bold text-dark fs-6">
                                                {emp.effectiveWorkingDays}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default AttendanceSummary;
