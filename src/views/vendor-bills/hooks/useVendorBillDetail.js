import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useVendorBillById, useDeleteVendorBill } from './useVendorBillApi';

/**
 * useVendorBillDetail Hook
 * Encapsulates data fetching, financial calculations,
 * and delete confirmation logic for VendorBillDetail.
 */
export const useVendorBillDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: bill, isLoading } = useVendorBillById(id);
    const { mutate: deleteBillMutate, isPending: isDeleting } = useDeleteVendorBill();

    const total = Number(bill?.total || 0);
    const paid = Number(bill?.paidAmount || bill?.paid_amount || 0);
    const balance = Number(bill?.balanceAmount ?? bill?.balance_amount ?? (total - paid));
    const taxable = Number(bill?.taxableAmount || bill?.taxable_amount || 0);
    const cgst = Number(bill?.cgst || 0);
    const sgst = Number(bill?.sgst || 0);
    const igst = Number(bill?.igst || 0);
    const totalGst = cgst + sgst + igst;
    const vendor = bill?.party || {};
    const vendorName = bill?.partyName || vendor.displayName || vendor.legalName || 'Vendor';
    const payments = bill?.payments || bill?.paymentAllocations || bill?.allocations || [];

    // Sums for payment table
    const totalCashPaid = payments.reduce((acc, p) => acc + Number(p.allocatedAmount || p.allocated_amount || 0), 0);
    const totalTdsDeducted = payments.reduce((acc, p) => acc + Number(p.tdsAmount || p.tds_amount || 0), 0);
    const totalWriteOff = payments.reduce((acc, p) => acc + Number(p.writeOffAmount || p.write_off_amount || 0), 0);

    const handleDelete = () => {
        if (paid > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Cannot Delete Bill',
                text: `This bill has ₹${paid.toLocaleString('en-IN')} in payments recorded against it. Cancel payments first.`,
                confirmButtonColor: '#3a57e8'
            });
            return;
        }

        Swal.fire({
            title: 'Delete Vendor Bill?',
            text: `Are you sure you want to delete bill "${bill?.billNo || bill?.bill_no}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Delete'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteBillMutate(id, {
                    onSuccess: () => navigate('/purchase/vendor-bills')
                });
            }
        });
    };

    return {
        id,
        bill,
        isLoading,
        total,
        paid,
        balance,
        taxable,
        cgst,
        sgst,
        igst,
        totalGst,
        vendor,
        vendorName,
        payments,
        totalCashPaid,
        totalTdsDeducted,
        totalWriteOff,
        isDeleting,
        handleDelete
    };
};

export default useVendorBillDetail;
