import Joi from "joi";

/**
 * =========================================================================
 * EMPLOYEE ADVANCE MANAGEMENT VALIDATION SCHEMAS (JOI)
 * =========================================================================
 */

/**
 * Advance Disbursal Form Schema
 * Validates employee advance creation / disbursement
 */
export const disburseAdvanceValidationSchema = Joi.object({
    employeeId: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().trim().pattern(/^[1-9]\d*$/)
    ).required().messages({
        "alternatives.match": "Please select an employee.",
        "any.required": "Please select an employee.",
        "string.empty": "Please select an employee.",
        "number.base": "Please select an employee."
    }),

    advanceDate: Joi.date().iso().required().messages({
        "date.base": "Please select a valid advance date.",
        "any.required": "Advance date is required."
    }),

    totalAmount: Joi.number().positive().precision(2).required().messages({
        "number.base": "Please enter a valid advance amount.",
        "number.positive": "Advance amount must be greater than zero.",
        "any.required": "Advance amount is required."
    }),

    recoveryType: Joi.string().valid("FULL", "EMI", "CUSTOM").default("FULL").messages({
        "any.only": "Recovery type must be either Single Deduction (FULL) or Monthly EMI."
    }),

    monthlyDeduction: Joi.when("recoveryType", {
        is: "EMI",
        then: Joi.number().positive().precision(2).max(Joi.ref("totalAmount")).required().messages({
            "number.base": "Please enter a valid monthly deduction amount.",
            "number.positive": "Monthly EMI must be greater than zero.",
            "number.max": "Monthly deduction cannot exceed total advance amount.",
            "any.required": "Monthly deduction is required for EMI recovery mode."
        }),
        otherwise: Joi.number().min(0).allow("", null).optional()
    }),

    paymentMode: Joi.string().valid("CASH", "BANK_TRANSFER", "UPI", "CHEQUE").default("CASH").messages({
        "any.only": "Please select a valid payment mode."
    }),

    paymentReference: Joi.string().trim().max(150).allow("", null).optional().messages({
        "string.max": "Payment reference cannot exceed 150 characters."
    }),

    remarks: Joi.string().trim().max(1000).allow("", null).optional().messages({
        "string.max": "Remarks cannot exceed 1000 characters."
    })
}).unknown(true);

/**
 * Direct Advance Repayment Schema Generator
 * @param {number} remainingBalance - Current outstanding loan balance
 */
export const createRepaymentValidationSchema = (remainingBalance = Infinity) => Joi.object({
    amount: Joi.number().positive().precision(2).max(remainingBalance).required().messages({
        "number.base": "Please enter a valid repayment amount.",
        "number.positive": "Repayment amount must be greater than zero.",
        "number.max": `Repayment cannot exceed outstanding balance (₹${Number(remainingBalance).toLocaleString('en-IN')}).`,
        "any.required": "Repayment amount is required."
    }),

    repaymentDate: Joi.date().iso().required().messages({
        "date.base": "Please select a valid repayment date.",
        "any.required": "Repayment date is required."
    }),

    repaymentType: Joi.string().valid("DIRECT_CASH", "DIRECT_BANK").default("DIRECT_CASH").messages({
        "any.only": "Please select a valid payment channel."
    }),

    remarks: Joi.string().trim().max(1000).allow("", null).optional().messages({
        "string.max": "Remarks cannot exceed 1000 characters."
    })
}).unknown(true);

/**
 * Salary Slip Advance Deduction Edit Schema Generator
 * @param {number} maxAllowable - Maximum allowable deduction based on net salary
 */
export const createEditAdvanceDeductionValidationSchema = (maxAllowable = Infinity) => Joi.object({
    advanceDeduction: Joi.number().min(0).precision(2).max(maxAllowable).required().messages({
        "number.base": "Please enter a valid deduction amount (₹0 or greater).",
        "number.min": "Advance deduction cannot be negative.",
        "number.max": `Recovery amount cannot exceed available net earnings (₹${Number(maxAllowable).toLocaleString('en-IN')}).`,
        "any.required": "Advance deduction amount is required."
    })
}).unknown(true);

/**
 * Helper utility to run Joi validation and return a standardized React error map
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
