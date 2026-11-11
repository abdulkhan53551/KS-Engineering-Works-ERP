import React from 'react';
import { Card, Table, Button, Badge, Form } from 'react-bootstrap';
import { FaFileInvoiceDollar, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaBolt } from 'react-icons/fa';
import moment from 'moment';

/**
 * Vendor Bill Allocation Grid Component
 * Allows allocating cash disbursements, TDS deductions, and discounts across unpaid vendor bills.
 */
const VendorBillAllocationGrid = ({
    unpaidBills = [],
    isLoading = false,
    allocations = {},
    calculations = {},
    updateAllocationRow,
    handlePayFull,
    disabled = false
}) => {
    const { rowDetails = {} } = calculations;

    // Aggregates for footer
    const totalBalanceDue = React.useMemo(() => {
        return unpaidBills.reduce((sum, bill) => {
            const row = rowDetails[bill.id || bill.vendorBillId];
            return sum + Number(row?.balanceDue ?? bill.balanceAmount ?? bill.balance_amount ?? bill.total ?? 0);
        }, 0);
    }, [unpaidBills, rowDetails]);

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
            <Card className="border-0 shadow-sm bg-white mb-3" style={{ borderRadius: '10px' }}>
                <Card.Body className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm mb-2" role="status" />
                    <p className="text-muted small mb-0">Loading vendor's unpaid bills...</p>
                </Card.Body>
            </Card>
        );
    }

    if (unpaidBills.length === 0) {
        return (
            <Card className="border-0 shadow-sm bg-light mb-3" style={{ borderRadius: '10px' }}>
                <Card.Body className="p-4 text-center">
                    <div className="d-inline-flex p-3 rounded-circle bg-white text-primary shadow-sm mb-3">
                        <FaInfoCircle size={24} />
                    </div>
                    <h6 className="fw-bold text-dark mb-1">No Unpaid Bills for this Vendor</h6>
                    <p className="text-muted small mb-2" style={{ maxWidth: '520px', margin: '0 auto' }}>
                        This supplier currently has no outstanding bills.
                        Any payment recorded will be held <strong>100% as Vendor Advance</strong> on their account and can be adjusted against future bills.
                    </p>
                    <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 fs-7">
                        100% Pure Advance Payment
                    </Badge>
                </Card.Body>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-sm bg-white mb-0" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <Card.Header
                className="bg-white border-bottom py-2.5 px-3.5 d-flex justify-content-between align-items-center flex-wrap gap-2"
                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
            >
                <div className="d-flex align-items-center">
                    <div
                        className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '32px', height: '32px', marginRight: '0.65rem' }}
                    >
                        <FaFileInvoiceDollar className="text-primary" size={14} />
                    </div>
                    <div>
                        <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.88rem' }}>
                            Unpaid Bills Settlement Matrix
                        </h6>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                            {unpaidBills.length} pending bill(s) available for allocation
                        </span>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted small" style={{ fontSize: '0.76rem' }}>Total Pending:</span>
                    <span className="fw-bold font-monospace text-danger" style={{ fontSize: '0.86rem' }}>
                        ₹{totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </Card.Header>

            <div className="table-responsive">
                <Table hover className="align-middle mb-0 text-nowrap" style={{ fontSize: '0.82rem' }}>
                    <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.70rem', letterSpacing: '0.04em' }}>
                        <tr>
                            <th className="py-2.5 px-3">Bill Details</th>
                            <th className="py-2.5 px-2 text-end">Original Total</th>
                            <th className="py-2.5 px-2 text-end">Balance Due</th>
                            <th className="py-2.5 px-2 text-center" style={{ width: '80px' }}>Action</th>
                            <th className="py-2.5 px-2 text-end" style={{ width: '135px' }}>Allocated Cash (₹)</th>
                            <th className="py-2.5 px-2 text-end" style={{ width: '105px' }}>TDS (₹)</th>
                            <th className="py-2.5 px-2 text-end" style={{ width: '115px' }}>Discount/Write-Off (₹)</th>
                            <th className="py-2.5 px-3 text-end" style={{ width: '120px' }}>Remaining Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {unpaidBills.map((bill) => {
                            const billId = bill.id || bill.vendorBillId;
                            const billNo = bill.billNo || bill.bill_no || `BILL-${billId}`;
                            const billTotal = Number(bill.total || 0);
                            const row = rowDetails[billId] || {};
                            const alloc = allocations[billId] || {};

                            const allocCash = Number(alloc.allocatedAmount || 0);
                            const tds = Number(alloc.tdsAmount || 0);
                            const writeOff = Number(alloc.writeOffAmount || 0);
                            const writeOffReason = alloc.writeOffReason || '';

                            const balanceDue = Number(row.balanceDue ?? bill.balanceAmount ?? bill.balance_amount ?? billTotal);
                            const remaining = Number(row.remainingBalance ?? balanceDue);
                            const isFullySettled = remaining <= 0 && balanceDue > 0;
                            const isOverSettled = row.isOverSettled;
                            const isWriteOffMissingReason = row.isWriteOffMissingReason;

                            return (
                                <tr key={billId} className={isOverSettled ? 'table-danger' : isFullySettled ? 'table-success bg-opacity-25' : ''}>
                                    {/* Bill Metadata */}
                                    <td className="px-3 py-2">
                                        <div className="d-flex flex-column">
                                            <span className="fw-bold font-monospace text-primary">
                                                {billNo}
                                            </span>
                                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                Date: {bill.billDate ? moment(bill.billDate).format('DD/MM/YYYY') : '-'}
                                                {bill.dueDate && ` • Due: ${moment(bill.dueDate).format('DD/MM/YYYY')}`}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Original Bill Total */}
                                    <td className="px-2 py-2 text-end font-monospace text-muted">
                                        ₹{billTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>

                                    {/* Current Balance Due */}
                                    <td className="px-2 py-2 text-end font-monospace fw-semibold text-danger">
                                        ₹{balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>

                                    {/* Pay Full Auto-fill Button */}
                                    <td className="px-2 py-2 text-center">
                                        <Button
                                            variant={isFullySettled ? 'success' : 'outline-primary'}
                                            size="sm"
                                            className="px-2 py-0.5 d-inline-flex align-items-center gap-1"
                                            style={{ fontSize: '0.70rem', borderRadius: '4px' }}
                                            disabled={disabled || balanceDue <= 0}
                                            onClick={() => handlePayFull(bill)}
                                        >
                                            {isFullySettled ? (
                                                <>
                                                    <FaCheckCircle size={10} />
                                                    <span>Settled</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaBolt size={10} />
                                                    <span>Pay Full</span>
                                                </>
                                            )}
                                        </Button>
                                    </td>

                                    {/* Allocated Cash Input */}
                                    <td className="px-2 py-2">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={alloc.allocatedAmount === 0 ? '' : (alloc.allocatedAmount ?? '')}
                                            disabled={disabled}
                                            isInvalid={isOverSettled}
                                            onChange={(e) => updateAllocationRow(billId, 'allocatedAmount', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="font-monospace text-end py-1 no-spinners"
                                            style={{ fontSize: '0.82rem', borderRadius: '5px', borderColor: '#cbd5e1' }}
                                        />
                                    </td>

                                    {/* TDS Deduction Input */}
                                    <td className="px-2 py-2">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={alloc.tdsAmount === 0 ? '' : (alloc.tdsAmount ?? '')}
                                            disabled={disabled}
                                            onChange={(e) => updateAllocationRow(billId, 'tdsAmount', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="font-monospace text-end py-1 no-spinners"
                                            style={{ fontSize: '0.82rem', borderRadius: '5px', borderColor: '#cbd5e1' }}
                                        />
                                    </td>

                                    {/* Write-off Input & Reason */}
                                    <td className="px-2 py-2">
                                        <Form.Control
                                            type="number"
                                            size="sm"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={alloc.writeOffAmount === 0 ? '' : (alloc.writeOffAmount ?? '')}
                                            disabled={disabled}
                                            onChange={(e) => updateAllocationRow(billId, 'writeOffAmount', e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            className="font-monospace text-end py-1 no-spinners"
                                            style={{ fontSize: '0.82rem', borderRadius: '5px', borderColor: '#cbd5e1' }}
                                        />
                                        {writeOff > 0 && (
                                            <Form.Control
                                                type="text"
                                                size="sm"
                                                placeholder="Write-off reason *"
                                                value={writeOffReason}
                                                isInvalid={isWriteOffMissingReason}
                                                disabled={disabled}
                                                onChange={(e) => updateAllocationRow(billId, 'writeOffReason', e.target.value)}
                                                className="mt-1 py-0.5"
                                                style={{ fontSize: '0.72rem' }}
                                            />
                                        )}
                                    </td>

                                    {/* Remaining Balance Due */}
                                    <td className="px-3 py-2 text-end font-monospace">
                                        {isOverSettled ? (
                                            <span className="text-danger fw-bold d-flex align-items-center justify-content-end gap-1">
                                                <FaExclamationTriangle size={11} /> Over-settled
                                            </span>
                                        ) : isFullySettled ? (
                                            <span className="text-success fw-bold">₹0.00</span>
                                        ) : (
                                            <span className="text-secondary fw-semibold">
                                                ₹{remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                    {/* Summary Aggregate Footer */}
                    <tfoot className="bg-light border-top text-dark" style={{ fontSize: '0.78rem' }}>
                        <tr>
                            <th className="px-3 py-2 text-uppercase fw-bold">Total Settled:</th>
                            <th className="px-2 py-2 text-end text-muted font-monospace">-</th>
                            <th className="px-2 py-2 text-end text-danger font-monospace">
                                ₹{totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </th>
                            <th className="px-2 py-2 text-center">-</th>
                            <th className="px-2 py-2 text-end text-primary font-monospace fw-bold">
                                ₹{totalAllocatedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </th>
                            <th className="px-2 py-2 text-end text-muted font-monospace">
                                ₹{totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </th>
                            <th className="px-2 py-2 text-end text-muted font-monospace">
                                ₹{totalWriteOff.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </th>
                            <th className="px-3 py-2 text-end text-danger font-monospace fw-bold">
                                ₹{totalRemainingDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </th>
                        </tr>
                    </tfoot>
                </Table>
            </div>
        </Card>
    );
};

export default VendorBillAllocationGrid;
