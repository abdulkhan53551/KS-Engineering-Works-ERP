import React, { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    FileText,
    Plus,
    Edit3,
    Trash2,
    ArrowLeft,
    TrendingUp,
    Shield,
    CheckCircle2,
    DollarSign,
    Layers,
    Info
} from 'lucide-react';
import { useSalaryTemplates, useDeleteSalaryTemplate } from '../hooks/useEmployeeApi';
import SalaryTemplateModal from '../components/SalaryTemplateModal';
import '../employee.css';

const SalaryTemplates = () => {
    const navigate = useNavigate();
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? undefined : activeFirm?.id;

    const [showModal, setShowModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    const { data: templatesRaw, isLoading } = useSalaryTemplates({ firmId });
    const templates = useMemo(() => {
        if (!templatesRaw) return [];
        return Array.isArray(templatesRaw)
            ? templatesRaw
            : (Array.isArray(templatesRaw?.data) ? templatesRaw.data : []);
    }, [templatesRaw]);

    const deleteMutation = useDeleteSalaryTemplate();

    const handleCreate = () => {
        setSelectedTemplate(null);
        setShowModal(true);
    };

    const handleEdit = (tpl) => {
        setSelectedTemplate(tpl);
        setShowModal(true);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
            await deleteMutation.mutateAsync(id);
        }
    };

    // Calculate metrics
    const totalTemplates = templates.length;
    const monthlyCount = templates.filter(t => t.templateType === 'MONTHLY').length;
    const wageCount = templates.filter(t => t.templateType !== 'MONTHLY').length;
    const defaultTemplate = templates.find(t => t.isDefault);

    return (
        <div className="container-fluid p-3">
            {/* Top Navigation Bar */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                        style={{ width: '36px', height: '36px' }}
                        onClick={() => navigate('/dashboard/employee/payroll')}
                        title="Back to Payroll"
                    >
                        <ArrowLeft size={16} />
                    </Button>
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <h4 className="fw-bold mb-0 text-dark">Salary Structure Templates</h4>
                            <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-1">
                                {totalTemplates} {totalTemplates === 1 ? 'Template' : 'Templates'}
                            </Badge>
                        </div>
                        <span className="text-muted small">
                            Define structured earning allowances & statutory deduction formulas for your workforce.
                        </span>
                    </div>
                </div>
                <Button variant="primary" size="sm" className="d-flex align-items-center gap-1 shadow-sm px-3" onClick={handleCreate}>
                    <Plus size={16} /> Create Template
                </Button>
            </div>

            {/* Metrics Overview Bar */}
            <Row className="g-3 mb-4">
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div
                                className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <Layers size={20} />
                            </div>
                            <div>
                                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Total Structures</div>
                                <div className="fw-bold fs-5 text-dark">{totalTemplates} Active</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div
                                className="rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Salary Types</div>
                                <div className="fw-bold fs-5 text-dark">{monthlyCount} Monthly • {wageCount} Daily/Wage</div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm rounded-3 bg-white">
                        <Card.Body className="p-3 d-flex align-items-center gap-3">
                            <div
                                className="rounded-3 bg-warning-subtle text-warning-emphasis d-flex align-items-center justify-content-center"
                                style={{ width: '44px', height: '44px' }}
                            >
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.72rem' }}>Default Assignment</div>
                                <div className="fw-bold fs-6 text-dark text-truncate" style={{ maxWidth: '200px' }}>
                                    {defaultTemplate ? defaultTemplate.templateName : 'None specified'}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Templates Grid */}
            <Row className="g-4">
                {isLoading ? (
                    <Col xs={12} className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <div className="mt-2 text-muted">Loading salary structure templates...</div>
                    </Col>
                ) : templates.length === 0 ? (
                    <Col xs={12}>
                        <Card className="border-0 shadow-sm rounded-3 text-center py-5">
                            <Card.Body>
                                <div
                                    className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center p-4 mb-3 text-muted"
                                >
                                    <FileText size={48} />
                                </div>
                                <h5 className="fw-bold text-dark">No Salary Templates Defined</h5>
                                <p className="text-muted small mx-auto" style={{ maxWidth: '420px' }}>
                                    Create your first template (e.g. Standard Workshop Staff, Executive CTC) to automatically compute Basic, HRA, PF, and ESI across payslips.
                                </p>
                                <Button variant="primary" size="sm" onClick={handleCreate} className="mt-2">
                                    <Plus size={15} className="me-1" /> Create Template
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ) : (
                    templates.map((tpl) => {
                        const earnings = tpl.components?.filter(c => (c.componentType || c.component_type) === 'EARNING') || [];
                        const deductions = tpl.components?.filter(c => (c.componentType || c.component_type) === 'DEDUCTION') || [];

                        return (
                            <Col lg={6} key={tpl.id}>
                                <Card className="border-0 shadow-sm rounded-3 h-100 overflow-hidden d-flex flex-column">
                                    {/* Top Accent Strip */}
                                    <div
                                        style={{
                                            height: '4px',
                                            background: tpl.isDefault
                                                ? 'linear-gradient(90deg, #10b981, #059669)'
                                                : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                                        }}
                                    />

                                    {/* Card Header */}
                                    <Card.Header className="bg-white border-0 pt-3 pb-2 px-4 d-flex justify-content-between align-items-start">
                                        <div>
                                            <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                                <h5 className="fw-bold mb-0 text-dark">{tpl.templateName}</h5>
                                                {tpl.isDefault && (
                                                    <Badge bg="success" className="px-2 py-1 small fw-semibold">
                                                        ✓ Default
                                                    </Badge>
                                                )}
                                                <Badge
                                                    bg="light"
                                                    className="text-secondary border px-2 py-1 small font-monospace"
                                                >
                                                    {tpl.templateType === 'MONTHLY' ? 'Monthly CTC' : (tpl.templateType === 'DAILY' ? 'Daily Wage' : 'Hourly')}
                                                </Badge>
                                            </div>
                                            {tpl.description ? (
                                                <p className="text-muted small mb-0">{tpl.description}</p>
                                            ) : (
                                                <span className="text-muted small fst-italic">Standard compensation structure</span>
                                            )}
                                        </div>

                                        <div className="d-flex gap-1 align-items-center ms-2">
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="p-1 px-2 border"
                                                onClick={() => handleEdit(tpl)}
                                                title="Edit Template"
                                            >
                                                <Edit3 size={14} className="text-secondary" />
                                            </Button>
                                            <Button
                                                variant="light"
                                                size="sm"
                                                className="p-1 px-2 border text-danger"
                                                onClick={() => handleDelete(tpl.id, tpl.templateName)}
                                                title="Delete Template"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </Card.Header>

                                    {/* Card Body: Two-Column Split (Earnings vs Deductions) */}
                                    <Card.Body className="px-4 py-2 flex-grow-1">
                                        <Row className="g-3">
                                            {/* Column 1: Earnings */}
                                            <Col sm={6}>
                                                <div className="p-3 rounded-3 bg-light h-100 border">
                                                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                                                        <div className="d-flex align-items-center gap-1 text-success fw-bold small">
                                                            <TrendingUp size={15} /> Earnings ({earnings.length})
                                                        </div>
                                                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>Addition (+)</span>
                                                    </div>

                                                    {earnings.length === 0 ? (
                                                        <div className="text-muted small text-center py-3">No earning lines</div>
                                                    ) : (
                                                        <div className="d-flex flex-column gap-2">
                                                            {earnings.map((c, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="d-flex justify-content-between align-items-center bg-white p-2 rounded border-sm shadow-none"
                                                                    style={{ border: '1px solid #f1f5f9' }}
                                                                >
                                                                    <div>
                                                                        <div className="fw-semibold text-dark small" style={{ fontSize: '0.8rem' }}>
                                                                            {c.componentName || c.component_name}
                                                                        </div>
                                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                            {(c.calcType || c.calc_type) === 'PERCENT_OF_BASIC' ? '% of Basic' :
                                                                             ((c.calcType || c.calc_type) === 'PERCENT_OF_GROSS' ? '% of Gross CTC' : 'Fixed Allowance')}
                                                                        </div>
                                                                    </div>
                                                                    <div className="fw-bold text-success text-end small">
                                                                        {(c.calcType || c.calc_type) === 'FIXED' ? `₹${Number(c.value).toLocaleString('en-IN')}` : `${c.value}%`}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>

                                            {/* Column 2: Deductions & Statutory */}
                                            <Col sm={6}>
                                                <div className="p-3 rounded-3 bg-light h-100 border">
                                                    <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                                                        <div className="d-flex align-items-center gap-1 text-danger fw-bold small">
                                                            <Shield size={15} /> Deductions ({deductions.length})
                                                        </div>
                                                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>Deduction (-)</span>
                                                    </div>

                                                    {deductions.length === 0 ? (
                                                        <div className="text-muted small text-center py-3">No deduction lines</div>
                                                    ) : (
                                                        <div className="d-flex flex-column gap-2">
                                                            {deductions.map((c, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="d-flex justify-content-between align-items-center bg-white p-2 rounded shadow-none"
                                                                    style={{ border: '1px solid #f1f5f9' }}
                                                                >
                                                                    <div>
                                                                        <div className="d-flex align-items-center gap-1">
                                                                            <span className="fw-semibold text-dark small" style={{ fontSize: '0.8rem' }}>
                                                                                {c.componentName || c.component_name}
                                                                            </span>
                                                                            {(c.isStatutory || c.is_statutory) && (
                                                                                <Badge
                                                                                    bg="danger-subtle"
                                                                                    className="text-danger border border-danger-subtle p-0 px-1"
                                                                                    style={{ fontSize: '0.62rem' }}
                                                                                >
                                                                                    Statutory
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                            {(c.calcType || c.calc_type) === 'PERCENT_OF_BASIC' ? '% of Basic' :
                                                                             ((c.calcType || c.calc_type) === 'PERCENT_OF_GROSS' ? '% of Gross Base' : 'Fixed Deduction')}
                                                                        </div>
                                                                    </div>
                                                                    <div className="fw-bold text-danger text-end small">
                                                                        {(c.calcType || c.calc_type) === 'FIXED' ? `₹${Number(c.value).toLocaleString('en-IN')}` : `${c.value}%`}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>
                                    </Card.Body>

                                    {/* Card Footer: Summary Strip */}
                                    <Card.Footer className="bg-white border-top py-2 px-4 d-flex justify-content-between align-items-center text-muted small mt-2">
                                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                            <Info size={13} className="text-primary" />
                                            <span>Statutory deductions auto-activate for permanent staff.</span>
                                        </div>
                                        <div className="fw-semibold text-dark" style={{ fontSize: '0.75rem' }}>
                                            {tpl.components?.length || 0} Total Rules
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        );
                    })
                )}
            </Row>

            {/* Salary Template Modal */}
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
