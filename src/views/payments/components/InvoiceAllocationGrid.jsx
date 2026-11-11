import React from 'react';
import { Card, Table, Button, Badge } from 'react-bootstrap';
import { FaFileInvoice, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaBolt } from 'react-icons/fa';
import moment from 'moment';

/**
 * Invoice Allocation Matrix Component
 * Allows allocating cash, TDS deductions, and write-off discounts across unpaid invoices.
 */
const InvoiceAllocationGrid = ({
    unpaidInvoices = [],
    isLoading = false,
    allocations = {},
    calculations = {},
    updateAllocationRow,
    handlePayFull,
    disabled = false
}) => {
    const { rowDetails = {} } = calculations;

    // Calculate column aggregates for professional settlement footer
    const totalBalanceDue = React.useMemo(() => {
        return unpaidInvoices.reduce((sum, inv) => {
            const row = rowDetails[inv.id || inv.invoiceId];
            return sum + Number(row?.balanceDue ?? inv.balanceAmount ?? inv.balance_amount ?? inv.total ?? 0);
        }, 0);
    }, [unpaidInvoices, rowDetails]);

    const totalAllocatedCash = React.useMemo(() => {
        return Object.values(rowDetails).reduce((sum, r) => sum + Number(r.allocatedAmount || 0), 0);
    }, [rowDetails]);

    const totalTds = React.useMemo(() => {
        return Object.values(rowDetails).reduce((sum, r) => sum + Number(r.tdsAmount || 0), 0);
    }, [rowDetails]);

    const totalWriteOff = React.useMemo(() => {
        return Object.values(rowDetails).reduce((sum, r) => sum + Number(r.writeOffAmount || 0), 0);
    }, [rowDetails]);

    const totalRemainingDue = React.useMemo(() => {
        return Object.values(rowDetails).reduce((sum, r) => sum + Number(r.remainingBalance || 0), 0);
    }, [rowDetails]);

    if (isLoading) {
        return (
            <Card className="receipt-form-card mb-3">
                <Card.Body className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm mb-2" role="status" />
                    <p className="text-muted small mb-0">Loading customer's unpaid invoices...</p>
                </Card.Body>
            </Card>
        );
    }

    if (unpaidInvoices.length === 0) {
        return (
            <Card className="receipt-form-card mb-3 bg-light">
                <Card.Body className="p-4 text-center">
                    <div className="d-inline-flex p-3 rounded-circle bg-white text-primary shadow-sm mb-3">
                        <FaInfoCircle size={24} />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">No Unpaid Invoices for this Customer</h6>
                    <p className="text-muted small mb-2" style={{ maxWidth: '500px', margin: '0 auto' }}>
                        This customer currently has no outstanding invoices.
                        Any payment recorded will be held <strong>100% as Customer Advance</strong> on their account and can be settled against future invoices.
                    </p>
                    <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 fs-7">
                        100% Advance Payment Mode
                    </Badge>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="receipt-form-card allocation-matrix-card mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center">
                    <span className="section-icon-badge" style={{ marginRight: '0.65rem' }}>
                        <FaFileInvoice size={16} />
                    </span>
                    <div>
                        <div className="d-flex align-items-center" style={{ gap: '0.65rem' }}>
                            <h6 className="section-title">Invoice Settlement Allocation Matrix</h6>
                            <span
                                className="d-inline-flex align-items-center font-monospace"
                                style={{
                                    backgroundColor: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '6px',
                                    padding: '0.18rem 0.55rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.02em'
                                }}
                            >
                                {unpaidInvoices.length} Unpaid {unpaidInvoices.length === 1 ? 'Invoice' : 'Invoices'}
                            </span>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                            Distribute funds, deduct TDS, or record invoice write-offs
                        </span>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small d-none d-md-inline" style={{ fontSize: '0.74rem' }}>
                        Tip: Click <strong>"Pay Full"</strong> to automatically allocate remaining balance.
                    </span>
                    <span className="step-pill">Step 3</span>
                </div>
            </Card.Header>

            <div className="table-responsive">
                <Table className="align-middle allocation-table mb-0">
                    <thead>
                        <tr>
                            <th style={{ minWidth: '175px' }}>Invoice Details</th>
                            <th style={{ minWidth: '110px' }} className="text-end">Total Amount</th>
                            <th style={{ minWidth: '115px' }} className="text-end">Balance Due</th>
                            <th style={{ minWidth: '155px' }}>Cash to Allocate (₹)</th>
                            <th style={{ minWidth: '135px' }}>TDS Deducted (₹)</th>
                            <th style={{ minWidth: '145px' }}>Write-Off / Disc. (₹)</th>
                            <th style={{ minWidth: '160px' }}>Write-Off Reason</th>
                            <th style={{ minWidth: '125px' }} className="text-end">Net Remaining</th>
                            <th style={{ minWidth: '110px' }} className="text-center">Quick Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unpaidInvoices.map((inv) => {
                            const invId = inv.id || inv.invoiceId;
                            const row = rowDetails[invId] || {
                                allocatedAmount: 0,
                                tdsAmount: 0,
                                writeOffAmount: 0,
                                writeOffReason: '',
                                balanceDue: Number(inv.balanceAmount ?? inv.balance_amount ?? inv.total ?? 0),
                                totalSettled: 0,
                                remainingBalance: Number(inv.balanceAmount ?? inv.balance_amount ?? inv.total ?? 0),
                                isOverSettled: false,
                                isWriteOffMissingReason: false
                            };

                            const hasWriteOff = Number(row.writeOffAmount) > 0;
                            const isFullySettled = row.remainingBalance === 0;

                            return (
                                <tr key={invId} className={row.isOverSettled ? 'row-oversettled' : (isFullySettled ? 'row-cleared' : '')}>
                                    {/* Invoice Details */}
                                    <td>
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold text-primary font-monospace" style={{ fontSize: '0.84rem' }}>
                                                {inv.invoiceNo || inv.invoice_no}
                                            </span>
                                            <span className="text-muted" style={{ fontSize: '0.70rem' }}>
                                                Dated: {inv.invoiceDate ? moment(inv.invoiceDate).format('DD/MM/YYYY') : '-'}
                                                {inv.dueDate && ` | Due: ${moment(inv.dueDate).format('DD/MM/YYYY')}`}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Total Amount */}
                                    <td className="text-end text-muted font-monospace" style={{ fontSize: '0.82rem' }}>
                                        ₹{Number(inv.total ?? inv.grandTotal ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>

                                    {/* Balance Due */}
                                    <td className="text-end">
                                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 font-monospace px-2 py-1" style={{ fontSize: '0.80rem' }}>
                                            ₹{Number(row.balanceDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>

                                    {/* Cash to Allocate Input */}
                                    <td>
                                        <div className="table-input-wrapper">
                                            <span className="input-prefix">₹</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={disabled}
                                                value={row.allocatedAmount === 0 ? '' : row.allocatedAmount}
                                                onChange={(e) => updateAllocationRow(invId, 'allocatedAmount', e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="0.00"
                                                className={`form-control table-ctrl font-monospace text-end ${row.isOverSettled ? 'is-invalid-field' : ''}`}
                                            />
                                        </div>
                                    </td>

                                    {/* TDS Deducted Input */}
                                    <td>
                                        <div className="table-input-wrapper">
                                            <span className="input-prefix">₹</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={disabled}
                                                value={row.tdsAmount === 0 ? '' : row.tdsAmount}
                                                onChange={(e) => updateAllocationRow(invId, 'tdsAmount', e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="0.00"
                                                className="form-control table-ctrl font-monospace text-end"
                                            />
                                        </div>
                                    </td>

                                    {/* Write-off Input */}
                                    <td>
                                        <div className="table-input-wrapper">
                                            <span className="input-prefix">₹</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                disabled={disabled}
                                                value={row.writeOffAmount === 0 ? '' : row.writeOffAmount}
                                                onChange={(e) => updateAllocationRow(invId, 'writeOffAmount', e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="0.00"
                                                className="form-control table-ctrl font-monospace text-end"
                                            />
                                        </div>
                                    </td>

                                    {/* Write-off Reason Input */}
                                    <td>
                                        <div className="table-input-wrapper">
                                            <input
                                                type="text"
                                                disabled={disabled || !hasWriteOff}
                                                value={row.writeOffReason || ''}
                                                onChange={(e) => updateAllocationRow(invId, 'writeOffReason', e.target.value)}
                                                placeholder={hasWriteOff ? 'Reason required *' : 'Reason if write-off > 0'}
                                                className={`form-control table-ctrl-text ${row.isWriteOffMissingReason ? 'is-invalid-field' : ''}`}
                                            />
                                        </div>
                                    </td>

                                    {/* Net Remaining Balance */}
                                    <td className="text-end font-monospace">
                                        {row.isOverSettled ? (
                                            <span className="text-danger fw-bold d-flex align-items-center justify-content-end" style={{ fontSize: '0.78rem' }}>
                                                <FaExclamationTriangle size={11} style={{ marginRight: '0.4rem' }} />
                                                <span>Over-settled!</span>
                                            </span>
                                        ) : row.remainingBalance === 0 ? (
                                            <span className="text-success fw-bold d-flex align-items-center justify-content-end" style={{ fontSize: '0.78rem' }}>
                                                <FaCheckCircle size={11} style={{ marginRight: '0.4rem' }} />
                                                <span>₹0.00 (Cleared)</span>
                                            </span>
                                        ) : (
                                            <span className="text-dark fw-bold" style={{ fontSize: '0.82rem' }}>
                                                ₹{Number(row.remainingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </td>

                                    {/* Pay Full Quick Button */}
                                    <td className="text-center">
                                        <Button
                                            variant={isFullySettled ? "outline-secondary" : "outline-primary"}
                                            size="sm"
                                            disabled={disabled || isFullySettled}
                                            onClick={() => handlePayFull(inv)}
                                            className="btn-pay-full d-inline-flex align-items-center"
                                        >
                                            <FaBolt size={10} style={{ marginRight: '0.35rem' }} />
                                            <span>Pay Full</span>
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0', fontSize: '0.82rem' }}>
                            <td className="fw-bold text-dark py-2.5">
                                Total ({unpaidInvoices.length} {unpaidInvoices.length === 1 ? 'Invoice' : 'Invoices'})
                            </td>
                            <td className="text-end font-monospace text-muted py-2.5">—</td>
                            <td className="text-end font-monospace py-2.5">
                                <span className="fw-bold text-danger">
                                    ₹{totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="text-end font-monospace py-2.5 pe-3">
                                <span className="fw-bold text-primary">
                                    ₹{totalAllocatedCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="text-end font-monospace py-2.5 pe-3">
                                <span className="fw-semibold text-secondary">
                                    ₹{totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="text-end font-monospace py-2.5 pe-3">
                                <span className="fw-semibold text-secondary">
                                    ₹{totalWriteOff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td className="text-center text-muted small py-2.5">—</td>
                            <td className="text-end font-monospace py-2.5">
                                <span className={`fw-bold ${totalRemainingDue === 0 ? 'text-success' : 'text-dark'}`}>
                                    ₹{totalRemainingDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </Table>
            </div>
        </Card>
    );
};

export default InvoiceAllocationGrid;
