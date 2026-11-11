import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useBulkPaySubmit } from '../hooks/useBulkPaySubmit';

const BulkPayModal = ({ show, onHide, selectedSlipIds = [] }) => {
    const today = new Date().toISOString().split('T')[0];
    const [paymentDate, setPaymentDate] = useState(today);
    const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
    const [paymentReference, setPaymentReference] = useState('');
    const [remarks, setRemarks] = useState('');

    const {
        handleSubmit,
        isLoading
    } = useBulkPaySubmit({
        onHide
    });

    const onSubmit = (e) => {
        handleSubmit(e, {
            slipIds: selectedSlipIds,
            paymentDate,
            paymentMode,
            paymentReference,
            remarks
        });
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={onSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Record Payout ({selectedSlipIds.length} Slips)</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="alert alert-info py-2 small mb-3">
                        Marking <strong>{selectedSlipIds.length}</strong> selected salary slips as <strong>PAID</strong>.
                    </div>
                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Payment Date <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Payment Mode <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    required
                                >
                                    <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                                    <option value="UPI">UPI / GPay / PhonePe</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="CASH">Cash</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Payment Reference / UTR Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. UTR12345678, Cheque No."
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={12}>
                            <Form.Group>
                                <Form.Label>Remarks</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    placeholder="Optional payment notes..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="success" type="submit" disabled={isLoading || selectedSlipIds.length === 0}>
                        {isLoading ? 'Processing...' : 'Mark as PAID'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default BulkPayModal;
