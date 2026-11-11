import Joi from "joi";

/**
 * Individual Invoice Knock-off Allocation Row Schema
 */
export const advanceAllocationRowSchema = Joi.object({
    invoiceId: Joi.number().integer().positive().required().messages({
        "number.base": "Invoice ID must be a valid number.",
        "any.required": "Invoice ID is required."
    }),
    allocatedAmount: Joi.number().min(0).precision(2).default(0).messages({
        "number.min": "Allocated advance amount cannot be negative."
    }),
    tdsAmount: Joi.number().min(0).precision(2).default(0).messages({
        "number.min": "TDS amount cannot be negative."
    }),
    writeOffAmount: Joi.number().min(0).precision(2).default(0).messages({
        "number.min": "Write-off amount cannot be negative."
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
 * Customer Advance Adjustment Application Schema
 */
export const applyAdvanceValidationSchema = Joi.object({
    allocations: Joi.array().items(advanceAllocationRowSchema).min(1).required().messages({
        "array.min": "At least one invoice allocation is required.",
        "any.required": "Allocations are required."
    })
}).unknown(true);
