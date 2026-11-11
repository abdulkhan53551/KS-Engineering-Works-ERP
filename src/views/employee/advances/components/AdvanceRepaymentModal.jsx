import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Spinner, ProgressBar } from 'react-bootstrap';
import { Banknote, AlertCircle, CheckCircle, Check, ArrowRight, Sparkles, Building2, Landmark, Wallet } from 'lucide-react';
import { useAdvanceRepaymentSubmit } from '../hooks/useAdvanceSubmit';
import '../../employee.css';

const AdvanceRepaymentModal = ({ show, onHide, advance }) => {
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        amount: '',
        repaymentDate: today,
        repaymentType: 'DIRECT_CASH',
        remarks: ''
    });

    const totalAmount = parseFloat(
        advance?.totalAmount !== undefined
            ? advance.totalAmount
            : (advance?.total_amount || 0)
    );

    const remainingBalance = parseFloat(
        advance?.remainingBalance !== undefined
            ? advance.remainingBalance
            : (advance?.remaining_balance || 0)
    );

    const {
        handleSubmit,
        errors,
        setErrors,
        isLoading: isPending
    } = useAdvanceRepaymentSubmit({
        advanceId: advance?.id,
        remainingBalance,
        onHide
    });

    const recoveredAmount = Math.max(0, totalAmount - remainingBalance);
    const recoveryPct = totalAmount > 0 ? Math.min(100, Math.round((recoveredAmount / totalAmount) * 100)) : 0;

    useEffect(() => {
        if (show && advance) {
            setFormData({
                amount: '',
                repaymentDate: new Date().toISOString().split('T')[0],
                repaymentType: 'DIRECT_CASH',
                remarks: ''
            });
            setErrors({});
        }
    }, [show, advance]);

    const handleSelectPreset = (presetAmount) => {
        setFormData(prev => ({ ...prev, amount: presetAmount.toString() }));
        if (errors.amount) {
            setErrors(prev => ({ ...prev, amount: null }));
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const onSubmit = (e) => {
        handleSubmit(e, formData);
    };

    if (!advance) return null;

    const employeeName = advance.firstName
        ? `${advance.firstName} ${advance.lastName || ''}`.trim()
        : (advance.name || 'Employee');

    const empCode = advance.empCode || advance.employeeCode || '';
    const avatarInitials = (
        (advance.firstName?.[0] || 'E') +
        (advance.lastName?.[0] || '')
    ).toUpperCase();

    // Live calculation calculations
    const amountNum = parseFloat(formData.amount);
    const hasValidAmount = !isNaN(amountNum) && amountNum > 0;
    const isFullSettlement = hasValidAmount && Math.abs(amountNum - remainingBalance) < 0.01;
    const isExcess = hasValidAmount && amountNum > remainingBalance;
    const projectedRemaining = hasValidAmount
        ? Math.max(0, Math.round((remainingBalance - amountNum) * 100) / 100)
        : remainingBalance;

    const halfBalance = Math.round(remainingBalance / 2);

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            backdrop="static"
            contentClassName="advance-modal-content advance-repayment-modal"
        >
            <Modal.Header closeButton className="border-0 pb-2 px-4 pt-4">
                <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-3">
                    <div
                        className="rounded-3 d-flex align-items-center justify-content-center shadow-sm"
                        style={{
                            width: '40px',
                            height: '40px',
                            background: '#ecfdf5',
                            color: '#059669',
                            border: '1px solid #a7f3d0'
                        }}
                    >
                        <Banknote size={22} />
                    </div>
                    <div>
                        <div className="fw-bold text-dark" style={{ letterSpacing: '-0.01em' }}>
                            Record Direct Repayment
                        </div>
                        <div className="text-muted small fw-normal" style={{ fontSize: '0.78rem' }}>
                            Collect cash or bank repayment from employee outside payroll.
                        </div>
                    </div>
                </Modal.Title>
            </Modal.Header>

            <Form onSubmit={onSubmit} noValidate>
                <Modal.Body className="px-4 py-2">
                    {/* Hero Loan Status Card with Visual Recovery Progress */}
                    <div className="repay-summary-card mb-3 shadow-none">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-2">
                                <div className="emp-avatar">{avatarInitials}</div>
                                <div>
                                    <div className="fw-bold text-dark fs-6 lh-sm">{employeeName}</div>
                                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                        {empCode ? `[${empCode}] ` : ''}{advance.department || 'Staff Member'}
                                    </div>
                                </div>
                            </div>
                            <div className="repay-due-badge">
                                <div className="label">Current Due</div>
                                <div className="amount">₹{remainingBalance.toLocaleString('en-IN')}</div>
                            </div>
                        </div>

                        {/* Loan Overview & Recovery Progress */}
                        <div className="pt-2 border-top border-slate-200">
                            <div className="d-flex justify-content-between align-items-center small text-muted mb-1" style={{ fontSize: '0.74rem' }}>
                                <span>
                                    Total Loan: <strong className="text-dark">₹{totalAmount.toLocaleString('en-IN')}</strong>
                                </span>
                                <span>
                                    Recovered: <strong className="text-success">₹{recoveredAmount.toLocaleString('en-IN')} ({recoveryPct}%)</strong>
                                </span>
                            </div>
                            <ProgressBar
                                now={recoveryPct}
                                variant="success"
                                style={{ height: '5px' }}
                                className="rounded-pill bg-slate-200"
                            />
                        </div>
                    </div>

                    <Row className="g-3">
                        {/* Repayment Amount & Quick Preset Chips */}
                        <Col md={12}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label mb-0 fw-semibold text-dark" style={{ fontSize: '0.80rem' }}>
                                    Repayment Amount (₹) <span className="text-danger">*</span>
                                </label>

                                {/* Quick Presets Pills */}
                                <div className="d-flex align-items-center gap-1">
                                    <button
                                        type="button"
                                        className={`quick-action-chip ${formData.amount === remainingBalance.toString() ? 'active-chip' : ''}`}
                                        onClick={() => handleSelectPreset(remainingBalance)}
                                        title="Pay entire remaining balance"
                                    >
                                        <Sparkles size={12} className={formData.amount === remainingBalance.toString() ? 'text-success' : 'text-primary'} />
                                        <span>Full Due (₹{remainingBalance.toLocaleString('en-IN')})</span>
                                    </button>

                                    {remainingBalance >= 100 && (
                                        <button
                                            type="button"
                                            className={`quick-action-chip ${formData.amount === halfBalance.toString() ? 'active-chip' : ''}`}
                                            onClick={() => handleSelectPreset(halfBalance)}
                                            title="Pay half of the remaining due"
                                        >
                                            50% (₹{halfBalance.toLocaleString('en-IN')})
                                        </button>
                                    )}

                                    {formData.amount && (
                                        <button
                                            type="button"
                                            className="quick-action-chip text-muted"
                                            onClick={() => handleChange('amount', '')}
                                            title="Clear input"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Crisp Monospace Currency Input */}
                            <div className={`repay-amount-wrapper ${errors.amount ? 'is-invalid' : ''}`}>
                                <span className="repay-currency-sign">₹</span>
                                <input
                                    id="repayAmount"
                                    type="number"
                                    min="1"
                                    max={remainingBalance}
                                    step="0.01"
                                    placeholder="0.00"
                                    className="repay-amount-input"
                                    value={formData.amount}
                                    onChange={(e) => handleChange('amount', e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                            {errors.amount && (
                                <div className="text-danger small mt-1 fw-medium" style={{ fontSize: '0.76rem' }}>
                                    {errors.amount}
                                </div>
                            )}

                            {/* Reactive Real-time Balance Preview */}
                            {hasValidAmount && (
                                <div className={`live-balance-box ${isExcess ? 'excess' : isFullSettlement ? 'full-settle' : 'standard'}`}>
                                    {isExcess ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <AlertCircle size={15} />
                                            <span>
                                                Amount exceeds current due by <strong>₹{(amountNum - remainingBalance).toLocaleString('en-IN')}</strong>. Maximum payable is ₹{remainingBalance.toLocaleString('en-IN')}.
                                            </span>
                                        </div>
                                    ) : isFullSettlement ? (
                                        <div className="d-flex align-items-center gap-2">
                                            <Sparkles size={15} className="text-success" />
                                            <span>
                                                <strong>Full Settlement:</strong> Loan will be completely paid off (Remaining ₹0) and marked as <strong>CLOSED</strong>.
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-muted">Balance after payment:</span>
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="text-decoration-line-through text-muted small">
                                                    ₹{remainingBalance.toLocaleString('en-IN')}
                                                </span>
                                                <ArrowRight size={13} className="text-muted" />
                                                <span className="fw-bold text-dark fs-6" style={{ fontFamily: 'monospace' }}>
                                                    ₹{projectedRemaining.toLocaleString('en-IN')}
                                                </span>
                                                <span className="badge bg-success-subtle text-success border border-success-subtle" style={{ fontSize: '0.70rem' }}>
                                                    −₹{amountNum.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </Col>

                        {/* Payment Channel (Tactile Segmented Selector) */}
                        <Col md={12}>
                            <label className="form-label mb-1 fw-semibold text-dark" style={{ fontSize: '0.80rem' }}>
                                Payment Channel <span className="text-danger">*</span>
                            </label>
                            <div className="payment-mode-grid">
                                <div
                                    className={`payment-mode-card ${formData.repaymentType === 'DIRECT_CASH' ? 'selected' : ''}`}
                                    onClick={() => handleChange('repaymentType', 'DIRECT_CASH')}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <Wallet size={16} className={formData.repaymentType === 'DIRECT_CASH' ? 'text-success' : 'text-muted'} />
                                        <span>Direct Cash</span>
                                    </div>
                                    {formData.repaymentType === 'DIRECT_CASH' && <Check size={16} className="text-success" />}
                                </div>

                                <div
                                    className={`payment-mode-card ${formData.repaymentType === 'DIRECT_BANK' ? 'selected' : ''}`}
                                    onClick={() => handleChange('repaymentType', 'DIRECT_BANK')}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <Landmark size={16} className={formData.repaymentType === 'DIRECT_BANK' ? 'text-success' : 'text-muted'} />
                                        <span>Bank Transfer / UPI</span>
                                    </div>
                                    {formData.repaymentType === 'DIRECT_BANK' && <Check size={16} className="text-success" />}
                                </div>
                            </div>
                        </Col>

                        {/* Repayment Date */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="repayDate"
                                    type="date"
                                    placeholder="Repayment Date"
                                    value={formData.repaymentDate}
                                    onChange={(e) => handleChange('repaymentDate', e.target.value)}
                                    isInvalid={!!errors.repaymentDate}
                                    required
                                />
                                <Form.Label htmlFor="repayDate">
                                    Repayment Date <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.repaymentDate}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>

                        {/* Remarks / Reference Notes */}
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                                <Form.Control
                                    id="repayRemarks"
                                    as="textarea"
                                    placeholder="Receipt Notes"
                                    value={formData.remarks}
                                    onChange={(e) => handleChange('remarks', e.target.value)}
                                    style={{ height: '70px' }}
                                />
                                <Form.Label htmlFor="repayRemarks">
                                    {formData.repaymentType === 'DIRECT_BANK'
                                        ? 'Bank Reference / UTR / UPI Ref / Notes (Optional)'
                                        : 'Receipt Notes / Cash Voucher # (Optional)'}
                                </Form.Label>
                            </Form.Floating>
                        </Col>
                    </Row>
                </Modal.Body>

                <Modal.Footer className="border-0 px-4 pb-4 pt-3 d-flex justify-content-between align-items-center">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onHide}
                        disabled={isPending}
                        className="px-3 fw-medium"
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="success"
                        size="sm"
                        type="submit"
                        disabled={isPending || !hasValidAmount || isExcess}
                        className="px-4 py-2 shadow-sm d-inline-flex align-items-center gap-2 fw-semibold"
                        style={{
                            background: isFullSettlement
                                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '8px'
                        }}
                    >
                        {isPending ? (
                            <>
                                <Spinner size="sm" animation="border" />
                                <span>Recording Repayment...</span>
                            </>
                        ) : isFullSettlement ? (
                            <>
                                <Sparkles size={16} />
                                <span>Settle Full Due (₹{remainingBalance.toLocaleString('en-IN')})</span>
                            </>
                        ) : hasValidAmount ? (
                            <>
                                <CheckCircle size={16} />
                                <span>Record Repayment • ₹{amountNum.toLocaleString('en-IN')}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={16} />
                                <span>Record Repayment</span>
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AdvanceRepaymentModal;

