// validationSchema.ts
import Joi from "joi";
import Decimal from 'decimal.js';

// Schema: Create a new invoice
export const invoiceValidationSchema = (isEditMode) => Joi.object({
    invoiceNo: Joi.string().max(255).required(),
    invoiceDate: Joi.date().required(),

    dueDays: Joi.number().integer().min(0).required(),
    dueDate: Joi.date().required(),

    customerName: Joi.string().max(255).required(),
    hasGst: Joi.boolean().default(false),
    gstNumber: Joi.string()
        .allow(null, '')
        .when('hasGst', {
            is: true,
            then: Joi.string()
                .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
                .required()
                .messages({
                    'string.pattern.base': 'GST number must be a valid 15-character GSTIN',
                    'any.required': 'GST number is required when GST is enabled'
                }),
            otherwise: Joi.string().allow(null, '')
        }),

    billingAddress: Joi.object({
        id: isEditMode
            ? Joi.number().integer().required()   // required only in edit
            : Joi.number().integer().optional(), // optional in add
        email: Joi.string().email().allow(null, ''),
        phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).allow(null, '').messages({
            'string.pattern.base': 'Billing phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
            'string.base': 'Billing phone must be text',
        }),
        website: Joi.string().uri().allow(null, ''),
        addressLine1: Joi.string().max(255).required().messages({
            'any.required': 'Billing address is required',
            'string.empty': 'Billing address is required'
        }),
        cityId: Joi.number().integer().required(),
        stateId: Joi.number().integer().required(),
        pincode: Joi.number().integer().min(100000).max(999999).messages({
            'any.required': 'Pincode is required',
            'string.empty': 'Pincode is required'
        }),
    }),

    shippingAddress: Joi.object({
        id: isEditMode
            ? Joi.number().integer().required()   // required only in edit
            : Joi.number().integer().optional(), // optional in add
        email: Joi.string().email().allow(null, ''),
        phoneNumber: Joi.string().pattern(/^[6-9]\d{9}$/).allow(null, '').messages({
            'string.pattern.base': 'Shipping phone number must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9',
            'string.base': 'Shipping phone must be text',
        }),
        addressLine1: Joi.string().max(255).messages({
            'any.required': 'Shipping address is required',
            'string.empty': 'Shipping address is required'
        }),
        cityId: Joi.number().integer().required(),
        stateId: Joi.number().integer().required(),
        pincode: Joi.number().integer().min(100000).max(999999).required().messages({
            'any.required': 'Pincode is required',
            'string.empty': 'Pincode is required'
        }),
    }),

    hasChallan: Joi.boolean().default(false),
    hasPo: Joi.boolean().default(false),
    hasEwayBill: Joi.boolean().default(false),

    // Challans
    challanIds: Joi.array()
        .items(Joi.number().integer().positive())
        .default([])
        .when('hasChallan', {
            is: true,
            then: Joi.array().min(1).required().messages({
                'any.required': 'Challan IDs are required when challan is selected.',
                'array.min': 'Please select at least one challan.'
            }),
            otherwise: Joi.array()
                .items(Joi.number().integer().positive())
                .default([])
                .custom(() => [])
        }),

    // Purchase Orders
    poIds: Joi.array()
        .items(Joi.number().integer().positive())
        .default([])
        .when('hasPo', {
            is: true,
            then: Joi.array().min(1).required().messages({
                'any.required': 'Purchase order IDs are required when PO is selected.',
                'array.min': 'Please select at least one PO.'
            }),
            otherwise: Joi.array()
                .items(Joi.number().integer().positive())
                .default([])
                .custom(() => [])
        }),

    // E-Way Bills
    ewayBillIds: Joi.array()
        .items(Joi.number().integer().positive())
        .default([])
        .when('hasEwayBill', {
            is: true,
            then: Joi.array().min(1).required().messages({
                'any.required': 'E-way bill IDs are required when e-way bill is selected.',
                'array.min': 'Please select at least one e-way bill.'
            }),
            otherwise: Joi.array()
                .items(Joi.number().integer().positive())
                .default([])
                .custom(() => [])
        }),


    items: Joi.array().items(
        Joi.object({
            productId: Joi.number().integer().positive().allow(null, 0).optional(),
            description: Joi.string().max(255).required(),
            hsnSacCode: Joi.string()
                .allow(null, "")
                .pattern(/^\d{4}$|^\d{6}$|^\d{8}$/)
                .messages({
                    "string.pattern.base": "HSN/SAC Code must be 4, 6, or 8 digits numeric."
                }),
            qty: Joi.number().precision(2).min(0).required(),
            itemUnitId: Joi.number().integer(),
            rate: Joi.number().precision(2).min(0).required(),
            discountPercent: Joi.number().precision(2).min(0).max(100).default(0),
            discountAmount: Joi.number().precision(2).min(0).allow(0),
            subTotal: Joi.number().precision(2).min(0).allow(0),
            taxableAmount: Joi.number().precision(2).min(0).allow(0),
            gstSlabId: Joi.number().integer().required(),
            cgst: Joi.number().precision(2).min(0).default(0),
            sgst: Joi.number().precision(2).min(0).default(0),
            igst: Joi.number().precision(2).min(0).default(0),
            total: Joi.number().precision(2).min(0).required().allow(0)
        })
            .custom(invoiceItemCustomValidation)
            .messages({ 'any.invalid': '{{#customMessage}}' })
    ).min(1).required(),

    subTotal: Joi.number().precision(2).min(0).required(),
    discountPercent: Joi.number().precision(2).min(0).max(100).allow(null, 0),
    discountAmount: Joi.number().precision(2).min(0).max(Joi.ref('subTotal')).default(0).messages({
        'number.max': 'Discount amount cannot be greater than the item subtotal.',
        'number.base': 'Discount amount must be a number.',
        'number.min': 'Discount amount cannot be negative.'
    }),
    taxableAmount: Joi.number().precision(2).min(0).allow(null, 0),
    cgst: Joi.number().precision(2).min(0).allow(null, 0),
    sgst: Joi.number().precision(2).min(0).allow(null, 0),
    igst: Joi.number().precision(2).min(0).allow(null, 0),
    total: Joi.number().precision(2).min(0).required(),
    roundOff: Joi.number().precision(2).allow(null, 0),
    roundOffManual: Joi.boolean().optional(),
    other: Joi.number().precision(2).allow(null, 0),

    paymentStatusId: Joi.number().integer().min(1).required(),
    paymentModeId: Joi.number().integer().min(0).required()
})
    .custom(validateCreateOrUpdateCustom)
    .messages({ 'any.invalid': '{{#customMessage}}' })

