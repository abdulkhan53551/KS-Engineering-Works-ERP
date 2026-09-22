import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useReviewLeave } from '../hooks/useEmployeeApi';

const LeaveReviewModal = ({ show, onHide, leave = null }) => {
    const [action, setAction] = useState('APPROVED');
    const [rejectionReason, setRejectionReason] = useState('');
    const reviewMutation = useReviewLeave();

    if (!leave) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await reviewMutation.mutateAsync({
                id: leave.id,
                status: action,
                rejectionReason: action === 'REJECTED' ? rejectionReason : null
            });
            onHide();
        } catch (err) {
            // Handled in hook
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>Review Leave Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="p-3 mb-3 rounded" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="d-flex justify-content-between mb-1">
                            <span className="fw-bold">{leave.firstName} {leave.lastName || ''}</span>
                            <span className="text-muted">{leave.empCode}</span>
                        </div>
                        <div className="text-muted small mb-2">{leave.department || 'General'}</div>
                        <div className="d-flex justify-content-between">
                            <span><strong>Type:</strong> {leave.leaveType}</span>
                            <span><strong>Days:</strong> {leave.totalDays}</span>
                        </div>
                        <div className="mt-1 small text-secondary">
                            <strong>Period:</strong> {leave.fromDate} to {leave.toDate}
                        </div>
                        {leave.reason && (
                            <div className="mt-2 p-2 bg-white rounded border small">
                                <strong>Reason:</strong> {leave.reason}
                            </div>
                        )}
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>Decision <span className="text-danger">*</span></Form.Label>
                        <div className="d-flex gap-3">
                            <Form.Check
                                type="radio"
                                id="decision-approve"
                                label="Approve Leave"
                                name="decision"
                                checked={action === 'APPROVED'}
                                onChange={() => setAction('APPROVED')}
                            />
                            <Form.Check
                                type="radio"
                                id="decision-reject"
                                label="Reject Leave"
                                name="decision"
                                checked={action === 'REJECTED'}
                                onChange={() => setAction('REJECTED')}
                            />
                        </div>
                    </Form.Group>

                    {action === 'REJECTED' && (
                        <Form.Group className="mb-3">
                            <Form.Label>Rejection Reason <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="Explain why this leave request is rejected..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                required
                            />
                        </Form.Group>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={reviewMutation.isPending}>
                        Cancel
                    </Button>
                    <Button
                        variant={action === 'APPROVED' ? 'success' : 'danger'}
                        type="submit"
                        disabled={reviewMutation.isPending || (action === 'REJECTED' && !rejectionReason.trim())}
                    >
                        {reviewMutation.isPending ? 'Processing...' : (action === 'APPROVED' ? 'Approve Leave' : 'Reject Leave')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default LeaveReviewModal;
