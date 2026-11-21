import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { FaDownload, FaFilePdf, FaPrint, FaTimes } from 'react-icons/fa';
import { downloadProformaPdf } from '../api';
import { toast } from 'react-toastify';

const ProformaPdfModal = ({
    show,
    onHide,
    proformaId,
    proformaNo
}) => {
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!show || !proformaId) {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
                setPdfBlobUrl(null);
            }
            return;
        }

        let isMounted = true;
        setLoading(true);

        downloadProformaPdf(proformaId)
            .then(blob => {
                if (isMounted) {
                    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                    setPdfBlobUrl(url);
                    setLoading(false);
                }
            })
            .catch(async (err) => {
                if (isMounted) {
                    let errMsg = 'Failed to load Proforma Invoice PDF.';
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
    }, [show, proformaId]);

    const handleDownload = () => {
        if (!pdfBlobUrl) return;
        const link = document.createElement('a');
        link.href = pdfBlobUrl;
        link.setAttribute('download', `Proforma_Invoice_${proformaNo || 'doc'}.pdf`);
        document.body.appendChild(link);
        link.click();
        if (link && link.parentNode) {
            link.parentNode.removeChild(link);
        }
    };

    const handlePrint = () => {
        if (!pdfBlobUrl) return;
        const iframe = document.getElementById('proforma-pdf-frame');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="modal-90w">
            <Modal.Header closeButton className="bg-white border-bottom py-2.5 px-3">
                <div className="d-flex align-items-center justify-content-between w-100 me-3 flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <div className="p-1.5 rounded d-flex align-items-center" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                            <FaFilePdf size={16} />
                        </div>
                        <div>
                            <Modal.Title style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                                Proforma Invoice: {proformaNo || ''}
                            </Modal.Title>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={handlePrint}
                            disabled={loading || !pdfBlobUrl}
                            className="d-flex align-items-center gap-1.5 fw-semibold"
                        >
                            <FaPrint size={12} /> Print
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            disabled={loading || !pdfBlobUrl}
                            className="d-flex align-items-center gap-1.5 fw-semibold text-white"
                            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                        >
                            <FaDownload size={12} /> Download PDF
                        </Button>
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body className="p-0 position-relative" style={{ height: '80vh', backgroundColor: '#525659' }}>
                {loading && (
                    <div className="position-absolute top-50 start-50 translate-middle text-center bg-white p-4 rounded shadow-sm z-3">
                        <Spinner animation="border" style={{ color: '#dc2626' }} className="mb-2" />
                        <div className="text-muted small fw-semibold">Rendering Proforma Invoice PDF...</div>
                    </div>
                )}
                {pdfBlobUrl && (
                    <iframe
                        id="proforma-pdf-frame"
                        src={`${pdfBlobUrl}#toolbar=0`}
                        title={`Proforma Invoice ${proformaNo}`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                    />
                )}
            </Modal.Body>
        </Modal>
    );
};

export default ProformaPdfModal;
