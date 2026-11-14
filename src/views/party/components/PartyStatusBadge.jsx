import React from 'react';

/**
 * PartyStatusBadge component
 * Displays a sleek fintech status pill identically to Invoice List.
 */
const PartyStatusBadge = ({ status }) => {
    const rawStatus = (status || '').toUpperCase();

    let pillClass = 'fintech-pill-cancelled';
    let label = status || 'Unknown';

    if (rawStatus === 'ACTIVE') {
        pillClass = 'fintech-pill-paid';
        label = 'Active';
    } else if (rawStatus === 'INACTIVE') {
        pillClass = 'fintech-pill-failed';
        label = 'Inactive';
    } else if (rawStatus === 'PENDING') {
        pillClass = 'fintech-pill-pending';
        label = 'Pending';
    } else if (rawStatus === 'SUSPENDED') {
        pillClass = 'fintech-pill-cancelled';
        label = 'Suspended';
    }

    return (
        <span className={`fintech-pill ${pillClass}`}>
            <span className="status-dot" />
            <span>{label}</span>
        </span>
    );
};

export default PartyStatusBadge;
