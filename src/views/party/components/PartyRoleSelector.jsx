import React from 'react';
import { Spinner, Badge } from 'react-bootstrap';
import { FaCheck } from 'react-icons/fa';
import { useMasterPartyRoles } from '../hooks/usePartyApi';

/**
 * PartyRoleSelector Component
 * Professional interactive role selector with pill-chips and crisp check indicators.
 */
const PartyRoleSelector = ({ selectedRoleIds = [], onChange, disabled = false }) => {
    const { data: roles = [], isLoading } = useMasterPartyRoles();

    const handleCheckboxChange = (roleId) => {
        if (disabled) return;
        const exists = selectedRoleIds.includes(roleId);
        let updated;
        if (exists) {
            updated = selectedRoleIds.filter((id) => id !== roleId);
        } else {
            updated = [...selectedRoleIds, roleId];
        }
        onChange(updated);
    };

    if (isLoading) {
        return (
            <div className="d-flex align-items-center gap-2 py-1">
                <Spinner animation="border" size="sm" variant="primary" style={{ width: '0.9rem', height: '0.9rem' }} />
                <span className="text-muted small" style={{ fontSize: '0.78rem' }}>Loading party roles...</span>
            </div>
        );
    }

    if (!roles || roles.length === 0) {
        return (
            <div className="text-muted small py-1" style={{ fontSize: '0.78rem' }}>
                No party roles configured in master table.
            </div>
        );
    }

    return (
        <div className="mt-2 pt-2.5 border-top">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-dark fw-semibold" style={{ fontSize: '0.80rem' }}>
                    Party Roles <span className="text-danger">*</span>
                </span>
                <span className="text-muted" style={{ fontSize: '0.74rem' }}>
                    Selected: <Badge bg={selectedRoleIds.length > 0 ? "primary" : "secondary"} style={{ fontSize: '0.70rem', padding: '0.2rem 0.45rem' }}>{selectedRoleIds.length}</Badge>
                </span>
            </div>

            <div className="d-flex flex-wrap gap-2">
                {roles.map((role) => {
                    const isChecked = selectedRoleIds.includes(role.id);
                    return (
                        <div
                            key={role.id}
                            onClick={() => handleCheckboxChange(role.id)}
                            className={`d-inline-flex align-items-center gap-2 rounded-pill px-3 py-1.5 transition-all user-select-none border ${
                                isChecked
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white text-dark border-light-subtle'
                            }`}
                            style={{
                                fontSize: '0.78rem',
                                fontWeight: isChecked ? 600 : 500,
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease-in-out'
                            }}
                        >
                            <span
                                className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                                    isChecked ? 'bg-white text-primary' : 'border border-secondary-subtle bg-light'
                                }`}
                                style={{ width: '15px', height: '15px', flexShrink: 0 }}
                            >
                                {isChecked && <FaCheck size={8} />}
                            </span>
                            <span>{role.name || role.code}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PartyRoleSelector;
