import Joi from "joi";

/**
 * Main Party validation schema
 */
export const createPartyValidationSchema = Joi.object({
    firmId: Joi.number().integer().allow(null, '').optional(),
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
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
            "string.empty": "Mobile number is required.",
            "string.pattern.base": "Please enter a valid 10-digit mobile number starting with 6-9."
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
    status: Joi.string().valid("ACTIVE", "INACTIVE").default("ACTIVE")
});

/**
 * Party Address validation schema
 */
export const partyAddressValidationSchema = Joi.object({
    addressTypeId: Joi.number().integer().required().messages({
        "number.base": "Please select an address type.",
        "any.required": "Address type is required."
    }),
    address: Joi.string().max(500).required().messages({
        "string.empty": "Address line is required.",
        "any.required": "Address line is required."
    }),
    stateId: Joi.number().integer().required().messages({
        "number.base": "Please select a state.",
        "any.required": "State is required."
    }),
    cityId: Joi.number().integer().required().messages({
        "number.base": "Please select a city.",
        "any.required": "City is required."
    }),
    country: Joi.string().default("India"),
    pincode: Joi.string()
        .pattern(/^[1-9][0-9]{5}$/)
        .required()
        .messages({
            "string.empty": "Pincode is required.",
            "string.pattern.base": "Please enter a valid 6-digit Indian pincode."
        })
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
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
            "string.empty": "Mobile number is required.",
            "string.pattern.base": "Please enter a valid 10-digit mobile number."
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
        .messages({
            "string.pattern.base": "Please enter a valid UPI ID (e.g. name@bank)."
        }),
    isPrimary: Joi.boolean().default(false)
});
