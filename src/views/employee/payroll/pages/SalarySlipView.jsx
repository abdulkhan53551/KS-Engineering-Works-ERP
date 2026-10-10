import React from 'react';
import { Card, Table, Button, Row, Col, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, AlertCircle } from 'lucide-react';
import { useSalarySlip, useDownloadSalarySlip } from '../../common/hooks/useEmployeeApi';
import { usePermission } from '../../../../hooks/usePermission';
import '../../employee.css';

const SalarySlipView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { can, isSuperAdmin } = usePermission();

    const { data: slipData, isLoading } = useSalarySlip(id);
    const slip = slipData?.id ? slipData : (slipData?.data || null);

    const downloadMutation = useDownloadSalarySlip();

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = () => {
        if (!slip) return;
        const safeEmpCode = (slip.empCode || 'EMP').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `SalarySlip-${safeEmpCode}-${slip.month}-${slip.year}.pdf`;
        downloadMutation.mutate({ id: slip.id, filename });
    };

    if (isLoading) {
        return (
            <div className="container-fluid p-3">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="skeleton-box" style={{ width: '80px', height: '32px' }} />
                    <div className="d-flex gap-2">
                        <div className="skeleton-box" style={{ width: '100px', height: '32px' }} />
                        <div className="skeleton-box" style={{ width: '120px', height: '32px' }} />
                    </div>
                </div>
                <div className="salary-slip-card shadow-sm p-4">
                    <div className="text-center mb-4">
                        <div className="skeleton-box mx-auto mb-2" style={{ width: '280px', height: '28px' }} />
                        <div className="skeleton-box mx-auto mb-2" style={{ width: '380px', height: '16px' }} />
                        <div className="skeleton-box mx-auto" style={{ width: '200px', height: '24px', borderRadius: '12px' }} />
                    </div>
                    <div className="skeleton-box w-100 mb-3" style={{ height: '120px', borderRadius: '6px' }} />
                    <div className="skeleton-box w-100 mb-3" style={{ height: '40px', borderRadius: '6px' }} />
                    <Row className="g-3 mb-3">
                        <Col md={6}>
                            <div className="skeleton-box w-100" style={{ height: '160px', borderRadius: '6px' }} />
                        </Col>
                        <Col md={6}>
                            <div className="skeleton-box w-100" style={{ height: '160px', borderRadius: '6px' }} />
                        </Col>
                    </Row>
                    <div className="skeleton-box w-100 mb-4" style={{ height: '60px', borderRadius: '6px' }} />
                </div>
            </div>
        );
    }

    if (!slip) {
        return (
            <div className="container-fluid p-5 text-center">
                <AlertCircle size={48} className="text-danger mb-3" />
                <h4 className="fw-bold">Salary slip not found</h4>
                <p className="text-muted small">The requested salary slip could not be found or may have been removed.</p>
                <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/employee/payroll')}>
                    Back to Payroll
                </Button>
            </div>
        );
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = `${monthNames[(slip.month || 1) - 1]} ${slip.year}`;

    return (
        <div className="container-fluid p-3">
            {/* Top Bar (Hidden on Print) */}
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} className="me-1" /> Back
                </Button>
                <div className="d-flex gap-2">
                    {(isSuperAdmin || can('payroll', 'print') || can('payroll', 'read')) && (
                        <>
                            <Button variant="outline-primary" size="sm" onClick={handlePrint}>
                                <Printer size={16} className="me-1" /> Print
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleDownloadPdf}
                                disabled={downloadMutation.isPending}
                                className="d-flex align-items-center"
                            >
                                {downloadMutation.isPending ? (
                                    <>
                                        <Spinner size="sm" className="me-2" /> Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} className="me-1" /> Download PDF
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Printable Payslip Card */}
            <div className="salary-slip-card shadow-sm">
                {/* Firm Header */}
                <div className="text-center border-bottom pb-3 mb-3">
                    <h3 className="fw-bold mb-1 text-dark">{slip.firmName || 'KS ENGINEERING WORKS'}</h3>
                    <div className="text-muted small">
                        {slip.branchName && `${slip.branchName} • `}
                        {slip.firmGstin && `GSTIN: ${slip.firmGstin} • `}
                        {slip.firmPhone && `Phone: ${slip.firmPhone}`}
                    </div>
                    <div className="badge bg-primary text-uppercase px-3 py-1 mt-2" style={{ letterSpacing: '1px' }}>
                        Salary Payslip — {monthName}
                    </div>
                </div>

                {/* Employee Info Grid */}
                <div className="p-3 mb-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Row className="g-2 small">
                        <Col md={6}>
                            <div className="d-flex"><strong style={{ width: '130px' }}>Employee Code:</strong> <span className="font-monospace text-primary">{slip.empCode}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>Employee Name:</strong> <span className="fw-bold text-dark">{slip.firstName} {slip.lastName || ''}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>Department:</strong> <span>{slip.department || '—'}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>Designation:</strong> <span>{slip.designation || '—'}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>Employment Type:</strong> <span>{slip.employmentType || '—'}</span></div>
                        </Col>
                        <Col md={6}>
                            <div className="d-flex"><strong style={{ width: '130px' }}>Bank Name:</strong> <span>{slip.bankName || '—'}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>Account No:</strong> <span className="font-monospace">{slip.accountNumber || '—'}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>IFSC Code:</strong> <span className="font-monospace">{slip.ifscCode || '—'}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>PAN / UAN:</strong> <span>{slip.panNumber || '—'} / {slip.uanNumber || '—'}</span></div>
                            <div className="d-flex"><strong style={{ width: '130px' }}>ESI Number:</strong> <span>{slip.esiNumber || '—'}</span></div>
                        </Col>
                    </Row>
                </div>

                {/* Attendance Summary Bar */}
                <div className="p-2 mb-3 rounded text-center small fw-semibold" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <Row className="g-1">
                        <Col>Total Days: <span className="text-dark">{slip.totalWorkingDays || slip.total_working_days || 0}</span></Col>
                        <Col>Present: <span className="text-success">{slip.presentDays || slip.present_days || 0}</span></Col>
                        <Col>Absent: <span className="text-danger">{slip.absentDays || slip.absent_days || 0}</span></Col>
                        <Col>Half Days: <span className="text-warning">{slip.halfDays || slip.half_days || 0}</span></Col>
                        <Col>Paid Leaves: <span className="text-primary">{slip.paidLeaveDays || slip.paid_leave_days || 0}</span></Col>
                        <Col>Overtime: <span className="text-dark">{slip.overtimeHours || slip.overtime_hours || 0} hrs</span></Col>
                    </Row>
                </div>

                {/* Earnings and Deductions Table */}
                <Row className="g-3 mb-3">
                    {/* Left: Earnings */}
                    <Col md={6}>
                        <div className="border rounded overflow-hidden">
                            <div className="p-2 bg-light fw-bold text-success border-bottom">
                                Earnings (+)
                            </div>
                            <Table size="sm" className="mb-0">
                                <tbody>
                                    {slip.earnings?.map((e, idx) => (
                                        <tr key={idx}>
                                            <td className="ps-3">{e.component_name}</td>
                                            <td className="text-end pe-3 fw-semibold">₹{parseFloat(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                    {parseFloat(slip.overtimePay || slip.overtime_pay || 0) > 0 && (
                                        <tr>
                                            <td className="ps-3">Overtime Pay ({slip.overtimeHours || slip.overtime_hours} hrs)</td>
                                            <td className="text-end pe-3 fw-semibold">₹{parseFloat(slip.overtimePay || slip.overtime_pay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    )}
                                    {(!slip.earnings || slip.earnings.length === 0) && !(parseFloat(slip.overtimePay || slip.overtime_pay || 0) > 0) && (
                                        <tr>
                                            <td colSpan="2" className="text-center py-2 text-muted small">No earnings recorded</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="table-light border-top">
                                    <tr>
                                        <th className="ps-3">Total Earnings (A)</th>
                                        <th className="text-end pe-3 text-success">
                                            ₹{(parseFloat(slip.grossEarnings || slip.gross_earnings || 0) + parseFloat(slip.overtimePay || slip.overtime_pay || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </th>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    </Col>

                    {/* Right: Deductions */}
                    <Col md={6}>
                        <div className="border rounded overflow-hidden">
                            <div className="p-2 bg-light fw-bold text-danger border-bottom">
                                Deductions (-)
                            </div>
                            <Table size="sm" className="mb-0">
                                <tbody>
                                    {slip.deductions?.length === 0 ? (
                                        <tr>
                                            <td colSpan="2" className="text-center py-2 text-muted small">No deductions applied</td>
                                        </tr>
                                    ) : (
                                        slip.deductions?.map((d, idx) => (
                                            <tr key={idx}>
                                                <td className="ps-3">{d.component_name}</td>
                                                <td className="text-end pe-3 fw-semibold">₹{parseFloat(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                                <tfoot className="table-light border-top">
                                    <tr>
                                        <th className="ps-3">Total Deductions (B)</th>
                                        <th className="text-end pe-3 text-danger">
                                            ₹{parseFloat(slip.totalDeductions || slip.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </th>
                                    </tr>
                                </tfoot>
                            </Table>
                        </div>
                    </Col>
                </Row>

                {/* Net Salary Highlight Box */}
                <div className="p-3 mb-4 rounded d-flex justify-content-between align-items-center" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                    <div>
                        <div className="small text-muted fw-semibold">NET SALARY PAYABLE (A - B)</div>
                        <div className="small text-muted fst-italic">Payment Status: <strong>{slip.status}</strong></div>
                        {parseFloat(slip.advance_deduction || slip.advanceDeduction || 0) > 0 && (
                            <div className="small text-danger fw-semibold mt-1">
                                Includes Salary Advance Recovery: ₹{parseFloat(slip.advance_deduction || slip.advanceDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                        )}
                    </div>
                    <div className="text-end">
                        <h3 className="fw-bold text-success mb-0">
                            ₹{parseFloat(slip.netSalary || slip.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>

                {/* Signatures */}
                <Row className="mt-5 pt-4 text-center text-muted small">
                    <Col xs={6}>
                        <div style={{ borderTop: '1px solid #cbd5e1', width: '180px', margin: '0 auto' }}></div>
                        <div className="mt-2">Employee Signature</div>
                    </Col>
                    <Col xs={6}>
                        <div style={{ borderTop: '1px solid #cbd5e1', width: '180px', margin: '0 auto' }}></div>
                        <div className="mt-2">Authorized Signatory</div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default SalarySlipView;

