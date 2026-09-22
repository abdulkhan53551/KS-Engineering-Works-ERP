import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useCreateShift, useUpdateShift } from '../hooks/useEmployeeApi';

const ShiftModal = ({ show, onHide, shift = null, firmId }) => {
    const [formData, setFormData] = useState({
        shiftName: '',
        shiftCode: '',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        isDefault: false
    });

    const createMutation = useCreateShift();
    const updateMutation = useUpdateShift();
    const isEditing = Boolean(shift?.id);

    useEffect(() => {
        if (shift) {
            setFormData({
                shiftName: shift.shiftName || shift.shift_name || '',
                shiftCode: shift.shiftCode || shift.shift_code || '',
                startTime: (shift.startTime || shift.start_time || '09:00:00').substring(0, 5),
                endTime: (shift.endTime || shift.end_time || '18:00:00').substring(0, 5),
                breakMinutes: shift.breakMinutes !== undefined ? shift.breakMinutes : (shift.break_minutes || 60),
                isDefault: Boolean(shift.isDefault || shift.is_default)
            });
        } else {
            setFormData({
                shiftName: '',
                shiftCode: '',
                startTime: '09:00',
                endTime: '18:00',
                breakMinutes: 60,
                isDefault: false
            });
        }
    }, [shift, show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await updateMutation.mutateAsync({
                    id: shift.id,
                    ...formData,
                    breakMinutes: parseInt(formData.breakMinutes, 10)
                });
            } else {
                await createMutation.mutateAsync({
                    ...formData,
                    firmId,
                    breakMinutes: parseInt(formData.breakMinutes, 10)
                });
            }
            onHide();
        } catch (err) {
            // Toast handled by hook
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Edit Shift' : 'Create New Shift'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row className="g-3">
                        <Col md={8}>
                            <Form.Group>
                                <Form.Label>Shift Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Day Shift, Night Shift"
                                    value={formData.shiftName}
                                    onChange={(e) => setFormData({ ...formData, shiftName: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Shift Code <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. DS, NS"
                                    value={formData.shiftCode}
                                    onChange={(e) => setFormData({ ...formData, shiftCode: e.target.value.toUpperCase() })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Break Duration (Minutes)</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    value={formData.breakMinutes}
                                    onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6} className="d-flex align-items-center mt-4">
                            <Form.Check
                                type="checkbox"
                                id="isDefaultShift"
                                label="Set as Default Shift"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : (isEditing ? 'Update Shift' : 'Create Shift')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ShiftModal;
