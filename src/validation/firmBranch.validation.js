import Joi from "joi";

export const firmBranchValidationSchema = Joi.object({
    branchName: Joi.string().max(255).required().messages({
        "string.empty": "Branch name is required.",
        "any.required": "Branch name is required."
    }),
    branchCode: Joi.string().max(20).required().messages({
        "string.empty": "Branch code is required.",
        "any.required": "Branch code is required."
    }),
    isHeadOffice: Joi.boolean().default(false),
    gstin: Joi.string()
        .pattern(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})$/)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Please enter a valid 15-digit GSTIN number.',
        }),
    phoneNumber: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Please enter a valid 10-digit phone number starting with 6-9.',
        }),
    email: Joi.string().email({ tlds: { allow: false } }).allow(null, ''),
    addressLine1: Joi.string().max(500).allow(null, ''),
    pincode: Joi.string()
        .pattern(/^\d{6}$/)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Please enter a valid 6-digit pincode.',
        }),
});
