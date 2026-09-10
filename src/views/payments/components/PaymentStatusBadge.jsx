import React from 'react';
import { Badge } from 'react-bootstrap';

/**
 * Consistent Badge component for Payment Status
 * Supports COMPLETED, CANCELLED, PENDING, etc.
 */
const PaymentStatusBadge = ({ status = 'COMPLETED', className = '', style = {} }) => {
    const normalized = (status || '').toUpperCase();

    let bg = 'secondary';
    let label = status || 'Unknown';

    switch (normalized) {
        case 'COMPLETED':
        case 'PAID':
            bg = 'soft-success';
            label = 'Completed';
            break;
        case 'CANCELLED':
            bg = 'soft-danger';
            label = 'Cancelled';
            break;
        case 'PENDING':
            bg = 'soft-warning';
            label = 'Pending';
            break;
        case 'PARTIAL':
        case 'PARTIALLY PAID':
            bg = 'soft-info';
            label = 'Partially Paid';
            break;
        default:
            bg = 'soft-secondary';
            label = status;
            break;
    }

    return (
        <Badge
            bg={bg}
            className={`text-uppercase font-monospace px-2.5 py-1 ${className}`}
            style={{ fontSize: '0.74rem', letterSpacing: '0.04em', fontWeight: 600, ...style }}
        >
            {label}
        </Badge>
    );
};

export default PaymentStatusBadge;
