import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Form, Badge, Spinner } from 'react-bootstrap';
import { Search, X, User, Check } from 'lucide-react';
import { useEmployeesDropdown } from '../hooks/useEmployeeApi';
import '../employee.css';

/**
 * EmployeeAutocompleteInput
 * Premium floating-label autocomplete dropdown for selecting employees with instant search.
 * Supports fluid editing, clearing, focus selection, and backspacing.
 */
const EmployeeAutocompleteInput = ({
    value,
    onChange,
    firmId,
    placeholder = 'Search by name or emp code...',
    label = 'Employee',
    required = false,
    isInvalid = false,
    errorMessage = '',
    disabled = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const { data: employeesRaw, isLoading } = useEmployeesDropdown({ firmId });
    const employees = useMemo(() => {
        if (!employeesRaw) return [];
        return Array.isArray(employeesRaw)
            ? employeesRaw
            : (Array.isArray(employeesRaw?.data) ? employeesRaw.data : []);
    }, [employeesRaw]);

    // Find currently selected employee object
    const selectedEmployee = useMemo(() => {
        if (!value) return null;
        return employees.find(e => String(e.id) === String(value)) || null;
    }, [value, employees]);

    // Sync input text when selected employee or value changes
    useEffect(() => {
        if (selectedEmployee) {
            setSearchTerm(`${selectedEmployee.firstName} ${selectedEmployee.lastName || ''} (${selectedEmployee.empCode})`.trim());
        } else if (!value) {
            setSearchTerm('');
        }
    }, [selectedEmployee, value]);

    // Close on outside click & sanitize input
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                if (selectedEmployee && value) {
                    setSearchTerm(`${selectedEmployee.firstName} ${selectedEmployee.lastName || ''} (${selectedEmployee.empCode})`.trim());
                } else {
                    setSearchTerm('');
                    if (value) onChange('', null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedEmployee, value, onChange]);

    // Filter suggestions based on searchTerm
    const filteredSuggestions = useMemo(() => {
        if (!searchTerm || (selectedEmployee && searchTerm === `${selectedEmployee.firstName} ${selectedEmployee.lastName || ''} (${selectedEmployee.empCode})`.trim())) {
            return employees;
        }
        const term = searchTerm.toLowerCase().trim();
        return employees.filter(e => {
            const fullName = `${e.firstName} ${e.lastName || ''}`.toLowerCase();
            const code = (e.empCode || '').toLowerCase();
            const dept = (e.department || '').toLowerCase();
            const desig = (e.designation || '').toLowerCase();
            return fullName.includes(term) || code.includes(term) || dept.includes(term) || desig.includes(term);
        });
    }, [employees, searchTerm, selectedEmployee]);

    const handleSelect = (emp) => {
        onChange(emp.id, emp);
        setSearchTerm(`${emp.firstName} ${emp.lastName || ''} (${emp.empCode})`.trim());
        setIsOpen(false);
        setActiveIndex(-1);
    };

    const handleClear = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        onChange('', null);
        setSearchTerm('');
        setIsOpen(true);
        setActiveIndex(-1);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        // If an employee was already selected, clear the linked value so user is free to search or clear
        if (value) {
            onChange('', null);
        }
        if (!val.trim()) {
            onChange('', null);
        }
        setIsOpen(true);
        setActiveIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredSuggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < filteredSuggestions.length) {
            e.preventDefault();
            handleSelect(filteredSuggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="position-relative" ref={containerRef}>
            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-0">
                <Form.Control
                    ref={inputRef}
                    type="text"
                    id={`emp-autocomplete-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={(e) => {
                        setIsOpen(true);
                        e.target.select();
                    }}
                    onKeyDown={handleKeyDown}
                    isInvalid={isInvalid}
                    disabled={disabled}
                    autoComplete="off"
                    className="pe-5"
                />
                <Form.Label htmlFor={`emp-autocomplete-${label.replace(/\s+/g, '-').toLowerCase()}`}>
                    {label} {required && <span className="text-danger">*</span>}
                </Form.Label>

                {/* Right side icon: Clear (✕) or Search */}
                <div
                    className="position-absolute end-0 top-50 translate-middle-y me-2 d-flex align-items-center gap-1"
                    style={{ zIndex: 5 }}
                >
                    {isLoading ? (
                        <Spinner animation="border" size="sm" variant="secondary" />
                    ) : (value || searchTerm) ? (
                        <button
                            type="button"
                            className="btn btn-sm btn-link p-0 text-muted d-flex align-items-center justify-content-center"
                            onClick={handleClear}
                            title="Clear selection"
                            tabIndex={-1}
                            style={{ width: '22px', height: '22px' }}
                        >
                            <X size={16} className="text-secondary" />
                        </button>
                    ) : (
                        <Search size={15} className="text-muted" />
                    )}
                </div>

                {isInvalid && errorMessage && (
                    <Form.Control.Feedback type="invalid" className="d-block">
                        {errorMessage}
                    </Form.Control.Feedback>
                )}
            </Form.Floating>

            {/* Suggestions Dropdown */}
            {isOpen && (
                <div
                    className="position-absolute w-100 bg-white shadow-lg rounded-2 border mt-1 overflow-auto"
                    style={{ maxHeight: '250px', zIndex: 1050 }}
                >
                    {filteredSuggestions.length === 0 ? (
                        <div className="p-3 text-center text-muted small">
                            {isLoading ? 'Loading staff directory...' : 'No matching employees found'}
                        </div>
                    ) : (
                        filteredSuggestions.map((emp, idx) => {
                            const isSelected = String(emp.id) === String(value);
                            const isActive = idx === activeIndex;

                            return (
                                <div
                                    key={emp.id}
                                    className={`p-2 px-3 border-bottom d-flex align-items-center justify-content-between cursor-pointer ${
                                        isActive ? 'bg-light' : ''
                                    } ${isSelected ? 'bg-primary-subtle' : ''}`}
                                    onClick={() => handleSelect(emp)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center gap-2">
                                        <div
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold small"
                                            style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}
                                        >
                                            {emp.firstName ? emp.firstName.charAt(0).toUpperCase() : <User size={14} />}
                                        </div>
                                        <div>
                                            <div className="fw-semibold text-dark small">
                                                {emp.firstName} {emp.lastName || ''}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                                {emp.designation || 'Staff'} {emp.department ? `• ${emp.department}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <Badge bg="light" className="text-dark border font-monospace" style={{ fontSize: '0.72rem' }}>
                                            {emp.empCode}
                                        </Badge>
                                        {isSelected && <Check size={16} className="text-primary" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeAutocompleteInput;
