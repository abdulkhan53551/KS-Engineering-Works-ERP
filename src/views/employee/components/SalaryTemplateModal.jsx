import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Table } from 'react-bootstrap';
import { Trash2, Plus } from 'lucide-react';
import { useCreateSalaryTemplate, useUpdateSalaryTemplate } from '../hooks/useEmployeeApi';
import { toast } from 'react-toastify';
import '../employee.css';

const DEFAULT_COMPONENTS = [
    { componentName: 'Basic Salary', componentType: 'EARNING', calcType: 'PERCENT_OF_GROSS', value: 40, isStatutory: false, sortOrder: 1 },
    { componentName: 'House Rent Allowance (HRA)', componentType: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 20, isStatutory: false, sortOrder: 2 },
    { componentName: 'Dearness Allowance (DA)', componentType: 'EARNING', calcType: 'PERCENT_OF_BASIC', value: 10, isStatutory: false, sortOrder: 3 },
    { componentName: 'Conveyance Allowance', componentType: 'EARNING', calcType: 'FIXED', value: 1600, isStatutory: false, sortOrder: 4 },
    { componentName: 'Provident Fund (PF)', componentType: 'DEDUCTION', calcType: 'PERCENT_OF_BASIC', value: 12, isStatutory: true, sortOrder: 10 },
    { componentName: 'Employee State Insurance (ESI)', componentType: 'DEDUCTION', calcType: 'PERCENT_OF_GROSS', value: 0.75, isStatutory: true, sortOrder: 11 },
    { componentName: 'Professional Tax (PT)', componentType: 'DEDUCTION', calcType: 'FIXED', value: 200, isStatutory: true, sortOrder: 12 }
];

