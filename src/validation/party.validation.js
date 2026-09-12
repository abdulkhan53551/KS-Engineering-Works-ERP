import Joi from "joi";

/**
 * Main Party validation schema
 */
export const createPartyValidationSchema = Joi.object({
    firmId: Joi.number().integer().allow(null, '').optional(),
    partyRoleIds: Joi.array().items(Joi.number().integer().positive()).optional(),
    partyCode: Joi.string().max(50).required().messages({
        "string.empty": "Party code is required.",
        "any.required": "Party code is required."
    }),
    legalName: Joi.string().max(255).required().messages({
        "string.empty": "Legal name is required.",
        "any.required": "Legal name is required."
    }),
    displayName: Joi.string().max(255).required().messages({
        "string.empty": "Display name is required.",
        "any.required": "Display name is required."
    }),
    mobile: Joi.string()
        .pattern(/^(?:(?:\+91|0)?[6-9]\d{9}|1800\d{6,7}|1860\d{6,7}|0\d{8,10}|\d{8,12})$/)
        .required()
        .messages({
            "string.empty": "Primary phone/mobile number is required.",
            "string.pattern.base": "Please enter a valid mobile, landline (with STD code), or 1800 toll-free number."
        }),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .allow(null, "")
        .messages({
            "string.email": "Please enter a valid email address."
        }),
    gstRegistered: Joi.boolean().default(false),
    gstin: Joi.when("gstRegistered", {
        is: true,
        then: Joi.string()
            .pattern(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})$/)
            .required()
            .messages({
                "string.empty": "GSTIN is required when GST is enabled.",
                "string.pattern.base": "Please enter a valid 15-character GSTIN (e.g. 24ABCDE1234F1Z5)."
            }),
        otherwise: Joi.string().allow("", null)
    }),
    panNumber: Joi.string()
        .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
        .allow(null, "")
        .messages({
            "string.pattern.base": "Please enter a valid 10-character PAN (e.g. ABCDE1234F)."
        }),
    cinNumber: Joi.string()
        .pattern(/^([A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6})$/)
        .allow(null, "")
        .messages({
            "string.pattern.base": "Please enter a valid 21-digit CIN number."
        }),
    tanNumber: Joi.string()
        .pattern(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/)
        .allow(null, "")
        .messages({
            "string.pattern.base": "Please enter a valid 10-digit TAN number."
        }),
    website: Joi.string()
        .uri({ scheme: [/https?/] })
        .allow(null, "")
        .messages({
            "string.uri": "Please enter a valid website URL (e.g. https://abc.com)."
        }),
    remarks: Joi.string().max(1000).allow(null, ""),
    logoUrl: Joi.string().allow(null, "").optional(),
    logoPublicId: Joi.string().allow(null, "").optional(),
    status: Joi.string().valid("ACTIVE", "INACTIVE").default("ACTIVE")
});

/**
 * Party Contact validation schema
 */
export const partyContactValidationSchema = Joi.object({
    contactRoleId: Joi.number().integer().required().messages({
        "number.base": "Please select a contact role.",
        "any.required": "Contact role is required."
    }),
    contactName: Joi.string().max(255).required().messages({
        "string.empty": "Contact name is required.",
        "any.required": "Contact name is required."
    }),
    designation: Joi.string().max(255).allow(null, ""),
    mobile: Joi.string()
        .pattern(/^(?:(?:\+91|0)?[6-9]\d{9}|1800\d{6,7}|1860\d{6,7}|0\d{8,10}|\d{8,12})$/)
        .allow(null, "")
        .optional()
        .messages({
            "string.pattern.base": "Please enter a valid mobile, landline (with STD code), or 1800 toll-free number."
        }),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .allow(null, "")
        .messages({
            "string.email": "Please enter a valid email address."
        }),
    isPrimary: Joi.boolean().default(false)
});

/**
 * Party Bank Account validation schema
 */
export const partyBankAccountValidationSchema = Joi.object({
    bankName: Joi.string().max(255).required().messages({
        "string.empty": "Bank name is required.",
        "any.required": "Bank name is required."
    }),
    accountNumber: Joi.string()
        .pattern(/^\d{9,18}$/)
        .required()
        .messages({
            "string.empty": "Account number is required.",
            "string.pattern.base": "Account number must be 9 to 18 digits."
        }),
    ifscCode: Joi.string()
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
        .required()
        .messages({
            "string.empty": "IFSC code is required.",
            "string.pattern.base": "Please enter a valid IFSC code (e.g. SBIN0007890)."
        }),
    branchName: Joi.string().max(255).required().messages({
        "string.empty": "Branch name is required.",
        "any.required": "Branch name is required."
    }),
    accountHolderName: Joi.string().max(255).required().messages({
        "string.empty": "Account holder name is required.",
        "any.required": "Account holder name is required."
    }),
    upiId: Joi.string()
        .pattern(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/)
        .allow(null, "")
        .optional()
        .messages({
            "string.pattern.base": "Please enter a valid UPI ID (e.g. name@bank)."
        }),
    isPrimary: Joi.boolean().default(false)
});

/**
 * Party Branch validation schema
 */
export const partyBranchValidationSchema = Joi.object({
    branchName: Joi.string().max(150).required().messages({
        "string.empty": "Branch name is required.",
        "any.required": "Branch name is required."
    }),
    branchCode: Joi.string().max(50).allow(null, "").optional(),
    gstin: Joi.string()
        .pattern(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})$/)
        .allow(null, "")
        .optional()
        .messages({
            "string.pattern.base": "Please enter a valid 15-character GSTIN (e.g. 24ABCDE1234F1Z5)."
        }),
    stateId: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().trim()
    ).required().messages({
        "number.base": "Please select a state.",
        "any.required": "State is required."
    }),
    cityId: Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().trim()
    ).required().messages({
        "number.base": "Please select a city.",
        "any.required": "City is required."
    }),
    address: Joi.string().max(500).required().messages({
        "string.empty": "Address line is required.",
        "any.required": "Address line is required."
    }),
    pincode: Joi.alternatives().try(
        Joi.string().pattern(/^[1-9][0-9]{5}$/),
        Joi.number().integer()
    ).required().messages({
        "string.empty": "Pincode is required.",
        "string.pattern.base": "Pincode must be a 6-digit number."
    }),
    country: Joi.string().allow(null, "").default("India").optional(),
    mobile: Joi.string()
        .pattern(/^(?:(?:\+91|0)?[6-9]\d{9}|1800\d{6,7}|1860\d{6,7}|0\d{8,10}|\d{8,12})$/)
        .allow(null, "")
        .optional()
        .messages({
            "string.pattern.base": "Please enter a valid phone or mobile number."
        }),
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .allow(null, "")
        .optional()
        .messages({
            "string.email": "Please enter a valid email address."
        }),
    remarks: Joi.string().max(1000).allow(null, "").optional(),
    isDefault: Joi.boolean().default(false),
    isHeadOffice: Joi.boolean().default(false)
}).unknown(true);


