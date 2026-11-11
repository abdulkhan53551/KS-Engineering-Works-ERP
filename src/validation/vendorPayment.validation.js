import Joi from "joi";

/**
 * Individual Vendor Bill Allocation Row Schema
 */
export const vendorPaymentAllocationRowSchema = Joi.object({
    vendorBillId: Joi.number().integer().positive().required().messages({
        "number.base": "Vendor Bill ID must be a valid number.",
        "any.required": "Vendor Bill ID is required."
    }),
    allocatedAmount: Joi.number().min(0).precision(2).default(0).messages({
        "number.min": "Allocated amount cannot be negative."
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
 * Main Create Outward Vendor Payment Schema
 */
export const createVendorPaymentValidationSchema = Joi.object({
    paymentDate: Joi.any().required().messages({
        "any.required": "Payment date is required."
    }),
    partyId: Joi.number().integer().positive().required().messages({
        "number.base": "Please select a valid vendor.",
        "any.required": "Vendor is required."
    }),
    totalAmount: Joi.number().positive().precision(2).required().messages({
        "number.base": "Total disbursement amount must be a number.",
        "number.positive": "Total disbursement amount must be greater than zero.",
        "any.required": "Total disbursement amount is required."
    }),
    paymentModeId: Joi.number().integer().positive().required().messages({
        "number.base": "Please select a payment mode.",
        "any.required": "Payment mode is required."
    }),
    referenceNo: Joi.string().trim().max(100).allow("", null).optional(),
    referenceDate: Joi.any().allow("", null).optional(),
    bankName: Joi.string().trim().max(150).allow("", null).optional(),
    notes: Joi.string().trim().max(1000).allow("", null).optional(),
    allocations: Joi.array().items(vendorPaymentAllocationRowSchema).default([]).optional()
}).unknown(true);
