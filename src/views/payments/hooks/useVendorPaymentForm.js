import { useState, useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import moment from 'moment';
import { toast } from 'react-toastify';
import { createVendorPaymentValidationSchema } from '../../../validation/vendorPayment.validation';
import {
    useCreateVendorPayment,
    useUpdateVendorPayment,
    usePaymentById,
    useNextOutwardPaymentNumber
} from './usePaymentApi';
import { useUnpaidVendorBills } from '../../vendor-bills/hooks/useVendorBillApi';
import { usePaymentMode } from '../../dashboard/hooks/api.hooks';
import useVendorPaymentAllocation from './useVendorPaymentAllocation';
import { getPartyById } from '../../party/api';
import { downloadVendorPaymentPdf } from '../api';

/**
 * useVendorPaymentForm Hook
 * Encapsulates all state, queries, mutations, allocation calculations,
 * dynamic reference labels, and event handlers for VendorPaymentForm.
 */
export const useVendorPaymentForm = ({ mode = 'create' } = {}) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const queryPartyId = searchParams.get('partyId');
    const queryBillId = searchParams.get('billId');

    const isView = mode === 'view' || window.location.pathname.endsWith('/view');
    const isEdit = mode === 'edit' || (Boolean(id) && !isView);
    const isCreate = !isEdit && !isView;

    // Fetch existing payment if editing or viewing
    const { data: existingPayment, isLoading: isLoadingPayment } = usePaymentById(id);

    // Queries & Mutations
    const { data: nextVoucherNo = 'PAY-AUTO' } = useNextOutwardPaymentNumber();
    const { mutate: createPaymentMutate, isPending: isCreating } = useCreateVendorPayment();
    const { mutate: updatePaymentMutate, isPending: isUpdating } = useUpdateVendorPayment();
    const { data: paymentModes = [], isLoading: isLoadingModes } = usePaymentMode();

    const [selectedParty, setSelectedParty] = useState(null);
    const [isAllocationsInitialized, setIsAllocationsInitialized] = useState(false);

    // Form setup
    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(createVendorPaymentValidationSchema),
        defaultValues: {
            paymentDate: new Date(),
            partyId: '',
            vendorName: '',
            totalAmount: '',
            paymentModeId: '',
            referenceNo: '',
            referenceDate: new Date(),
            bankName: '',
            notes: ''
        }
    });

    const watchPartyId = useWatch({ control, name: 'partyId' });
    const watchVendorName = useWatch({ control, name: 'vendorName' });
    const watchTotalAmount = useWatch({ control, name: 'totalAmount' });
    const watchPaymentModeId = useWatch({ control, name: 'paymentModeId' });

    // Fetch unpaid vendor bills
    const { data: rawUnpaidBills = [], isLoading: isLoadingBills } = useUnpaidVendorBills(watchPartyId);

    // Merge existing allocations into unpaid bills list for edit/view modes so previously settled bills appear with restored balances
    const effectiveBills = useMemo(() => {
        if (isCreate || !existingPayment) return rawUnpaidBills;

        const prevAllocations = existingPayment.allocations || existingPayment.vendorBillAllocations || [];
        if (!prevAllocations.length) return rawUnpaidBills;

        const billsMap = new Map();
        rawUnpaidBills.forEach((b) => {
            const bId = Number(b.id || b.vendorBillId);
            billsMap.set(bId, { ...b });
        });

        prevAllocations.forEach((a) => {
            const bId = Number(a.vendorBillId || a.billId);
            const allocCash = Number(a.allocatedAmount || a.allocated_amount || 0);
            const allocTds = Number(a.tdsAmount || a.tds_amount || 0);
            const allocWo = Number(a.writeOffAmount || a.write_off_amount || 0);
            const totalSettledByVoucher = allocCash + allocTds + allocWo;

            if (billsMap.has(bId)) {
                const cur = billsMap.get(bId);
                const curBal = Number(cur.balanceAmount ?? cur.balance_amount ?? 0);
                billsMap.set(bId, {
                    ...cur,
                    balanceAmount: curBal + totalSettledByVoucher,
                    balance_amount: curBal + totalSettledByVoucher
                });
            } else {
                billsMap.set(bId, {
                    id: bId,
                    vendorBillId: bId,
                    billNo: a.billNo || a.bill_no || `BILL-${bId}`,
                    billDate: a.billDate || a.bill_date,
                    total: a.billTotal || a.bill_total || totalSettledByVoucher,
                    balanceAmount: totalSettledByVoucher,
                    balance_amount: totalSettledByVoucher,
                    paymentStatus: 'PAID'
                });
            }
        });

        return Array.from(billsMap.values());
    }, [rawUnpaidBills, existingPayment, isCreate]);

    // Allocation logic hook
    const {
        allocations,
        calculations,
        updateAllocationRow,
        clearAllocations,
        handlePayFull,
        getAllocationsPayload
    } = useVendorPaymentAllocation(effectiveBills, watchTotalAmount);

    // Populate form data when editing or viewing existing payment
    useEffect(() => {
        if ((isEdit || isView) && existingPayment) {
            const party = existingPayment.party || {};
            const pId = Number(existingPayment.partyId || party.id || 0);
            const vName = existingPayment.vendorName || existingPayment.partyName || party.displayName || party.legalName || '';

            reset({
                paymentDate: existingPayment.paymentDate ? new Date(existingPayment.paymentDate) : new Date(),
                partyId: pId || '',
                vendorName: vName,
                totalAmount: Number(existingPayment.totalAmount || existingPayment.total_amount || 0),
                paymentModeId: Number(existingPayment.paymentModeId || existingPayment.payment_mode_id || ''),
                referenceNo: existingPayment.referenceNo || existingPayment.reference_no || '',
                referenceDate: existingPayment.referenceDate ? new Date(existingPayment.referenceDate) : new Date(),
                bankName: existingPayment.bankName || existingPayment.bank_name || '',
                notes: existingPayment.notes || ''
            });

            if (party.id || pId) {
                setSelectedParty(party.id ? party : { id: pId, displayName: vName });
            }
        }
    }, [existingPayment, isEdit, isView, reset]);

    // Pre-populate previous allocations into allocation hook state
    useEffect(() => {
        if ((isEdit || isView) && existingPayment && !isAllocationsInitialized && effectiveBills.length > 0) {
            const prevAllocations = existingPayment.allocations || existingPayment.vendorBillAllocations || [];
            if (prevAllocations.length > 0) {
                prevAllocations.forEach((a) => {
                    const bId = Number(a.vendorBillId || a.billId);
                    if (bId) {
                        updateAllocationRow(bId, 'allocatedAmount', Number(a.allocatedAmount || a.allocated_amount || 0));
                        if (a.tdsAmount || a.tds_amount) {
                            updateAllocationRow(bId, 'tdsAmount', Number(a.tdsAmount || a.tds_amount || 0));
                        }
                        if (a.writeOffAmount || a.write_off_amount) {
                            updateAllocationRow(bId, 'writeOffAmount', Number(a.writeOffAmount || a.write_off_amount || 0));
                        }
                        if (a.writeOffReason || a.write_off_reason) {
                            updateAllocationRow(bId, 'writeOffReason', a.writeOffReason || a.write_off_reason || '');
                        }
                    }
                });
                setIsAllocationsInitialized(true);
            }
        }
    }, [existingPayment, isEdit, isView, isAllocationsInitialized, effectiveBills, updateAllocationRow]);

    // Handle query params on create mode (e.g. redirected from Vendor Bill "Record Payment")
    useEffect(() => {
        if (isCreate && queryPartyId) {
            const pId = Number(queryPartyId);
            setValue('partyId', pId, { shouldValidate: true });
            getPartyById(pId)
                .then((res) => {
                    const party = res?.data ?? res;
                    if (party) {
                        setSelectedParty(party);
                        setValue('vendorName', party.displayName || party.legalName || '', { shouldValidate: true });
                    }
                })
                .catch(() => { });
        }
    }, [isCreate, queryPartyId, setValue]);

    // Auto-allocate specific bill if queryBillId passed on create
    useEffect(() => {
        if (isCreate && queryBillId && effectiveBills.length > 0 && !watchTotalAmount) {
            const target = effectiveBills.find((b) => Number(b.id || b.vendorBillId) === Number(queryBillId));
            if (target) {
                const bal = Number(target.balanceAmount ?? target.balance_amount ?? target.total ?? 0);
                if (bal > 0) {
                    setValue('totalAmount', bal, { shouldValidate: true });
                    updateAllocationRow(target.id || target.vendorBillId, 'allocatedAmount', bal);
                }
            }
        }
    }, [isCreate, queryBillId, effectiveBills, watchTotalAmount, setValue, updateAllocationRow]);

    // Dynamic mode labels for banking references
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

    // Party selection
    const handleSelectParty = (party) => {
        if (!party) return;
        clearAllocations();
        setSelectedParty(party);
        const pId = Number(party.id);
        const name = party.displayName || party.legalName || '';
        setValue('partyId', pId, { shouldValidate: true, shouldDirty: true });
        setValue('vendorName', name, { shouldValidate: true, shouldDirty: true });
    };

    const handleClearParty = () => {
        clearAllocations();
        setSelectedParty(null);
        setValue('partyId', '', { shouldValidate: true, shouldDirty: true });
        setValue('vendorName', '', { shouldValidate: true, shouldDirty: true });
    };

    const handleDetachParty = () => {
        clearAllocations();
        setSelectedParty(null);
        setValue('partyId', '', { shouldValidate: true, shouldDirty: true });
    };

    // Form submit
    const onSubmit = (formData) => {
        if (isView) return;

        if (!formData.partyId && !selectedParty?.id) {
            toast.error('Please select a vendor.');
            return;
        }

        if (calculations.errors.length > 0) {
            toast.error(calculations.errors[0] || 'Please resolve allocation issues.');
            return;
        }

        const allocationsPayload = getAllocationsPayload();
        const pDateStr = moment(formData.paymentDate || new Date()).format('YYYY-MM-DD');

        const payload = {
            paymentDate: pDateStr,
            partyId: Number(formData.partyId || selectedParty?.id),
            totalAmount: Number(formData.totalAmount),
            paymentModeId: Number(formData.paymentModeId),
            referenceNo: formData.referenceNo ? formData.referenceNo.trim() : undefined,
            referenceDate: formData.referenceDate ? moment(formData.referenceDate).format('YYYY-MM-DD') : undefined,
            bankName: formData.bankName ? formData.bankName.trim() : undefined,
            notes: formData.notes ? formData.notes.trim() : undefined,
            allocations: allocationsPayload
        };

        if (isEdit && id) {
            updatePaymentMutate(
                { id, data: payload },
                {
                    onSuccess: () => {
                        navigate(`/payments/vendor-payments/${id}`);
                    }
                }
            );
        } else {
            createPaymentMutate(payload, {
                onSuccess: () => {
                    navigate('/payments/vendor-payments');
                }
            });
        }
    };

    const onValidationErrors = (formErrors) => {
        const errorKeys = Object.keys(formErrors);
        if (errorKeys.length > 0) {
            const firstKey = errorKeys[0];
            const msg = formErrors[firstKey]?.message || `Please check ${firstKey}`;
            toast.error(msg);
        }
    };

    // PDF Download in view mode
    const handleDownloadPdf = async () => {
        if (!existingPayment) return;
        const pNo = existingPayment.paymentNo || existingPayment.payment_no || `PAY-${id}`;
        try {
            await downloadVendorPaymentPdf(id, pNo);
            toast.success(`Payment voucher ${pNo} downloaded.`);
        } catch (err) {
            toast.error(err?.message || 'Failed to download PDF voucher.');
        }
    };

    const paymentNo = existingPayment?.paymentNo || existingPayment?.payment_no || nextVoucherNo || 'PAY-AUTO';
    const isCancelled = (existingPayment?.status || '').toUpperCase() === 'CANCELLED';
    const isSaving = isCreating || isUpdating;
    const numericTotal = Number(watchTotalAmount || 0);

    return {
        id,
        isView,
        isEdit,
        isCreate,
        existingPayment,
        isLoadingPayment,
        paymentNo,
        isCancelled,
        isSaving,
        numericTotal,
        register,
        handleSubmit,
        setValue,
        control,
        errors,
        watchPartyId,
        watchVendorName,
        watchTotalAmount,
        watchPaymentModeId,
        paymentModes,
        isLoadingModes,
        selectedParty,
        effectiveBills,
        isLoadingBills,
        allocations,
        calculations,
        updateAllocationRow,
        handlePayFull,
        referenceLabel,
        referencePlaceholder,
        handleSelectParty,
        handleClearParty,
        handleDetachParty,
        onSubmit,
        onValidationErrors,
        handleDownloadPdf
    };
};

export default useVendorPaymentForm;
