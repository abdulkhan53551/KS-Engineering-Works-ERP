// validationSchema.ts
import Joi from "joi";

// Schema: Create a new invoice challan
export const invoiceChallanValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    challanNo: Joi.string().max(50).required(),
    challanDate: Joi.date().required(),
    customerName: Joi.string().max(255).required(),
    isInvoiced: Joi.boolean().when('invoiceId', {
        is: Joi.number().integer().positive(),
        then: Joi.boolean().default(false),
        otherwise: Joi.valid(false)
            .messages({ "any.only": "isInvoiced must be false when invoice is not mapped to this challan." })
            .default(false)
    })
});