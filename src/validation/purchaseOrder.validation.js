import Joi from "joi";

// Line item schema for Customer Purchase Order
export const purchaseOrderItemValidationSchema = Joi.object({
    id: Joi.number().integer().positive().optional(),
    productId: Joi.number().integer().positive().allow(null).optional(),
    itemName: Joi.string().max(255).required().messages({
        'string.empty': 'Item name is required',
        'any.required': 'Item name is required'
    }),
    description: Joi.string().allow('', null).optional(),
    hsnSacCode: Joi.string().max(30).allow('', null).optional(),
    qty: Joi.number().positive().required().messages({
        'number.base': 'Quantity must be a valid number',
        'number.positive': 'Quantity must be greater than 0',
        'any.required': 'Quantity is required'
    }),
    invoicedQty: Joi.number().min(0).optional().default(0),
    unit: Joi.string().max(50).optional().default('Nos'),
    rate: Joi.number().min(0).optional().default(0),
    gstRate: Joi.number().min(0).optional().default(0),
    taxableAmount: Joi.number().min(0).optional().default(0),
    cgst: Joi.number().min(0).optional().default(0),
    sgst: Joi.number().min(0).optional().default(0),
    igst: Joi.number().min(0).optional().default(0),
    total: Joi.number().min(0).optional().default(0),
    sortOrder: Joi.number().integer().min(0).optional().default(0)
});

// Schema: Create a new Customer Purchase Order
export const createPurchaseOrderValidationSchema = Joi.object({
    firmBranchId: Joi.number().integer().positive().allow(null).optional(),
    partyId: Joi.number().integer().positive().allow(null).optional(),
    partyBranchId: Joi.number().integer().positive().allow(null).optional(),
    poNo: Joi.string().max(50).required().messages({
        'string.empty': 'Purchase Order number is required',
        'any.required': 'Purchase Order number is required'
    }),
    poDate: Joi.date().required().messages({
        'any.required': 'PO Date is required'
    }),
    customerName: Joi.string().max(255).required().messages({
        'string.empty': 'Customer name is required',
        'any.required': 'Customer name is required'
    }),
    billingAddress: Joi.string().allow('', null).optional(),
    deliveryAddress: Joi.string().allow('', null).optional(),
    deliveryDueDate: Joi.date().allow(null).optional(),
    validUntil: Joi.date().allow(null).optional(),
    paymentTerms: Joi.string().max(255).allow('', null).optional(),
    advancePercentage: Joi.number().min(0).max(100).optional().default(0),
    status: Joi.string().valid('OPEN', 'PARTIALLY_INVOICED', 'COMPLETED', 'CANCELLED').default('OPEN'),
    notes: Joi.string().allow('', null).optional(),
    items: Joi.array().items(purchaseOrderItemValidationSchema).optional().default([])
});

// Schema: Update an existing Customer Purchase Order
export const updatePurchaseOrderValidationSchema = Joi.object({
    firmBranchId: Joi.number().integer().positive().allow(null).optional(),
    partyId: Joi.number().integer().positive().allow(null).optional(),
    partyBranchId: Joi.number().integer().positive().allow(null).optional(),
    poNo: Joi.string().max(50).optional(),
    poDate: Joi.date().optional(),
    customerName: Joi.string().max(255).optional(),
    billingAddress: Joi.string().allow('', null).optional(),
    deliveryAddress: Joi.string().allow('', null).optional(),
    deliveryDueDate: Joi.date().allow(null).optional(),
    validUntil: Joi.date().allow(null).optional(),
    paymentTerms: Joi.string().max(255).allow('', null).optional(),
    advancePercentage: Joi.number().min(0).max(100).optional(),
    status: Joi.string().valid('OPEN', 'PARTIALLY_INVOICED', 'COMPLETED', 'CANCELLED').optional(),
    notes: Joi.string().allow('', null).optional(),
    items: Joi.array().items(purchaseOrderItemValidationSchema).optional()
}).min(1);

// Default export / alias for form validation compatibility
export const purchaseOrderValidationSchema = createPurchaseOrderValidationSchema;
