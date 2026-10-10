import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Button, Table, Form, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { FaWallet, FaCheckCircle, FaExclamationTriangle, FaBolt, FaFileInvoice } from 'react-icons/fa';
import Decimal from 'decimal.js';
import { toast } from 'react-toastify';
import moment from 'moment';
import { useUnpaidInvoices, useApplyCustomerAdvance } from '../../hooks/usePaymentApi';

const toDec = (val) => {
    try {
        if (val === "" || val === null || val === undefined || isNaN(val)) return new Decimal(0);
        return new Decimal(val).toDecimalPlaces(2);
    } catch {
        return new Decimal(0);
    }
};

/**
 * ApplyAdvanceModal Component
 * Interactive knock-off engine to adjust unallocated customer advances against unpaid invoices.
 */
const ApplyAdvanceModal = ({ show, onHide, receipt }) => {
    const partyId = receipt?.partyId || receipt?.party_id;
    const receiptNo = receipt?.paymentNo || receipt?.payment_no || `REC-${receipt?.id}`;
    const initialAdvance = Number(receipt?.unallocatedAmount ?? receipt?.unallocated_amount ?? 0);

    const { data: unpaidInvoices = [], isLoading: isLoadingInvoices } = useUnpaidInvoices(partyId);
    const { mutate: applyAdvanceMutate, isPending: isApplying } = useApplyCustomerAdvance();

    // Allocations map: { [invoiceId]: { allocatedAmount, tdsAmount, writeOffAmount, writeOffReason } }
    const [allocations, setAllocations] = useState({});

    // Reset allocations on modal open
    useEffect(() => {
        if (show) {
            setAllocations({});
        }
    }, [show, receipt?.id]);

    const initialAdvanceDec = useMemo(() => toDec(initialAdvance), [initialAdvance]);

    // Handle allocation input change
    const handleAllocationChange = (invId, val) => {
        const num = parseFloat(val);
        const cleanVal = isNaN(num) || num < 0 ? 0 : num;
        setAllocations((prev) => ({
            ...prev,
            [invId]: {
                ...(prev[invId] || {}),
                allocatedAmount: cleanVal
            }
        }));
    };

    // Calculations & Validation
    const { totalAllocated, remainingAdvance, isOverAllocated, rowDetails, canSubmit } = useMemo(() => {
        let totalAlloc = new Decimal(0);
        const details = {};
        let hasError = false;

        unpaidInvoices.forEach((inv) => {
            const invId = inv.id || inv.invoiceId;
            const balanceDue = toDec(inv.balanceAmount ?? inv.balance_amount ?? inv.total ?? 0);
            const alloc = allocations[invId] || {};
            const allocCash = toDec(alloc.allocatedAmount);

            totalAlloc = totalAlloc.plus(allocCash);

            const isRowOver = allocCash.gt(balanceDue.plus(0.01));
            if (isRowOver) hasError = true;

            details[invId] = {
                allocatedAmount: allocCash.toNumber(),
                balanceDue: balanceDue.toNumber(),
                remainingBalance: Math.max(0, balanceDue.minus(allocCash).toNumber()),
                isRowOver
            };
        });

        const overAllocated = totalAlloc.gt(initialAdvanceDec.plus(0.01));
        const remaining = initialAdvanceDec.minus(totalAlloc);

        const valid = !overAllocated && !hasError && totalAlloc.gt(0);

        return {
            totalAllocated: totalAlloc.toNumber(),
            remainingAdvance: Math.max(0, remaining.toNumber()),
            isOverAllocated: overAllocated,
            rowDetails: details,
            canSubmit: valid
        };
    }, [allocations, unpaidInvoices, initialAdvanceDec]);

    // "Apply Max" 1-click helper for an invoice
    const handleApplyMax = (inv) => {
        const invId = inv.id || inv.invoiceId;
        const balanceDue = toDec(inv.balanceAmount ?? inv.balance_amount ?? inv.total ?? 0);

        // Current cash allocated to other rows
        const currentThisRow = toDec(allocations[invId]?.allocatedAmount);
        const otherAllocated = toDec(totalAllocated).minus(currentThisRow);
        const availableFromAdvance = Decimal.max(0, initialAdvanceDec.minus(otherAllocated));

        // Amount to allocate is minimum of balanceDue and remaining available advance
        const targetAmount = Decimal.min(balanceDue, availableFromAdvance);
        handleAllocationChange(invId, targetAmount.toNumber());
    };

    // Submit handler
    const handleSubmit = () => {
        if (!canSubmit) return;

        const payload = [];
        unpaidInvoices.forEach((inv) => {
            const invId = inv.id || inv.invoiceId;
            const row = rowDetails[invId];
            if (row && row.allocatedAmount > 0) {
                payload.push({
                    invoiceId: Number(invId),
                    allocatedAmount: row.allocatedAmount,
                    tdsAmount: 0,
                    writeOffAmount: 0,
                    writeOffReason: null
                });
            }
        });

        applyAdvanceMutate(
            { receiptId: receipt.id, allocations: payload },
            {
                onSuccess: () => {
                    onHide();
                }
            }
        );
    };

    const advanceUsedPercent = initialAdvance > 0 ? Math.min(100, Math.round((totalAllocated / initialAdvance) * 100)) : 0;

    return (
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static">
            <Modal.Header closeButton className="border-bottom py-2.5 px-3">
                <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
                    <div
                        className="rounded-circle bg-soft-info d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                    >
                        <FaWallet className="text-info" size={14} />
                    </div>
                    <span>Apply Advance Balance to Invoices</span>
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="p-3">
                {/* Advance Balance Card */}
                <div className="p-3 rounded bg-light border mb-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                        <div>
                            <span className="text-muted small d-block">Receipt Voucher:</span>
                            <strong className="font-monospace text-primary">{receiptNo}</strong>
                            <span className="text-muted small ms-2">
                                (Customer: {receipt?.customerName || receipt?.partyName || 'Customer'})
                            </span>
                        </div>
                        <div className="text-end">
                            <span className="text-muted small d-block">Available Advance:</span>
                            <h5 className="fw-bold font-monospace text-success mb-0">
                                ₹{initialAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h5>
                        </div>
                    </div>

                    {/* Progress Bar for Advance Usage */}
                    <div className="mt-2">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                            <span>Advance Allocated: <strong>₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                            <span>Remaining Balance: <strong>₹{remainingAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                        <ProgressBar
                            now={advanceUsedPercent}
                            variant={isOverAllocated ? 'danger' : advanceUsedPercent === 100 ? 'success' : 'info'}
                            style={{ height: '7px' }}
                        />
                    </div>
                </div>

                {/* Over-allocation warning */}
                {isOverAllocated && (
                    <Alert variant="danger" className="py-2 px-3 mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.84rem' }}>
                        <FaExclamationTriangle size={14} className="flex-shrink-0" />
                        <div>Total allocated amount exceeds the available advance balance by ₹{(totalAllocated - initialAdvance).toFixed(2)}.</div>
                    </Alert>
                )}

                {/* Invoices List */}
                <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.88rem' }}>
                    Select Invoices to Knock Off
                </h6>

                {isLoadingInvoices ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" size="sm" variant="primary" />
                        <p className="text-muted small mt-2">Loading customer's unpaid invoices...</p>
                    </div>
                ) : unpaidInvoices.length === 0 ? (
                    <Alert variant="secondary" className="text-center py-4 mb-0">
                        <FaFileInvoice size={24} className="text-secondary opacity-50 mb-2" />
                        <p className="mb-0 fw-semibold">No unpaid invoices found for this customer.</p>
                        <span className="small text-muted">The advance balance remains safely on customer's ledger for future billings.</span>
                    </Alert>
                ) : (
                    <div className="table-responsive border rounded" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <Table hover className="align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                            <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.70rem' }}>
                                <tr>
                                    <th className="py-2 px-3">Invoice #</th>
                                    <th className="py-2 px-2">Date</th>
                                    <th className="py-2 px-2 text-end">Balance Due</th>
                                    <th className="py-2 px-2 text-center" style={{ width: '85px' }}>Action</th>
                                    <th className="py-2 px-2 text-end" style={{ width: '140px' }}>Knock-Off Amount (₹)</th>
                                    <th className="py-2 px-3 text-end" style={{ width: '110px' }}>Remaining</th>
                                </tr>
                            </thead>
                            <tbody>
                                {unpaidInvoices.map((inv) => {
                                    const invId = inv.id || inv.invoiceId;
                                    const invNo = inv.invoiceNo || inv.invoice_no || `INV-${invId}`;
                                    const row = rowDetails[invId] || {};
                                    const allocVal = allocations[invId]?.allocatedAmount ?? '';
                                    const isRowOver = row.isRowOver;

                                    return (
                                        <tr key={invId} className={isRowOver ? 'table-danger' : ''}>
                                            <td className="px-3 py-2 font-monospace fw-bold text-primary">
                                                {invNo}
                                            </td>
                                            <td className="px-2 py-2 text-muted">
                                                {inv.invoiceDate ? moment(inv.invoiceDate).format('DD/MM/YYYY') : '-'}
                                            </td>
                                            <td className="px-2 py-2 text-end font-monospace fw-semibold text-danger">
                                                ₹{(row.balanceDue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="px-2 py-0.5 d-inline-flex align-items-center gap-1"
                                                    style={{ fontSize: '0.70rem' }}
                                                    disabled={isApplying || (row.balanceDue <= 0)}
                                                    onClick={() => handleApplyMax(inv)}
                                                >
                                                    <FaBolt size={9} />
                                                    <span>Max</span>
                                                </Button>
                                            </td>
                                            <td className="px-2 py-2">
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    value={allocVal === 0 ? '' : allocVal}
                                                    disabled={isApplying}
                                                    isInvalid={isRowOver}
                                                    onChange={(e) => handleAllocationChange(invId, e.target.value)}
                                                    className="font-monospace text-end py-1"
                                                    style={{ fontSize: '0.82rem' }}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-end font-monospace">
                                                {isRowOver ? (
                                                    <span className="text-danger small fw-bold">Over balance</span>
                                                ) : (
                                                    <span className="text-muted">
                                                        ₹{(row.remainingBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="border-top py-2 px-3">
                <Button variant="outline-secondary" size="sm" onClick={onHide} disabled={isApplying}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    className="px-3 d-flex align-items-center gap-1.5"
                    disabled={!canSubmit || isApplying}
                    onClick={handleSubmit}
                >
                    {isApplying ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        <FaCheckCircle size={12} />
                    )}
                    <span>Confirm Knock-Off (₹{totalAllocated.toLocaleString('en-IN')})</span>
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ApplyAdvanceModal;
