import React, { useState } from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * GstBadge component
 * Displays GST compliance status along with copy-to-clipboard for GSTIN.
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
            <Badge
                className="bg-soft-warning text-warning fw-normal px-2 py-1"
                style={{ fontSize: '0.75rem', borderRadius: '0.5rem' }}
            >
                Unregistered
            </Badge>
        );
    }

    if (!gstin) {
        return (
            <Badge
                className="bg-soft-secondary text-secondary fw-normal px-2 py-1"
                style={{ fontSize: '0.75rem', borderRadius: '0.5rem' }}
            >
                Registered (No GSTIN)
            </Badge>
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
            <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{copied ? 'Copied!' : 'Copy GSTIN'}</Tooltip>}
            >
                <button
                    type="button"
                    onClick={handleCopy}
                    className="btn btn-xs btn-link p-0 text-muted hover-primary ms-1"
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                    {copied ? (
                        <FaCheck size={11} className="text-success" />
                    ) : (
                        <FaCopy size={11} />
                    )}
                </button>
            </OverlayTrigger>
        </div>
    );
};

export default GstBadge;
