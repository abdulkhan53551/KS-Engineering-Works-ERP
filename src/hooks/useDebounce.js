import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. search inputs).
 * 
 * @param {any} value - The input value to debounce
 * @param {number} delay - Debounce delay in milliseconds (default: 400ms)
 * @returns {any} The debounced value
 */
export const useDebounce = (value, delay = 400) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export default useDebounce;
