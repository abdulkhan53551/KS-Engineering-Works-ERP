// validationSchema.ts
import Joi from "joi";

// Schema: Create a new purchase order
export const createPurchaseOrderValidationSchema = Joi.object({
    poNo: Joi.string().max(50).required(),
    poDate: Joi.date().required(),
    customerName: Joi.string().max(255).required(),
    status: Joi.string().valid('OPEN', 'COMPLETED', 'CANCELLED').default('OPEN')
});

// Schema: Update an existing purchase order
export const updatePurchaseOrderValidationSchema = Joi.object({
    poNo: Joi.string().max(50).optional(),
    poDate: Joi.date().optional(),
    customerName: Joi.string().max(255).optional(),
    status: Joi.string().valid('OPEN', 'COMPLETED', 'CANCELLED').optional()
}).min(1);

// Default export / alias for form validation compatibility
export const purchaseOrderValidationSchema = createPurchaseOrderValidationSchema;