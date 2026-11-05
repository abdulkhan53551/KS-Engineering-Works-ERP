import Joi from "joi";

// Item schema for delivery challan line items
export const challanItemValidationSchema = Joi.object({
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
    unit: Joi.string().max(50).optional().default('Nos'),
    rate: Joi.number().min(0).optional().default(0),
    total: Joi.number().min(0).optional().default(0),
    sortOrder: Joi.number().integer().min(0).optional().default(0)
});

// Schema: Create a new invoice challan
export const createInvoiceChallanValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    firmBranchId: Joi.number().integer().positive().allow(null).optional(),
    partyId: Joi.number().integer().positive().allow(null).optional(),
    partyBranchId: Joi.number().integer().positive().allow(null).optional(),
    challanNo: Joi.string().max(50).optional().allow('', null),
    challanDate: Joi.date().required().messages({
        'any.required': 'Challan Date is required'
    }),
    customerName: Joi.string().max(255).required().messages({
        'string.empty': 'Customer name is required',
        'any.required': 'Customer name is required'
    }),
    deliveryAddress: Joi.string().allow('', null).optional(),
    transportMode: Joi.string().max(50).allow('', null).optional().default('Road'),
    vehicleNo: Joi.string().max(50).allow('', null).optional(),
    transporterName: Joi.string().max(150).allow('', null).optional(),
    lrNo: Joi.string().max(100).allow('', null).optional(),
    dispatchReason: Joi.string().max(100).allow('', null).optional().default('Supply on Delivery'),
    status: Joi.string().valid('DRAFT', 'DISPATCHED', 'BILLED', 'CANCELLED').optional().default('DISPATCHED'),
    notes: Joi.string().allow('', null).optional(),
    items: Joi.array().items(challanItemValidationSchema).optional().default([])
});

// Schema: Update an existing invoice challan
export const updateInvoiceChallanValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    firmBranchId: Joi.number().integer().positive().allow(null).optional(),
    partyId: Joi.number().integer().positive().allow(null).optional(),
    partyBranchId: Joi.number().integer().positive().allow(null).optional(),
    challanNo: Joi.string().max(50).optional().allow('', null),
    challanDate: Joi.date().optional(),
    customerName: Joi.string().max(255).optional(),
    deliveryAddress: Joi.string().allow('', null).optional(),
    transportMode: Joi.string().max(50).allow('', null).optional(),
    vehicleNo: Joi.string().max(50).allow('', null).optional(),
    transporterName: Joi.string().max(150).allow('', null).optional(),
    lrNo: Joi.string().max(100).allow('', null).optional(),
    dispatchReason: Joi.string().max(100).allow('', null).optional(),
    status: Joi.string().valid('DRAFT', 'DISPATCHED', 'BILLED', 'CANCELLED').optional(),
    notes: Joi.string().allow('', null).optional(),
    items: Joi.array().items(challanItemValidationSchema).optional()
}).min(1);

// Default export / alias for form validation compatibility
export const invoiceChallanValidationSchema = createInvoiceChallanValidationSchema;
