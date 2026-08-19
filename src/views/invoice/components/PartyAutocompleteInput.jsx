import React, { useState, useEffect, useRef } from 'react';
import { Form, Spinner, Badge } from 'react-bootstrap';
import { FaSearch, FaTimes, FaBuilding, FaCheck } from 'react-icons/fa';
import { searchParties, getPartyDetailsById } from '../../party/api';
import './PartyAutocompleteInput.css';

/**
 * PartyAutocompleteInput Component
 * Modern autocomplete search input for selecting parties in Invoice Form.
 * Automatically fetches and pre-fills billing & shipping addresses upon selection.
 */
const PartyAutocompleteInput = ({
    value,
    onChange,
    onSelectParty,
    isInvalid = false,
    errorMessage = '',
    placeholder = 'Customer Name',
    label = 'Customer Name',
    required = true,
    disabled = false
}) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Sync external value changes
    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform debounced search
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
                const res = await searchParties(query.trim());
                const list = res?.data ?? res ?? [];
                setSuggestions(Array.isArray(list) ? list : []);
                setIsOpen(true);
                setActiveIndex(-1);
            } catch (err) {
                console.error('Error searching parties:', err);
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

    const handleSelectParty = async (party) => {
        if (!party || !party.id) return;
        const displayName = party.displayName || party.legalName || '';
        setSearchTerm(displayName);
        setIsOpen(false);
        setIsFetchingDetails(true);

        try {
            const res = await getPartyDetailsById(party.id);
            const fullDetails = res?.data ?? res ?? party;
            if (onSelectParty) {
                onSelectParty(fullDetails);
            }
        } catch (err) {
            console.error('Error fetching party details:', err);
            // Fallback to selected party summary
            if (onSelectParty) {
                onSelectParty(party);
            }
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleKeyDown = (e) => {
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
                handleSelectParty(suggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        setSearchTerm('');
        setSuggestions([]);
        setIsOpen(false);
        if (onChange) {
            onChange({ target: { name: 'customerName', value: '' } });
        }
    };

    return (
        <div ref={containerRef} className="party-autocomplete-container">
            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-4">
                <Form.Control
                    type="text"
                    name="customerName"
                    id="customerName"
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
                    disabled={disabled || isFetchingDetails}
                    isInvalid={isInvalid}
                    autoComplete="off"
                    style={{ fontSize: '0.84rem', paddingRight: '36px' }}
                />
                <Form.Label htmlFor="customerName" style={{ fontSize: '0.78rem' }}>
                    {label} {required && <span className="text-danger label-required">*</span>}
                </Form.Label>
                <Form.Control.Feedback type="invalid" style={{ fontSize: '0.75rem' }}>
                    {errorMessage}
                </Form.Control.Feedback>

                {/* Right side status indicator */}
                <div className="party-autocomplete-spinner">
                    {isLoading || isFetchingDetails ? (
                        <Spinner animation="border" size="sm" variant="primary" style={{ width: '0.85rem', height: '0.85rem' }} />
                    ) : searchTerm && !disabled ? (
                        <button
                            type="button"
                            className="party-autocomplete-clear-btn"
                            onClick={handleClear}
                            title="Clear search"
                        >
                            <FaTimes size={11} />
                        </button>
                    ) : null}
                </div>
            </Form.Floating>

            {/* Suggestions Dropdown */}
            {isOpen && (
                <div className="party-autocomplete-dropdown">
                    <div className="party-autocomplete-header d-flex align-items-center justify-content-between">
                        <span>Matching Parties</span>
                        <span className="text-muted fw-normal">{suggestions.length} found</span>
                    </div>

                    {suggestions.length === 0 ? (
                        <div className="party-autocomplete-empty">
                            {isLoading ? (
                                <div className="d-flex align-items-center justify-content-center gap-2 py-2">
                                    <Spinner animation="border" size="sm" variant="primary" />
                                    <span>Searching parties...</span>
                                </div>
                            ) : (
                                <div>No matching party found for <strong>"{searchTerm}"</strong></div>
                            )}
                        </div>
                    ) : (
                        suggestions.map((item, index) => {
                            const isActive = index === activeIndex;
                            return (
                                <div
                                    key={item.id}
                                    className={`party-autocomplete-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleSelectParty(item)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                                        <div
                                            className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: '28px', height: '28px' }}
                                        >
                                            <FaBuilding className="text-primary" size={12} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="party-item-legal-name text-truncate">
                                                {item.legalName || item.displayName}
                                            </div>
                                            {item.displayName && item.displayName !== item.legalName && (
                                                <div className="party-item-display-name text-truncate">
                                                    Trade: {item.displayName}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {item.partyCode && (
                                        <span className="party-item-code">{item.partyCode}</span>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default PartyAutocompleteInput;