const SalaryTemplateModal = ({ show, onHide, template = null, firmId }) => {
    const [templateName, setTemplateName] = useState('');
    const [templateType, setTemplateType] = useState('MONTHLY');
    const [description, setDescription] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [components, setComponents] = useState(DEFAULT_COMPONENTS);
    const [errors, setErrors] = useState({});

    const createMutation = useCreateSalaryTemplate();
    const updateMutation = useUpdateSalaryTemplate();
    const isEditing = Boolean(template?.id);

    useEffect(() => {
        if (template) {
            setTemplateName(template.templateName || template.template_name || '');
            setTemplateType(template.templateType || template.template_type || 'MONTHLY');
            setDescription(template.description || '');
            setIsDefault(Boolean(template.isDefault || template.is_default));
            setComponents(
                Array.isArray(template.components) && template.components.length > 0
                    ? template.components.map(c => ({
                        componentName: c.componentName || c.component_name,
                        componentType: c.componentType || c.component_type,
                        calcType: c.calcType || c.calc_type,
                        value: parseFloat(c.value || 0),
                        isStatutory: Boolean(c.isStatutory || c.is_statutory),
                        sortOrder: c.sortOrder !== undefined ? c.sortOrder : (c.sort_order || 0)
                    }))
                    : DEFAULT_COMPONENTS
            );
        } else {
            setTemplateName('');
            setTemplateType('MONTHLY');
            setDescription('');
            setIsDefault(false);
            setComponents(DEFAULT_COMPONENTS);
        }
        setErrors({});
    }, [template, show]);

    const addComponent = () => {
        setComponents([
            ...components,
            {
                componentName: '',
                componentType: 'EARNING',
                calcType: 'FIXED',
                value: 0,
                isStatutory: false,
                sortOrder: components.length + 1
            }
        ]);
    };

    const removeComponent = (index) => {
        setComponents(components.filter((_, idx) => idx !== index));
    };

    const updateComponent = (index, field, val) => {
        const next = [...components];
        next[index] = { ...next[index], [field]: val };
        setComponents(next);
    };

    const validate = () => {
        const errs = {};
        if (!templateName.trim()) {
            errs.templateName = 'Template name is required.';
        }
        if (components.length === 0) {
            errs.components = 'Please add at least one salary component.';
        }
        setErrors(errs);
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            toast.error(errs.templateName || errs.components || 'Please fix the errors in the form.');
            return;
        }

        try {
            const payload = {
                firmId,
                templateName,
                templateType,
                description,
                isDefault,
                components: components.map((c, idx) => ({
                    ...c,
                    value: parseFloat(c.value) || 0,
                    sortOrder: idx + 1
                }))
            };

            if (isEditing) {
                await updateMutation.mutateAsync({ id: template.id, ...payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onHide();
        } catch (err) {
            // Handled in hook
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Modal show={show} onHide={onHide} size="xl" centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title className="fw-bold fs-5">{isEditing ? 'Edit Salary Template' : 'Create Salary Template'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Row className="g-3 mb-3">
                        <Col md={6}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Control
                                    id="templateName"
                                    type="text"
                                    placeholder="Template Name"
                                    value={templateName}
                                    onChange={(e) => {
                                        setTemplateName(e.target.value);
                                        if (errors.templateName) setErrors(prev => ({ ...prev, templateName: null }));
                                    }}
                                    isInvalid={!!errors.templateName}
                                    required
                                />
                                <Form.Label htmlFor="templateName">Template Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control.Feedback type="invalid">{errors.templateName}</Form.Control.Feedback>
                            </Form.Floating>
                        </Col>
                        <Col md={3}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                <Form.Select
                                    id="templateType"
                                    value={templateType}
                                    onChange={(e) => setTemplateType(e.target.value)}
                                    required
                                >
                                    <option value="MONTHLY">Monthly CTC</option>
                                    <option value="DAILY">Daily Wage</option>
                                    <option value="HOURLY">Hourly Rate</option>
                                </Form.Select>
                                <Form.Label htmlFor="templateType">Salary Type <span className="text-danger">*</span></Form.Label>
                            </Form.Floating>
                        </Col>
                        <Col md={3} className="d-flex align-items-center mb-3">
                            <Form.Check
                                type="checkbox"
                                id="isDefaultTemplate"
                                label="Set as Default Template"
                                checked={isDefault}
                                onChange={(e) => setIsDefault(e.target.checked)}
                                className="fw-semibold text-secondary"
                            />
                        </Col>
                        <Col md={12}>
                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-2">
                                <Form.Control
                                    id="description"
                                    as="textarea"
                                    placeholder="Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    style={{ height: '70px' }}
                                />
                                <Form.Label htmlFor="description">Description / Notes</Form.Label>
                            </Form.Floating>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                        <div>
                            <h6 className="mb-0 fw-bold">Salary Components (Earnings & Deductions)</h6>
                            <span className="text-muted small">Configure earning lines and statutory deduction formulas</span>
                        </div>
                        <Button variant="outline-primary" size="sm" onClick={addComponent}>
                            <Plus size={15} className="me-1" /> Add Component
                        </Button>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <Table hover className="align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '25%' }}>Component Name</th>
                                    <th style={{ width: '18%' }}>Type</th>
                                    <th style={{ width: '22%' }}>Calculation Type</th>
                                    <th style={{ width: '15%' }}>Value (% or ₹)</th>
                                    <th style={{ width: '12%' }} className="text-center">Statutory?</th>
                                    <th style={{ width: '8%' }} className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {components.map((comp, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                placeholder="e.g. Basic, HRA"
                                                value={comp.componentName}
                                                onChange={(e) => updateComponent(idx, 'componentName', e.target.value)}
                                                required
                                            />
                                        </td>
                                        <td>
                                            <Form.Select
                                                size="sm"
                                                value={comp.componentType}
                                                onChange={(e) => updateComponent(idx, 'componentType', e.target.value)}
                                            >
                                                <option value="EARNING">Earning (+)</option>
                                                <option value="DEDUCTION">Deduction (-)</option>
                                            </Form.Select>
                                        </td>
                                        <td>
                                            <Form.Select
                                                size="sm"
                                                value={comp.calcType}
                                                onChange={(e) => updateComponent(idx, 'calcType', e.target.value)}
                                            >
                                                <option value="PERCENT_OF_BASIC">% of Basic</option>
                                                <option value="PERCENT_OF_GROSS">% of Gross Base</option>
                                                <option value="FIXED">Fixed Amount (₹)</option>
                                            </Form.Select>
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                step="any"
                                                min="0"
                                                value={comp.value}
                                                onChange={(e) => updateComponent(idx, 'value', e.target.value)}
                                                required
                                            />
                                        </td>
                                        <td className="text-center">
                                            <Form.Check
                                                type="checkbox"
                                                id={`statutory-${idx}`}
                                                checked={comp.isStatutory}
                                                onChange={(e) => updateComponent(idx, 'isStatutory', e.target.checked)}
                                                title="Statutory components (PF/ESI/PT) are auto-skipped for non-permanent employees"
                                            />
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                className="p-1"
                                                onClick={() => removeComponent(idx)}
                                            >
                                                <Trash2 size={15} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" size="sm" onClick={onHide} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit" disabled={isLoading || !templateName.trim()}>
                        {isLoading ? 'Saving...' : (isEditing ? 'Update Template' : 'Create Template')}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default SalaryTemplateModal;
