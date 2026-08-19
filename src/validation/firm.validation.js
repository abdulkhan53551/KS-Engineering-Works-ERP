// validationSchema.ts
import Joi from "joi";

const validateLogoFile = (value, helpers) => {
    // if no file selected
    if (!value || value.length === 0) {
        return helpers.error("any.required");
    }

    const file = value[0]; // first file from FileList
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
        return helpers.error("file.invalidType");
    }

    if (file.size > maxSize) {
        return helpers.error("file.maxSize");
    }

    return value;
}

export const createFirmValidationSchema = Joi.object({
    firmName: Joi.string().max(255).required(),
    tradeName: Joi.string().max(255).allow(null, ''),
    firmType: Joi.string()
        .valid('Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'Other')
        .required(),
    businessActivity: Joi.string().max(1000).required(),
    // logoUrl: Joi.any()
    //     .custom(validateLogoFile)
    //     .messages({
    //         "any.required": "Please upload a logo file.",
    //         "file.invalidType": "Logo must be a PNG or JPG image.",
    //         "file.maxSize": "Logo size must be less than 2MB.",
    //     })
    //     .optional(),
    logoUrl: Joi.any()
        .optional(),
    isGstRegistered: Joi.boolean().required(),
    gstin: Joi.when('isGstRegistered', {
        is: true,
        then: Joi.string()
            .pattern(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1})$/)
            .required()
            .messages({
                'string.empty': 'GSTIN is required when GST is enabled',
                'string.pattern.base': 'Please enter a valid GSTIN number',
            }),
        otherwise: Joi.string().allow('', null),
    }),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required(),
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
    email: Joi.string().email().allow(null, ''),
    phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    website: Joi.string().uri().allow(null, ''),

    addressLine1: Joi.string().max(500).required(),
    cityId: Joi.number().integer().required(),
    stateId: Joi.number().integer().required(),
    pincode: Joi.number().integer().min(100000).max(999999).required(),
    country: Joi.string().default('India'),

    // Bank account details
    upiId: Joi.string()
        .pattern(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/)
        .max(100)
        .allow(null, '')
        .messages({
            'string.pattern.base': 'Please enter a valid UPI ID (e.g., username@bank).',
        }),
    accountHolderName: Joi.string().max(255).required(),
    accountNumber: Joi.string().pattern(/^\d{9,18}$/).required().messages({
        "string.empty": "Account number is required.",
        "string.pattern.base": "Account number must be 9 to 18 digits long and contain only numbers.",
        "any.required": "Account number is required.",
    }),
    ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
    bankName: Joi.string().max(255).required(),
    branchName: Joi.string().max(255).required(),
    accountType: Joi.string().valid('current', 'savings').required(),
});