import React, { useState } from 'react';
import { Badge } from 'react-bootstrap';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * GstBadge component
 * Displays GST compliance status along with copy-to-clipboard for GSTIN.
 * High-performance: Uses native browser tooltip (title) to avoid Popper/Overlay re-renders on row hover.
 */
const GstBadge = ({ gstRegistered, gstin }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        if (!gstin) return;

        navigator.clipboard.writeText(gstin);
        setCopied(true);
        toast.info(`GSTIN copied: ${gstin}`, { autoClose: 1500 });
        setTimeout(() => setCopied(false), 2000);
    };

    if (!gstRegistered) {
        return (
            <span className="fintech-mode-pill" style={{ color: '#d97706', background: '#fffbeb', borderColor: '#fde68a' }}>
                Unregistered
            </span>
        );
    }

    if (!gstin) {
        return (
            <span className="fintech-mode-pill text-muted">
                No GSTIN
            </span>
        );
    }

    return (
        <div className="d-inline-flex align-items-center gap-1.5">
            <span
                className="font-monospace fw-semibold text-dark"
                style={{ fontSize: '0.82rem', letterSpacing: '0.03em' }}
            >
                {gstin}
            </span>
            <button
                type="button"
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy GSTIN'}
                className="btn btn-xs btn-link p-0 text-muted hover-primary ms-1"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
                {copied ? (
                    <FaCheck size={11} className="text-success" />
                ) : (
                    <FaCopy size={11} />
                )}
            </button>
        </div>
    );
};

export default GstBadge;
