import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Save, ArrowLeft, Shield, Clock, Calendar, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { usePermission } from '../../../../hooks/usePermission';
import { usePayrollSettings } from '../../common/hooks/useEmployeeApi';
import { usePayrollSettingsSubmit } from '../hooks/usePayrollSettingsSubmit';
import '../../employee.css';

const PayrollSettings = () => {
    const navigate = useNavigate();
    const { can, isSuperAdmin } = usePermission();
    const currentUser = useSelector((state) => state.authReducer?.user);
    const { activeFirm } = useSelector((state) => state.firmReducer || {});
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const firmId = isAllFirms ? null : Number(activeFirm?.id);

    const { data: settingsData, isLoading, isFetching } = usePayrollSettings(
        { firmId },
        { enabled: Boolean(firmId) }
    );

    const {
        handleSubmit,
        errors,
        setErrors,
        isSubmitting
    } = usePayrollSettingsSubmit({
        firmId
    });

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
        pfWageCeiling: 25000,
        esiEnabled: false,
        esiEmployerPercent: 3.25,
        esiEmployeePercent: 0.75,
        esiWageCeiling: 21000,
        ptEnabled: false,
        ptMonthlyAmount: 200
    });

    useEffect(() => {
        // Robust extraction supporting direct object, nested .data, camelCase, and snake_case properties
        const s = settingsData?.data || (settingsData?.id || settingsData?.workingDaysPerMonth !== undefined || settingsData?.working_days_per_month !== undefined ? settingsData : null);
        if (s) {
            setFormData({
                workingDaysPerMonth: s.workingDaysPerMonth !== undefined ? s.workingDaysPerMonth : (s.working_days_per_month !== undefined ? s.working_days_per_month : 26),
                weeklyOffDay: s.weeklyOffDay || s.weekly_off_day || 'SUNDAY',
                otRateType: s.otRateType || s.ot_rate_type || 'FIXED',
                otHourlyRate: parseFloat(s.otHourlyRate !== undefined ? s.otHourlyRate : (s.ot_hourly_rate !== undefined ? s.ot_hourly_rate : 0)) || 0,
                otMultiplierNormal: parseFloat(s.otMultiplierNormal !== undefined ? s.otMultiplierNormal : (s.ot_multiplier_normal !== undefined ? s.ot_multiplier_normal : 1.5)) || 1.5,
                otMultiplierHoliday: parseFloat(s.otMultiplierHoliday !== undefined ? s.otMultiplierHoliday : (s.ot_multiplier_holiday !== undefined ? s.ot_multiplier_holiday : 2.0)) || 2.0,
                otMultiplierWeekend: parseFloat(s.otMultiplierWeekend !== undefined ? s.otMultiplierWeekend : (s.ot_multiplier_weekend !== undefined ? s.ot_multiplier_weekend : 2.0)) || 2.0,
                pfEnabled: Boolean(s.pfEnabled !== undefined ? s.pfEnabled : s.pf_enabled),
                pfEmployerPercent: parseFloat(s.pfEmployerPercent !== undefined ? s.pfEmployerPercent : (s.pf_employer_percent !== undefined ? s.pf_employer_percent : 12.00)) || 12.00,
                pfEmployeePercent: parseFloat(s.pfEmployeePercent !== undefined ? s.pfEmployeePercent : (s.pf_employee_percent !== undefined ? s.pf_employee_percent : 12.00)) || 12.00,
                pfWageCeiling: parseFloat(s.pfWageCeiling !== undefined ? s.pfWageCeiling : (s.pf_wage_ceiling !== undefined ? s.pf_wage_ceiling : 25000)) || 25000,
                esiEnabled: Boolean(s.esiEnabled !== undefined ? s.esiEnabled : s.esi_enabled),
                esiEmployerPercent: parseFloat(s.esiEmployerPercent !== undefined ? s.esiEmployerPercent : (s.esi_employer_percent !== undefined ? s.esi_employer_percent : 3.25)) || 3.25,
                esiEmployeePercent: parseFloat(s.esiEmployeePercent !== undefined ? s.esiEmployeePercent : (s.esi_employee_percent !== undefined ? s.esi_employee_percent : 0.75)) || 0.75,
                esiWageCeiling: parseFloat(s.esiWageCeiling !== undefined ? s.esiWageCeiling : (s.esi_wage_ceiling !== undefined ? s.esi_wage_ceiling : 21000)) || 21000,
                ptEnabled: Boolean(s.ptEnabled !== undefined ? s.ptEnabled : s.pt_enabled),
                ptMonthlyAmount: parseFloat(s.ptMonthlyAmount !== undefined ? s.ptMonthlyAmount : (s.pt_monthly_amount !== undefined ? s.pt_monthly_amount : 200)) || 200
            });
        }
    }, [settingsData]);

    const onSubmit = (e) => {
        handleSubmit(e, formData);
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
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
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

                <div className="d-flex align-items-center gap-3">
                    {(isSuperAdmin || can('payroll-settings', 'update')) && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onSubmit}
                            disabled={isAllFirms || isSubmitting || isLoading}
                            className="d-flex align-items-center gap-1 px-3 py-2 shadow-sm"
                        >
                            <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Settings'}
                        </Button>
                    )}
                </div>
            </div>

            {isFetching && !isLoading && !isAllFirms && (
                <div className="text-muted small mb-3 d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" variant="primary" /> Refreshing settings for selected firm...
                </div>
            )}

            {isAllFirms ? (
                <Card className="border-0 shadow-sm rounded-3 p-5 text-center my-4">
                    <Card.Body>
                        <div className="rounded-circle bg-warning-subtle text-warning mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <Building2 size={32} />
                        </div>
                        <h5 className="fw-bold text-dark mb-2">Select a Firm from the Header</h5>
                        <p className="text-muted mb-0" style={{ maxWidth: '520px', margin: '0 auto' }}>
                            Payroll rules (working days, overtime rate, PF, ESI, and Professional Tax) are configured on a per-firm basis.
                            Please use the <strong>firm dropdown in the top navigation header</strong> to choose a specific firm.
                        </p>
                    </Card.Body>
                </Card>
            ) : (

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
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="workingDaysPerMonth"
                                                type="number"
                                                min="1"
                                                max="31"
                                                placeholder="Working Days Per Month"
                                                value={formData.workingDaysPerMonth}
                                                onChange={(e) => setFormData({ ...formData, workingDaysPerMonth: e.target.value })}
                                                required
                                            />
                                            <Form.Label htmlFor="workingDaysPerMonth">Working Days Per Month <span className="text-danger">*</span></Form.Label>
                                        </Form.Floating>
                                        <div className="text-muted small ps-1" style={{ marginTop: '-8px' }}>Standard is 26 days.</div>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Select
                                                id="weeklyOffDay"
                                                aria-label="Weekly Off Day"
                                                value={formData.weeklyOffDay}
                                                onChange={(e) => setFormData({ ...formData, weeklyOffDay: e.target.value })}
                                            >
                                                <option value="SUNDAY">Sunday</option>
                                                <option value="SATURDAY">Saturday</option>
                                                <option value="NONE">None / Custom</option>
                                            </Form.Select>
                                            <Form.Label htmlFor="weeklyOffDay">Weekly Off Day</Form.Label>
                                        </Form.Floating>
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
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Select
                                                id="otRateType"
                                                aria-label="OT Calculation Method"
                                                value={formData.otRateType}
                                                onChange={(e) => setFormData({ ...formData, otRateType: e.target.value })}
                                            >
                                                <option value="FIXED">Fixed Hourly Rate (₹ / hr)</option>
                                                <option value="MULTIPLIER">Salary Multiplier (e.g. 1.5x)</option>
                                            </Form.Select>
                                            <Form.Label htmlFor="otRateType">OT Calculation Method</Form.Label>
                                        </Form.Floating>
                                    </Col>

                                    {formData.otRateType === 'FIXED' ? (
                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="otHourlyRate"
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="Fixed Hourly Rate (₹)"
                                                    value={formData.otHourlyRate}
                                                    onChange={(e) => setFormData({ ...formData, otHourlyRate: e.target.value })}
                                                />
                                                <Form.Label htmlFor="otHourlyRate">Fixed Hourly Rate (₹)</Form.Label>
                                            </Form.Floating>
                                            <div className="text-muted small ps-1" style={{ marginTop: '-8px' }}>Applied per OT hour worked.</div>
                                        </Col>
                                    ) : (
                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="otMultiplierNormal"
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    step="0.1"
                                                    placeholder="Normal OT Multiplier"
                                                    value={formData.otMultiplierNormal}
                                                    onChange={(e) => setFormData({ ...formData, otMultiplierNormal: e.target.value })}
                                                />
                                                <Form.Label htmlFor="otMultiplierNormal">Normal OT Multiplier</Form.Label>
                                            </Form.Floating>
                                            <div className="text-muted small ps-1" style={{ marginTop: '-8px' }}>e.g. 1.5 = 1.5x base hourly rate.</div>
                                        </Col>
                                    )}

                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="otMultiplierHoliday"
                                                type="number"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                                placeholder="Holiday OT Multiplier"
                                                value={formData.otMultiplierHoliday}
                                                onChange={(e) => setFormData({ ...formData, otMultiplierHoliday: e.target.value })}
                                            />
                                            <Form.Label htmlFor="otMultiplierHoliday">Holiday OT Multiplier</Form.Label>
                                        </Form.Floating>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="otMultiplierWeekend"
                                                type="number"
                                                min="1"
                                                max="5"
                                                step="0.1"
                                                placeholder="Weekend OT Multiplier"
                                                value={formData.otMultiplierWeekend}
                                                onChange={(e) => setFormData({ ...formData, otMultiplierWeekend: e.target.value })}
                                            />
                                            <Form.Label htmlFor="otMultiplierWeekend">Weekend OT Multiplier</Form.Label>
                                        </Form.Floating>
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
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="pfEmployeePercent"
                                                type="number"
                                                step="0.1"
                                                placeholder="Employee Contribution (%)"
                                                disabled={!formData.pfEnabled}
                                                value={formData.pfEmployeePercent}
                                                onChange={(e) => setFormData({ ...formData, pfEmployeePercent: e.target.value })}
                                            />
                                            <Form.Label htmlFor="pfEmployeePercent">Employee Contribution (%)</Form.Label>
                                        </Form.Floating>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="pfEmployerPercent"
                                                type="number"
                                                step="0.1"
                                                placeholder="Employer Contribution (%)"
                                                disabled={!formData.pfEnabled}
                                                value={formData.pfEmployerPercent}
                                                onChange={(e) => setFormData({ ...formData, pfEmployerPercent: e.target.value })}
                                            />
                                            <Form.Label htmlFor="pfEmployerPercent">Employer Contribution (%)</Form.Label>
                                        </Form.Floating>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="pfWageCeiling"
                                                type="number"
                                                placeholder="Wage Ceiling (₹)"
                                                disabled={!formData.pfEnabled}
                                                value={formData.pfWageCeiling}
                                                onChange={(e) => setFormData({ ...formData, pfWageCeiling: e.target.value })}
                                            />
                                            <Form.Label htmlFor="pfWageCeiling">Wage Ceiling (₹)</Form.Label>
                                        </Form.Floating>
                                        <div className="text-muted small ps-1" style={{ marginTop: '-8px' }}>PF calculated up to ₹25,000.</div>
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
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="esiEmployeePercent"
                                                type="number"
                                                step="0.05"
                                                placeholder="Employee Contribution (%)"
                                                disabled={!formData.esiEnabled}
                                                value={formData.esiEmployeePercent}
                                                onChange={(e) => setFormData({ ...formData, esiEmployeePercent: e.target.value })}
                                            />
                                            <Form.Label htmlFor="esiEmployeePercent">Employee Contribution (%)</Form.Label>
                                        </Form.Floating>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="esiEmployerPercent"
                                                type="number"
                                                step="0.05"
                                                placeholder="Employer Contribution (%)"
                                                disabled={!formData.esiEnabled}
                                                value={formData.esiEmployerPercent}
                                                onChange={(e) => setFormData({ ...formData, esiEmployerPercent: e.target.value })}
                                            />
                                            <Form.Label htmlFor="esiEmployerPercent">Employer Contribution (%)</Form.Label>
                                        </Form.Floating>
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="esiWageCeiling"
                                                type="number"
                                                placeholder="Gross Wage Ceiling (₹)"
                                                disabled={!formData.esiEnabled}
                                                value={formData.esiWageCeiling}
                                                onChange={(e) => setFormData({ ...formData, esiWageCeiling: e.target.value })}
                                            />
                                            <Form.Label htmlFor="esiWageCeiling">Gross Wage Ceiling (₹)</Form.Label>
                                        </Form.Floating>
                                        <div className="text-muted small ps-1" style={{ marginTop: '-8px' }}>Applicable if wage &lt;= ₹21,000.</div>
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
                                        <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                            <Form.Control
                                                id="ptMonthlyAmount"
                                                type="number"
                                                placeholder="Monthly PT Amount (₹)"
                                                disabled={!formData.ptEnabled}
                                                value={formData.ptMonthlyAmount}
                                                onChange={(e) => setFormData({ ...formData, ptMonthlyAmount: e.target.value })}
                                            />
                                            <Form.Label htmlFor="ptMonthlyAmount">Monthly PT Amount (₹)</Form.Label>
                                        </Form.Floating>
                                        <div className="text-muted small ps-1" style={{ marginTop: '-8px' }}>Flat monthly deduction (standard ₹200).</div>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        )}
        </div>
    );
};

export default PayrollSettings;
