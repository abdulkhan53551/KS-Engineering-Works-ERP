import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Settings, Save, ArrowLeft, Shield, Clock, Calendar } from 'lucide-react';
import { usePayrollSettings, useUpdatePayrollSettings } from '../hooks/useEmployeeApi';
import '../employee.css';

const PayrollSettings = () => {
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.authReducer?.user);
    const firmId = currentUser?.firmId;

    const { data: settingsData, isLoading } = usePayrollSettings({ firmId });
    const updateMutation = useUpdatePayrollSettings();

    const [formData, setFormData] = useState({
        workingDaysPerMonth: 26,
        weeklyOffDay: 'SUNDAY',
        otRateType: 'FIXED',
        otHourlyRate: 0,
        otMultiplierNormal: 1.5,
        otMultiplierHoliday: 2.0,
        otMultiplierWeekend: 2.0,
        pfEnabled: false,
        pfEmployerPercent: 12.00,
        pfEmployeePercent: 12.00,
        pfWageCeiling: 15000,
        esiEnabled: false,
        esiEmployerPercent: 3.25,
        esiEmployeePercent: 0.75,
        esiWageCeiling: 21000,
        ptEnabled: false,
        ptMonthlyAmount: 200
    });

    useEffect(() => {
        const s = settingsData?.data || (settingsData?.working_days_per_month !== undefined ? settingsData : null);
        if (s) {
            setFormData({
                workingDaysPerMonth: s.working_days_per_month !== undefined ? s.working_days_per_month : 26,
                weeklyOffDay: s.weekly_off_day || 'SUNDAY',
                otRateType: s.ot_rate_type || 'FIXED',
                otHourlyRate: parseFloat(s.ot_hourly_rate || 0),
                otMultiplierNormal: parseFloat(s.ot_multiplier_normal || 1.5),
                otMultiplierHoliday: parseFloat(s.ot_multiplier_holiday || 2.0),
                otMultiplierWeekend: parseFloat(s.ot_multiplier_weekend || 2.0),
                pfEnabled: Boolean(s.pf_enabled),
                pfEmployerPercent: parseFloat(s.pf_employer_percent || 12.00),
                pfEmployeePercent: parseFloat(s.pf_employee_percent || 12.00),
                pfWageCeiling: parseFloat(s.pf_wage_ceiling || 15000),
                esiEnabled: Boolean(s.esi_enabled),
                esiEmployerPercent: parseFloat(s.esi_employer_percent || 3.25),
                esiEmployeePercent: parseFloat(s.esi_employee_percent || 0.75),
                esiWageCeiling: parseFloat(s.esi_wage_ceiling || 21000),
                ptEnabled: Boolean(s.pt_enabled),
                ptMonthlyAmount: parseFloat(s.pt_monthly_amount || 200)
            });
        }
    }, [settingsData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateMutation.mutateAsync({
                ...formData,
                firmId,
                workingDaysPerMonth: parseInt(formData.workingDaysPerMonth, 10),
                otHourlyRate: parseFloat(formData.otHourlyRate) || 0,
                otMultiplierNormal: parseFloat(formData.otMultiplierNormal) || 1.5,
                otMultiplierHoliday: parseFloat(formData.otMultiplierHoliday) || 2.0,
                otMultiplierWeekend: parseFloat(formData.otMultiplierWeekend) || 2.0,
                pfEmployerPercent: parseFloat(formData.pfEmployerPercent) || 12,
                pfEmployeePercent: parseFloat(formData.pfEmployeePercent) || 12,
                pfWageCeiling: parseFloat(formData.pfWageCeiling) || 15000,
                esiEmployerPercent: parseFloat(formData.esiEmployerPercent) || 3.25,
                esiEmployeePercent: parseFloat(formData.esiEmployeePercent) || 0.75,
                esiWageCeiling: parseFloat(formData.esiWageCeiling) || 21000,
                ptMonthlyAmount: parseFloat(formData.ptMonthlyAmount) || 200
            });
        } catch (err) {
            // Handled in hook
        }
    };

    if (isLoading) {
        return (
            <div className="container-fluid p-5 text-center">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2 text-muted">Loading payroll settings...</div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee/payroll')}>
                        <ArrowLeft size={16} />
                    </Button>
                    <div>
                        <h4 className="fw-bold mb-0 text-dark">Firm Payroll Settings</h4>
                        <span className="text-muted small">
                            Configure overtime rates, default working days, and statutory compliance (PF, ESI, PT).
                        </span>
                    </div>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={updateMutation.isPending}
                    className="d-flex align-items-center gap-1"
                >
                    <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>

            <Form onSubmit={handleSubmit}>
                <Row className="g-4">
                    {/* 1. Working Days & Weekly Off */}
                    <Col md={6}>
                        <Card className="border-0 shadow-sm rounded-3 h-100">
                            <Card.Header className="bg-white border-0 py-3">
                                <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                    <Calendar size={18} /> Working Calendar Rules
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Working Days Per Month <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                max="31"
                                                value={formData.workingDaysPerMonth}
                                                onChange={(e) => setFormData({ ...formData, workingDaysPerMonth: e.target.value })}
                                                required
                                            />
                                            <Form.Text className="text-muted">Standard is 26 days.</Form.Text>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Weekly Off Day</Form.Label>
                                            <Form.Select
                                                value={formData.weeklyOffDay}
                                                onChange={(e) => setFormData({ ...formData, weeklyOffDay: e.target.value })}
                                            >
                                                <option value="SUNDAY">Sunday</option>
                                                <option value="SATURDAY">Saturday</option>
                                                <option value="NONE">None / Custom</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 2. Overtime Configuration */}
                    <Col md={6}>
                        <Card className="border-0 shadow-sm rounded-3 h-100">
                            <Card.Header className="bg-white border-0 py-3">
                                <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                    <Clock size={18} /> Overtime (OT) Calculation Rules
                                </h6>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>OT Calculation Method</Form.Label>
                                            <Form.Select
                                                value={formData.otRateType}
                                                onChange={(e) => setFormData({ ...formData, otRateType: e.target.value })}
                                            >
                                                <option value="FIXED">Fixed Hourly Rate (₹ / hr)</option>
                                                <option value="MULTIPLIER">Salary Multiplier (e.g. 1.5x)</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>

                                    {formData.otRateType === 'FIXED' ? (
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Fixed Hourly Rate (₹)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={formData.otHourlyRate}
                                                    onChange={(e) => setFormData({ ...formData, otHourlyRate: e.target.value })}
                                                />
                                                <Form.Text className="text-muted">Applied per OT hour worked.</Form.Text>
                                            </Form.Group>
                                        </Col>
                                    ) : (
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Normal OT Multiplier</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    step="0.1"
                                                    value={formData.otMultiplierNormal}
                                                    onChange={(e) => setFormData({ ...formData, otMultiplierNormal: e.target.value })}
                                                />
                                                <Form.Text className="text-muted">e.g. 1.5 = 1.5x base hourly rate.</Form.Text>
                                            </Form.Group>
                                        </Col>
                                    )}

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Holiday OT Multiplier</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                                value={formData.otMultiplierHoliday}
                                                onChange={(e) => setFormData({ ...formData, otMultiplierHoliday: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Weekend OT Multiplier</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                                value={formData.otMultiplierWeekend}
                                                onChange={(e) => setFormData({ ...formData, otMultiplierWeekend: e.target.value })}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* 3. Statutory Compliance (PF, ESI, PT) */}
                    <Col md={12}>
                        <Card className="border-0 shadow-sm rounded-3">
                            <Card.Header className="bg-white border-0 py-3">
                                <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                    <Shield size={18} /> Statutory Compliance (PF, ESI, Professional Tax)
                                </h6>
                                <span className="text-muted small">
                                    Note: Statutory deductions are <strong>strictly applied only to Permanent staff</strong>. Non-permanent workers (Daily Wage / Contract) are automatically excluded.
                                </span>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-4">
                                    {/* PF */}
                                    <Col md={4} className="border-end">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="pfEnabled"
                                                label={<strong className="text-dark">Provident Fund (PF)</strong>}
                                                checked={formData.pfEnabled}
                                                onChange={(e) => setFormData({ ...formData, pfEnabled: e.target.checked })}
                                            />
                                        </div>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Employee Contribution (%)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.1"
                                                disabled={!formData.pfEnabled}
                                                value={formData.pfEmployeePercent}
                                                onChange={(e) => setFormData({ ...formData, pfEmployeePercent: e.target.value })}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Employer Contribution (%)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.1"
                                                disabled={!formData.pfEnabled}
                                                value={formData.pfEmployerPercent}
                                                onChange={(e) => setFormData({ ...formData, pfEmployerPercent: e.target.value })}
                                            />
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className="small">Wage Ceiling (₹)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                disabled={!formData.pfEnabled}
                                                value={formData.pfWageCeiling}
                                                onChange={(e) => setFormData({ ...formData, pfWageCeiling: e.target.value })}
                                            />
                                            <Form.Text className="text-muted">PF calculated up to ₹15,000.</Form.Text>
                                        </Form.Group>
                                    </Col>

                                    {/* ESI */}
                                    <Col md={4} className="border-end">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="esiEnabled"
                                                label={<strong className="text-dark">Employee State Insurance (ESI)</strong>}
                                                checked={formData.esiEnabled}
                                                onChange={(e) => setFormData({ ...formData, esiEnabled: e.target.checked })}
                                            />
                                        </div>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Employee Contribution (%)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.05"
                                                disabled={!formData.esiEnabled}
                                                value={formData.esiEmployeePercent}
                                                onChange={(e) => setFormData({ ...formData, esiEmployeePercent: e.target.value })}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Employer Contribution (%)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.05"
                                                disabled={!formData.esiEnabled}
                                                value={formData.esiEmployerPercent}
                                                onChange={(e) => setFormData({ ...formData, esiEmployerPercent: e.target.value })}
                                            />
                                        </Form.Group>
                                        <Form.Group>
                                            <Form.Label className="small">Gross Wage Ceiling (₹)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                disabled={!formData.esiEnabled}
                                                value={formData.esiWageCeiling}
                                                onChange={(e) => setFormData({ ...formData, esiWageCeiling: e.target.value })}
                                            />
                                            <Form.Text className="text-muted">Applicable if wage &lt;= ₹21,000.</Form.Text>
                                        </Form.Group>
                                    </Col>

                                    {/* PT */}
                                    <Col md={4}>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <Form.Check
                                                type="switch"
                                                id="ptEnabled"
                                                label={<strong className="text-dark">Professional Tax (PT)</strong>}
                                                checked={formData.ptEnabled}
                                                onChange={(e) => setFormData({ ...formData, ptEnabled: e.target.checked })}
                                            />
                                        </div>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small">Monthly PT Amount (₹)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                disabled={!formData.ptEnabled}
                                                value={formData.ptMonthlyAmount}
                                                onChange={(e) => setFormData({ ...formData, ptMonthlyAmount: e.target.value })}
                                            />
                                            <Form.Text className="text-muted">Flat monthly deduction (standard ₹200).</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default PayrollSettings;
