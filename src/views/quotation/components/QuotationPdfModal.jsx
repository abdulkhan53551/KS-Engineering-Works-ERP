import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form, Badge } from 'react-bootstrap';
import { FaDownload, FaFilePdf, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { downloadQuotationPdf } from '../api';
import { toast } from 'react-toastify';

const QuotationPdfModal = ({ 
    show, 
    onHide, 
    quotationId, 
    quotationNo, 
    revisionNo = 0,
    initialIncludeAnnexure = true 
}) => {
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [includeAnnexure, setIncludeAnnexure] = useState(initialIncludeAnnexure);

    // Sync initial prop when modal opens
    useEffect(() => {
        if (show) {
            setIncludeAnnexure(initialIncludeAnnexure);
        }
    }, [show, initialIncludeAnnexure]);

    useEffect(() => {
        if (!show || !quotationId) {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
                setPdfBlobUrl(null);
            }
            return;
        }

        let isMounted = true;
        setLoading(true);

        downloadQuotationPdf(quotationId, includeAnnexure)
            .then(blob => {
                if (isMounted) {
                    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                    setPdfBlobUrl(url);
                    setLoading(false);
                }
            })
            .catch(async (err) => {
                if (isMounted) {
                    let errMsg = 'Failed to render PDF preview.';
                    if (err?.response?.data instanceof Blob) {
                        try {
                            const text = await err.response.data.text();
                            const parsed = JSON.parse(text);
                            errMsg = parsed.message || errMsg;
                        } catch (_) {}
                    } else if (err?.response?.data?.message) {
                        errMsg = err.response.data.message;
                    }
                    toast.error(errMsg);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [show, quotationId, includeAnnexure]);

    const handleDownload = () => {
        if (!pdfBlobUrl) return;
        const link = document.createElement('a');
        link.href = pdfBlobUrl;
        const suffix = includeAnnexure ? '' : '_Commercial_Only';
        link.setAttribute('download', `Quotation_${quotationNo || 'doc'}_R${revisionNo}${suffix}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="modal-90w">
            <Modal.Header closeButton className="bg-white border-bottom py-2.5 px-3">
                <div className="d-flex align-items-center justify-content-between w-100 me-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded bg-primary bg-opacity-10 text-primary d-flex align-items-center">
                            <FaFilePdf size={16} />
                        </div>
                        <div>
                            <Modal.Title style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                PDF Preview: Quotation {quotationNo} (REV-{String(revisionNo).padStart(2, '0')})
                            </Modal.Title>
                        </div>
                    </div>

                    {/* Dynamic Provision: Toggle Annexure - 1 in PDF */}
                    <div className="d-flex align-items-center gap-2 bg-light px-3 py-1 rounded border">
                        <Form.Check 
                            type="switch"
                            id="pdf-toggle-annexure"
                            checked={includeAnnexure}
                            disabled={loading}
                            onChange={(e) => setIncludeAnnexure(e.target.checked)}
                            label={
                                <span className="small fw-bold d-flex align-items-center gap-1.5 user-select-none">
                                    <span>Annexure - I (Tech Specs):</span>
                                    <Badge bg={includeAnnexure ? "primary" : "secondary"} className="rounded-pill" style={{ fontSize: '10px' }}>
                                        {includeAnnexure ? "Print in PDF" : "Omit (Page 1 Only)"}
                                    </Badge>
                                </span>
                            }
                        />
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="p-0" style={{ height: '78vh', background: '#334155' }}>
                {loading ? (
                    <div className="d-flex flex-column justify-content-center align-items-center h-100 text-white gap-3">
                        <Spinner animation="border" variant="light" />
                        <span className="small">
                            {includeAnnexure 
                                ? 'Rendering Complete Quotation & Technical Annexure with Puppeteer...' 
                                : 'Rendering Commercial-Only Quotation with Puppeteer...'}
                        </span>
                    </div>
                ) : pdfBlobUrl ? (
                    <iframe
                        src={pdfBlobUrl}
                        title={`Quotation-${quotationNo}`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                    />
                ) : (
                    <div className="d-flex justify-content-center align-items-center h-100 text-white">
                        <span>Failed to load PDF preview.</span>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer className="d-flex justify-content-between align-items-center py-2 px-3">
                <div>
                    <span className="text-muted small">
                        Generated strictly formatted to A4 portrait dimensions. {includeAnnexure ? '(Commercial + Annexure - I)' : '(Commercial Offer Only)'}
                    </span>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleDownload} disabled={!pdfBlobUrl} className="d-flex align-items-center gap-1.5 px-3">
                        <FaDownload size={11} /> Download PDF
                    </Button>
                    <Button variant="light" size="sm" onClick={onHide} className="border px-3">
                        Close
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default QuotationPdfModal;