// Custom validation function for create/update
function validateCreateOrUpdateCustom(item, helpers) {

    // console.log('items => ', item);

    const gross = new Decimal(item.subTotal || 0);

    // Rule: If discountPercent > 0 → discountAmount must be > 0
    if (item.discountPercent && item.discountPercent > 0) {
        if (!item.discountAmount || item.discountAmount <= 0) {
            return helpers.error("any.invalid", { customMessage: "Discount amount must be provided when discount percent is greater than 0" });
        }
    }

    // If both provided → check consistency
    if (item.discountPercent > 0 && item.discountAmount > 0) {
        const expected = gross.times(item.discountPercent).div(100);
        if (!expected.equals(item.discountAmount)) {
            return helpers.error("any.invalid", { customMessage: "Discount percent and discount amount mismatch" });
        }
    }

    // Rule: discount amount cannot exceed gross
    if (gross.lessThan(item.discountAmount || 0)) {
        return helpers.error("any.invalid", { customMessage: "Discount amount cannot exceed gross amount of invoice" });
    }

    return item;
}

// Custom validation function for invoice items
function invoiceItemCustomValidation(item, helpers) {
    const qty = new Decimal(item.qty || 0);
    const rate = new Decimal(item.rate || 0);
    const grossAmount = qty.times(rate);

    // Rule 1: discount amount <= gross
    if (grossAmount.lessThan(item.discountAmount || 0)) {
        return helpers.error("any.invalid", { customMessage: "Discount amount cannot exceed gross amount (rate * qty) of invoice item" });
    }

    return item;
}