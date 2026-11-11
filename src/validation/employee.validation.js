import Joi from "joi";

/**
 * =========================================================================
 * EMPLOYEE MANAGEMENT SYSTEM VALIDATION SCHEMAS (JOI)
 * Enterprise-grade validation schemas adhering to KS Engineering Works ERP
 * =========================================================================
 */

/**
 * Standard Helper utility to execute Joi schema validation and map errors to React state
 * @param {Joi.Schema} schema - Joi schema object
 * @param {Object} data - Form data object to validate
 * @returns {{ errors: Object, isValid: boolean, value: Object }}
 */
export const validateWithJoi = (schema, data) => {
    if (!schema || typeof schema.validate !== "function") {
        return { errors: {}, isValid: true, value: data };
    }

    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: false });
    if (!error) {
        return { errors: {}, isValid: true, value };
    }

    const errors = {};
    error.details.forEach((detail) => {
        const field = detail.path[0];
        if (!errors[field]) {
            errors[field] = detail.message;
        }
    });

    return { errors, isValid: false, value };
};

/**
 * Emergency Contact Schema
 */
export const emergencyContactValidationSchema = Joi.object({
    emergencyContactName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-Z\s.'-]+$/)
        .allow("", null)
        .optional()
        .messages({
            "string.min": "Emergency contact person name must be at least 2 characters.",
            "string.max": "Emergency contact person name cannot exceed 100 characters.",
            "string.pattern.base": "Emergency contact person name can only contain letters, spaces, and dots."
        }),

    emergencyContactPhone: Joi.string()
        .trim()
        .pattern(/^[6-9]\d{9}$/)
        .allow("", null)
        .optional()
        .messages({
            "string.pattern.base": "Emergency contact phone must be a valid 10-digit mobile number."
        })
}).custom((obj, helpers) => {
    const hasName = Boolean(obj.emergencyContactName && String(obj.emergencyContactName).trim());
    const hasPhone = Boolean(obj.emergencyContactPhone && String(obj.emergencyContactPhone).trim());

    if (hasName && !hasPhone) {
        return helpers.message("Emergency contact phone is required when contact person name is entered.");
    }
    if (hasPhone && !hasName) {
        return helpers.message("Emergency contact person name is required when emergency phone is entered.");
    }
    return obj;
});

/**
 * Employee Creation & Update Form Schema
 * Validates complete employee master records across all form tabs
 */
