import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Spinner, InputGroup, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    DollarSign,
    Play,
    CheckCircle,
    Settings,
    FileText,
    FileSpreadsheet,
    Download,
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Eye,
    Search,
    RefreshCw,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Edit3
} from 'lucide-react';
import useDebounce from '../../../../hooks/useDebounce';
import {
    useSalarySlips,
    useGeneratePayroll,
    useApproveSalarySlip,
    usePayrollReport,
    useDownloadSalarySlip,
    useExportSalaryMuster
} from '../../common/hooks/useEmployeeApi';
import BulkPayModal from '../components/BulkPayModal';
import EditAdvanceDeductionModal from '../../advances/components/EditAdvanceDeductionModal';
import PaginationBar from '../../../../components/PaginationBar';
import TableSkeleton from '../../common/components/TableSkeleton';
import usePermission from '../../../../hooks/usePermission';
import '../../employee.css';

const PayrollRun = () => {
    const navigate = useNavigate();
    const { can, isSuperAdmin } = usePermission();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 400);

    // Sorting
    const [sortBy, setSortBy] = useState('id');
    const [sortOrder, setSortOrder] = useState('desc');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const [selectedSlipIds, setSelectedSlipIds] = useState([]);
    const [showBulkPayModal, setShowBulkPayModal] = useState(false);
    const [slipForAdvanceEdit, setSlipForAdvanceEdit] = useState(null);

    // Reset selection on filter/month changes
    useEffect(() => {
        setSelectedSlipIds([]);
    }, [month, year, statusFilter, debouncedSearch, page, pageSize]);

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
        setPage(1);
    };

    const SortIcon = ({ column }) => {
        if (sortBy !== column) return <ArrowUpDown size={12} className="ms-1 text-muted opacity-50" />;
        return sortOrder === 'asc'
            ? <ArrowUp size={12} className="ms-1 text-primary" />
            : <ArrowDown size={12} className="ms-1 text-primary" />;
    };

    // Queries
    const { data: slipsResult, isLoading: loadingSlips, refetch } = useSalarySlips({
        firmId,
        month,
        year,
        status: statusFilter,
        search: debouncedSearch,
        sortBy,
        sortOrder,
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
    const downloadMutation = useDownloadSalarySlip();
    const exportMusterMutation = useExportSalaryMuster();

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

                    {(isSuperAdmin || can('salary-templates', 'read')) && (
                        <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee/salary-templates')}>
                            <FileText size={15} className="me-1" /> Templates
                        </Button>
                    )}
                    {(isSuperAdmin || can('payroll-settings', 'read')) && (
                        <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee/payroll-settings')}>
                            <Settings size={15} className="me-1" /> Settings
                        </Button>
                    )}

                    {/* Wage Muster Export Dropdown */}
                    {(isSuperAdmin || can('payroll', 'read') || can('payroll', 'print')) && (
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="outline-success"
                                size="sm"
                                id="dropdown-export-muster"
                                disabled={exportMusterMutation.isPending}
                                className="d-flex align-items-center gap-1 shadow-sm"
                            >
                                <Download size={15} />
                                {exportMusterMutation.isPending ? 'Exporting...' : 'Export Muster'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu align="end" className="shadow border-0 p-2" style={{ minWidth: '280px' }}>
                                <Dropdown.Item
                                    onClick={() => exportMusterMutation.mutate({ firmId, month, year, type: 'full' })}
                                    className="d-flex align-items-start gap-2 py-2 rounded"
                                >
                                    <FileSpreadsheet size={18} className="text-success mt-1" />
                                    <div>
                                        <div className="fw-bold text-dark">Wage Muster Roll (.xlsx)</div>
                                        <small className="text-muted d-block">Form T register with all earnings & deductions</small>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    onClick={() => exportMusterMutation.mutate({ firmId, month, year, type: 'bank' })}
                                    className="d-flex align-items-start gap-2 py-2 rounded"
                                >
                                    <CreditCard size={18} className="text-primary mt-1" />
                                    <div>
                                        <div className="fw-bold text-dark">Bank Transfer File (NEFT/RTGS)</div>
                                        <small className="text-muted d-block">A/C, IFSC & Net Salary for bank upload</small>
                                    </div>
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                    onClick={() => exportMusterMutation.mutate({ firmId, month, year, format: 'pdf' })}
                                    className="d-flex align-items-start gap-2 py-2 rounded"
                                >
                                    <FileText size={18} className="text-danger mt-1" />
                                    <div>
                                        <div className="fw-bold text-dark">Download Form T (PDF)</div>
                                        <small className="text-muted d-block">Official landscape statutory register ready to print</small>
                                    </div>
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    )}

                    {(isSuperAdmin || can('payroll', 'create')) && (
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
                    )}
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
                        <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '600px' }}>
                            <InputGroup size="sm" style={{ maxWidth: '280px' }}>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <Search size={14} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search employee name, code..."
                                    className="border-start-0 ps-0"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                />
                                {searchTerm && (
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        className="border-start-0"
                                        onClick={() => { setSearchTerm(''); setPage(1); }}
                                    >
                                        ×
                                    </Button>
                                )}
                            </InputGroup>
                            <Form.Select
                                size="sm"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                style={{ width: '150px' }}
                            >
                                <option value="">All Statuses</option>
                                <option value="GENERATED">Generated</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PAID">Paid</option>
                            </Form.Select>
                            <Button variant="outline-secondary" size="sm" onClick={() => refetch()} title="Refresh">
                                <RefreshCw size={15} />
                            </Button>
                            {selectedSlipIds.length > 0 && (
                                <span className="text-muted small">
                                    Selected: <strong>{selectedSlipIds.length}</strong>
                                </span>
                            )}
                        </div>

                        {selectedSlipIds.length > 0 && (isSuperAdmin || can('payroll', 'update')) && (
                            <Button
                                variant="success"
                                size="sm"
                                onClick={() => setShowBulkPayModal(true)}
                                className="d-flex align-items-center gap-1 shadow-sm"
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
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('first_name')}>
                                        Employee <SortIcon column="first_name" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('present_days')}>
                                        Attendance <SortIcon column="present_days" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('gross_earnings')}>
                                        Gross Pay <SortIcon column="gross_earnings" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('overtime_pay')}>
                                        Overtime <SortIcon column="overtime_pay" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total_deductions')}>
                                        Deductions <SortIcon column="total_deductions" />
                                    </th>
                                    <th>Advance Recovery</th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('net_salary')}>
                                        Net Salary <SortIcon column="net_salary" />
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
                                        Status <SortIcon column="status" />
                                    </th>
                                    <th style={{ width: '10%' }} className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingSlips ? (
                                    <TableSkeleton rows={pageSize > 10 ? 8 : 5} cols={9} hasCheckbox={true} hasAvatar={false} />
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
                                            <td>
                                                {parseFloat(slip.advanceDeduction || 0) > 0 ? (
                                                    <div className="d-flex align-items-center gap-1">
                                                        <span className="text-danger fw-semibold">
                                                            -₹{parseFloat(slip.advanceDeduction).toLocaleString('en-IN')}
                                                        </span>
                                                        {slip.status === 'GENERATED' && (isSuperAdmin || can('payroll', 'update')) && (
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 text-decoration-none text-muted"
                                                                onClick={() => setSlipForAdvanceEdit(slip)}
                                                                title="Adjust Advance Deduction"
                                                            >
                                                                <Edit3 size={13} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">
                                                        —
                                                        {slip.status === 'GENERATED' && (isSuperAdmin || can('payroll', 'update')) && (
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 ms-1 text-decoration-none text-muted"
                                                                onClick={() => setSlipForAdvanceEdit(slip)}
                                                                title="Set Advance Deduction"
                                                            >
                                                                <Edit3 size={12} />
                                                            </Button>
                                                        )}
                                                    </span>
                                                )}
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
                                                    {(isSuperAdmin || can('payroll', 'read')) && (
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            onClick={() => navigate(`/dashboard/employee/salary-slip/${slip.id}`)}
                                                            title="View Printable Pay Slip"
                                                        >
                                                            <Eye size={14} /> Slip
                                                        </Button>
                                                    )}
                                                    {(isSuperAdmin || can('payroll', 'read') || can('payroll', 'print')) && (
                                                        <Button
                                                            variant="light"
                                                            size="sm"
                                                            onClick={() => {
                                                                const safeEmpCode = (slip.empCode || 'EMP').replace(/[^a-zA-Z0-9_-]/g, '_');
                                                                downloadMutation.mutate({
                                                                    id: slip.id,
                                                                    filename: `SalarySlip-${safeEmpCode}-${slip.month}-${slip.year}.pdf`
                                                                });
                                                            }}
                                                            title="Download Slip PDF"
                                                            disabled={downloadMutation.isPending && downloadMutation.variables?.id === slip.id}
                                                        >
                                                            {downloadMutation.isPending && downloadMutation.variables?.id === slip.id ? (
                                                                <Spinner size="sm" animation="border" style={{ width: '12px', height: '12px' }} />
                                                            ) : (
                                                                <Download size={14} />
                                                            )}
                                                        </Button>
                                                    )}
                                                    {slip.status === 'GENERATED' && (isSuperAdmin || can('payroll', 'approve')) && (
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

            <EditAdvanceDeductionModal
                show={Boolean(slipForAdvanceEdit)}
                onHide={() => setSlipForAdvanceEdit(null)}
                slip={slipForAdvanceEdit}
            />
        </div>
    );
};

export default PayrollRun;
