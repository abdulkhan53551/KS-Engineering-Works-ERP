import React from 'react';
import { Modal, Button, Table, Badge, Row, Col, Spinner, ProgressBar } from 'react-bootstrap';
import { DollarSign, Calendar, Clock, CheckCircle, AlertTriangle, ShieldCheck, User } from 'lucide-react';
import { useAdvanceById, useTogglePauseAdvance } from '../../common/hooks/useEmployeeApi';
import '../../employee.css';

const AdvanceDetailModal = ({ show, onHide, advanceId, onOpenRepayModal }) => {
    const { data: advance, isLoading } = useAdvanceById(advanceId, { enabled: Boolean(advanceId && show) });
    const { mutateAsync: togglePause, isPending: isTogglingPause } = useTogglePauseAdvance();

    if (!show) return null;

    const handleTogglePause = async () => {
        if (!advance) return;
        try {
            await togglePause({
                id: advance.id,
                isPaused: !advance.is_paused && !advance.isPaused
            });
        } catch (e) {
            // Toast handled in hook
        }
    };

    const totalAmount = parseFloat(advance?.total_amount || advance?.totalAmount || 0);
    const recoveredAmount = parseFloat(advance?.recovered_amount || advance?.recoveredAmount || 0);
    const remainingBalance = parseFloat(advance?.remaining_balance || advance?.remainingBalance || 0);
    const recoveryProgress = totalAmount > 0 ? Math.min(100, Math.round((recoveredAmount / totalAmount) * 100)) : 0;

    const isPaused = advance?.is_paused || advance?.isPaused;
    const isClosed = advance?.status === 'CLOSED';

    const repayments = Array.isArray(advance?.repayments) ? advance.repayments : [];

    return (
        <Modal show={show} onHide={onHide} centered size="lg" backdrop="static" contentClassName="advance-modal-content">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
                    <DollarSign size={20} className="text-primary" />
                    Advance & Recovery Ledger
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="pt-3">
                {isLoading ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-muted small">Loading advance ledger...</div>
                    </div>
                ) : !advance ? (
                    <div className="text-center py-4 text-muted">Advance record not found.</div>
                ) : (
                    <>
                        {/* Top Profile Card */}
                        <div className="bg-light p-3 rounded-3 mb-3">
                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <User size={16} className="text-primary" />
                                        <span className="fw-bold fs-6">
                                            {advance.firstName} {advance.lastName || ''}
                                        </span>
                                        {advance.empCode && (
                                            <Badge bg="secondary" className="px-2">{advance.empCode}</Badge>
                                        )}
                                    </div>
                                    <div className="text-muted small mb-1">
                                        <strong>Department:</strong> {advance.department || '—'} | <strong>Designation:</strong> {advance.designation || '—'}
                                    </div>
                                    <div className="text-muted small">
                                        <strong>Base Salary:</strong> ₹{parseFloat(advance.baseSalary || 0).toLocaleString('en-IN')} / {(advance.salaryType || '')?.toLowerCase()}
                                    </div>
                                </Col>

                                <Col md={6} className="text-md-end">
                                    <div className="mb-2">
                                        {isClosed ? (
                                            <Badge bg="success" className="px-3 py-1">Fully Settled</Badge>
                                        ) : isPaused ? (
                                            <Badge bg="warning" text="dark" className="px-3 py-1">Recovery Paused</Badge>
                                        ) : (
                                            <Badge bg="primary" className="px-3 py-1">Active</Badge>
                                        )}
                                    </div>
                                    <div className="text-muted small">
                                        Disbursed on: <strong>{new Date(advance.advance_date || advance.advanceDate).toLocaleDateString()}</strong>
                                    </div>
                                    <div className="text-muted small">
                                        Payment Mode: <strong>{advance.payment_mode || advance.paymentMode}</strong>
                                    </div>
                                </Col>
                            </Row>

                            {/* Progress Bar & Amounts */}
                            <div className="mt-3 pt-3 border-top">
                                <div className="d-flex justify-content-between align-items-center small mb-1">
                                    <span className="text-muted">
                                        Recovered: <strong className="text-success">₹{recoveredAmount.toLocaleString('en-IN')}</strong> of ₹{totalAmount.toLocaleString('en-IN')}
                                    </span>
                                    <span className="fw-bold text-danger">
                                        Outstanding: ₹{remainingBalance.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <ProgressBar
                                    now={recoveryProgress}
                                    variant={isClosed ? 'success' : 'primary'}
                                    style={{ height: '8px' }}
                                    className="rounded-pill"
                                />
                            </div>
                        </div>

                        {/* Recovery Terms Info */}
                        <Row className="g-2 mb-3">
                            <Col md={4}>
                                <div className="p-2 border rounded text-center">
                                    <div className="text-muted small">Recovery Plan</div>
                                    <div className="fw-bold">{advance.recovery_type || advance.recoveryType}</div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-2 border rounded text-center">
                                    <div className="text-muted small">Monthly Deduction</div>
                                    <div className="fw-bold text-primary">
                                        ₹{parseFloat(advance.monthly_deduction || advance.monthlyDeduction || 0).toLocaleString('en-IN')}
                                    </div>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-2 border rounded text-center">
                                    <div className="text-muted small">Disbursed By</div>
                                    <div className="fw-semibold text-truncate">{advance.disbursedByUserName || 'Admin'}</div>
                                </div>
                            </Col>
                        </Row>

                        {advance.remarks && (
                            <div className="alert alert-info py-2 px-3 small mb-3">
                                <strong>Remarks:</strong> {advance.remarks}
                            </div>
                        )}

                        {/* Repayments History */}
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="fw-bold mb-0 text-dark">Repayment & Deduction History</h6>
                            <span className="badge bg-light text-dark">{repayments.length} Records</span>
                        </div>

                        {repayments.length === 0 ? (
                            <div className="text-center py-4 border rounded text-muted small">
                                No repayments or deductions recorded yet.
                            </div>
                        ) : (
                            <div className="table-responsive border rounded">
                                <Table hover size="sm" className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Amount Deducted</th>
                                            <th>Balance After</th>
                                            <th>Reference / Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repayments.map((rep) => {
                                            const isPayroll = rep.repaymentType === 'PAYROLL_DEDUCTION';
                                            return (
                                                <tr key={rep.id}>
                                                    <td className="small">
                                                        {new Date(rep.repaymentDate).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        {isPayroll ? (
                                                            <Badge bg="info" text="dark" className="px-2">Payroll Auto-Deduction</Badge>
                                                        ) : (
                                                            <Badge bg="success" className="px-2">Cash / Direct</Badge>
                                                        )}
                                                    </td>
                                                    <td className="fw-bold text-success">
                                                        ₹{parseFloat(rep.amountDeducted || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="fw-semibold text-dark">
                                                        ₹{parseFloat(rep.balanceAfter || 0).toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="text-muted small">
                                                        {rep.remarks || (rep.slipMonth ? `Salary Slip (${rep.slipMonth}/${rep.slipYear})` : '—')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </>
                )}
            </Modal.Body>

            <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
                <div>
                    {!isClosed && advance && (
                        <Button
                            variant={isPaused ? 'outline-success' : 'outline-warning'}
                            size="sm"
                            onClick={handleTogglePause}
                            disabled={isTogglingPause}
                            className="me-2"
                        >
                            {isPaused ? 'Resume Deductions' : 'Pause Deductions'}
                        </Button>
                    )}
                    {!isClosed && advance && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => {
                                onHide();
                                if (onOpenRepayModal) onOpenRepayModal(advance);
                            }}
                        >
                            Record Manual Repayment
                        </Button>
                    )}
                </div>

                <Button variant="secondary" size="sm" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AdvanceDetailModal;