export const employeeValidationSchema = Joi.object({
    // Tab 1: Personal & Identification Details
    empCode: Joi.string().trim().max(50).required().messages({
        "string.empty": "Employee code is required.",
        "any.required": "Employee code is required."
    }),
    firstName: Joi.string().trim().max(100).required().messages({
        "string.empty": "First name is required.",
        "any.required": "First name is required."
    }),
    lastName: Joi.string().trim().max(100).allow("", null).optional(),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).allow("", null).optional().messages({
        "string.pattern.base": "Enter a valid 10-digit mobile number."
    }),
    email: Joi.string().trim().email({ tlds: { allow: false } }).allow("", null).optional().messages({
        "string.email": "Enter a valid email address."
    }),
    emergencyContactName: Joi.string().trim().min(2).max(100).pattern(/^[a-zA-Z\s.'-]+$/).allow("", null).optional().messages({
        "string.min": "Emergency contact person name must be at least 2 characters.",
        "string.max": "Emergency contact person name cannot exceed 100 characters.",
        "string.pattern.base": "Emergency contact person name can only contain letters, spaces, and dots."
    }),
    emergencyContactPhone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).allow("", null).optional().messages({
        "string.pattern.base": "Enter a valid 10-digit phone number."
    }),
    dateOfBirth: Joi.date().iso().allow("", null).optional(),
    gender: Joi.string().valid("MALE", "FEMALE", "OTHER", "").allow(null).optional(),
    bloodGroup: Joi.string().trim().max(10).allow("", null).optional(),
    address: Joi.string().allow("", null).optional(),
    cityId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().allow("", null)).optional(),
    stateId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().allow("", null)).optional(),
    pincode: Joi.string().trim().pattern(/^\d{6}$/).allow("", null).optional().messages({
        "string.pattern.base": "Enter a valid 6-digit postal pincode."
    }),

    // Tab 2: Employment & Hierarchy
    dateOfJoining: Joi.date().iso().required().messages({
        "date.base": "Date of joining is required.",
        "any.required": "Date of joining is required."
    }),
    dateOfExit: Joi.date().iso().allow("", null).optional(),
    department: Joi.string().trim().max(100).allow("", null).optional(),
    designation: Joi.string().trim().max(100).allow("", null).optional(),
    employmentType: Joi.string().valid("PERMANENT", "DAILY_WAGE", "CONTRACT", "PART_TIME").required().messages({
        "string.empty": "Employment type is required.",
        "any.required": "Employment type is required."
    }),
    status: Joi.string().valid("ACTIVE", "RESIGNED", "TERMINATED", "ABSCONDED").default("ACTIVE"),
    shiftId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().allow("", null)).optional(),

    // Tab 3: Salary & Compensation
    salaryType: Joi.string().valid("MONTHLY", "DAILY", "HOURLY").default("MONTHLY"),
    baseSalary: Joi.number().min(0).precision(2).required().messages({
        "number.base": "Base salary must be a non-negative amount.",
        "number.min": "Base salary must be a non-negative amount.",
        "any.required": "Base salary is required."
    }),
    salaryTemplateId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string().allow("", null)).optional(),

    // Tab 4: Banking & Statutory
    bankName: Joi.string().trim().max(150).allow("", null).optional(),
    accountNumber: Joi.string().trim().max(50).allow("", null).optional(),
    ifscCode: Joi.string().trim().uppercase().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).allow("", null).optional().messages({
        "string.pattern.base": "Invalid IFSC format (e.g. SBIN0001234)."
    }),
    panNumber: Joi.string().trim().uppercase().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).allow("", null).optional().messages({
        "string.pattern.base": "Invalid PAN format (e.g. ABCDE1234F)."
    }),
    aadharNumber: Joi.string().trim().pattern(/^\d{12}$/).allow("", null).optional().messages({
        "string.pattern.base": "Aadhaar must be a 12-digit number."
    }),
    uanNumber: Joi.string().trim().max(30).allow("", null).optional(),
    esiNumber: Joi.string().trim().max(30).allow("", null).optional()
}).custom((obj, helpers) => {
    const hasName = Boolean(obj.emergencyContactName && String(obj.emergencyContactName).trim());
    const hasPhone = Boolean(obj.emergencyContactPhone && String(obj.emergencyContactPhone).trim());

    if (hasName && !hasPhone) {
        return helpers.message("Emergency contact phone is required when contact person name is entered.");
    }
    if (hasPhone && !hasName) {
        return helpers.message("Emergency contact person name is required when emergency phone is entered.");
    }
    if (hasPhone && obj.phone && String(obj.emergencyContactPhone).trim() === String(obj.phone).trim()) {
        return helpers.message("Emergency contact phone cannot be the same as personal mobile number.");
    }
    return obj;
}).unknown(true);

/**
 * Shift Definition Schema
 * Validates shift timings, codes, and duration
 */
export const shiftValidationSchema = Joi.object({
    shiftName: Joi.string().trim().max(100).required().messages({
        "string.empty": "Shift name is required.",
        "any.required": "Shift name is required."
    }),
    shiftCode: Joi.string().trim().max(50).required().messages({
        "string.empty": "Shift code is required.",
        "any.required": "Shift code is required."
    }),
    startTime: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).required().messages({
        "string.empty": "Start time is required.",
        "any.required": "Start time is required.",
        "string.pattern.base": "Start time must be in HH:mm format."
    }),
    endTime: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).required().messages({
        "string.empty": "End time is required.",
        "any.required": "End time is required.",
        "string.pattern.base": "End time must be in HH:mm format."
    }),
    breakMinutes: Joi.number().integer().min(0).max(720).default(60).messages({
        "number.min": "Break duration cannot be negative."
    }),
    isDefault: Joi.boolean().default(false),
    isNightShift: Joi.boolean().default(false),
    description: Joi.string().trim().max(500).allow("", null).optional()
}).unknown(true);

