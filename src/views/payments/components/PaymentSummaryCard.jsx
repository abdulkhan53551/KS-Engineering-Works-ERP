import React from 'react';
import { Spinner } from 'react-bootstrap';
import { FaSave, FaExclamationCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

/**
 * Real-time Payment & Invariants Summary Card
 * Sticky bottom bar showing received cash, allocations, retained advance, and validation guards.
 */
const PaymentSummaryCard = ({
    calculations = {},
    isSubmitting = false,
    onSubmit,
    onCancel,
    cancelUrl = '/payments/receipts'
}) => {
    const {
        totalReceived = 0,
        totalCashAllocated = 0,
        totalTdsDeducted = 0,
        totalWriteOff = 0,
        unallocatedAdvance = 0,
        isCashOverAllocated = false,
        errors = [],
        isValid = false
    } = calculations;

    return (
        <div className="sticky-summary-dock">
            {/* Error Banner if Invariants Broken */}
            {errors.length > 0 && (
                <div className="allocation-error-card mb-2.5 shadow-sm d-flex align-items-start">
                    <FaExclamationCircle className="text-danger mt-1 flex-shrink-0" size={16} style={{ marginRight: '0.65rem' }} />
                    <div className="flex-grow-1">
                        <strong className="d-block mb-1 text-danger">
                            Please resolve the following allocation errors before submitting:
                        </strong>
                        <ul>
                            {errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="summary-dock-inner d-flex flex-wrap align-items-center justify-content-between gap-3">
                {/* Summary Metrics */}
                <div className="d-flex flex-wrap align-items-center">
                    {/* Received */}
                    <div className="dock-metric">
                        <span className="metric-label">Total Received</span>
                        <span className="metric-value text-dark">
                            ₹{Number(totalReceived).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="dock-divider" />

                    {/* Allocated Cash */}
                    <div className="dock-metric">
                        <span className="metric-label">Allocated Cash</span>
                        <span className={`metric-value ${isCashOverAllocated ? 'text-danger' : 'text-primary'}`}>
                            ₹{Number(totalCashAllocated).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="dock-divider" />

                    {/* Advance Retained */}
                    <div className="dock-metric">
                        <span className="metric-label">Advance Retained</span>
                        {unallocatedAdvance > 0 ? (
                            <span className="metric-value text-success">
                                +₹{Number(unallocatedAdvance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        ) : (
                            <span className="metric-value text-muted">₹0.00</span>
                        )}
                    </div>

                    {/* TDS Deductions */}
                    {totalTdsDeducted > 0 && (
                        <>
                            <div className="dock-divider" />
                            <div className="dock-metric">
                                <span className="metric-label">TDS Deductions</span>
                                <span className="metric-value text-secondary">
                                    ₹{Number(totalTdsDeducted).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </>
                    )}

                    {/* Write-offs */}
                    {totalWriteOff > 0 && (
                        <>
                            <div className="dock-divider" />
                            <div className="dock-metric">
                                <span className="metric-label">Write-off / Discount</span>
                                <span className="metric-value text-warning">
                                    ₹{Number(totalWriteOff).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="d-flex align-items-center gap-2">
                    {onCancel ? (
                        <button
                            type="button"
                            className="btn btn-action-cancel"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                    ) : (
                        <Link to={cancelUrl} className="btn btn-action-cancel text-decoration-none">
                            Cancel
                        </Link>
                    )}

                    <button
                        type="button"
                        className="btn btn-action-save d-flex align-items-center"
                        disabled={isSubmitting || !isValid}
                        onClick={onSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" style={{ marginRight: '0.5rem' }} />
                                <span>Recording Payment...</span>
                            </>
                        ) : (
                            <>
                                <FaSave size={14} style={{ marginRight: '0.5rem' }} />
                                <span>Save & Generate Receipt</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSummaryCard;
