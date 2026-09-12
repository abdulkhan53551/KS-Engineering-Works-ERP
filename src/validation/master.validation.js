import Joi from "joi";

/**
 * Validation schema for Contact Role
 * Payload: { roleCode, roleName, description }
 */
export const contactRoleValidationSchema = Joi.object({
    roleCode: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(/^[A-Z0-9_-]+$/)
        .required()
        .messages({
            "string.empty": "Contact Role Code is required",
            "string.min": "Code must be at least 2 characters",
            "string.max": "Code cannot exceed 50 characters",
            "string.pattern.base": "Code must be uppercase alphanumeric (e.g. OWNER, MANAGER)",
            "any.required": "Contact Role Code is required"
        }),
    roleName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.empty": "Contact Role Name is required",
            "string.min": "Name must be at least 2 characters",
            "string.max": "Name cannot exceed 100 characters",
            "any.required": "Contact Role Name is required"
        }),
    description: Joi.string()
        .trim()
        .max(255)
        .allow(null, "")
        .optional()
        .messages({
            "string.max": "Description cannot exceed 255 characters"
        })
});

/**
 * Validation schema for Party Role
 * Payload: { roleCode, roleName, description }
 */
export const partyRoleValidationSchema = Joi.object({
    roleCode: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(/^[A-Z0-9_-]+$/)
        .required()
        .messages({
            "string.empty": "Party Role Code is required",
            "string.min": "Code must be at least 2 characters",
            "string.max": "Code cannot exceed 50 characters",
            "string.pattern.base": "Code must be uppercase alphanumeric (e.g. CUSTOMER, VENDOR)",
            "any.required": "Party Role Code is required"
        }),
    roleName: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.empty": "Party Role Name is required",
            "string.min": "Name must be at least 2 characters",
            "string.max": "Name cannot exceed 100 characters",
            "any.required": "Party Role Name is required"
        }),
    description: Joi.string()
        .trim()
        .max(255)
        .allow(null, "")
        .optional()
        .messages({
            "string.max": "Description cannot exceed 255 characters"
        })
});
