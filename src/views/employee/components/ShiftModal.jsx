import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useCreateShift, useUpdateShift } from '../hooks/useEmployeeApi';
import { toast } from 'react-toastify';
import '../employee.css';

const ShiftModal = ({ show, onHide, shift = null, firmId }) => {
    const [formData, setFormData] = useState({
        shiftName: '',
        shiftCode: '',
        startTime: '09:00',
        endTime: '18:00',
        breakMinutes: 60,
        isDefault: false
    });
    const [errors, setErrors] = useState({});

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
        setErrors({});
    }, [shift, show]);

    const validate = () => {
        const errs = {};
        if (!formData.shiftName.trim()) {
            errs.shiftName = 'Shift name is required.';
        }
        if (!formData.shiftCode.trim()) {
            errs.shiftCode = 'Shift code is required.';
        }
        if (!formData.startTime) {
            errs.startTime = 'Start time is required.';
        }
        if (!formData.endTime) {
            errs.endTime = 'End time is required.';
        }
        setErrors(errs);
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            toast.error('Please fix the errors in the form.');
            return;
        }

        try {
            if (isEditing) {
                await updateMutation.mutateAsync({
                    id: shift.id,
                    ...formData,
                    breakMinutes: parseInt(formData.breakMinutes, 10) || 0
                });
            } else {
                await createMutation.mutateAsync({
                    ...formData,
                    firmId,
                    breakMinutes: parseInt(formData.breakMinutes, 10) || 0
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
                    <Modal.Title className="fw-bold fs-5">{isEditing ? 'Edit Shift' : 'Create New Shift'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Row className="g-3">
                        <Col md={8}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="shiftName"
                                    type="text"
                                    placeholder="Shift Name"
                                    value={formData.shiftName}
                                    onChange={(e) => {
                                        setFormData({ ...formData, shiftName: e.target.value });
                                        if (errors.shiftName) setErrors(prev => ({ ...prev, shiftName: null }));
                                    }}
                                    isInvalid={!!errors.shiftName}
                                    required
                                />
                                <Form.Label htmlFor="shiftName">Shift Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.shiftName}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                        <Col md={4}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="shiftCode"
                                    type="text"
                                    placeholder="Shift Code"
                                    value={formData.shiftCode}
                                    onChange={(e) => {
                                        setFormData({ ...formData, shiftCode: e.target.value.toUpperCase() });
                                        if (errors.shiftCode) setErrors(prev => ({ ...prev, shiftCode: null }));
                                    }}
                                    isInvalid={!!errors.shiftCode}
                                    required
                                />
                                <Form.Label htmlFor="shiftCode">Shift Code <span className="text-danger">*</span></Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.shiftCode}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => {
                                        setFormData({ ...formData, startTime: e.target.value });
                                        if (errors.startTime) setErrors(prev => ({ ...prev, startTime: null }));
                                    }}
                                    isInvalid={!!errors.startTime}
                                    required
                                />
                                <Form.Label htmlFor="startTime">Start Time <span className="text-danger">*</span></Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.startTime}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => {
                                        setFormData({ ...formData, endTime: e.target.value });
                                        if (errors.endTime) setErrors(prev => ({ ...prev, endTime: null }));
                                    }}
                                    isInvalid={!!errors.endTime}
                                    required
                                />
                                <Form.Label htmlFor="endTime">End Time <span className="text-danger">*</span></Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.endTime}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="breakMinutes"
                                    type="number"
                                    min="0"
                                    placeholder="Break Duration (Minutes)"
                                    value={formData.breakMinutes}
                                    onChange={(e) => setFormData({ ...formData, breakMinutes: e.target.value })}
                                />
                                <Form.Label htmlFor="breakMinutes">Break Duration (Mins)</Form.Label>
                            </Form.Floating>
                        </Col>
                        <Col md={6} className="d-flex align-items-center">
                            <Form.Check
                                type="checkbox"
                                id="isDefaultShift"
                                label="Set as Default Shift"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="fw-semibold text-secondary"
                            />
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" size="sm" onClick={onHide} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : (isEditing ? 'Update Shift' : 'Create Shift')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ShiftModal;
