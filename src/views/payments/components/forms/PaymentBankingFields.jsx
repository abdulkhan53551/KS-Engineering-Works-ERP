import React from 'react';
import { Row, Col, Form, Card } from 'react-bootstrap';
import { usePaymentMode } from '../../../dashboard/hooks/api.hooks';
import { FaMoneyBillWave, FaReceipt } from 'react-icons/fa';
import { numberToIndianRupeesWords } from '../../../../utilities/numberToWords';

/**
 * Reusable Banking & Transaction Info Form Component for Payments
 */
const PaymentBankingFields = ({
    register,
    errors,
    watchPaymentModeId,
    watchTotalAmount,
    disabled = false
}) => {
    const { data: paymentModes = [], isLoading: isLoadingModes } = usePaymentMode();

    // Check if the selected mode is Cheque or Bank Transfer to customize labels
    const selectedModeObj = paymentModes.find(
        (m) => Number(m.id || m.value) === Number(watchPaymentModeId)
    );
    const modeLabel = (selectedModeObj?.label || selectedModeObj?.name || '').toLowerCase();
    const isCheque = modeLabel.includes('cheque');
    const isBank = modeLabel.includes('bank') || modeLabel.includes('neft') || modeLabel.includes('rtgs') || modeLabel.includes('imps') || modeLabel.includes('online');
    const isUpi = modeLabel.includes('upi') || modeLabel.includes('qr');

    let referenceLabel = 'Reference / Transaction ID';
    let referencePlaceholder = 'e.g. UTR1234567890';
    if (isCheque) {
        referenceLabel = 'Cheque Number';
        referencePlaceholder = 'e.g. CHQ-458921';
    } else if (isBank) {
        referenceLabel = 'UTR / Transfer Ref Number';
        referencePlaceholder = 'e.g. UTR9876543210';
    } else if (isUpi) {
        referenceLabel = 'UPI / Transaction Ref ID';
        referencePlaceholder = 'e.g. 324109823451';
    }

    const numericTotal = Number(watchTotalAmount);

    return (
        <Card className="receipt-form-card mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <span className="section-icon-badge" style={{ marginRight: '0.65rem' }}>
                        <FaMoneyBillWave size={16} />
                    </span>
                    <div>
                        <h6 className="section-title">Payment & Banking Details</h6>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Specify payment mode, received amount, and financial references
                        </span>
                    </div>
                </div>
                <span className="step-pill">Step 2</span>
            </Card.Header>
            <Card.Body className="p-3.5">
                <Row className="g-3">
                    {/* Payment Mode */}
                    <Col lg={4} md={6}>
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Select
                                id="paymentModeId"
                                isInvalid={!!errors.paymentModeId}
                                disabled={disabled || isLoadingModes}
                                {...register('paymentModeId')}
                            >
                                <option value="">-- Select Payment Mode --</option>
                                {paymentModes.map((mode) => (
                                    <option key={mode.id || mode.value} value={mode.id || mode.value}>
                                        {mode.label || mode.name}
                                    </option>
                                ))}
                            </Form.Select>
                            <Form.Label htmlFor="paymentModeId">
                                Payment Mode <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                                {errors.paymentModeId?.message}
                            </Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    {/* Total Cash Received */}
                    <Col lg={4} md={6}>
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="number"
                                step="0.01"
                                min="0"
                                id="totalAmount"
                                placeholder="Total Cash Received (₹)"
                                isInvalid={!!errors.totalAmount}
                                disabled={disabled}
                                onWheel={(e) => e.target.blur()}
                                {...register('totalAmount')}
                                className="font-monospace fw-bold"
                            />
                            <Form.Label htmlFor="totalAmount">
                                Total Cash Received (₹) <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                                {errors.totalAmount?.message}
                            </Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    {/* Reference / Transaction ID */}
                    <Col lg={4} md={6}>
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="text"
                                id="referenceNo"
                                placeholder={referencePlaceholder}
                                isInvalid={!!errors.referenceNo}
                                disabled={disabled}
                                {...register('referenceNo')}
                            />
                            <Form.Label htmlFor="referenceNo">
                                {referenceLabel}
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                                {errors.referenceNo?.message}
                            </Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    {/* Transfer / Reference Date */}
                    <Col lg={4} md={6}>
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="date"
                                id="referenceDate"
                                placeholder="Reference Date"
                                isInvalid={!!errors.referenceDate}
                                disabled={disabled}
                                {...register('referenceDate')}
                            />
                            <Form.Label htmlFor="referenceDate">
                                {isCheque ? 'Cheque / Clearance Date' : 'Transfer / Ref Date'}
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                                {errors.referenceDate?.message}
                            </Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    {/* Deposited / Drawn Bank Name */}
                    <Col lg={4} md={6}>
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="text"
                                id="bankName"
                                placeholder="Bank Name"
                                isInvalid={!!errors.bankName}
                                disabled={disabled}
                                {...register('bankName')}
                            />
                            <Form.Label htmlFor="bankName">
                                Bank Name (Optional)
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                                {errors.bankName?.message}
                            </Form.Control.Feedback>
                        </Form.Floating>
                    </Col>

                    {/* Notes / Remarks */}
                    <Col lg={4} md={6}>
                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                            <Form.Control
                                type="text"
                                id="notes"
                                placeholder="Notes / Remarks"
                                isInvalid={!!errors.notes}
                                disabled={disabled}
                                {...register('notes')}
                            />
                            <Form.Label htmlFor="notes">
                                Notes / Remarks (Optional)
                            </Form.Label>
                            <Form.Control.Feedback type="invalid">
                                {errors.notes?.message}
                            </Form.Control.Feedback>
                        </Form.Floating>
                    </Col>
                </Row>

                {/* Amount in words live banner */}
                {numericTotal > 0 && (
                    <div className="amount-words-banner mt-3 d-flex align-items-center">
                        <FaReceipt size={13} className="text-success flex-shrink-0" style={{ marginRight: '0.5rem' }} />
                        <span className="fw-bold" style={{ marginRight: '0.45rem' }}>Amount in Words:</span>
                        <span className="text-dark font-monospace">{numberToIndianRupeesWords(numericTotal)}</span>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PaymentBankingFields;
