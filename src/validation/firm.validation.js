// validationSchema.ts
import Joi from "joi";

export const createFirmValidationSchema = Joi.object({
    firmName: Joi.string().max(255).required().messages({
        "string.empty": "Firm name is required.",
        "any.required": "Firm name is required."
    }),
    tradeName: Joi.string().max(255).allow(null, ''),
    firmType: Joi.string()
        .valid('Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'Other')
        .required()
        .messages({
            "string.empty": "Please select a firm type.",
            "any.required": "Firm type is required."
        }),
    businessActivity: Joi.string().max(1000).required().messages({
        "string.empty": "Business activity is required.",
        "any.required": "Business activity is required."
    }),
    logoUrl: Joi.string().allow(null, '').optional(),
    logoPublicId: Joi.string().allow(null, '').optional(),
    isGstRegistered: Joi.boolean().required(),
    gstin: Joi.when('isGstRegistered', {
        is: true,
        then: Joi.string()
            .pattern(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})$/)
            .required()
            .messages({
                'string.empty': 'GSTIN is required when GST is enabled',
                'string.pattern.base': 'Please enter a valid 15-digit GSTIN number',
            }),
        otherwise: Joi.string().allow('', null),
    }),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required().messages({
        "string.empty": "PAN number is required.",
        "string.pattern.base": "Please enter a valid 10-character PAN number (e.g. ABCDE1234F)."
    }),
    cinNumber: Joi.string().pattern(/^([A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})$/).allow(null, ''),
    tanNumber: Joi.string().pattern(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/).allow(null, ''),

    invoicePrefix: Joi.string().max(10).default('INV'),
    invoiceStartNumber: Joi.string()
        .pattern(/^\d+$/)
        .min(1)
        .max(6)
        .required()
        .messages({
            "string.empty": "Invoice start number is required.",
            "string.pattern.base": "Invoice start number must contain only digits.",
            "string.min": "Invoice start number cannot be empty.",
        }),
    notesFooter: Joi.string().allow(null, ''),

    // Address details
    email: Joi.string().email({ tlds: { allow: false } }).allow(null, ''),
    phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
        "string.empty": "Phone number is required.",
        "string.pattern.base": "Please enter a valid 10-digit mobile number starting with 6-9."
    }),
    website: Joi.string().allow(null, ''),

    addressLine1: Joi.string().max(500).required().messages({
        "string.empty": "Address line 1 is required.",
        "any.required": "Address line 1 is required."
    }),
    cityId: Joi.number().integer().required().messages({
        "number.base": "Please select a city.",
        "any.required": "City is required."
    }),
    stateId: Joi.number().integer().required().messages({
        "number.base": "Please select a state.",
        "any.required": "State is required."
    }),
    pincode: Joi.number().integer().min(100000).max(999999).required().messages({
        "number.base": "Please enter a valid 6-digit pincode.",
        "any.required": "Pincode is required."
    }),
    country: Joi.string().default('India'),

    // Bank account details
    upiId: Joi.string()
        .pattern(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/)
        .max(100)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Please enter a valid UPI ID (e.g., username@bank).',
        }),
    accountHolderName: Joi.string().max(255).required().messages({
        "string.empty": "Account holder name is required.",
        "any.required": "Account holder name is required."
    }),
    accountNumber: Joi.string().pattern(/^\d{9,18}$/).required().messages({
        "string.empty": "Account number is required.",
        "string.pattern.base": "Account number must be 9 to 18 digits long and contain only numbers.",
        "any.required": "Account number is required.",
    }),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
        "string.empty": "IFSC code is required.",
        "string.pattern.base": "Please enter a valid IFSC code (e.g. SBIN0001234)."
    }),
    bankName: Joi.string().max(255).required().messages({
        "string.empty": "Bank name is required.",
        "any.required": "Bank name is required."
    }),
    branchName: Joi.string().max(255).required().messages({
        "string.empty": "Branch name is required.",
        "any.required": "Branch name is required."
    }),
    accountType: Joi.string().valid('current', 'savings', 'Current', 'Savings').required().messages({
        "string.empty": "Please select an account type.",
        "any.required": "Account type is required."
    }),
}).unknown(true);