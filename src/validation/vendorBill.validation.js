import Joi from "joi";

/**
 * Validation schema for creating a new Vendor Bill
 */
export const createVendorBillValidationSchema = Joi.object({
    partyId: Joi.number().integer().positive().required().messages({
        "number.base": "Please select a valid vendor.",
        "number.positive": "Please select a valid vendor.",
        "any.required": "Vendor is required."
    }),
    branchId: Joi.number().integer().positive().allow(null).optional(),
    billNo: Joi.string().trim().max(100).required().messages({
        "string.empty": "Bill number is required.",
        "any.required": "Bill number is required."
    }),
    billDate: Joi.any().required().messages({
        "any.required": "Bill date is required."
    }),
    dueDays: Joi.number().integer().min(0).default(30).messages({
        "number.min": "Due days cannot be negative."
    }),
    dueDate: Joi.any().required().messages({
        "any.required": "Due date is required."
    }),
    taxableAmount: Joi.number().min(0).precision(2).optional(),
    cgst: Joi.number().min(0).precision(2).default(0).optional(),
    sgst: Joi.number().min(0).precision(2).default(0).optional(),
    igst: Joi.number().min(0).precision(2).default(0).optional(),
    otherCharges: Joi.number().min(0).precision(2).default(0).optional(),
    roundOff: Joi.number().precision(2).default(0).optional(),
    total: Joi.number().precision(2).optional(),
    notes: Joi.string().trim().max(1000).allow("", null).optional()
}).unknown(true);

/**
 * Validation schema for updating a Vendor Bill
 * (Allows non-monetary updates even if monetary fields are locked)
 */
export const updateVendorBillValidationSchema = Joi.object({
    partyId: Joi.number().integer().positive().optional(),
    branchId: Joi.number().integer().positive().allow(null).optional(),
    billNo: Joi.string().trim().max(100).optional(),
    billDate: Joi.any().optional(),
    dueDays: Joi.number().integer().min(0).optional(),
    dueDate: Joi.any().optional(),
    taxableAmount: Joi.number().min(0).precision(2).optional(),
    cgst: Joi.number().min(0).precision(2).optional(),
    sgst: Joi.number().min(0).precision(2).optional(),
    igst: Joi.number().min(0).precision(2).optional(),
    otherCharges: Joi.number().min(0).precision(2).optional(),
    roundOff: Joi.number().precision(2).optional(),
    total: Joi.number().precision(2).optional(),
    notes: Joi.string().trim().max(1000).allow("", null).optional()
}).unknown(true);
