import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
    createVendorBillValidationSchema,
    updateVendorBillValidationSchema
} from '../../../validation/vendorBill.validation';
import {
    useCreateVendorBill,
    useUpdateVendorBill,
    useVendorBillById
} from './useVendorBillApi';
import useBillTaxCalculation from './useBillTaxCalculation';

export const GST_RATES = [0, 5, 12, 18, 28];

/**
 * useVendorBillForm Hook
 * Encapsulates form state, validation, tax calculations, credit days computation,
 * and submit handlers for VendorBillForm.
 */
export const useVendorBillForm = ({ mode = 'create' } = {}) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = mode === 'edit' || Boolean(id);

    // Fetch existing bill if editing
    const { data: existingBill, isLoading: isLoadingBill } = useVendorBillById(id);

    const { mutate: createBillMutate, isPending: isCreating } = useCreateVendorBill();
    const { mutate: updateBillMutate, isPending: isUpdating } = useUpdateVendorBill();

    const [selectedParty, setSelectedParty] = useState(null);
    const [billNoConflictError, setBillNoConflictError] = useState('');

    // Check if monetary fields must be locked (if bill is partially or fully paid)
    const paidAmount = Number(existingBill?.paidAmount || existingBill?.paid_amount || 0);
    const isMonetaryLocked = isEdit && paidAmount > 0;

    // React Hook Form
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        control,
        reset,
        formState: { errors }
    } = useForm({
        resolver: joiResolver(isEdit ? updateVendorBillValidationSchema : createVendorBillValidationSchema),
        defaultValues: {
            partyId: '',
            vendorName: '',
            branchId: null,
            billNo: '',
            billDate: new Date(),
            dueDays: 30,
            dueDate: moment().add(30, 'days').toDate(),
            taxableAmount: 0,
            total: 0,
            notes: ''
        }
    });

    const watchDueDays = useWatch({ control, name: 'dueDays' });
    const watchVendorName = useWatch({ control, name: 'vendorName' });

    // Tax calculation engine
    const {
        taxableAmount,
        setTaxableAmount,
        gstRate,
        setGstRate,
        taxType,
        setTaxType,
        cgst,
        setCgst,
        sgst,
        setSgst,
        igst,
        setIgst,
        otherCharges,
        setOtherCharges,
        roundOff,
        setRoundOff,
        totals
    } = useBillTaxCalculation({
        initialValues: {
            taxableAmount: existingBill?.taxableAmount || existingBill?.taxable_amount || 0,
            cgst: existingBill?.cgst || 0,
            sgst: existingBill?.sgst || 0,
            igst: existingBill?.igst || 0,
            otherCharges: existingBill?.otherCharges || existingBill?.other_charges || 0,
            roundOff: existingBill?.roundOff || existingBill?.round_off || 0
        },
        isMonetaryLocked
    });

    // Sync calculated totals to react-hook-form values
    useEffect(() => {
        setValue('taxableAmount', totals.taxableAmount, { shouldValidate: true });
        setValue('total', totals.total, { shouldValidate: true });
        setValue('cgst', totals.cgst);
        setValue('sgst', totals.sgst);
        setValue('igst', totals.igst);
        setValue('otherCharges', totals.otherCharges);
        setValue('roundOff', totals.roundOff);
    }, [totals, setValue]);

    // Populate data in Edit mode
    useEffect(() => {
        if (isEdit && existingBill) {
            const rawBDate = existingBill.billDate || existingBill.bill_date;
            const rawDDate = existingBill.dueDate || existingBill.due_date;
            const bDate = rawBDate ? moment(rawBDate).toDate() : new Date();
            const dDate = rawDDate ? moment(rawDDate).toDate() : moment().add(30, 'days').toDate();
            const days = existingBill.dueDays !== undefined ? existingBill.dueDays : moment(dDate).diff(moment(bDate), 'days');

            reset({
                partyId: existingBill.partyId || existingBill.party_id,
                vendorName: existingBill.partyName || existingBill.party?.displayName || existingBill.party?.legalName || '',
                branchId: existingBill.branchId || null,
                billNo: existingBill.billNo || existingBill.bill_no || '',
                billDate: bDate,
                dueDays: days >= 0 ? days : 30,
                dueDate: dDate,
                taxableAmount: Number(existingBill.taxableAmount || existingBill.taxable_amount || 0),
                total: Number(existingBill.total || 0),
                notes: existingBill.notes || ''
            });

            if (existingBill.party) {
                setSelectedParty(existingBill.party);
            }
        }
    }, [isEdit, existingBill, reset]);

    // Handle party selection
    const handleSelectParty = (party) => {
        if (!party) return;
        setSelectedParty(party);
        const pId = Number(party.id);
        const name = party.displayName || party.legalName || '';
        setValue('partyId', pId, { shouldValidate: true, shouldDirty: true });
        setValue('vendorName', name, { shouldValidate: true, shouldDirty: true });
        setBillNoConflictError('');
    };

    const handleClearParty = () => {
        setSelectedParty(null);
        setValue('partyId', '', { shouldValidate: true, shouldDirty: true });
        setValue('vendorName', '', { shouldValidate: true, shouldDirty: true });
    };

    const handleDetachParty = () => {
        setSelectedParty(null);
        setValue('partyId', '', { shouldValidate: true, shouldDirty: true });
    };

    // Auto-update due date when credit days change
    const handleDueDaysChange = (daysVal) => {
        const num = parseInt(daysVal, 10) || 0;
        setValue('dueDays', num, { shouldDirty: true, shouldValidate: true });
        const currentDate = getValues('billDate') || new Date();
        const computedDue = moment(currentDate).add(num, 'days').toDate();
        setValue('dueDate', computedDue, { shouldDirty: true, shouldValidate: true });
    };

    // Form submission
    const onSubmit = (formData) => {
        if (!formData.partyId && !selectedParty?.id) {
            toast.error('Please select a vendor.');
            return;
        }

        if (totals.total <= 0 && totals.taxableAmount <= 0) {
            toast.error('Please enter a valid taxable amount or total bill amount.');
            return;
        }

        const bDateStr = moment(formData.billDate || new Date()).format('YYYY-MM-DD');
        const dDateStr = moment(formData.dueDate || moment().add(30, 'days')).format('YYYY-MM-DD');

        const payload = {
            partyId: Number(formData.partyId || selectedParty?.id),
            branchId: formData.branchId ? Number(formData.branchId) : null,
            billNo: String(formData.billNo || '').trim(),
            billDate: bDateStr,
            dueDays: Number(formData.dueDays ?? 30),
            dueDate: dDateStr,
            taxableAmount: Number(totals.taxableAmount || 0),
            cgst: Number(totals.cgst || 0),
            sgst: Number(totals.sgst || 0),
            igst: Number(totals.igst || 0),
            otherCharges: Number(totals.otherCharges || 0),
            roundOff: Number(totals.roundOff || 0),
            total: Number(totals.total || 0),
            notes: formData.notes ? formData.notes.trim() : ''
        };

        if (isEdit) {
            updateBillMutate(
                { id, data: payload },
                {
                    onSuccess: () => navigate(`/purchase/vendor-bills/${id}`),
                    onError: (err) => {
                        if (err?.response?.status === 409) {
                            setBillNoConflictError(err?.response?.data?.message || 'A bill with this number already exists for this vendor.');
                        }
                    }
                }
            );
        } else {
            createBillMutate(payload, {
                onSuccess: (res) => {
                    const newId = res?.data?.id || res?.id;
                    if (newId) {
                        navigate(`/purchase/vendor-bills/${newId}`);
                    } else {
                        navigate('/purchase/vendor-bills');
                    }
                },
                onError: (err) => {
                    if (err?.response?.status === 409) {
                        setBillNoConflictError(err?.response?.data?.message || 'A bill with this number already exists for this vendor.');
                    }
                }
            });
        }
    };

    // Validation failure handler
    const onValidationErrors = (formErrors) => {
        const errorKeys = Object.keys(formErrors);
        if (errorKeys.length > 0) {
            const firstKey = errorKeys[0];
            const msg = formErrors[firstKey]?.message || `Please check ${firstKey}`;
            toast.error(msg);
        }
    };

    return {
        id,
        isEdit,
        existingBill,
        isLoadingBill,
        isMonetaryLocked,
        paidAmount,
        selectedParty,
        billNoConflictError,
        setBillNoConflictError,
        register,
        handleSubmit,
        setValue,
        getValues,
        control,
        errors,
        watchDueDays,
        watchVendorName,
        taxableAmount,
        setTaxableAmount,
        gstRate,
        setGstRate,
        taxType,
        setTaxType,
        cgst,
        setCgst,
        sgst,
        setSgst,
        igst,
        setIgst,
        otherCharges,
        setOtherCharges,
        roundOff,
        setRoundOff,
        totals,
        isCreating,
        isUpdating,
        handleSelectParty,
        handleClearParty,
        handleDetachParty,
        handleDueDaysChange,
        onSubmit,
        onValidationErrors
    };
};

export default useVendorBillForm;
