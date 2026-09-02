import Joi from "joi";

/**
 * Product validation schema for creating and updating products/items
 */
export const productValidationSchema = () => Joi.object({
    name: Joi.string().trim().min(2).max(255).required().messages({
        'string.empty': 'Product / Part Name is required',
        'any.required': 'Product / Part Name is required',
        'string.min': 'Product name must be at least 2 characters'
    }),
    itemCode: Joi.string().trim().max(100).allow('', null).optional().messages({
        'string.max': 'Part Code / SKU cannot exceed 100 characters'
    }),
    itemType: Joi.string()
        .valid('FINISHED_GOODS', 'RAW_MATERIAL', 'SERVICE', 'CONSUMABLE')
        .default('FINISHED_GOODS'),
    hsnSacCode: Joi.string()
        .allow('', null)
        .pattern(/^\d{4}$|^\d{6}$|^\d{8}$/)
        .messages({
            'string.pattern.base': 'HSN/SAC code must be 4, 6, or 8 numeric digits'
        }),
    gstSlabId: Joi.number().integer().positive().allow(null, '').optional(),
    itemUnitId: Joi.number().integer().positive().required().messages({
        'number.base': 'Unit of Measurement is required',
        'any.required': 'Unit of Measurement is required',
        'number.positive': 'Unit of Measurement is required'
    }),
    sellingPrice: Joi.number().min(0).precision(2).default(0.00),
    purchasePrice: Joi.number().min(0).precision(2).default(0.00),

    // Product Image / Photo
    imageUrl: Joi.string().uri().allow('', null).optional(),
    imagePublicId: Joi.string().allow('', null).optional(),

    // Engineering Technical Attributes
    drawingNumber: Joi.string().trim().max(150).allow('', null),
    materialGrade: Joi.string().trim().max(100).allow('', null),
    dimensions: Joi.string().trim().max(200).allow('', null),
    unitWeightKg: Joi.number().min(0).precision(3).allow(null, '').optional(),

    description: Joi.string().trim().allow('', null),
    notes: Joi.string().trim().allow('', null),
    status: Joi.string().valid('ACTIVE', 'INACTIVE').default('ACTIVE')
});
