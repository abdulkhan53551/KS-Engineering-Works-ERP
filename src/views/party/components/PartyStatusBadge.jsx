import React from 'react';

/**
 * PartyStatusBadge component
 * Displays a professional ERP badge styled identically to Invoice List's payment status badge.
 */
const PartyStatusBadge = ({ status }) => {
    const rawStatus = (status || '').toUpperCase();

    let badgeClass = 'bg-secondary';
    if (rawStatus === 'ACTIVE') {
        badgeClass = 'bg-success';
    } else if (rawStatus === 'INACTIVE') {
        badgeClass = 'bg-danger';
    } else if (rawStatus === 'PENDING') {
        badgeClass = 'bg-warning text-dark';
    } else if (rawStatus === 'SUSPENDED') {
        badgeClass = 'bg-dark';
    }

    return (
        <span className={`badge ${badgeClass}`}>
            {status || 'UNKNOWN'}
        </span>
    );
};

export default PartyStatusBadge;
