import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Tab, Nav, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Save, User, Briefcase, DollarSign, CreditCard, RefreshCw } from 'lucide-react';
import {
    useEmployee,
    useCreateEmployee,
    useUpdateEmployee,
    useShifts,
    useSalaryTemplates,
    useNextEmployeeCode
} from '../hooks/useEmployeeApi';
import { toast } from 'react-toastify';
import '../employee.css';

const EmployeeForm = ({ mode = 'create' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.authReducer?.user);
    const { activeFirm, userFirms = [] } = useSelector((state) => state.firmReducer || {});

    // Determine effective firm ID
    const isAllFirms = !activeFirm || activeFirm?.id === 'all';
    const effectiveFirmId = isAllFirms ? (userFirms[0]?.id || currentUser?.firmId) : activeFirm?.id;

    const isEdit = mode === 'edit' || Boolean(id);
    const [activeTab, setActiveTab] = useState('personal');
    const [errors, setErrors] = useState({});

    const { data: employeeDataRaw, isLoading: isFetchingEmployee } = useEmployee(id);
    const employeeData = employeeDataRaw?.id ? employeeDataRaw : (employeeDataRaw?.data || null);

    // Auto-generate employee code hook
    const {
        data: nextCodeData,
        refetch: refetchNextCode,
        isFetching: isFetchingCode
    } = useNextEmployeeCode(effectiveFirmId, {
        enabled: !isEdit
    });

    const { data: shiftsRaw } = useShifts({ firmId: effectiveFirmId });
    const shifts = Array.isArray(shiftsRaw)
        ? shiftsRaw
        : (Array.isArray(shiftsRaw?.data)
            ? shiftsRaw.data
            : []);

    const { data: templatesRaw } = useSalaryTemplates({ firmId: effectiveFirmId });
    const templates = Array.isArray(templatesRaw)
        ? templatesRaw
        : (Array.isArray(templatesRaw?.data)
            ? templatesRaw.data
            : []);

    const createMutation = useCreateEmployee();
    const updateMutation = useUpdateEmployee();

    const [formData, setFormData] = useState({
        empCode: '',
        targetFirmId: effectiveFirmId || '',
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

    // Populate auto-generated employee code for new employees
    useEffect(() => {
        const code = nextCodeData?.nextCode || nextCodeData?.nextEmpCode;
        if (!isEdit && code && !formData.empCode) {
            setFormData(prev => ({ ...prev, empCode: code }));
        }
    }, [isEdit, nextCodeData, formData.empCode]);

    useEffect(() => {
        if (!isEdit && effectiveFirmId && !formData.targetFirmId) {
            setFormData(prev => ({ ...prev, targetFirmId: effectiveFirmId }));
        }
    }, [isEdit, effectiveFirmId, formData.targetFirmId]);

    useEffect(() => {
        if (isEdit && employeeData) {
            const dob = employeeData.dateOfBirth || employeeData.date_of_birth;
            const doj = employeeData.dateOfJoining || employeeData.date_of_joining;
            const doe = employeeData.dateOfExit || employeeData.date_of_exit;

            setFormData({
                empCode: employeeData.empCode || employeeData.emp_code || '',
                targetFirmId: employeeData.firmId || employeeData.firm_id || effectiveFirmId || '',
                firstName: employeeData.firstName || employeeData.first_name || '',
                lastName: employeeData.lastName || employeeData.last_name || '',
                email: employeeData.email || '',
                phone: employeeData.phone || '',
                dateOfBirth: dob ? String(dob).substring(0, 10) : '',
                gender: employeeData.gender || 'MALE',
                bloodGroup: employeeData.bloodGroup || employeeData.blood_group || '',
                address: employeeData.address || '',
                pincode: employeeData.pincode || '',
                emergencyContactName: employeeData.emergencyContactName || employeeData.emergency_contact_name || '',
                emergencyContactPhone: employeeData.emergencyContactPhone || employeeData.emergency_contact_phone || '',

                dateOfJoining: doj ? String(doj).substring(0, 10) : '',
                dateOfExit: doe ? String(doe).substring(0, 10) : '',
                department: employeeData.department || '',
                designation: employeeData.designation || '',
                employmentType: employeeData.employmentType || employeeData.employment_type || 'PERMANENT',
                status: employeeData.status || 'ACTIVE',
                shiftId: employeeData.currentShift?.shiftId || employeeData.shiftId || '',

                salaryType: employeeData.salaryType || employeeData.salary_type || 'MONTHLY',
                baseSalary: employeeData.baseSalary !== undefined ? employeeData.baseSalary : (employeeData.base_salary || 0),
                salaryTemplateId: employeeData.salaryTemplateId || employeeData.salary_template_id || '',

                bankName: employeeData.bankName || employeeData.bank_name || '',
                accountNumber: employeeData.accountNumber || employeeData.account_number || '',
                ifscCode: employeeData.ifscCode || employeeData.ifsc_code || '',
                panNumber: employeeData.panNumber || employeeData.pan_number || '',
                aadharNumber: employeeData.aadharNumber || employeeData.aadhar_number || '',
                uanNumber: employeeData.uanNumber || employeeData.uan_number || '',
                esiNumber: employeeData.esiNumber || employeeData.esi_number || ''
            });
        }
    }, [isEdit, employeeData, effectiveFirmId]);

    const handleChange = (field, val) => {
        setFormData(prev => ({ ...prev, [field]: val }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleAutoGenerateCode = async () => {
        try {
            const result = await refetchNextCode();
            const code = result?.data?.nextCode || result?.data?.nextEmpCode;
            if (code) {
                handleChange('empCode', code);
                toast.success(`Generated code: ${code}`);
            } else {
                toast.warning('Could not generate code. Please type manually.');
            }
        } catch (err) {
            toast.error('Failed to generate employee code.');
        }
    };

    const validateForm = () => {
        const errs = {};

        // Tab 1 validation
        if (!formData.empCode || !formData.empCode.trim()) {
            errs.empCode = 'Employee code is required.';
        }
        if (!formData.firstName || !formData.firstName.trim()) {
            errs.firstName = 'First name is required.';
        }
        if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone.trim())) {
            errs.phone = 'Enter a valid 10-digit mobile number.';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            errs.email = 'Enter a valid email address.';
        }
        if (formData.emergencyContactPhone && !/^[6-9]\d{9}$/.test(formData.emergencyContactPhone.trim())) {
            errs.emergencyContactPhone = 'Enter a valid 10-digit phone number.';
        }
        if (formData.pincode && !/^\d{6}$/.test(formData.pincode.trim())) {
            errs.pincode = 'Enter a valid 6-digit postal pincode.';
        }

        // Tab 2 validation
        if (!formData.dateOfJoining) {
            errs.dateOfJoining = 'Date of joining is required.';
        }
        if (!formData.employmentType) {
            errs.employmentType = 'Employment type is required.';
        }

        // Tab 3 validation
        if (formData.baseSalary === '' || isNaN(formData.baseSalary) || Number(formData.baseSalary) < 0) {
            errs.baseSalary = 'Base salary must be a non-negative amount.';
        }

        // Tab 4 validation
        if (formData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.trim().toUpperCase())) {
            errs.panNumber = 'Invalid PAN format (e.g. ABCDE1234F).';
        }
        if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber.trim().replace(/\s/g, ''))) {
            errs.aadharNumber = 'Aadhaar must be a 12-digit number.';
        }
        if (formData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim().toUpperCase())) {
            errs.ifscCode = 'Invalid IFSC format (e.g. SBIN0001234).';
        }

        setErrors(errs);
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validateForm();
        if (Object.keys(errs).length > 0) {
            // Find which tab contains the first error and switch to it
            if (errs.empCode || errs.firstName || errs.phone || errs.email || errs.emergencyContactPhone || errs.pincode) {
                setActiveTab('personal');
            } else if (errs.dateOfJoining || errs.employmentType) {
                setActiveTab('employment');
            } else if (errs.baseSalary) {
                setActiveTab('salary');
            } else if (errs.panNumber || errs.aadharNumber || errs.ifscCode) {
                setActiveTab('bank');
            }
            toast.error('Please resolve the errors highlighted in the form.');
            return;
        }

        try {
            const selectedFirmId = formData.targetFirmId || effectiveFirmId;
            const payload = {
                ...formData,
                firmId: selectedFirmId,
                dateOfBirth: formData.dateOfBirth || null,
                dateOfExit: formData.dateOfExit || null,
                dateOfJoining: formData.dateOfJoining || null,
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
                                        <Col md={isAllFirms && userFirms.length > 1 ? 4 : 4}>
                                            <div className="position-relative">
                                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                    <Form.Control
                                                        id="empCode"
                                                        type="text"
                                                        placeholder="Employee Code"
                                                        value={formData.empCode}
                                                        onChange={(e) => handleChange('empCode', e.target.value.toUpperCase())}
                                                        isInvalid={!!errors.empCode}
                                                        className="pe-5"
                                                        required
                                                    />
                                                    <Form.Label htmlFor="empCode">
                                                        Employee Code <span className="text-danger">*</span>
                                                    </Form.Label>
                                                    <Form.Control.Feedback type="invalid">{errors.empCode}</Form.Control.Feedback>
                                                </Form.Floating>
                                                {!isEdit && (
                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="position-absolute end-0 top-50 translate-middle-y me-2 p-1 text-primary text-decoration-none"
                                                        onClick={handleAutoGenerateCode}
                                                        disabled={isFetchingCode}
                                                        title="Regenerate next employee code"
                                                        style={{ zIndex: 5 }}
                                                    >
                                                        <RefreshCw size={15} className={isFetchingCode ? 'spin' : ''} />
                                                    </Button>
                                                )}
                                            </div>
                                        </Col>

                                        {isAllFirms && userFirms.length > 1 && (
                                            <Col md={4}>
                                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                    <Form.Select
                                                        id="targetFirmId"
                                                        value={formData.targetFirmId}
                                                        onChange={(e) => handleChange('targetFirmId', Number(e.target.value))}
                                                    >
                                                        {userFirms.map(f => (
                                                            <option key={f.id} value={f.id}>{f.firmName || f.name}</option>
                                                        ))}
                                                    </Form.Select>
                                                    <Form.Label htmlFor="targetFirmId">Assign to Firm <span className="text-danger">*</span></Form.Label>
                                                </Form.Floating>
                                            </Col>
                                        )}

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="firstName"
                                                    type="text"
                                                    placeholder="First Name"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleChange('firstName', e.target.value)}
                                                    isInvalid={!!errors.firstName}
                                                    required
                                                />
                                                <Form.Label htmlFor="firstName">First Name <span className="text-danger">*</span></Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="lastName"
                                                    type="text"
                                                    placeholder="Last Name"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleChange('lastName', e.target.value)}
                                                />
                                                <Form.Label htmlFor="lastName">Last Name</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="phone"
                                                    type="tel"
                                                    maxLength={10}
                                                    placeholder="Phone Number"
                                                    value={formData.phone}
                                                    onChange={(e) => handleChange('phone', e.target.value)}
                                                    isInvalid={!!errors.phone}
                                                />
                                                <Form.Label htmlFor="phone">Phone Number (10 Digits)</Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="email"
                                                    type="email"
                                                    placeholder="Email Address"
                                                    value={formData.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    isInvalid={!!errors.email}
                                                />
                                                <Form.Label htmlFor="email">Email Address</Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="dateOfBirth"
                                                    type="date"
                                                    placeholder="Date of Birth"
                                                    value={formData.dateOfBirth}
                                                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                                />
                                                <Form.Label htmlFor="dateOfBirth">Date of Birth</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Select
                                                    id="gender"
                                                    value={formData.gender}
                                                    onChange={(e) => handleChange('gender', e.target.value)}
                                                >
                                                    <option value="MALE">Male</option>
                                                    <option value="FEMALE">Female</option>
                                                    <option value="OTHER">Other</option>
                                                </Form.Select>
                                                <Form.Label htmlFor="gender">Gender</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="bloodGroup"
                                                    type="text"
                                                    placeholder="Blood Group"
                                                    value={formData.bloodGroup}
                                                    onChange={(e) => handleChange('bloodGroup', e.target.value)}
                                                />
                                                <Form.Label htmlFor="bloodGroup">Blood Group</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="emergencyContactName"
                                                    type="text"
                                                    placeholder="Emergency Contact Name"
                                                    value={formData.emergencyContactName}
                                                    onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                                                />
                                                <Form.Label htmlFor="emergencyContactName">Emergency Contact Person</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="emergencyContactPhone"
                                                    type="tel"
                                                    maxLength={10}
                                                    placeholder="Emergency Phone"
                                                    value={formData.emergencyContactPhone}
                                                    onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                                                    isInvalid={!!errors.emergencyContactPhone}
                                                />
                                                <Form.Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.emergencyContactPhone}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={9}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="address"
                                                    as="textarea"
                                                    placeholder="Residential Address"
                                                    value={formData.address}
                                                    onChange={(e) => handleChange('address', e.target.value)}
                                                />
                                                <Form.Label htmlFor="address">Residential Address</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="pincode"
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="Pincode"
                                                    value={formData.pincode}
                                                    onChange={(e) => handleChange('pincode', e.target.value)}
                                                    isInvalid={!!errors.pincode}
                                                />
                                                <Form.Label htmlFor="pincode">Pincode</Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.pincode}</Form.Control.Feedback>
                                            </Form.Floating>
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
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="dateOfJoining"
                                                    type="date"
                                                    placeholder="Date of Joining"
                                                    value={formData.dateOfJoining}
                                                    onChange={(e) => handleChange('dateOfJoining', e.target.value)}
                                                    isInvalid={!!errors.dateOfJoining}
                                                    required
                                                />
                                                <Form.Label htmlFor="dateOfJoining">Date of Joining <span className="text-danger">*</span></Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.dateOfJoining}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Select
                                                    id="employmentType"
                                                    value={formData.employmentType}
                                                    onChange={(e) => handleChange('employmentType', e.target.value)}
                                                    isInvalid={!!errors.employmentType}
                                                    required
                                                >
                                                    <option value="PERMANENT">Permanent Staff (PF/ESI Applicable)</option>
                                                    <option value="DAILY_WAGE">Daily Wage Worker</option>
                                                    <option value="CONTRACT">Contract Basis</option>
                                                    <option value="PART_TIME">Part Time</option>
                                                </Form.Select>
                                                <Form.Label htmlFor="employmentType">Employment Type <span className="text-danger">*</span></Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.employmentType}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Select
                                                    id="status"
                                                    value={formData.status}
                                                    onChange={(e) => handleChange('status', e.target.value)}
                                                >
                                                    <option value="ACTIVE">Active</option>
                                                    <option value="RESIGNED">Resigned</option>
                                                    <option value="TERMINATED">Terminated</option>
                                                    <option value="ABSCONDED">Absconded</option>
                                                </Form.Select>
                                                <Form.Label htmlFor="status">Employment Status</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="department"
                                                    type="text"
                                                    placeholder="Department"
                                                    value={formData.department}
                                                    onChange={(e) => handleChange('department', e.target.value)}
                                                />
                                                <Form.Label htmlFor="department">Department</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={6}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="designation"
                                                    type="text"
                                                    placeholder="Designation"
                                                    value={formData.designation}
                                                    onChange={(e) => handleChange('designation', e.target.value)}
                                                />
                                                <Form.Label htmlFor="designation">Designation</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={formData.status !== 'ACTIVE' ? 6 : 12}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Select
                                                    id="shiftId"
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
                                                <Form.Label htmlFor="shiftId">Assigned Work Shift</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        {formData.status !== 'ACTIVE' && (
                                            <Col md={6}>
                                                <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                    <Form.Control
                                                        id="dateOfExit"
                                                        type="date"
                                                        placeholder="Date of Exit"
                                                        value={formData.dateOfExit}
                                                        onChange={(e) => handleChange('dateOfExit', e.target.value)}
                                                    />
                                                    <Form.Label htmlFor="dateOfExit">Date of Exit</Form.Label>
                                                </Form.Floating>
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
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Select
                                                    id="salaryType"
                                                    value={formData.salaryType}
                                                    onChange={(e) => handleChange('salaryType', e.target.value)}
                                                    required
                                                >
                                                    <option value="MONTHLY">Monthly CTC (₹ per month)</option>
                                                    <option value="DAILY">Daily Wage (₹ per day)</option>
                                                    <option value="HOURLY">Hourly Rate (₹ per hour)</option>
                                                </Form.Select>
                                                <Form.Label htmlFor="salaryType">Salary Rate Type <span className="text-danger">*</span></Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="baseSalary"
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="Base Rate Amount"
                                                    value={formData.baseSalary}
                                                    onChange={(e) => handleChange('baseSalary', e.target.value)}
                                                    isInvalid={!!errors.baseSalary}
                                                    required
                                                />
                                                <Form.Label htmlFor="baseSalary">Base Rate Amount (₹) <span className="text-danger">*</span></Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.baseSalary}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Select
                                                    id="salaryTemplateId"
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
                                                <Form.Label htmlFor="salaryTemplateId">Salary Structure Template</Form.Label>
                                            </Form.Floating>
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
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="bankName"
                                                    type="text"
                                                    placeholder="Bank Name"
                                                    value={formData.bankName}
                                                    onChange={(e) => handleChange('bankName', e.target.value)}
                                                />
                                                <Form.Label htmlFor="bankName">Bank Name</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="accountNumber"
                                                    type="text"
                                                    placeholder="Account Number"
                                                    value={formData.accountNumber}
                                                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                                                />
                                                <Form.Label htmlFor="accountNumber">Bank Account Number</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={4}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="ifscCode"
                                                    type="text"
                                                    maxLength={11}
                                                    placeholder="IFSC Code"
                                                    value={formData.ifscCode}
                                                    onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                                                    isInvalid={!!errors.ifscCode}
                                                />
                                                <Form.Label htmlFor="ifscCode">IFSC Code (e.g. SBIN0001234)</Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.ifscCode}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="panNumber"
                                                    type="text"
                                                    maxLength={10}
                                                    placeholder="PAN Number"
                                                    value={formData.panNumber}
                                                    onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                                                    isInvalid={!!errors.panNumber}
                                                />
                                                <Form.Label htmlFor="panNumber">PAN Number (e.g. ABCDE1234F)</Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.panNumber}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="aadharNumber"
                                                    type="text"
                                                    maxLength={12}
                                                    placeholder="Aadhar Number"
                                                    value={formData.aadharNumber}
                                                    onChange={(e) => handleChange('aadharNumber', e.target.value)}
                                                    isInvalid={!!errors.aadharNumber}
                                                />
                                                <Form.Label htmlFor="aadharNumber">Aadhar Number (12 Digits)</Form.Label>
                                                <Form.Control.Feedback type="invalid">{errors.aadharNumber}</Form.Control.Feedback>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="uanNumber"
                                                    type="text"
                                                    maxLength={12}
                                                    placeholder="PF UAN Number"
                                                    value={formData.uanNumber}
                                                    onChange={(e) => handleChange('uanNumber', e.target.value)}
                                                />
                                                <Form.Label htmlFor="uanNumber">PF UAN Number</Form.Label>
                                            </Form.Floating>
                                        </Col>

                                        <Col md={3}>
                                            <Form.Floating className="custom-form-floating custom-form-floating-sm form-group mb-3">
                                                <Form.Control
                                                    id="esiNumber"
                                                    type="text"
                                                    placeholder="ESI IP Number"
                                                    value={formData.esiNumber}
                                                    onChange={(e) => handleChange('esiNumber', e.target.value)}
                                                />
                                                <Form.Label htmlFor="esiNumber">ESI IP Number</Form.Label>
                                            </Form.Floating>
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