/**
 * Leave Application Schema
 * Validates employee leave requests
 */
export const leaveApplyValidationSchema = Joi.object({
    employeeId: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().trim().pattern(/^[1-9]\d*$/)
    ).required().messages({
        "alternatives.match": "Please select an employee.",
        "string.empty": "Please select an employee.",
        "any.required": "Please select an employee."
    }),
    leaveType: Joi.string().valid("CASUAL", "SICK", "EARNED", "UNPAID", "HALF_DAY").required().messages({
        "any.only": "Please select a valid leave type.",
        "any.required": "Leave type is required."
    }),
    fromDate: Joi.date().iso().required().messages({
        "date.base": "From date is required.",
        "any.required": "From date is required."
    }),
    toDate: Joi.date().iso().min(Joi.ref("fromDate")).required().messages({
        "date.base": "To date is required.",
        "date.min": "To date cannot be earlier than from date.",
        "any.required": "To date is required."
    }),
    fromSession: Joi.string().valid("SESSION_1", "SESSION_2").default("SESSION_1"),
    toSession: Joi.string().valid("SESSION_1", "SESSION_2").default("SESSION_2"),
    reason: Joi.string().trim().max(1000).allow("", null).optional()
}).custom((obj, helpers) => {
    if (obj.fromDate && obj.toDate && String(obj.fromDate).substring(0, 10) === String(obj.toDate).substring(0, 10)) {
        if (obj.fromSession === "SESSION_2" && obj.toSession === "SESSION_1") {
            return helpers.message("End session cannot be earlier than start session on the same day.");
        }
    }
    return obj;
}).unknown(true);

/**
 * Salary Template Schema
 * Validates salary template setup and component structure
 */
export const salaryTemplateValidationSchema = Joi.object({
    templateName: Joi.string().trim().max(100).required().messages({
        "string.empty": "Template name is required.",
        "any.required": "Template name is required."
    }),
    templateType: Joi.string().valid("CUSTOM", "MONTHLY_FIXED", "DAILY_WAGE", "PIECE_RATE").default("CUSTOM"),
    description: Joi.string().trim().max(500).allow("", null).optional(),
    isDefault: Joi.boolean().default(false),
    components: Joi.array().min(1).required().messages({
        "array.min": "Please add at least one salary component.",
        "any.required": "Please add at least one salary component."
    })
}).unknown(true);

/**
 * Shift Assignment Schema
 * Validates assigning shifts to employees
 */
export const shiftAssignValidationSchema = Joi.object({
    shiftId: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().trim().pattern(/^[1-9]\d*$/)
    ).required().messages({
        "any.required": "Please select a shift.",
        "string.empty": "Please select a shift.",
        "alternatives.match": "Please select a shift."
    }),
    employeeIds: Joi.array().items(
        Joi.alternatives().try(Joi.number().integer().positive(), Joi.string())
    ).min(1).required().messages({
        "array.min": "Please select at least one employee.",
        "any.required": "Please select at least one employee."
    }),
    effectiveFrom: Joi.date().iso().required().messages({
        "date.base": "Effective from date is required.",
        "any.required": "Effective from date is required."
    }),
    effectiveTo: Joi.date().iso().min(Joi.ref("effectiveFrom")).allow("", null).optional().messages({
        "date.min": "Effective To date cannot be earlier than Effective From date."
    })
}).unknown(true);

/**
 * Payroll Settings Schema
 * Validates payroll calculation settings and statutory thresholds
 */
