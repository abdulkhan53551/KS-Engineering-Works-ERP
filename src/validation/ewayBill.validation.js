// validationSchema.ts
import Joi from "joi";

// Schema: Create a new eway bill
export const createEWayBillValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    ewayBillNo: Joi.string().max(50).required(),
    ewayBillDate: Joi.date().required(),
    ewaybillValidUpto: Joi.date()
        .min(Joi.ref('ewayBillDate')) // must be same or after ewayBillDate
        .required()
        .messages({
            'date.min': '"ewaybillValidUpto" must be greater than or equal to "ewayBillDate"',
        }),
    customerName: Joi.string().max(255).required()
});

// Schema: Update an existing eway bill
export const updateEWayBillValidationSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().allow(null).optional(),
    ewayBillNo: Joi.string().max(50).optional(),
    ewayBillDate: Joi.date().optional(),
    ewaybillValidUpto: Joi.date()
        .min(Joi.ref('ewayBillDate')) // must be same or after ewayBillDate
        .optional()
        .messages({
            'date.min': '"ewaybillValidUpto" must be greater than or equal to "ewayBillDate"',
        }),
    customerName: Joi.string().max(255).optional()
}).min(1);

// Default export / alias for form validation compatibility
export const eWayBillValidationSchema = createEWayBillValidationSchema;