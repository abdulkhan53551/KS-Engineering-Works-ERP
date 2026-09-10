import Joi from "joi";

/**
 * Individual Invoice Allocation Row Schema
 */
export const paymentAllocationRowSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().required().messages({
        "number.base": "Invoice ID must be a valid number.",
        "any.required": "Invoice ID is required."
    }),
    allocatedAmount: Joi.number().min(0).precision(2).default(0).messages({
        "number.min": "Allocated cash cannot be negative."
    }),
    tdsAmount: Joi.number().min(0).precision(2).default(0).messages({
        "number.min": "TDS amount cannot be negative."
    }),
    writeOffAmount: Joi.number().min(0).precision(2).default(0).messages({
        "number.min": "Write-off discount cannot be negative."
    }),
    writeOffReason: Joi.when("writeOffAmount", {
        is: Joi.number().greater(0),
        then: Joi.string().trim().min(3).max(255).required().messages({
            "string.empty": "Reason is required when write-off discount is applied.",
            "any.required": "Reason is required when write-off discount is applied."
        }),
        otherwise: Joi.string().allow("", null).optional()
    })
}).unknown(true);

/**
 * Main Create Customer Payment Receipt Schema
 */
export const createPaymentValidationSchema = Joi.object({
    paymentDate: Joi.date().iso().required().messages({
        "date.base": "Please select a valid payment date.",
        "any.required": "Payment date is required."
    }),
    partyId: Joi.number().integer().positive().required().messages({
        "number.base": "Please select a valid customer.",
        "any.required": "Customer is required."
    }),
    totalAmount: Joi.number().positive().precision(2).required().messages({
        "number.base": "Total received amount must be a number.",
        "number.positive": "Total received amount must be greater than zero.",
        "any.required": "Total received amount is required."
    }),
    paymentModeId: Joi.number().integer().positive().required().messages({
        "number.base": "Please select a payment mode.",
        "any.required": "Payment mode is required."
    }),
    referenceNo: Joi.string().trim().max(100).allow("", null).optional(),
    referenceDate: Joi.date().iso().allow("", null).optional(),
    bankName: Joi.string().trim().max(150).allow("", null).optional(),
    notes: Joi.string().trim().max(1000).allow("", null).optional(),
    allocations: Joi.array().items(paymentAllocationRowSchema).default([]).optional()
}).unknown(true);
