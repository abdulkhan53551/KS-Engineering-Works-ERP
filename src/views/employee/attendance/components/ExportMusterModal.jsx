import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Table, Badge } from 'react-bootstrap';
import { FileSpreadsheet, FileText, Download, Check, Calendar, Users, ShieldCheck } from 'lucide-react';
import { useExportAttendanceMuster } from '../../common/hooks/useEmployeeApi';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const ExportMusterModal = ({
    show,
    onHide,
    month,
    year,
    firmId,
    branchId,
    previewEmployees = []
}) => {
    const [format, setFormat] = useState('xlsx'); // 'xlsx' | 'pdf'
    const [includeOt, setIncludeOt] = useState(true);

    const exportMutation = useExportAttendanceMuster();
    const monthName = `${MONTH_NAMES[(month || 1) - 1]} ${year}`;

    const handleDownload = async () => {
        await exportMutation.mutateAsync({
            firmId,
            branchId,
            month,
            year,
            includeOt,
            format
        });
        onHide();
    };

    const sampleEmps = previewEmployees.slice(0, 4);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="muster-modal">
            {/* Header */}
            <div className="muster-modal-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-3 d-flex align-items-center justify-content-center text-primary"
                        style={{ width: '44px', height: '44px', background: '#e0f2fe' }}
                    >
                        <Calendar size={22} />
                    </div>
                    <div>
                        <h5 className="fw-bold mb-0 text-dark">Export Attendance Muster Roll</h5>
                        <div className="text-muted small">
                            Form II Statutory Register • <strong>{monthName}</strong>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={onHide}
                    disabled={exportMutation.isPending}
                />
            </div>

            <Modal.Body className="p-4">
                {/* 1. Format Selection Cards */}
                <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="fw-bold text-dark small text-uppercase mb-0" style={{ letterSpacing: '0.5px' }}>
                            1. Select Export Format
                        </label>
                        <span className="text-muted small">Choose spreadsheet or print-ready document</span>
                    </div>

                    <Row className="g-3">
                        <Col sm={6}>
                            <div
                                onClick={() => setFormat('xlsx')}
                                className={`muster-format-card ${format === 'xlsx' ? 'active' : ''}`}
                            >
                                <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success me-1">
                                    <FileSpreadsheet size={26} />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                        <span className="fw-bold text-dark">Excel (.xlsx)</span>
                                        <div className="muster-radio-dot">
                                            {format === 'xlsx' && <div className="muster-radio-inner" />}
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.3' }}>
                                        Complete statutory muster with frozen panes, color-coded days, and auto-sum formulas.
                                    </p>
                                </div>
                            </div>
                        </Col>

                        <Col sm={6}>
                            <div
                                onClick={() => setFormat('pdf')}
                                className={`muster-format-card ${format === 'pdf' ? 'active' : ''}`}
                            >
                                <div className="p-2 rounded-3 bg-danger bg-opacity-10 text-danger me-1">
                                    <FileText size={26} />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="d-flex align-items-center justify-content-between mb-1">
                                        <span className="fw-bold text-dark">Landscape PDF (.pdf)</span>
                                        <div className="muster-radio-dot">
                                            {format === 'pdf' && <div className="muster-radio-inner" />}
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0" style={{ fontSize: '0.78rem', lineHeight: '1.3' }}>
                                        Official Form II A3 landscape document with company letterhead and signature blocks.
                                    </p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 2. Customization Options */}
                <div className="mb-4 p-3 bg-light rounded-3 border border-light-subtle">
                    <label className="fw-bold text-dark small text-uppercase mb-2 d-block" style={{ letterSpacing: '0.5px' }}>
                        2. Configuration Options
                    </label>
                    <Row className="g-2">
                        <Col sm={6}>
                            <Form.Check
                                type="checkbox"
                                id="check-ot-muster"
                                label="Include Overtime Hours Summary"
                                checked={includeOt}
                                onChange={(e) => setIncludeOt(e.target.checked)}
                                className="small fw-semibold text-dark"
                            />
                        </Col>
                        <Col sm={6}>
                            <div className="d-flex align-items-center gap-1 text-muted small">
                                <ShieldCheck size={16} className="text-success" />
                                <span>Certified Form II Factory Compliance Template</span>
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* 3. Live Data Preview Table */}
                <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="fw-bold text-dark small text-uppercase mb-0" style={{ letterSpacing: '0.5px' }}>
                            Live Muster Preview (Days 1–12 Sample)
                        </label>
                        <span className="text-muted small">
                            <Users size={13} className="me-1" />
                            {previewEmployees.length} employees enrolled
                        </span>
                    </div>

                    <div className="muster-preview-wrapper overflow-hidden">
                        <div className="table-responsive bg-white rounded-2 border">
                            <Table className="muster-preview-table mb-0 align-middle">
                                <thead>
                                    <tr>
                                        <th style={{ width: '65px', textAlign: 'left', paddingLeft: '8px' }}>Code</th>
                                        <th style={{ width: '130px', textAlign: 'left' }}>Employee Name</th>
                                        <th style={{ width: '85px', textAlign: 'left' }}>Dept</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(d => (
                                            <th key={d} style={{ width: '26px' }}>{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sampleEmps.length === 0 ? (
                                        <tr>
                                            <td colSpan={15} className="py-4 text-center text-muted">
                                                No active employees found to preview.
                                            </td>
                                        </tr>
                                    ) : (
                                        sampleEmps.map((emp, idx) => (
                                            <tr key={emp.id || idx}>
                                                <td className="ps-2 font-monospace fw-bold text-primary">
                                                    {emp.emp_code || emp.empCode}
                                                </td>
                                                <td className="text-start fw-bold text-dark text-truncate" style={{ maxWidth: '130px' }}>
                                                    {emp.first_name || emp.firstName} {emp.last_name || emp.lastName || ''}
                                                </td>
                                                <td className="text-start text-muted small">
                                                    {emp.department || 'General'}
                                                </td>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(d => {
                                                    const isSunday = (d % 7 === 0);
                                                    const isAbsent = (d === 6 && idx === 1);
                                                    const code = isSunday ? 'WO' : (isAbsent ? 'A' : 'P');
                                                    return (
                                                        <td key={d}>
                                                            <span className={`muster-day-badge muster-day-${code}`}>
                                                                {code}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer className="px-4 py-3 bg-light border-top d-flex justify-content-between align-items-center">
                <div className="text-muted small">
                    <span className="badge bg-secondary bg-opacity-10 text-secondary me-2">
                        {previewEmployees.length} Employees
                    </span>
                    <span>Ready to download</span>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={onHide}
                        disabled={exportMutation.isPending}
                        className="px-3"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownload}
                        disabled={exportMutation.isPending}
                        className="d-flex align-items-center gap-2 shadow-sm px-4 fw-semibold"
                    >
                        {exportMutation.isPending ? (
                            <>
                                <Spinner size="sm" animation="border" /> Generating {format.toUpperCase()}...
                            </>
                        ) : (
                            <>
                                <Download size={16} /> Download Muster ({format === 'pdf' ? '.pdf' : '.xlsx'})
                            </>
                        )}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};

export default ExportMusterModal;
