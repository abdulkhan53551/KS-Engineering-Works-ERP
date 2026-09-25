import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    DollarSign,
    Play,
    CheckCircle,
    Settings,
    FileText,
    Download,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Eye
} from 'lucide-react';
import {
    useSalarySlips,
    useGeneratePayroll,
    useApproveSalarySlip,
    usePayrollReport
} from '../hooks/useEmployeeApi';
import BulkPayModal from '../components/BulkPayModal';
import PaginationBar from '../../../components/PaginationBar';
import '../employee.css';

const PayrollRun = () => {
    const navigate = useNavigate();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const [selectedSlipIds, setSelectedSlipIds] = useState([]);
    const [showBulkPayModal, setShowBulkPayModal] = useState(false);

    // Queries
    const { data: slipsResult, isLoading: loadingSlips, refetch } = useSalarySlips({
        firmId,
        month,
        year,
        status: statusFilter,
        page,
        pageSize
    });

    const { data: reportData } = usePayrollReport({
        firmId,
        month,
        year
    });

    const generateMutation = useGeneratePayroll();
    const approveMutation = useApproveSalarySlip();

    const slips = Array.isArray(slipsResult?.slips)
        ? slipsResult.slips
        : (Array.isArray(slipsResult?.data?.slips)
            ? slipsResult.data.slips
            : (Array.isArray(slipsResult) ? slipsResult : []));
    const pagination = slipsResult?.pagination || slipsResult?.data?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 };

    const handleGenerate = async () => {
        if (window.confirm(`Generate payroll calculations for ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}?`)) {
            await generateMutation.mutateAsync({ firmId, month, year });
            setSelectedSlipIds([]);
        }
    };

    const handleApprove = async (id) => {
        await approveMutation.mutateAsync(id);
    };

    const toggleSelectSlip = (id) => {
        if (selectedSlipIds.includes(id)) {
            setSelectedSlipIds(selectedSlipIds.filter(s => s !== id));
        } else {
            setSelectedSlipIds([...selectedSlipIds, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedSlipIds.length === slips.length) {
            setSelectedSlipIds([]);
        } else {
            setSelectedSlipIds(slips.map(s => s.id));
        }
    };

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
        setSelectedSlipIds([]);
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
        setSelectedSlipIds([]);
    };

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="container-fluid p-3">
            {/* Header & Controls */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Salary & Payroll Processing</h4>
                    <span className="text-muted small">
                        Generate monthly salary sheets from attendance, calculate overtime, and record employee payouts.
                    </span>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
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

                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee/salary-templates')}>
                        <FileText size={15} className="me-1" /> Templates
                    </Button>
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee/payroll-settings')}>
                        <Settings size={15} className="me-1" /> Settings
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={generateMutation.isPending}
                        className="d-flex align-items-center gap-1 shadow-sm"
                    >
                        <Play size={15} />
                        {generateMutation.isPending ? 'Calculating...' : 'Run Payroll'}
                    </Button>
                </div>
            </div>

            {/* Financial Summary KPI Cards */}
            <Row className="g-3 mb-4">
                <Col xl={3} sm={6}>
                    <div className="emp-kpi-card p-3">
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Total Gross Pay</div>
                                <h4 className="fw-bold mb-0 text-dark">
                                    ₹{reportData?.totalGross?.toLocaleString('en-IN') || '0'}
                                </h4>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col xl={3} sm={6}>
                    <div className="emp-kpi-card kpi-danger p-3">
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <FileText size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Total Deductions</div>
                                <h4 className="fw-bold mb-0 text-danger">
                                    -₹{reportData?.totalDeductions?.toLocaleString('en-IN') || '0'}
                                </h4>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col xl={3} sm={6}>
                    <div className="emp-kpi-card kpi-warning p-3">
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Overtime Payout</div>
                                <h4 className="fw-bold mb-0 text-warning">
                                    +₹{reportData?.totalOTPay?.toLocaleString('en-IN') || '0'}
                                </h4>
                            </div>
                        </div>
                    </div>
                </Col>

                <Col xl={3} sm={6}>
                    <div className="emp-kpi-card kpi-success p-3">
                        <div className="d-flex align-items-center">
                            <div className="emp-kpi-icon me-3">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <div className="text-muted small fw-semibold">Net Payable</div>
                                <h4 className="fw-bold mb-0 text-success">
                                    ₹{reportData?.totalNet?.toLocaleString('en-IN') || '0'}
                                </h4>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Slips Table Card */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-3">
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <Form.Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                style={{ width: '160px' }}
                            >
                                <option value="">All Statuses</option>
                                <option value="GENERATED">Generated</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PAID">Paid</option>
                            </Form.Select>
                            {selectedSlipIds.length > 0 && (
                                <span className="text-muted small">
                                    Selected: <strong>{selectedSlipIds.length}</strong>
                                </span>
                            )}
                        </div>

                        {selectedSlipIds.length > 0 && (
                            <Button
                                variant="success"
                                size="sm"
                                onClick={() => setShowBulkPayModal(true)}
                                className="d-flex align-items-center gap-1"
                            >
                                <CreditCard size={15} /> Mark Selected as PAID ({selectedSlipIds.length})
                            </Button>
                        )}
                    </div>

                    <div className="table-responsive">
                        <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '4%' }}>
                                        <Form.Check
                                            type="checkbox"
                                            checked={slips.length > 0 && selectedSlipIds.length === slips.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th>Employee</th>
                                    <th>Attendance</th>
                                    <th>Gross Pay</th>
                                    <th>Overtime</th>
                                    <th>Deductions</th>
                                    <th>Net Salary</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingSlips ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-4 text-muted">
                                            <Spinner size="sm" className="me-2" /> Loading salary slips...
                                        </td>
                                    </tr>
                                ) : slips.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-5 text-muted">
                                            <DollarSign size={36} className="text-secondary mb-2" />
                                            <div>No payroll records for this month yet.</div>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="mt-3"
                                                onClick={handleGenerate}
                                                disabled={generateMutation.isPending}
                                            >
                                                <Play size={14} className="me-1" /> Run Payroll Calculation
                                            </Button>
                                        </td>
                                    </tr>
                                ) : (
                                    slips.map(slip => (
                                        <tr key={slip.id}>
                                            <td>
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={selectedSlipIds.includes(slip.id)}
                                                    onChange={() => toggleSelectSlip(slip.id)}
                                                />
                                            </td>
                                            <td>
                                                <div className="fw-semibold text-dark">
                                                    {slip.firstName} {slip.lastName || ''}
                                                </div>
                                                <div className="text-muted small">
                                                    <span className="text-primary font-monospace">{slip.empCode}</span> • {slip.department || 'Staff'}
                                                </div>
                                            </td>
                                            <td>
                                                <div><strong>{slip.presentDays}</strong> / {slip.totalWorkingDays} days</div>
                                                {parseFloat(slip.overtimeHours || 0) > 0 && (
                                                    <span className="ot-pill">+{slip.overtimeHours} hrs OT</span>
                                                )}
                                            </td>
                                            <td>₹{parseFloat(slip.grossEarnings || 0).toLocaleString('en-IN')}</td>
                                            <td className="text-warning">
                                                {parseFloat(slip.overtimePay || 0) > 0 ? `+₹${parseFloat(slip.overtimePay).toLocaleString('en-IN')}` : '—'}
                                            </td>
                                            <td className="text-danger">
                                                -₹{parseFloat(slip.totalDeductions || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="fw-bold text-success fs-6">
                                                ₹{parseFloat(slip.netSalary || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td>
                                                <Badge bg={slip.status === 'PAID' ? 'success' : (slip.status === 'APPROVED' ? 'primary' : 'warning')}>
                                                    {slip.status}
                                                </Badge>
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group">
                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        onClick={() => navigate(`/dashboard/employee/salary-slip/${slip.id}`)}
                                                        title="View Printable Pay Slip"
                                                    >
                                                        <Eye size={14} /> Slip
                                                    </Button>
                                                    {slip.status === 'GENERATED' && (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleApprove(slip.id)}
                                                            title="Approve Slip"
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>

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

            <BulkPayModal
                show={showBulkPayModal}
                onHide={() => { setShowBulkPayModal(false); setSelectedSlipIds([]); }}
                selectedSlipIds={selectedSlipIds}
            />
        </div>
    );
};

export default PayrollRun;
