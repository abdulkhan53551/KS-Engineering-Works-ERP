import React, { forwardRef } from 'react';
import './FloatingLabelDropdown.css';

/**
 * FloatingLabelDropdown Component
 * Professional floating label select dropdown for forms.
 */
const FloatingLabelDropdown = forwardRef(({
    id,
    name,
    label,
    value,
    defaultValue,
    onChange,
    onBlur,
    options = [],
    placeholder = '',
    required = false,
    disabled = false,
    isInvalid = false,
    errorMessage = '',
    className = '',
    children,
    ...rest
}, ref) => {
    const hasVal = value !== undefined && value !== null && value !== '';

    return (
        <div className={`custom-floating-dropdown-container ${className}`}>
            <select
                ref={ref}
                id={id || name}
                name={name}
                value={value}
                defaultValue={defaultValue}
                onChange={onChange}
                onBlur={onBlur}
                required={required}
                disabled={disabled}
                className={`custom-floating-select ${isInvalid ? 'is-invalid' : ''} ${hasVal ? 'has-value' : ''}`}
                {...rest}
            >
                <option value="" hidden>{placeholder}</option>
                {options && options.length > 0
                    ? options.map((opt) => (
                          <option key={opt.value ?? opt.id} value={opt.value ?? opt.id}>
                              {opt.label ?? opt.name ?? opt.code}
                          </option>
                      ))
                    : children}
            </select>
            <label htmlFor={id || name} className="custom-floating-label">
                {label} {required && <span className="text-danger label-required">*</span>}
            </label>
            {isInvalid && errorMessage && (
                <div className="custom-floating-feedback">{errorMessage}</div>
            )}
        </div>
    );
});

FloatingLabelDropdown.displayName = 'FloatingLabelDropdown';
export default FloatingLabelDropdown;
