import React from 'react';
import { Badge } from 'react-bootstrap';

/**
 * Visual badge for Vendor Bill payment statuses: UNPAID, PARTIAL, PAID
 */
const VendorBillStatusBadge = ({ status, className = '' }) => {
    const s = (status || 'UNPAID').toUpperCase();

    let bg = 'warning';
    let text = 'Unpaid';
    let customStyle = {
        backgroundColor: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeeba',
        fontSize: '0.74rem',
        fontWeight: 600,
        padding: '0.35em 0.65em',
        letterSpacing: '0.02em'
    };

    switch (s) {
        case 'PAID':
            bg = 'success';
            text = 'Paid';
            customStyle = {
                backgroundColor: '#d4edda',
                color: '#155724',
                border: '1px solid #c3e6cb',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '0.35em 0.65em',
                letterSpacing: '0.02em'
            };
            break;
        case 'PARTIAL':
        case 'PARTIALLY_PAID':
            bg = 'info';
            text = 'Partial';
            customStyle = {
                backgroundColor: '#cce5ff',
                color: '#004085',
                border: '1px solid #b8daff',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '0.35em 0.65em',
                letterSpacing: '0.02em'
            };
            break;
        case 'CANCELLED':
            bg = 'danger';
            text = 'Cancelled';
            customStyle = {
                backgroundColor: '#f8d7da',
                color: '#721c24',
                border: '1px solid #f5c6cb',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '0.35em 0.65em',
                letterSpacing: '0.02em'
            };
            break;
        case 'UNPAID':
        default:
            bg = 'warning';
            text = 'Unpaid';
            break;
    }

    return (
        <Badge pill bg={bg} style={customStyle} className={`text-uppercase ${className}`}>
            {text}
        </Badge>
    );
};

export default VendorBillStatusBadge;
