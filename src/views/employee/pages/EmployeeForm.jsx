import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Tab, Nav, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Save, User, Briefcase, DollarSign, CreditCard } from 'lucide-react';
import {
    useEmployee,
    useCreateEmployee,
    useUpdateEmployee,
    useShifts,
    useSalaryTemplates
} from '../hooks/useEmployeeApi';
import { useGetFirms } from '../../firms/hooks/api.hooks';
import '../employee.css';

const EmployeeForm = ({ mode = 'create' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.authReducer?.user);
    const firmId = currentUser?.firmId;

    const isEdit = mode === 'edit' || Boolean(id);
    const [activeTab, setActiveTab] = useState('personal');

    const { data: employeeDataRaw, isLoading: isFetchingEmployee } = useEmployee(id);
    const employeeData = employeeDataRaw?.id ? employeeDataRaw : (employeeDataRaw?.data || null);

    const { data: shiftsRaw } = useShifts({ firmId });
    const shifts = Array.isArray(shiftsRaw)
        ? shiftsRaw
        : (Array.isArray(shiftsRaw?.data)
            ? shiftsRaw.data
            : []);

    const { data: templatesRaw } = useSalaryTemplates({ firmId });
    const templates = Array.isArray(templatesRaw)
        ? templatesRaw
        : (Array.isArray(templatesRaw?.data)
            ? templatesRaw.data
            : []);

    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();

    const [formData, setFormData] = useState({
        empCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'MALE',
        bloodGroup: '',
        address: '',
        pincode: '',
        emergencyContactName: '',
        emergencyContactPhone: '',

        dateOfJoining: new Date().toISOString().split('T')[0],
        dateOfExit: '',
        department: '',
        designation: '',
        employmentType: 'PERMANENT',
        status: 'ACTIVE',
        shiftId: '',

        salaryType: 'MONTHLY',
        baseSalary: 0,
        salaryTemplateId: '',

        bankName: '',
        accountNumber: '',
        ifscCode: '',
        panNumber: '',
        aadharNumber: '',
        uanNumber: '',
        esiNumber: ''
    });

    useEffect(() => {
        if (isEdit && employeeData) {
            setFormData({
                empCode: employeeData.emp_code || '',
                firstName: employeeData.first_name || '',
                lastName: employeeData.last_name || '',
                email: employeeData.email || '',
                phone: employeeData.phone || '',
                dateOfBirth: employeeData.date_of_birth ? employeeData.date_of_birth.substring(0, 10) : '',
                gender: employeeData.gender || 'MALE',
                bloodGroup: employeeData.blood_group || '',
                address: employeeData.address || '',
                pincode: employeeData.pincode || '',
                emergencyContactName: employeeData.emergency_contact_name || '',
                emergencyContactPhone: employeeData.emergency_contact_phone || '',

                dateOfJoining: employeeData.date_of_joining ? employeeData.date_of_joining.substring(0, 10) : '',
                dateOfExit: employeeData.date_of_exit ? employeeData.date_of_exit.substring(0, 10) : '',
                department: employeeData.department || '',
                designation: employeeData.designation || '',
                employmentType: employeeData.employment_type || 'PERMANENT',
                status: employeeData.status || 'ACTIVE',
                shiftId: employeeData.currentShift?.shiftId || '',

                salaryType: employeeData.salary_type || 'MONTHLY',
                baseSalary: employeeData.base_salary || 0,
                salaryTemplateId: employeeData.salary_template_id || '',

                bankName: employeeData.bank_name || '',
                accountNumber: employeeData.account_number || '',
                ifscCode: employeeData.ifsc_code || '',
                panNumber: employeeData.pan_number || '',
                aadharNumber: employeeData.aadhar_number || '',
                uanNumber: employeeData.uan_number || '',
                esiNumber: employeeData.esi_number || ''
            });
        }
    }, [isEdit, employeeData]);

    const handleChange = (field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                firmId,
                baseSalary: parseFloat(formData.baseSalary) || 0,
                shiftId: formData.shiftId ? parseInt(formData.shiftId, 10) : null,
                salaryTemplateId: formData.salaryTemplateId ? parseInt(formData.salaryTemplateId, 10) : null
            };

            if (isEdit) {
                await updateMutation.mutateAsync({ id, ...payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            navigate('/dashboard/employee');
        } catch (err) {
            // Handled by mutation hook
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isEdit && isFetchingEmployee) {
        return (
            <div className="container-fluid p-4 text-center">
                <Spinner animation="border" variant="primary" />
                <div className="mt-2 text-muted">Loading employee profile...</div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={() => navigate('/dashboard/employee')}>
                        <ArrowLeft size={16} />
                    </Button>
                    <div>
                        <h4 className="fw-bold mb-0">
                            {isEdit ? `Edit Employee: ${formData.firstName} ${formData.lastName}` : 'Add New Employee'}
                        </h4>
                        <span className="text-muted small">
                            {isEdit ? `Code: ${formData.empCode}` : 'Fill in the details below to register a new employee.'}
                        </span>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/employee')}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Spinner size="sm" className="me-1" /> Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="me-1" /> {isEdit ? 'Update Employee' : 'Save Employee'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Multi-Tab Form Card */}
            <Card className="border-0 shadow-sm rounded-3">
                <Card.Body className="p-4">
                    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                        <Nav variant="pills" className="emp-form-tabs mb-4 p-1 bg-light rounded-3 d-flex gap-2">
                            <Nav.Item>
                                <Nav.Link eventKey="personal" className="d-flex align-items-center gap-2">
                                    <User size={16} /> 1. Personal & Identity
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="employment" className="d-flex align-items-center gap-2">
                                    <Briefcase size={16} /> 2. Employment & Shift
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="salary" className="d-flex align-items-center gap-2">
                                    <DollarSign size={16} /> 3. Salary & Compensation
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="bank" className="d-flex align-items-center gap-2">
                                    <CreditCard size={16} /> 4. Bank & Statutory
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <Form onSubmit={handleSubmit}>
                            <Tab.Content>
                                {/* TAB 1: PERSONAL & IDENTITY */}
                                <Tab.Pane eventKey="personal">
                                    <h6 className="fw-bold mb-3 text-primary">Personal Details</h6>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Employee Code <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. KS-EMP-001"
                                                    value={formData.empCode}
                                                    onChange={(e) => handleChange('empCode', e.target.value.toUpperCase())}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. Ramesh"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Last Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. Sharma"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Phone Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. 9876543210"
                                                    value={formData.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Email Address</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    placeholder="e.g. ramesh@example.com"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Date of Birth</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>Gender</Form.Label>
                                                <Form.Select
                                                    value={formData.gender}
                                                    onChange={(e) => handleChange('gender', e.target.value)}
                                                >
                                                    <option value="MALE">Male</option>
                                                    <option value="FEMALE">Female</option>
                                                    <option value="OTHER">Other</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>Blood Group</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. O+, B+, AB+"
                                                    value={formData.bloodGroup}
                                                    onChange={(e) => handleChange('bloodGroup', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Emergency Contact (Name & Phone)</Form.Label>
                                                <Row className="g-2">
                                                    <Col md={6}>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Contact Name"
                                                            value={formData.emergencyContactName}
                                                            onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                                                        />
                                                    </Col>
                                                    <Col md={6}>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="Phone Number"
                                                            value={formData.emergencyContactPhone}
                                                            onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                                                        />
                                                    </Col>
                                                </Row>
                                            </Form.Group>
                                        </Col>

                                        <Col md={9}>
                                            <Form.Group>
                                                <Form.Label>Residential Address</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    placeholder="Full residential street address..."
                                                    value={formData.address}
                                                    onChange={(e) => handleChange('address', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>Pincode</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. 400001"
                                                    value={formData.pincode}
                                                    onChange={(e) => handleChange('pincode', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-end mt-4">
                                        <Button variant="primary" size="sm" onClick={() => setActiveTab('employment')}>
                                            Next: Employment & Shift →
                                        </Button>
                                    </div>
                                </Tab.Pane>

                                {/* TAB 2: EMPLOYMENT & SHIFT */}
                                <Tab.Pane eventKey="employment">
                                    <h6 className="fw-bold mb-3 text-primary">Employment & Work Shift</h6>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Date of Joining <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    value={formData.dateOfJoining}
                                                    onChange={(e) => handleChange('dateOfJoining', e.target.value)}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Employment Type <span className="text-danger">*</span></Form.Label>
                                                <Form.Select
                                                    value={formData.employmentType}
                                                    onChange={(e) => handleChange('employmentType', e.target.value)}
                                                    required
                                                >
                                                    <option value="PERMANENT">Permanent Staff (PF/ESI Applicable)</option>
                                                    <option value="DAILY_WAGE">Daily Wage Worker</option>
                                                    <option value="CONTRACT">Contract Basis</option>
                                                    <option value="PART_TIME">Part Time</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Employment Status</Form.Label>
                                                <Form.Select
                                                    value={formData.status}
                                                    onChange={(e) => handleChange('status', e.target.value)}
                                                >
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="RESIGNED">Resigned</option>
                                                    <option value="TERMINATED">Terminated</option>
                                                    <option value="ABSCONDED">Absconded</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Department</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. Fabrication, Machining, Quality, Accounts"
                                                    value={formData.department}
                                                    onChange={(e) => handleChange('department', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Designation</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. Lathe Operator, Welder, Foreman, Manager"
                                                    value={formData.designation}
                                                    onChange={(e) => handleChange('designation', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Assigned Work Shift</Form.Label>
                                                <Form.Select
                                                    value={formData.shiftId}
                                                    onChange={(e) => handleChange('shiftId', e.target.value)}
                                                >
                                                    <option value="">-- No Shift Assigned --</option>
                                                    {shifts.map(s => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.shiftName} ({s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>

                                        {formData.status !== 'ACTIVE' && (
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Date of Exit</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={formData.dateOfExit}
                                                        onChange={(e) => handleChange('dateOfExit', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        )}
                                    </Row>
                                    <div className="d-flex justify-content-between mt-4">
                                        <Button variant="outline-secondary" size="sm" onClick={() => setActiveTab('personal')}>
                                            ← Back to Personal
                                        </Button>
                                        <Button variant="primary" size="sm" onClick={() => setActiveTab('salary')}>
                                            Next: Salary & Compensation →
                                        </Button>
                                    </div>
                                </Tab.Pane>

                                {/* TAB 3: SALARY & COMPENSATION */}
                                <Tab.Pane eventKey="salary">
                                    <h6 className="fw-bold mb-3 text-primary">Salary Configuration</h6>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Salary Rate Type <span className="text-danger">*</span></Form.Label>
                                                <Form.Select
                                                    value={formData.salaryType}
                                                    onChange={(e) => handleChange('salaryType', e.target.value)}
                                                    required
                                                >
                                                    <option value="MONTHLY">Monthly CTC (₹ per month)</option>
                                                    <option value="DAILY">Daily Wage (₹ per day)</option>
                                                    <option value="HOURLY">Hourly Rate (₹ per hour)</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Base Rate Amount (₹) <span className="text-danger">*</span></Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="0.00"
                                                    value={formData.baseSalary}
                                                    onChange={(e) => handleChange('baseSalary', e.target.value)}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Salary Structure Template</Form.Label>
                                                <Form.Select
                                                    value={formData.salaryTemplateId}
                                                    onChange={(e) => handleChange('salaryTemplateId', e.target.value)}
                                                >
                                                    <option value="">-- Default / Flat Salary --</option>
                                                    {templates.map(t => (
                                                        <option key={t.id} value={t.id}>
                                                            {t.templateName} ({t.templateType})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="alert alert-light border mt-4 p-3 small text-muted">
                                        <div className="fw-bold text-dark mb-1">💡 How Payroll Calculation Works:</div>
                                        <div>• <strong>Monthly CTC:</strong> Daily rate = Monthly Salary ÷ Working Days (default 26). Base earnings = Daily Rate × Payable Days.</div>
                                        <div>• <strong>Daily Wage:</strong> Base earnings = Daily Rate × Payable Days (Present + Half Days×0.5 + Paid Leaves).</div>
                                        <div>• <strong>Hourly Rate:</strong> Base earnings = Hourly Rate × Total Hours Worked.</div>
                                        <div>• <strong>Statutory Rules:</strong> PF, ESI, and PT deductions are only applied if Employment Type is set to <strong>Permanent</strong>.</div>
                                    </div>

                                    <div className="d-flex justify-content-between mt-4">
                                        <Button variant="outline-secondary" size="sm" onClick={() => setActiveTab('employment')}>
                                            ← Back to Employment
                                        </Button>
                                        <Button variant="primary" size="sm" onClick={() => setActiveTab('bank')}>
                                            Next: Bank & Statutory →
                                        </Button>
                                    </div>
                                </Tab.Pane>

                                {/* TAB 4: BANK & STATUTORY */}
                                <Tab.Pane eventKey="bank">
                                    <h6 className="fw-bold mb-3 text-primary">Bank & Statutory Details</h6>
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Bank Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. State Bank of India"
                                                    value={formData.bankName}
                                                    onChange={(e) => handleChange('bankName', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Account Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Bank Account Number"
                                                    value={formData.accountNumber}
                                                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>IFSC Code</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. SBIN0001234"
                                                    value={formData.ifscCode}
                                                    onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>PAN Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="e.g. ABCDE1234F"
                                                    value={formData.panNumber}
                                                    onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>Aadhar Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="12-digit Aadhar"
                                                    value={formData.aadharNumber}
                                                    onChange={(e) => handleChange('aadharNumber', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>PF UAN Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Universal Account Number"
                                                    value={formData.uanNumber}
                                                    onChange={(e) => handleChange('uanNumber', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={3}>
                                            <Form.Group>
                                                <Form.Label>ESI IP Number</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="ESI Insurance No."
                                                    value={formData.esiNumber}
                                                    onChange={(e) => handleChange('esiNumber', e.target.value)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-between mt-4">
                                        <Button variant="outline-secondary" size="sm" onClick={() => setActiveTab('salary')}>
                                            ← Back to Salary
                                        </Button>
                                        <Button variant="success" size="sm" type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Saving...' : (isEdit ? '✓ Update Employee Profile' : '✓ Create Employee Profile')}
                                        </Button>
                                    </div>
                                </Tab.Pane>
                            </Tab.Content>
                        </Form>
                    </Tab.Container>
                </Card.Body>
            </Card>
        </div>
    );
};

export default EmployeeForm;