export const payrollSettingsValidationSchema = Joi.object({
    firmId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string()).required().messages({
        "any.required": "Please select a specific firm to configure payroll settings."
    }),
    workingDaysPerMonth: Joi.number().integer().min(1).max(31).default(26).messages({
        "number.min": "Working days per month must be between 1 and 31.",
        "number.max": "Working days per month must be between 1 and 31."
    }),
    otHourlyRate: Joi.number().min(0).default(0),
    otMultiplierNormal: Joi.number().min(1).max(10).default(1.5),
    otMultiplierHoliday: Joi.number().min(1).max(10).default(2.0),
    otMultiplierWeekend: Joi.number().min(1).max(10).default(2.0),
    pfEmployerPercent: Joi.number().min(0).max(100).default(12),
    pfEmployeePercent: Joi.number().min(0).max(100).default(12),
    pfWageCeiling: Joi.number().min(0).default(25000),
    esiEmployerPercent: Joi.number().min(0).max(100).default(3.25),
    esiEmployeePercent: Joi.number().min(0).max(100).default(0.75),
    esiWageCeiling: Joi.number().min(0).default(21000),
    ptMonthlyAmount: Joi.number().min(0).default(200)
}).unknown(true);

/**
 * Attendance Hours / Manual Punch Schema
 */
export const attendanceHoursValidationSchema = Joi.object({
    employeeId: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string()).required().messages({
        "any.required": "Employee is required."
    }),
    attendanceDate: Joi.date().iso().required().messages({
        "date.base": "Attendance date is required.",
        "any.required": "Attendance date is required."
    }),
    status: Joi.string().valid("PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "WEEKLY_OFF", "HOLIDAY").required().messages({
        "any.required": "Status is required."
    }),
    checkIn: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).allow("", null).optional().messages({
        "string.pattern.base": "Check in time must be in HH:mm format."
    }),
    checkOut: Joi.string().trim().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/).allow("", null).optional().messages({
        "string.pattern.base": "Check out time must be in HH:mm format."
    }),
    totalHours: Joi.number().min(0).max(24).allow("", null).optional(),
    overtimeHours: Joi.number().min(0).max(24).allow("", null).optional(),
    overtimeType: Joi.string().valid("NORMAL", "HOLIDAY", "WEEKEND").default("NORMAL"),
    remarks: Joi.string().trim().max(500).allow("", null).optional()
}).unknown(true);

/**
 * Leave Review Decision Schema
 */
export const leaveReviewValidationSchema = Joi.object({
    id: Joi.alternatives().try(Joi.number().integer().positive(), Joi.string()).required().messages({
        "any.required": "Leave record ID is required."
    }),
    status: Joi.string().valid("APPROVED", "REJECTED").required().messages({
        "any.required": "Review decision is required."
    }),
    rejectionReason: Joi.when("status", {
        is: "REJECTED",
        then: Joi.string().trim().min(2).max(500).required().messages({
            "string.empty": "Please provide a reason for rejecting the leave.",
            "any.required": "Rejection reason is required."
        }),
        otherwise: Joi.string().allow("", null).optional()
    })
}).unknown(true);

/**
 * Bulk Payout Schema
 */
export const bulkPayValidationSchema = Joi.object({
    slipIds: Joi.array().items(Joi.alternatives().try(Joi.number(), Joi.string())).min(1).required().messages({
        "array.min": "Please select at least one salary slip to record payout.",
        "any.required": "No salary slips selected."
    }),
    paymentDate: Joi.date().iso().required().messages({
        "date.base": "Payment date is required.",
        "any.required": "Payment date is required."
    }),
    paymentMode: Joi.string().valid("BANK_TRANSFER", "UPI", "CHEQUE", "CASH").required().messages({
        "any.only": "Please select a valid payment mode.",
        "any.required": "Payment mode is required."
    }),
    paymentReference: Joi.string().trim().max(150).allow("", null).optional(),
    remarks: Joi.string().trim().max(500).allow("", null).optional()
}).unknown(true);

