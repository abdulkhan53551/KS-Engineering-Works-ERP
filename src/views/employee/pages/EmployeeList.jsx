import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    Users,
    UserCheck,
    Briefcase,
    DollarSign,
    Trash2,
    Search,
    RefreshCw,
    Plus,
    Calendar,
    Clock,
    Eye,
    Edit3,
    RotateCcw
} from 'lucide-react';
import useDebounce from '../../../hooks/useDebounce';
import {
    useEmployees,
    useEmployeesMeta,
    useDeleteEmployee,
    useRestoreEmployee
} from '../hooks/useEmployeeApi';
import PaginationBar from '../../../components/PaginationBar';
import '../employee.css';

const EmployeeList = () => {
    const navigate = useNavigate();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [isTrash, setIsTrash] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // API Queries
    const { data: result, isLoading, refetch } = useEmployees({
        page,
        pageSize,
        search: debouncedSearch,
        status: statusFilter,
        employmentType: typeFilter,
        department: deptFilter,
        firmId,
        trash: isTrash
    });

    const { data: meta } = useEmployeesMeta({ firmId });

    // Mutations
    const deleteMutation = useDeleteEmployee();
    const restoreMutation = useRestoreEmployee();

    const employees = Array.isArray(result?.employees)
        ? result.employees
        : (Array.isArray(result?.data?.employees)
            ? result.data.employees
            : (Array.isArray(result) ? result : []));
    const pagination = result?.pagination || result?.data?.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1 };

    const handleDelete = async (id) => {
        if (window.confirm(isTrash ? 'Permanently delete this employee?' : 'Move this employee to recycle bin?')) {
            await deleteMutation.mutateAsync({ id, permanent: isTrash });
        }
    };

    const handleRestore = async (id) => {
        await restoreMutation.mutateAsync(id);
    };

    const getTypeBadge = (type) => {
        switch (type) {
            case 'PERMANENT':
                return <span className="badge badge-permanent">Permanent</span>;
            case 'DAILY_WAGE':
                return <span className="badge badge-daily">Daily Wage</span>;
            case 'CONTRACT':
                return <span className="badge badge-contract">Contract</span>;
            default:
                return <Badge bg="light" text="dark">{type}</Badge>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'ACTIVE':
                return <span className="badge badge-active">Active</span>;
            case 'RESIGNED':
                return <span className="badge badge-resigned">Resigned</span>;
            case 'TERMINATED':
                return <span className="badge badge-terminated">Terminated</span>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="container-fluid p-3">
            {/* Header with Title & Quick Action Navigation */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                <div>
                    <h3 className="fw-bold mb-1 text-dark">Employee Management</h3>
                    <p className="text-muted mb-0 small">
                        Manage company personnel, shifts, attendance tracking, and monthly payroll.
                    </p>
                </div>
                <div className="d-flex flex-wrap gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => navigate('/dashboard/employee/attendance')}>
                        <Calendar size={15} className="me-1" /> Attendance Sheet
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee/shifts')}>
                        <Clock size={15} className="me-1" /> Shifts
                    </Button>
                    <Button variant="outline-success" size="sm" onClick={() => navigate('/dashboard/employee/payroll')}>
                        <DollarSign size={15} className="me-1" /> Payroll Run
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/employee/create')}>
                        <Plus size={16} className="me-1" /> Add Employee
                    </Button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <Row className="g-3 mb-4">
                <Col xl={3} sm={6}>
                    <div className="emp-kpi-card p-3">
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Total Employees</div>
                                <h4 className="fw-bold mb-0 text-dark">{meta?.totalEmployees || 0}</h4>
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xl={3} sm={6}>
                    <div className="emp-kpi-card kpi-success p-3">
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Active Staff</div>
                                <h4 className="fw-bold mb-0 text-success">{meta?.activeEmployees || 0}</h4>
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xl={3} sm={6}>
                    <div className="emp-kpi-card kpi-purple p-3">
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Permanent / Daily Wage</div>
                                <h4 className="fw-bold mb-0 text-dark">
                                    {meta?.permanentEmployees || 0} <span className="fs-6 text-muted">/ {meta?.dailyWageEmployees || 0}</span>
                                </h4>
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xl={3} sm={6}>
                    <div
                        className={`emp-kpi-card ${meta?.trashEmployees > 0 ? 'kpi-warning' : ''} p-3 cursor-pointer`}
                        onClick={() => { setIsTrash(!isTrash); setPage(1); }}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <Trash2 size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Recycle Bin</div>
                                <h4 className="fw-bold mb-0 text-warning">{meta?.trashEmployees || 0}</h4>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Main Card with Filters & Table */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-3">
                    {/* Filter Bar */}
                    <div className="row g-2 align-items-center mb-3">
                        <div className="col-md-4">
                            <InputGroup size="sm">
                                <InputGroup.Text className="bg-white border-end-0">
                                    <Search size={15} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by name, code, phone, department..."
                                    className="border-start-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm('')}>
                                        ✕
                                    </Button>
                                )}
                            </InputGroup>
                        </div>

                        <div className="col-md-2">
                            <Form.Select
                                size="sm"
                                value={typeFilter}
                                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All Types</option>
                                <option value="PERMANENT">Permanent</option>
                                <option value="DAILY_WAGE">Daily Wage</option>
                                <option value="CONTRACT">Contract</option>
                                <option value="PART_TIME">Part Time</option>
                            </Form.Select>
                        </div>

                        <div className="col-md-2">
                            <Form.Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="RESIGNED">Resigned</option>
                                <option value="TERMINATED">Terminated</option>
                                <option value="ABSCONDED">Absconded</option>
                            </Form.Select>
                        </div>

                        <div className="col-md-2">
                            <Form.Select
                                size="sm"
                                value={deptFilter}
                                onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All Departments</option>
                                {meta?.departmentBreakdown?.map((d, idx) => (
                                    <option key={idx} value={d.department}>{d.department}</option>
                                ))}
                            </Form.Select>
                        </div>

                        <div className="col-md-2 d-flex justify-content-end gap-2">
                            <Button
                                variant={isTrash ? 'warning' : 'outline-secondary'}
                                size="sm"
                                onClick={() => { setIsTrash(!isTrash); setPage(1); }}
                                title="Toggle Recycle Bin"
                            >
                                <Trash2 size={15} className="me-1" />
                                {isTrash ? 'Viewing Trash' : 'Trash'}
                            </Button>
                            <Button variant="outline-secondary" size="sm" onClick={() => refetch()} title="Refresh">
                                <RefreshCw size={15} />
                            </Button>
                        </div>
                    </div>

                    {/* Employee Directory Table */}
                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '12%' }}>Emp Code</th>
                                    <th style={{ width: '22%' }}>Employee Name</th>
                                    <th style={{ width: '16%' }}>Department & Role</th>
                                    <th style={{ width: '13%' }}>Type</th>
                                    <th style={{ width: '13%' }}>Shift</th>
                                    <th style={{ width: '12%' }}>Base Salary</th>
                                    <th style={{ width: '8%' }}>Status</th>
                                    <th style={{ width: '12%' }} className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            <div className="spinner-border spinner-border-sm me-2" role="status" />
                                            Loading employee records...
                                        </td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-5 text-muted">
                                            <Users size={36} className="text-secondary mb-2" />
                                            <div>No employee records found.</div>
                                            {!isTrash && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="mt-3"
                                                    onClick={() => navigate('/dashboard/employee/create')}
                                                >
                                                    <Plus size={15} className="me-1" /> Add First Employee
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr key={emp.id}>
                                            <td className="fw-bold text-primary font-monospace">
                                                {emp.empCode}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div
                                                        className="rounded-circle d-flex align-items-center justify-content-center text-white me-2 fw-bold"
                                                        style={{
                                                            width: '34px',
                                                            height: '34px',
                                                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0) || ''}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold text-dark">
                                                            <Link to={`/dashboard/employee/${emp.id}`} className="text-decoration-none text-dark hover-primary">
                                                                {emp.firstName} {emp.lastName || ''}
                                                            </Link>
                                                        </div>
                                                        <div className="text-muted small">{emp.phone || emp.email || 'No contact'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="fw-medium text-dark">{emp.department || '—'}</div>
                                                <div className="text-muted small">{emp.designation || '—'}</div>
                                            </td>
                                            <td>
                                                {getTypeBadge(emp.employmentType)}
                                            </td>
                                            <td>
                                                {emp.currentShiftName ? (
                                                    <span className="shift-time-badge" title={`${emp.shiftStartTime?.substring(0, 5)} - ${emp.shiftEndTime?.substring(0, 5)}`}>
                                                        <Clock size={12} /> {emp.currentShiftCode}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted small">Not Assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="fw-semibold text-dark">
                                                    ₹{parseFloat(emp.baseSalary || 0).toLocaleString('en-IN')}
                                                </div>
                                                <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                                    {emp.salaryType === 'MONTHLY' ? 'Per Month' : (emp.salaryType === 'DAILY' ? 'Per Day' : 'Per Hour')}
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(emp.status)}
                                            </td>
                                            <td className="text-end">
                                                {isTrash ? (
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        className="p-1 px-2 me-1"
                                                        onClick={() => handleRestore(emp.id)}
                                                        title="Restore Employee"
                                                    >
                                                        <RotateCcw size={14} /> Restore
                                                    </Button>
                                                ) : (
                                                    <div className="btn-group">
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="p-1 px-2"
                                                            onClick={() => navigate(`/dashboard/employee/${emp.id}`)}
                                                            title="View Profile"
                                                        >
                                                            <Eye size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="p-1 px-2"
                                                            onClick={() => navigate(`/dashboard/employee/${emp.id}/edit`)}
                                                            title="Edit Employee"
                                                        >
                                                            <Edit3 size={14} />
                                                        </Button>
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            className="p-1 px-2 text-danger"
                                                            onClick={() => handleDelete(emp.id)}
                                                            title="Move to Trash"
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination Bar */}
                    {pagination.total > 0 && (
                        <div className="mt-3">
                            <PaginationBar
                                pagination={pagination}
                                onPageChange={(p) => setPage(p)}
                                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                            />
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default EmployeeList;
