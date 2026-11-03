// validationSchema.ts
import Joi from "joi";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
const PASSWORD_ERROR_MSG = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';

export const signinSchema = Joi.object({
    email: Joi.string().email({ tlds: false }).required().label("Email"),
    password: Joi.string().required().label("Password")
});

export const signupSchema = Joi.object({
    firstName: Joi.string().trim().required().label("First Name"),
    lastName: Joi.string().trim().allow('', null).label("Last Name"),
    userName: Joi.string().trim().alphanum().min(3).max(30).required().label("Username"),
    email: Joi.string().trim().email({ tlds: false }).required().label("Email"),
    password: Joi.string()
        .min(8)
        .max(100)
        .pattern(PASSWORD_REGEX)
        .required()
        .label("Password")
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': PASSWORD_ERROR_MSG
        }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().label("Confirm Password").messages({
        'any.only': 'Passwords do not match'
    })
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email({ tlds: false }).required().label("Email")
});

export const resetPasswordSchema = Joi.object({
    password: Joi.string()
        .min(8)
        .max(100)
        .pattern(PASSWORD_REGEX)
        .required()
        .label("New Password")
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.pattern.base': PASSWORD_ERROR_MSG
        }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().label("Confirm Password").messages({
        'any.only': 'Passwords do not match'
    })
});