import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FileText, Plus, Edit3, Trash2, ArrowLeft } from 'lucide-react';
import { useSalaryTemplates, useDeleteSalaryTemplate } from '../hooks/useEmployeeApi';
import SalaryTemplateModal from '../components/SalaryTemplateModal';
import '../employee.css';

const SalaryTemplates = () => {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.authReducer?.user);
    const firmId = currentUser?.firmId;

    const [showModal, setShowModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const { data: templatesRaw, isLoading } = useSalaryTemplates({ firmId });
    const templates = Array.isArray(templatesRaw) ? templatesRaw : (Array.isArray(templatesRaw?.data) ? templatesRaw.data : []);
    const deleteMutation = useDeleteSalaryTemplate();

    const handleCreate = () => {
        setSelectedTemplate(null);
        setShowModal(true);
    };

    const handleEdit = (tpl) => {
        setSelectedTemplate(tpl);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this salary template?')) {
            await deleteMutation.mutateAsync(id);
        }
    };

    return (
        <div className="container-fluid p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee/payroll')}>
                        <ArrowLeft size={16} />
                    </Button>
                    <div>
                        <h4 className="fw-bold mb-0 text-dark">Salary Structure Templates</h4>
                        <span className="text-muted small">
                            Define earning & deduction component formulas (e.g. Basic, HRA, PF, ESI).
                        </span>
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={handleCreate}>
                    <Plus size={16} className="me-1" /> Create Template
                </Button>
            </div>

            <Row className="g-4">
                {isLoading ? (
                    <Col xs={12} className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-muted">Loading templates...</div>
                    </Col>
                ) : templates.length === 0 ? (
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm rounded-3 text-center py-5">
                            <Card.Body>
                                <FileText size={40} className="text-muted mb-2" />
                                <h5>No salary templates found</h5>
                                <p className="text-muted small">Create templates to automatically structure earnings and deductions for your staff.</p>
                                <Button variant="primary" size="sm" onClick={handleCreate}>
                                    <Plus size={15} className="me-1" /> Create First Template
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ) : (
                    templates.map(tpl => (
                        <Col lg={6} key={tpl.id}>
                            <Card className="border-0 shadow-sm rounded-3 h-100">
                                <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="fw-bold mb-0 text-dark">{tpl.templateName}</h5>
                                        <span className="text-muted small">Type: {tpl.templateType}</span>
                                    </div>
                                    <div className="d-flex gap-2 align-items-center">
                                        {tpl.isDefault && <Badge bg="success">Default</Badge>}
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="p-1 px-2"
                                            onClick={() => handleEdit(tpl)}
                                            title="Edit Template"
                                        >
                                            <Edit3 size={15} />
                                        </Button>
                                        <Button
                                            variant="light"
                                            size="sm"
                                            className="p-1 px-2 text-danger"
                                            onClick={() => handleDelete(tpl.id)}
                                            title="Delete Template"
                                        >
                                            <Trash2 size={15} />
                                        </Button>
                                    </div>
                                </Card.Header>
                                <Card.Body className="pt-0">
                                    {tpl.description && (
                                        <p className="text-muted small mb-3">{tpl.description}</p>
                                    )}

                                    <Table size="sm" hover className="align-middle mb-0 border rounded">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Component</th>
                                                <th>Type</th>
                                                <th>Formula / Calc</th>
                                                <th className="text-end">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tpl.components?.map((c, idx) => (
                                                <tr key={idx}>
                                                    <td className="fw-semibold">
                                                        {c.componentName || c.component_name}
                                                        {(c.isStatutory || c.is_statutory) && (
                                                            <span className="badge bg-light text-secondary ms-1 small" style={{ fontSize: '0.68rem' }}>
                                                                Statutory
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {(c.componentType || c.component_type) === 'EARNING' ? (
                                                            <Badge bg="success">Earning (+)</Badge>
                                                        ) : (
                                                            <Badge bg="danger">Deduction (-)</Badge>
                                                        )}
                                                    </td>
                                                    <td className="text-muted small">
                                                        {(c.calcType || c.calc_type) === 'PERCENT_OF_BASIC' ? '% of Basic' :
                                                         ((c.calcType || c.calc_type) === 'PERCENT_OF_GROSS' ? '% of Gross' : 'Fixed')}
                                                    </td>
                                                    <td className="text-end fw-bold">
                                                        {(c.calcType || c.calc_type) === 'FIXED' ? `₹${c.value}` : `${c.value}%`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>

            <SalaryTemplateModal
                show={showModal}
                onHide={() => setShowModal(false)}
                template={selectedTemplate}
                firmId={firmId}
            />
        </div>
    );
};

export default SalaryTemplates;
