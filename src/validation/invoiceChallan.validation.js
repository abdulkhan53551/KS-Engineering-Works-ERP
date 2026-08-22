// validationSchema.ts
import Joi from "joi";

// Schema: Create a new invoice challan
export const createInvoiceChallanValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    challanNo: Joi.string().max(50).required(),
    challanDate: Joi.date().required(),
    customerName: Joi.string().max(255).required()
});

// Schema: Update an existing invoice challan
export const updateInvoiceChallanValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    challanNo: Joi.string().max(50).optional(),
    challanDate: Joi.date().optional(),
    customerName: Joi.string().max(255).optional()
}).min(1);

// Default export / alias for form validation compatibility
export const invoiceChallanValidationSchema = createInvoiceChallanValidationSchema;