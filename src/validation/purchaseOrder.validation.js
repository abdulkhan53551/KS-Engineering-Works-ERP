// validationSchema.ts
import Joi from "joi";

// Schema: Create a new purchase order
export const purchaseOrderValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    poNo: Joi.string().max(50).required(),
    poDate: Joi.date().required(),
    customerName: Joi.string().max(255).required(),
    isInvoiced: Joi.boolean().when('invoiceId', {
        is: Joi.number().integer().positive(),
        then: Joi.boolean().default(false),
        otherwise: Joi.valid(false)
            .messages({ "any.only": "isInvoiced must be false when invoice is not mapped to this purchase order." })
            .default(false)
    })
});