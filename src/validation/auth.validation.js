// validationSchema.ts
import Joi from "joi";

export const signinSchema = Joi.object({
    email: Joi.string().email({ tlds: false }).required().label("Email"),
    password: Joi.string().min(6).required().label("Password")
});

export const signupSchema = Joi.object({
    firstName: Joi.string().trim().required().label("First Name"),
    lastName: Joi.string().trim().allow('', null).label("Last Name"),
    userName: Joi.string().trim().alphanum().min(3).max(30).required().label("Username"),
    email: Joi.string().trim().email({ tlds: false }).required().label("Email"),
    password: Joi.string().min(6).required().label("Password"),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().label("Confirm Password").messages({
        'any.only': 'Passwords do not match'
    })
});

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email({ tlds: false }).required().label("Email")
});

export const resetPasswordSchema = Joi.object({
    password: Joi.string().min(6).required().label("New Password"),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().label("Confirm Password").messages({
        'any.only': 'Passwords do not match'
    })
});