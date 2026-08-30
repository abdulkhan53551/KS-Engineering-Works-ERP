import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Form, Spinner } from 'react-bootstrap';
import { FaTimes, FaPlus, FaCogs } from 'react-icons/fa';
import { searchProducts } from '../api';
import QuickAddProductModal from './QuickAddProductModal';
import './ProductAutocompleteInput.css';

/**
 * ProductAutocompleteInput Component
 * Multi-attribute autocomplete dropdown for Invoice and Purchase Order line-item tables.
 * Auto-populates description, HSN, rate, unit, and GST slab on selection.
 */
const ProductAutocompleteInput = ({
    value,
    onChange,
    onClear,
    onSelectProduct,
    itemType = '',
    placeholder = 'Enter or search item / service...',
    isInvalid = false,
    errorMessage = '',
    disabled = false
}) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Sync external value changes
    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    const updateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const spaceBelow = window.innerHeight - rect.bottom;
        const estimatedDropdownHeight = 280;
        const showAbove = spaceBelow < estimatedDropdownHeight && rect.top > estimatedDropdownHeight;

        const width = Math.max(rect.width, 420);
        let left = rect.left;
        if (left + width > window.innerWidth - 16) {
            left = Math.max(16, window.innerWidth - width - 16);
        }

        setDropdownStyle({
            position: 'fixed',
            top: showAbove ? `${rect.top - 6}px` : `${rect.bottom + 4}px`,
            transform: showAbove ? 'translateY(-100%)' : 'none',
            left: `${left}px`,
            width: `${width}px`,
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 99999
        });
    }, []);

    useEffect(() => {
        if (isOpen) {
            updateDropdownPosition();
            window.addEventListener('resize', updateDropdownPosition);
            window.addEventListener('scroll', updateDropdownPosition, true);
            return () => {
                window.removeEventListener('resize', updateDropdownPosition);
                window.removeEventListener('scroll', updateDropdownPosition, true);
            };
        }
    }, [isOpen, updateDropdownPosition]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform debounced multi-attribute search
    const performSearch = (query) => {
        if (!query || query.trim().length < 1) {
            setSuggestions([]);
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await searchProducts({ q: query.trim(), itemType, limit: 12 });
                const list = res?.data ?? res ?? [];
                setSuggestions(Array.isArray(list) ? list : []);
                setIsOpen(true);
                setActiveIndex(-1);
            } catch (err) {
                console.error('Error searching products:', err);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 250);
    };

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        if (onChange) {
            onChange(e);
        }
        performSearch(query);
    };

    const handleSelect = (product) => {
        if (!product) return;
        const name = product.name || '';
        setSearchTerm(name);
        setIsOpen(false);
        if (onSelectProduct) {
            onSelectProduct(product);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(false);
            return;
        }

        if (!isOpen || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                handleSelect(suggestions[activeIndex]);
            }
        }
    };

    const handleClear = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSearchTerm('');
        setSuggestions([]);
        setIsOpen(false);
        if (onChange) {
            onChange({ target: { value: '' } });
        }
        if (onClear) {
            onClear();
        }
    };

    return (
        <div ref={containerRef} className="product-autocomplete-container">
            <div className="product-autocomplete-wrapper">
                <Form.Control
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => {
                        if (searchTerm && suggestions.length > 0) {
                            setIsOpen(true);
                        } else if (searchTerm && searchTerm.trim().length >= 1) {
                            performSearch(searchTerm);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    isInvalid={isInvalid}
                    autoComplete="off"
                    style={{ fontSize: '0.84rem', paddingRight: '28px' }}
                />

                {/* Right side loading spinner */}
                {isLoading && (
                    <div className="product-autocomplete-spinner">
                        <Spinner animation="border" size="sm" variant="primary" style={{ width: '0.75rem', height: '0.75rem' }} />
                    </div>
                )}

                {/* Right side clear button */}
                {!isLoading && searchTerm && !disabled && (
                    <button
                        type="button"
                        className="product-autocomplete-clear-btn"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        onClick={handleClear}
                        title="Clear"
                    >
                        <FaTimes size={10} />
                    </button>
                )}
            </div>

            {isInvalid && errorMessage && (
                <Form.Control.Feedback type="invalid" className="d-block" style={{ fontSize: '0.75rem' }}>
                    {errorMessage}
                </Form.Control.Feedback>
            )}

            {/* Suggestions Dropdown via Portal */}
            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="product-autocomplete-dropdown"
                    style={dropdownStyle}
                >
                    <div className="product-autocomplete-header d-flex align-items-center justify-content-between">
                        <span>Matching Catalog Products</span>
                        <span className="text-muted fw-normal">{suggestions.length} found</span>
                    </div>

                    {suggestions.length === 0 ? (
                        <div className="product-autocomplete-empty">
                            {isLoading ? (
                                <div className="d-flex align-items-center justify-content-center gap-2 py-2">
                                    <Spinner animation="border" size="sm" variant="primary" />
                                    <span>Searching catalog...</span>
                                </div>
                            ) : (
                                <div>No matching product found for <strong>"{searchTerm}"</strong></div>
                            )}
                        </div>
                    ) : (
                        suggestions.map((item, index) => {
                            const isActive = index === activeIndex;
                            const specs = [
                                item.drawingNumber ? `DWG: ${item.drawingNumber}` : null,
                                item.materialGrade ? item.materialGrade : null
                            ].filter(Boolean).join(' | ');

                            return (
                                <div
                                    key={item.id}
                                    className={`product-autocomplete-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <div
                                            className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: '26px', height: '26px' }}
                                        >
                                            <FaCogs className="text-primary" size={11} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="product-item-name text-truncate">
                                                {item.name}
                                            </div>
                                            {specs && (
                                                <div className="product-item-specs text-truncate">
                                                    {specs}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                        {item.itemCode && (
                                            <span className="product-item-code">{item.itemCode}</span>
                                        )}
                                        <div>
                                            <div className="product-item-price">
                                                ₹{Number(item.sellingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="product-item-tax">
                                                {item.unitName || 'NOS'} {item.gstRate !== undefined && item.gstRate !== null ? `(GST ${item.gstRate}%)` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Quick Add Product Button inside Dropdown */}
                    <div className="product-autocomplete-footer">
                        <button
                            type="button"
                            className="product-quick-add-btn"
                            onClick={() => {
                                setIsOpen(false);
                                setShowQuickAddModal(true);
                            }}
                        >
                            <FaPlus size={10} />
                            <span>Add "{searchTerm || 'New Product'}" to Catalog</span>
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Quick Add Modal */}
            <QuickAddProductModal
                show={showQuickAddModal}
                onHide={() => setShowQuickAddModal(false)}
                initialName={searchTerm}
                onProductCreated={(newProduct) => {
                    handleSelect(newProduct);
                }}
            />
        </div>
    );
};

export default ProductAutocompleteInput;
