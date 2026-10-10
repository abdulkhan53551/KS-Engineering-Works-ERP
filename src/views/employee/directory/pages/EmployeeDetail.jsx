import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge, Tab, Nav, Table, Spinner, ProgressBar, Dropdown, Form, InputGroup } from 'react-bootstrap';
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
    Plus,
    Eye,
    MoreVertical,
    PlayCircle,
    PauseCircle,
    CheckCircle,
    TrendingDown,
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    X,
    AlertTriangle
} from 'lucide-react';
import useDebounce from '../../../../hooks/useDebounce';
import usePermission from '../../../../hooks/usePermission';
import PaginationBar from '../../../../components/PaginationBar';
import {
    useEmployee,
    useAttendance,
    useSalarySlips,
    useAdvances,
    useTogglePauseAdvance
} from '../../common/hooks/useEmployeeApi';
import ShiftAssignModal from '../../shifts/components/ShiftAssignModal';
import AdvanceDisburseModal from '../../advances/components/AdvanceDisburseModal';
import AdvanceRepaymentModal from '../../advances/components/AdvanceRepaymentModal';
import AdvanceDetailModal from '../../advances/components/AdvanceDetailModal';
import '../../employee.css';

const EmployeeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { can, isSuperAdmin } = usePermission();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});

    const [activeTab, setActiveTab] = useState('profile');
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [selectedAdvanceForRepay, setSelectedAdvanceForRepay] = useState(null);
    const [selectedAdvanceForDetail, setSelectedAdvanceForDetail] = useState(null);

    // Advances tab pagination, sorting & filters
    const [advancePage, setAdvancePage] = useState(1);
    const [advancePageSize, setAdvancePageSize] = useState(5);
    const [advanceSortBy, setAdvanceSortBy] = useState('advance_date');
    const [advanceSortOrder, setAdvanceSortOrder] = useState('desc');
    const [advanceStatusFilter, setAdvanceStatusFilter] = useState('ALL');
    const [advanceSearch, setAdvanceSearch] = useState('');
    const debouncedAdvanceSearch = useDebounce(advanceSearch, 350);

    const handleAdvanceSort = (column) => {
        if (advanceSortBy === column) {
            setAdvanceSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setAdvanceSortBy(column);
            setAdvanceSortOrder('desc');
        }
        setAdvancePage(1);
    };

    const AdvanceSortIcon = ({ column }) => {
        if (advanceSortBy !== column) return <ArrowUpDown size={12} className="ms-1 text-muted opacity-50" />;
        return advanceSortOrder === 'asc'
            ? <ArrowUp size={12} className="ms-1 text-primary" />
            : <ArrowDown size={12} className="ms-1 text-primary" />;
    };

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

    const {
        data: advancesResult,
        isLoading: isLoadingAdvances,
        isFetching: isFetchingAdvances,
        refetch: refetchAdvances
    } = useAdvances({
        employeeId: id,
        status: advanceStatusFilter === 'ALL' ? undefined : advanceStatusFilter,
        search: debouncedAdvanceSearch || undefined,
        sortBy: advanceSortBy,
        sortOrder: advanceSortOrder,
        page: advancePage,
        pageSize: advancePageSize
    });
    const employeeAdvances = Array.isArray(advancesResult?.advances) ? advancesResult.advances : [];
    const advanceSummary = advancesResult?.summary || { totalDisbursed: 0, totalRecovered: 0, totalOutstanding: 0 };
    const advancePagination = advancesResult?.pagination || { page: 1, pageSize: advancePageSize, total: 0, totalPages: 1 };

    const { mutateAsync: togglePause } = useTogglePauseAdvance();

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
                    {(isSuperAdmin || can('employees', 'update')) && (
                        <Button variant="primary" size="sm" onClick={() => navigate(`/dashboard/employee/${id}/edit`)}>
                            <Edit3 size={15} className="me-1" /> Edit Profile
                        </Button>
                    )}
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
                            <Nav.Item>
                                <Nav.Link eventKey="advances" className="d-flex align-items-center gap-2">
                                    <CreditCard size={16} /> Advances & Loans
                                    {advanceSummary.totalOutstanding > 0 && (
                                        <Badge bg="danger" pill className="ms-1" style={{ fontSize: '10px' }}>
                                            ₹{advanceSummary.totalOutstanding.toLocaleString('en-IN')}
                                        </Badge>
                                    )}
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

                                        <div className="mt-4">
                                            <h6 className="fw-bold mb-3 text-danger border-bottom pb-2 d-flex align-items-center gap-2">
                                                <AlertTriangle size={15} /> Emergency Contact
                                            </h6>
                                            <Table borderless size="sm" className="mb-0">
                                                <tbody>
                                                    <tr>
                                                        <td className="text-muted" style={{ width: '40%' }}>Contact Person:</td>
                                                        <td className="fw-semibold">
                                                            {employee.emergencyContactName || employee.emergency_contact_name || '—'}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="text-muted">Emergency Phone:</td>
                                                        <td>
                                                            {(employee.emergencyContactPhone || employee.emergency_contact_phone) ? (
                                                                <a
                                                                    href={`tel:${employee.emergencyContactPhone || employee.emergency_contact_phone}`}
                                                                    className="text-decoration-none fw-semibold font-monospace text-danger"
                                                                >
                                                                    {employee.emergencyContactPhone || employee.emergency_contact_phone}
                                                                </a>
                                                            ) : (
                                                                '—'
                                                            )}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </div>
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
                                    {(isSuperAdmin || can('shifts', 'update')) && (
                                        <Button variant="outline-primary" size="sm" onClick={() => setShowShiftModal(true)}>
                                            <Plus size={15} className="me-1" /> Re-assign Shift
                                        </Button>
                                    )}
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

                            {/* TAB 5: ADVANCES & LOANS */}
                            <Tab.Pane eventKey="advances">
                                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <h6 className="fw-bold mb-0 text-primary">Advances & Loan History</h6>
                                        {advancePagination.total > 0 && (
                                            <Badge bg="primary-subtle" text="primary" pill className="px-2">
                                                {advancePagination.total} {advancePagination.total === 1 ? 'Record' : 'Records'}
                                            </Badge>
                                        )}
                                    </div>
                                    {(isSuperAdmin || can('payroll', 'create')) && (
                                        <Button variant="primary" size="sm" onClick={() => setShowAdvanceModal(true)} className="d-inline-flex align-items-center gap-1 shadow-sm">
                                            <Plus size={15} /> Disburse Advance
                                        </Button>
                                    )}
                                </div>

                                {/* Advance Stats Bar */}
                                <Row className="g-3 mb-4">
                                    <Col md={4}>
                                        <div className="p-3 border rounded-3 bg-white shadow-sm d-flex align-items-center justify-content-between">
                                            <div>
                                                <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Total Disbursed</span>
                                                <h4 className="fw-bold mb-0 text-dark mt-1">
                                                    ₹{advanceSummary.totalDisbursed.toLocaleString('en-IN')}
                                                </h4>
                                            </div>
                                            <div className="p-2 rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                                <DollarSign size={20} />
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="p-3 border rounded-3 bg-white shadow-sm d-flex align-items-center justify-content-between">
                                            <div>
                                                <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Total Recovered</span>
                                                <h4 className="fw-bold mb-0 text-success mt-1">
                                                    ₹{advanceSummary.totalRecovered.toLocaleString('en-IN')}
                                                </h4>
                                            </div>
                                            <div className="p-2 rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                                <CheckCircle size={20} />
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4}>
                                        <div className="p-3 border rounded-3 bg-white shadow-sm d-flex align-items-center justify-content-between">
                                            <div>
                                                <span className="text-muted small fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Outstanding Balance</span>
                                                <h4 className="fw-bold mb-0 text-danger mt-1">
                                                    ₹{advanceSummary.totalOutstanding.toLocaleString('en-IN')}
                                                </h4>
                                            </div>
                                            <div className="p-2 rounded-3 bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                                                <TrendingDown size={20} />
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Toolbar: Search, Status Filter, Page Size & Refresh */}
                                <div className="p-2 border rounded-3 bg-light mb-3">
                                    <Row className="g-2 align-items-center">
                                        <Col md={5} sm={12}>
                                            <InputGroup size="sm">
                                                <InputGroup.Text className="bg-white border-end-0">
                                                    <Search size={14} className="text-muted" />
                                                </InputGroup.Text>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Search remarks, payment ref..."
                                                    value={advanceSearch}
                                                    onChange={(e) => {
                                                        setAdvanceSearch(e.target.value);
                                                        setAdvancePage(1);
                                                    }}
                                                    className="border-start-0"
                                                />
                                                {advanceSearch && (
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setAdvanceSearch('');
                                                            setAdvancePage(1);
                                                        }}
                                                        title="Clear search"
                                                    >
                                                        <X size={13} />
                                                    </Button>
                                                )}
                                            </InputGroup>
                                        </Col>

                                        <Col md={3} sm={6}>
                                            <Form.Select
                                                size="sm"
                                                value={advanceStatusFilter}
                                                onChange={(e) => {
                                                    setAdvanceStatusFilter(e.target.value);
                                                    setAdvancePage(1);
                                                }}
                                            >
                                                <option value="ALL">All Statuses</option>
                                                <option value="ACTIVE">Active (In Recovery)</option>
                                                <option value="PAUSED">Paused</option>
                                                <option value="CLOSED">Settled (Closed)</option>
                                            </Form.Select>
                                        </Col>

                                        <Col md={2} sm={3}>
                                            <Form.Select
                                                size="sm"
                                                value={advancePageSize}
                                                onChange={(e) => {
                                                    setAdvancePageSize(parseInt(e.target.value, 10));
                                                    setAdvancePage(1);
                                                }}
                                            >
                                                <option value={5}>5 per page</option>
                                                <option value={10}>10 per page</option>
                                                <option value={20}>20 per page</option>
                                                <option value={50}>50 per page</option>
                                            </Form.Select>
                                        </Col>

                                        <Col md={2} sm={3} className="text-end">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                onClick={() => refetchAdvances()}
                                                disabled={isFetchingAdvances}
                                                className="w-100 d-inline-flex align-items-center justify-content-center gap-1"
                                                title="Refresh advances"
                                            >
                                                <RefreshCw size={13} className={isFetchingAdvances ? 'spin' : ''} />
                                                <span>Refresh</span>
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="table-responsive border rounded-3 bg-white">
                                    <Table hover size="sm" className="mb-0 align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th
                                                    className="py-2 user-select-none"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleAdvanceSort('advance_date')}
                                                    title="Sort by Disbursed Date"
                                                >
                                                    <div className="d-inline-flex align-items-center">
                                                        <span>Disbursed Date</span>
                                                        <AdvanceSortIcon column="advance_date" />
                                                    </div>
                                                </th>
                                                <th
                                                    className="py-2 user-select-none"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleAdvanceSort('total_amount')}
                                                    title="Sort by Total Amount"
                                                >
                                                    <div className="d-inline-flex align-items-center">
                                                        <span>Total Amount</span>
                                                        <AdvanceSortIcon column="total_amount" />
                                                    </div>
                                                </th>
                                                <th className="py-2">Recovery Type</th>
                                                <th
                                                    className="py-2 user-select-none"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleAdvanceSort('remaining_balance')}
                                                    title="Sort by Remaining Balance"
                                                >
                                                    <div className="d-inline-flex align-items-center">
                                                        <span>Repaid / Balance</span>
                                                        <AdvanceSortIcon column="remaining_balance" />
                                                    </div>
                                                </th>
                                                <th
                                                    className="py-2 user-select-none"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => handleAdvanceSort('status')}
                                                    title="Sort by Status"
                                                >
                                                    <div className="d-inline-flex align-items-center">
                                                        <span>Status</span>
                                                        <AdvanceSortIcon column="status" />
                                                    </div>
                                                </th>
                                                <th className="py-2 text-end pe-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoadingAdvances ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5">
                                                        <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                                                        <span className="text-muted">Loading advances...</span>
                                                    </td>
                                                </tr>
                                            ) : employeeAdvances.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5 text-muted">
                                                        <div className="fw-semibold">No advances or loans found</div>
                                                        <div className="small text-muted mt-1">
                                                            {advanceSearch || advanceStatusFilter !== 'ALL' ? (
                                                                <>
                                                                    No records match your filters.{' '}
                                                                    <Button
                                                                        variant="link"
                                                                        size="sm"
                                                                        className="p-0 text-decoration-none"
                                                                        onClick={() => {
                                                                            setAdvanceSearch('');
                                                                            setAdvanceStatusFilter('ALL');
                                                                            setAdvancePage(1);
                                                                        }}
                                                                    >
                                                                        Reset filters
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                'No advances or loans recorded for this employee.'
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                employeeAdvances.map((adv) => {
                                                    const totalAmt = parseFloat(adv.totalAmount || 0);
                                                    const recAmt = parseFloat(adv.recoveredAmount || 0);
                                                    const remAmt = parseFloat(adv.remainingBalance || 0);
                                                    const pct = totalAmt > 0 ? Math.min(100, Math.round((recAmt / totalAmt) * 100)) : 0;
                                                    const isClosed = adv.status === 'CLOSED';
                                                    const isPaused = adv.isPaused || adv.status === 'PAUSED';

                                                    return (
                                                        <tr key={adv.id}>
                                                            <td className="fw-semibold text-dark">
                                                                {new Date(adv.advanceDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                {adv.paymentMode && (
                                                                    <div className="text-muted" style={{ fontSize: '11px' }}>
                                                                        via {adv.paymentMode}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="fw-bold text-dark fs-6">
                                                                ₹{totalAmt.toLocaleString('en-IN')}
                                                            </td>
                                                            <td>
                                                                {adv.recoveryType === 'EMI' ? (
                                                                    <Badge bg="info" text="dark" className="px-2 py-1">
                                                                        EMI: ₹{parseFloat(adv.monthlyDeduction || 0).toLocaleString('en-IN')}/mo
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge bg="light" text="dark" className="border px-2 py-1">
                                                                        Single Deduction (FULL)
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td style={{ minWidth: '170px' }}>
                                                                <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.82rem' }}>
                                                                    <span className="text-success fw-semibold">
                                                                        ₹{recAmt.toLocaleString('en-IN')} <small className="text-muted">paid</small>
                                                                    </span>
                                                                    <span className="text-danger fw-bold">
                                                                        ₹{remAmt.toLocaleString('en-IN')} <small className="text-muted">due</small>
                                                                    </span>
                                                                </div>
                                                                <ProgressBar
                                                                    now={pct}
                                                                    variant={isClosed ? 'success' : 'primary'}
                                                                    style={{ height: '7px', borderRadius: '4px' }}
                                                                />
                                                            </td>
                                                            <td>
                                                                {isClosed ? (
                                                                    <Badge bg="success" className="px-2 py-1">Settled</Badge>
                                                                ) : isPaused ? (
                                                                    <Badge bg="warning" text="dark" className="px-2 py-1">Paused</Badge>
                                                                ) : (
                                                                    <Badge bg="primary" className="px-2 py-1">Active</Badge>
                                                                )}
                                                            </td>
                                                            <td className="text-end text-nowrap pe-3">
                                                                <div className="d-inline-flex align-items-center gap-1">
                                                                    <Button
                                                                        variant="outline-primary"
                                                                        size="sm"
                                                                        className="py-1 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                                                        onClick={() => setSelectedAdvanceForDetail(adv.id)}
                                                                        title="View Repayment Ledger & History"
                                                                    >
                                                                        <Eye size={13} />
                                                                        <span>Ledger</span>
                                                                    </Button>

                                                                    {!isClosed && (isSuperAdmin || can('payroll', 'update')) && (
                                                                        <Button
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                            className="py-1 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                                                            onClick={() => setSelectedAdvanceForRepay(adv)}
                                                                            title="Record Direct Cash / Bank Repayment"
                                                                        >
                                                                            <CreditCard size={13} />
                                                                            <span>Repay</span>
                                                                        </Button>
                                                                    )}

                                                                    {!isClosed && (isSuperAdmin || can('payroll', 'update')) && (
                                                                        <Button
                                                                            variant={isPaused ? "outline-success" : "outline-secondary"}
                                                                            size="sm"
                                                                            className="py-1 px-2 d-inline-flex align-items-center gap-1 shadow-sm"
                                                                            onClick={() => togglePause({ id: adv.id, isPaused: !isPaused })}
                                                                            title={isPaused ? "Resume Recovery" : "Pause Deductions"}
                                                                        >
                                                                            {isPaused ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                                                                            <span>{isPaused ? "Resume" : "Pause"}</span>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </Table>
                                </div>

                                {/* Table Footer: Summary Count & Pagination */}
                                {advancePagination.total > 0 && (
                                    <div className="p-3 border rounded-3 bg-white mt-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
                                        <div className="text-muted small">
                                            Showing <span className="fw-semibold text-dark">{(advancePage - 1) * advancePageSize + 1}</span> to{' '}
                                            <span className="fw-semibold text-dark">
                                                {Math.min(advancePage * advancePageSize, advancePagination.total)}
                                            </span>{' '}
                                            of <span className="fw-semibold text-dark">{advancePagination.total}</span> advances
                                        </div>
                                        {advancePagination.totalPages > 1 && (
                                            <PaginationBar
                                                page={advancePage}
                                                pageSize={advancePageSize}
                                                total={advancePagination.total}
                                                totalPages={advancePagination.totalPages}
                                                onPageChange={(p) => setAdvancePage(p)}
                                            />
                                        )}
                                    </div>
                                )}
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

            {/* Advance Modals */}
            <AdvanceDisburseModal
                show={showAdvanceModal}
                onHide={() => setShowAdvanceModal(false)}
                defaultEmployeeId={parseInt(id, 10)}
                firmId={firmId}
            />

            <AdvanceRepaymentModal
                show={Boolean(selectedAdvanceForRepay)}
                onHide={() => setSelectedAdvanceForRepay(null)}
                advance={selectedAdvanceForRepay}
            />

            <AdvanceDetailModal
                show={Boolean(selectedAdvanceForDetail)}
                onHide={() => setSelectedAdvanceForDetail(null)}
                advanceId={selectedAdvanceForDetail}
                onOpenRepayModal={(adv) => setSelectedAdvanceForRepay(adv)}
            />
        </div>
    );
};

export default EmployeeDetail;
