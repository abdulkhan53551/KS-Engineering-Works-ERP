import Joi from 'joi';

/**
 * Joi Validation Schema for Proforma Invoice Create & Update
 */
export const proformaValidationSchema = (isEditMode = false) => Joi.object({
    proformaNo: Joi.string().max(100).allow(null, '').optional(),
    proformaDate: Joi.date().required().messages({
        'date.base': 'Please select a valid Proforma Invoice Date',
        'any.required': 'Proforma Invoice Date is required'
    }),
    dueDays: Joi.number().integer().min(1).max(365).empty('').default(15).messages({
        'number.base': 'Due days must be a valid number',
        'number.min': 'Due days must be at least 1 day',
        'number.max': 'Due days cannot exceed 365 days'
    }),
    dueDate: Joi.date().allow(null, '').optional(),

    // Cross-Module References
    orderRefNo: Joi.string().max(100).allow(null, '').optional(),
    orderRefDate: Joi.date().allow(null, '').optional(),
    quotationId: Joi.number().integer().positive().allow(null, 0, '').optional(),
    taxInvoiceId: Joi.number().integer().positive().allow(null, 0, '').optional(),

    // Buyer Information
    partyId: Joi.number().integer().positive().allow(null, 0, '').optional(),
    customerName: Joi.string().trim().max(255).required().messages({
        'string.empty': 'Customer / Buyer Name is required',
        'any.required': 'Customer / Buyer Name is required'
    }),
    hasGst: Joi.boolean().default(false),
    gstNumber: Joi.string()
        .allow(null, '')
        .when('hasGst', {
            is: true,
            then: Joi.string()
                .trim()
                .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Please enter a valid 15-digit GSTIN (e.g. 27AAACM1234E1Z1)',
                    'string.empty': 'GSTIN is required when GST is enabled',
                    'any.required': 'GSTIN is required when GST is enabled'
                }),
            otherwise: Joi.string().allow(null, '')
        }),
    contactPerson: Joi.string().max(150).allow(null, '').optional(),
    contactPhone: Joi.string()
        .allow(null, '')
        .empty('')
        .pattern(/^(?:(?:\+91|0)?[6-9]\d{9}|1800\d{6,7}|1860\d{6,7}|0\d{8,10}|\d{8,12})$/)
        .optional()
        .messages({
            'string.pattern.base': 'Please enter a valid mobile number or telephone with STD code'
        }),
    contactEmail: Joi.string()
        .allow(null, '')
        .empty('')
        .email({ tlds: { allow: false } })
        .optional()
        .messages({
            'string.email': 'Please enter a valid email address'
        }),
    billingAddress: Joi.string().max(500).allow(null, '').optional(),
    shippingAddress: Joi.string().max(500).allow(null, '').optional(),
    placeOfSupply: Joi.string().max(100).allow(null, '').optional(),

    // Dispatch & Destination
    dispatchThrough: Joi.string().max(150).allow(null, '').optional(),
    destination: Joi.string().max(150).allow(null, '').optional(),

    // Commercial Terms & Advance Terms
    paymentTerms: Joi.string().max(255).allow(null, '').default('Advance against Proforma Invoice'),
    deliveryPeriod: Joi.string().max(255).allow(null, '').default('3-4 Weeks from advance receipt'),
    freightBasis: Joi.string().max(255).allow(null, '').default('Ex-Works / Extra at actuals'),
    warrantyTerms: Joi.string().max(255).allow(null, '').default('Immediate check upon receipt'),
    specialNotes: Joi.string().max(2000).allow(null, '').optional(),
    termsAndConditions: Joi.string().max(3000).allow(null, '').optional(),

    // Financial Totals
    subTotal: Joi.number().min(0).allow(null, 0).optional(),
    discountPercent: Joi.number().min(0).max(100).allow(null, 0).optional(),
    discountAmount: Joi.number().min(0).allow(null, 0).optional(),
    taxableAmount: Joi.number().min(0).allow(null, 0).optional(),
    cgst: Joi.number().min(0).allow(null, 0).optional(),
    sgst: Joi.number().min(0).allow(null, 0).optional(),
    igst: Joi.number().min(0).allow(null, 0).optional(),
    other: Joi.number().allow(null, 0).optional(),
    roundOff: Joi.number().allow(null, 0).optional(),
    roundOffManual: Joi.boolean().optional(),
    total: Joi.number().min(0).allow(null, 0).optional(),
    advanceAmountRequested: Joi.number().min(0).allow(null, 0).optional(),
    advanceReceived: Joi.number().min(0).allow(null, 0).optional(),
    status: Joi.string().valid('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'CONVERTED', 'CANCELLED').default('DRAFT'),

    // Line Items
    items: Joi.array().items(
        Joi.object({
            id: Joi.number().integer().positive().optional(),
            productId: Joi.number().integer().positive().allow(null, 0).optional(),
            itemName: Joi.string().trim().required().messages({
                'string.empty': 'Line item name is required',
                'any.required': 'Line item name is required'
            }),
            description: Joi.string().allow(null, '').optional(),
            drawingNumber: Joi.string().allow(null, '').optional(),
            hsnSacCode: Joi.string().allow(null, '').optional(),
            qty: Joi.number().positive().required().messages({
                'number.positive': 'Qty must be greater than 0',
                'any.required': 'Qty is required'
            }),
            unit: Joi.string().default('Nos'),
            rate: Joi.number().min(0).required().messages({
                'number.min': 'Rate cannot be negative',
                'any.required': 'Rate is required'
            }),
            discountPercent: Joi.number().min(0).max(100).default(0),
            discountAmount: Joi.number().min(0).default(0),
            subTotal: Joi.number().min(0).default(0),
            taxableAmount: Joi.number().min(0).default(0),
            taxRate: Joi.number().min(0).default(18),
            cgst: Joi.number().min(0).default(0),
            sgst: Joi.number().min(0).default(0),
            igst: Joi.number().min(0).default(0),
            total: Joi.number().min(0).default(0),
            sortOrder: Joi.number().optional()
        }).unknown(true)
    ).min(1).required().messages({
        'array.min': 'Please add at least one line item to the proforma invoice',
        'any.required': 'Please add at least one line item to the proforma invoice'
    })
}).unknown(true);
