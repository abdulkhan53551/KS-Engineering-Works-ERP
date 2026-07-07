// validationSchema.ts
import Joi from "joi";

// Schema: Create a new eway bill
export const eWayBillValidationSchema = Joi.object({
    ewayBillNo: Joi.string().max(50).required(),
    ewayBillDate: Joi.date().required(),
    ewaybillValidUpto: Joi.date()
        .min(Joi.ref('ewayBillDate')) // must be same or after ewayBillDate
        .required()
        .messages({
            'date.min': '"ewaybillValidUpto" must be greater than or equal to "ewayBillDate"',
        }),
    customerName: Joi.string().max(255).required(),
    isInvoiced: Joi.boolean().when('invoiceId', {
        is: Joi.number().integer().positive(),
        then: Joi.boolean().default(false),
        otherwise: Joi.valid(false)
            .messages({ "any.only": "isInvoiced must be false when invoice is not mapped to this E-way bill." })
            .default(false)
    }),
    invoiceId: Joi.number().integer().positive().allow(null).default(null),
});