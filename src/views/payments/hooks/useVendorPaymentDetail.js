import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { usePaymentById, useCancelVendorPayment } from './usePaymentApi';
import { downloadVendorPaymentPdf } from '../api';

/**
 * useVendorPaymentDetail Hook
 * Encapsulates data fetching, financial sums, PDF download,
 * and cancellation modal logic for VendorPaymentDetail.
 */
export const useVendorPaymentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: payment, isLoading } = usePaymentById(id);
    const { mutate: cancelPaymentMutate, isPending: isCancelling } = useCancelVendorPayment();

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const paymentNo = payment?.paymentNo || payment?.payment_no || (payment?.id ? `PAY-${payment.id}` : '');
    const isCancelled = (payment?.status || '').toUpperCase() === 'CANCELLED';
    const total = Number(payment?.totalAmount || payment?.total_amount || 0);
    const allocated = Number(payment?.allocatedAmount || payment?.allocated_amount || 0);
    const advance = Number(payment?.unallocatedAmount || payment?.unallocated_amount || 0);
    const vendor = payment?.party || {};
    const vendorName = payment?.vendorName || payment?.partyName || vendor.displayName || vendor.legalName || 'Vendor';
    const allocations = payment?.allocations || payment?.vendorBillAllocations || [];

    // Sums for table footer
    const totalCashAllocated = allocations.reduce((acc, a) => acc + Number(a.allocatedAmount || a.allocated_amount || 0), 0);
    const totalTdsDeducted = allocations.reduce((acc, a) => acc + Number(a.tdsAmount || a.tds_amount || 0), 0);
    const totalWriteOff = allocations.reduce((acc, a) => acc + Number(a.writeOffAmount || a.write_off_amount || 0), 0);
    const grandSettled = totalCashAllocated + totalTdsDeducted + totalWriteOff;

    // PDF Download
    const handleDownloadPdf = async () => {
        if (!payment) return;
        try {
            await downloadVendorPaymentPdf(id, paymentNo);
            toast.success(`Payment voucher ${paymentNo} downloaded.`);
        } catch (err) {
            toast.error(err?.message || 'Failed to download PDF voucher.');
        }
    };

    // Cancel voucher
    const handleConfirmCancel = () => {
        cancelPaymentMutate(
            { id, reason: cancelReason },
            {
                onSuccess: () => {
                    setShowCancelModal(false);
                    setCancelReason('');
                }
            }
        );
    };

    return {
        id,
        payment,
        isLoading,
        paymentNo,
        isCancelled,
        total,
        allocated,
        advance,
        vendor,
        vendorName,
        allocations,
        totalCashAllocated,
        totalTdsDeducted,
        totalWriteOff,
        grandSettled,
        showCancelModal,
        setShowCancelModal,
        cancelReason,
        setCancelReason,
        isCancelling,
        handleDownloadPdf,
        handleConfirmCancel
    };
};

export default useVendorPaymentDetail;
