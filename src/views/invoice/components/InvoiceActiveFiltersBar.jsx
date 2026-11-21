import React from 'react';
import PropTypes from 'prop-types';
import { FaFilter, FaTimes, FaUndo } from 'react-icons/fa';

/**
 * InvoiceActiveFiltersBar Component
 * Renders an enterprise-grade horizontal active filters banner with dynamic color-coded chips.
 */
const InvoiceActiveFiltersBar = ({ chips = [], onResetAll }) => {
    if (!chips || chips.length === 0) return null;

    return (
        <div className="invoice-active-filters-bar">
            <div className="active-filters-left">
                <div className="active-filters-lead">
                    <FaFilter size={10} className="lead-icon" />
                    <span className="lead-title">Active Filters</span>
                    <span className="lead-count-badge">{chips.length}</span>
                </div>

                <div className="filter-chips-list">
                    {chips.map((chip) => (
                        <div
                            key={chip.id}
                            className={`filter-chip chip-${chip.type}`}
                            title={chip.title}
                        >
                            {chip.label && <span className="chip-label">{chip.label}</span>}
                            <span className="chip-value">{chip.value}</span>
                            <button
                                type="button"
                                className="chip-close-btn"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    chip.onRemove?.();
                                }}
                                title={`Remove ${chip.label || ''} filter`}
                                aria-label={`Remove ${chip.label || ''} filter`}
                            >
                                <FaTimes size={8} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reset All Filters Button */}
            {typeof onResetAll === 'function' && (
                <button
                    type="button"
                    className="btn-clear-all-chips"
                    onClick={onResetAll}
                    title="Reset all active filters"
                >
                    <FaUndo size={9} />
                    <span>Clear all</span>
                </button>
            )}
        </div>
    );
};

InvoiceActiveFiltersBar.propTypes = {
    chips: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            label: PropTypes.string,
            value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string,
            onRemove: PropTypes.func.isRequired
        })
    ),
    onResetAll: PropTypes.func
};

export default React.memo(InvoiceActiveFiltersBar);
