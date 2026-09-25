import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge, Tab, Nav, Table, Spinner } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    ArrowLeft,
    Edit3,
    Clock,
    Calendar,
    DollarSign,
    User,
    CreditCard,
    Phone,
    Mail,
    MapPin,
    Plus
} from 'lucide-react';
import {
    useEmployee,
    useAttendance,
    useSalarySlips
} from '../hooks/useEmployeeApi';
import ShiftAssignModal from '../components/ShiftAssignModal';
import '../employee.css';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});

    const [activeTab, setActiveTab] = useState('profile');
    const [showShiftModal, setShowShiftModal] = useState(false);

    const { data: employeeRaw, isLoading: isFetchingEmployee } = useEmployee(id);
    const employee = employeeRaw?.id ? employeeRaw : (employeeRaw?.data || null);
    const firmId = employee?.firm_id || (activeFirm?.id !== 'all' ? activeFirm?.id : undefined);

    const { data: attendanceListRaw } = useAttendance({ employeeId: id });
    const attendanceList = Array.isArray(attendanceListRaw)
        ? attendanceListRaw
        : (Array.isArray(attendanceListRaw?.data)
            ? attendanceListRaw.data
            : []);

    const { data: salarySlipsResult } = useSalarySlips({ employeeId: id, pageSize: 12 });
    const salarySlips = Array.isArray(salarySlipsResult?.slips)
        ? salarySlipsResult.slips
        : (Array.isArray(salarySlipsResult?.data?.slips)
            ? salarySlipsResult.data.slips
            : (Array.isArray(salarySlipsResult) ? salarySlipsResult : []));

    if (isFetchingEmployee) {
        return (
            <div className="container-fluid p-4 text-center">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2 text-muted">Loading employee details...</div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="container-fluid p-4 text-center">
                <h4>Employee not found</h4>
                <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/employee')}>
                    Back to Employee Directory
                </Button>
            </div>
        );
    }

    return (
        <div className="container-fluid p-3">
            {/* Header / Profile Hero */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee')}>
                        <ArrowLeft size={16} />
                    </Button>
                    <h4 className="fw-bold mb-0">Employee Profile</h4>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="primary" size="sm" onClick={() => navigate(`/dashboard/employee/${id}/edit`)}>
                        <Edit3 size={15} className="me-1" /> Edit Profile
                    </Button>
                </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="border-0 shadow-sm rounded-3 mb-4 overflow-hidden">
                <div style={{ height: '80px', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />
                <Card.Body className="pt-0 px-4 pb-4">
                    <div className="d-flex flex-wrap align-items-end justify-content-between" style={{ marginTop: '-40px' }}>
                        <div className="d-flex align-items-end gap-3">
                            <div
                                className="rounded-circle border border-4 border-white shadow-sm d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, #1e293b, #334155)',
                                    fontSize: '1.75rem'
                                }}
                            >
                                {(employee.firstName || employee.first_name || '')?.charAt(0)}{(employee.lastName || employee.last_name || '')?.charAt(0) || ''}
                            </div>
                            <div>
                                <h4 className="fw-bold mb-0 text-dark">
                                    {employee.firstName || employee.first_name} {employee.lastName || employee.last_name || ''}
                                </h4>
                                <div className="text-muted small">
                                    <span className="fw-semibold text-primary font-monospace">{employee.empCode || employee.emp_code}</span>
                                    {employee.designation && ` • ${employee.designation}`}
                                    {employee.department && ` (${employee.department})`}
                                </div>
                            </div>
                        </div>

                        <div className="d-flex gap-2 mt-3 mt-md-0">
                            <span className="badge badge-permanent px-3 py-2 fs-7">{employee.employmentType || employee.employment_type}</span>
                            <span className="badge badge-active px-3 py-2 fs-7">{employee.status}</span>
                        </div>
                    </div>

                    <Row className="g-3 mt-3 pt-3 border-top text-muted small">
                        <Col md={3}>
                            <div className="d-flex align-items-center gap-2">
                                <Phone size={15} className="text-primary" />
                                <span>{employee.phone || 'No phone'}</span>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="d-flex align-items-center gap-2">
                                <Mail size={15} className="text-primary" />
                                <span>{employee.email || 'No email'}</span>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="d-flex align-items-center gap-2">
                                <MapPin size={15} className="text-primary" />
                                <span>{employee.cityName ? `${employee.cityName}, ${employee.stateName}` : (employee.address || 'No address')}</span>
                            </div>
                        </Col>
                        <Col md={3}>
                            <div className="d-flex align-items-center gap-2">
                                <DollarSign size={15} className="text-success" />
                                <span className="fw-bold text-dark">
                                    ₹{parseFloat(employee.baseSalary !== undefined ? employee.baseSalary : (employee.base_salary || 0)).toLocaleString('en-IN')} / {(employee.salaryType || employee.salary_type || '')?.toLowerCase()}
                                </span>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Profile Tabs */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-4">
                    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav variant="pills" className="emp-form-tabs mb-4 p-1 bg-light rounded-3 d-flex gap-2">
                            <Nav.Item>
                                <Nav.Link eventKey="profile" className="d-flex align-items-center gap-2">
                                    <User size={16} /> Personal & Bank Info
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="shifts" className="d-flex align-items-center gap-2">
                                    <Clock size={16} /> Shifts History
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="attendance" className="d-flex align-items-center gap-2">
                                    <Calendar size={16} /> Recent Attendance
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="payroll" className="d-flex align-items-center gap-2">
                                    <DollarSign size={16} /> Payslip History
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <Tab.Content>
                            {/* TAB 1: PROFILE & BANK DETAILS */}
                            <Tab.Pane eventKey="profile">
                                <Row className="g-4">
                                    <Col md={6}>
                                        <h6 className="fw-bold mb-3 text-primary border-bottom pb-2">Employment Information</h6>
                                        <Table borderless size="sm" className="mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="text-muted" style={{ width: '40%' }}>Date of Joining:</td>
                                                    <td className="fw-semibold">{(employee.dateOfJoining || employee.date_of_joining) ? new Date(employee.dateOfJoining || employee.date_of_joining).toLocaleDateString() : '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Employment Type:</td>
                                                    <td>{employee.employmentType || employee.employment_type}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Department:</td>
                                                    <td>{employee.department || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Designation:</td>
                                                    <td>{employee.designation || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Branch / Location:</td>
                                                    <td>{employee.branchName || 'Head Office'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Salary Template:</td>
                                                    <td>{employee.salaryTemplateName || 'Default Basic'}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>

                                    <Col md={6}>
                                        <h6 className="fw-bold mb-3 text-primary border-bottom pb-2">Bank & Statutory Details</h6>
                                        <Table borderless size="sm" className="mb-0">
                                            <tbody>
                                                <tr>
                                                    <td className="text-muted" style={{ width: '40%' }}>Bank Name:</td>
                                                    <td className="fw-semibold">{employee.bankName || employee.bank_name || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Account Number:</td>
                                                    <td className="font-monospace">{employee.accountNumber || employee.account_number || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">IFSC Code:</td>
                                                    <td className="font-monospace">{employee.ifscCode || employee.ifsc_code || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">PAN Number:</td>
                                                    <td className="font-monospace">{employee.panNumber || employee.pan_number || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">Aadhar Number:</td>
                                                    <td className="font-monospace">{employee.aadharNumber || employee.aadhar_number || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">PF UAN:</td>
                                                    <td className="font-monospace">{employee.uanNumber || employee.uan_number || '—'}</td>
                                                </tr>
                                                <tr>
                                                    <td className="text-muted">ESI Number:</td>
                                                    <td className="font-monospace">{employee.esiNumber || employee.esi_number || '—'}</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            </Tab.Pane>

                            {/* TAB 2: SHIFT ASSIGNMENTS */}
                            <Tab.Pane eventKey="shifts">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0 text-primary">Shift Assignments</h6>
                                    <Button variant="outline-primary" size="sm" onClick={() => setShowShiftModal(true)}>
                                        <Plus size={15} className="me-1" /> Re-assign Shift
                                    </Button>
                                </div>
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Shift Name</th>
                                                <th>Timings</th>
                                                <th>Break</th>
                                                <th>Effective From</th>
                                                <th>Effective To</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employee.shiftAssignments?.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-3 text-muted">
                                                        No shift assignments found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                employee.shiftAssignments?.map(s => (
                                                    <tr key={s.assignmentId}>
                                                        <td className="fw-semibold">{s.shiftName} ({s.shiftCode})</td>
                                                        <td>{s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}</td>
                                                        <td>{s.breakMinutes} mins</td>
                                                        <td>{s.effectiveFrom ? new Date(s.effectiveFrom).toLocaleDateString() : '—'}</td>
                                                        <td>{s.effectiveTo ? new Date(s.effectiveTo).toLocaleDateString() : 'Ongoing'}</td>
                                                        <td>
                                                            {s.isActive ? (
                                                                <Badge bg="success">Current Active</Badge>
                                                            ) : (
                                                                <Badge bg="light" text="dark">Past</Badge>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab.Pane>

                            {/* TAB 3: RECENT ATTENDANCE */}
                            <Tab.Pane eventKey="attendance">
                                <h6 className="fw-bold mb-3 text-primary">Recent Attendance Logs</h6>
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Check In</th>
                                                <th>Check Out</th>
                                                <th>Total Hours</th>
                                                <th>Overtime</th>
                                                <th>Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceList.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="text-center py-3 text-muted">
                                                        No attendance records logged yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                attendanceList.slice(0, 30).map(att => (
                                                    <tr key={att.id}>
                                                        <td className="fw-semibold">{new Date(att.attendanceDate).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`att-cell att-${att.status === 'HALF_DAY' ? 'HD' : (att.status === 'WEEKLY_OFF' ? 'WO' : att.status.charAt(0))}`} style={{ width: 'auto', padding: '2px 8px', height: 'auto' }}>
                                                                {att.status}
                                                            </span>
                                                        </td>
                                                        <td>{att.checkIn ? att.checkIn.substring(0, 5) : '—'}</td>
                                                        <td>{att.checkOut ? att.checkOut.substring(0, 5) : '—'}</td>
                                                        <td>{att.totalHours ? `${att.totalHours} hrs` : '—'}</td>
                                                        <td>
                                                            {parseFloat(att.overtimeHours || 0) > 0 ? (
                                                                <span className="ot-pill">+{att.overtimeHours} hrs OT</span>
                                                            ) : '—'}
                                                        </td>
                                                        <td className="text-muted small">{att.remarks || '—'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab.Pane>

                            {/* TAB 4: PAYSLIP HISTORY */}
                            <Tab.Pane eventKey="payroll">
                                <h6 className="fw-bold mb-3 text-primary">Generated Salary Slips</h6>
                                <div className="table-responsive">
                                    <Table hover className="align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Period</th>
                                                <th>Days Present</th>
                                                <th>Overtime Pay</th>
                                                <th>Gross Earnings</th>
                                                <th>Deductions</th>
                                                <th>Net Pay</th>
                                                <th>Status</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salarySlips.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center py-3 text-muted">
                                                        No salary slips generated yet for this employee.
                                                    </td>
                                                </tr>
                                            ) : (
                                                salarySlips.map(slip => (
                                                    <tr key={slip.id}>
                                                        <td className="fw-semibold">
                                                            {new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td>{slip.presentDays} / {slip.totalWorkingDays}</td>
                                                        <td>₹{parseFloat(slip.overtimePay || 0).toLocaleString('en-IN')}</td>
                                                        <td>₹{parseFloat(slip.grossEarnings || 0).toLocaleString('en-IN')}</td>
                                                        <td className="text-danger">-₹{parseFloat(slip.totalDeductions || 0).toLocaleString('en-IN')}</td>
                                                        <td className="fw-bold text-success">₹{parseFloat(slip.netSalary || 0).toLocaleString('en-IN')}</td>
                                                        <td>
                                                            <Badge bg={slip.status === 'PAID' ? 'success' : (slip.status === 'APPROVED' ? 'primary' : 'warning')}>
                                                                {slip.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-end">
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => navigate(`/dashboard/employee/salary-slip/${slip.id}`)}
                                                            >
                                                                View Slip
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Card.Body>
            </Card>

            {/* Shift Assignment Modal */}
            <ShiftAssignModal
                show={showShiftModal}
                onHide={() => setShowShiftModal(false)}
                firmId={firmId}
                preSelectedEmployeeId={parseInt(id, 10)}
            />
        </div>
    );
};

export default EmployeeDetail;
