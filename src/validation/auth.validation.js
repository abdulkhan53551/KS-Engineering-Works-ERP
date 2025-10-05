// validationSchema.ts
import Joi from "joi";

export const signinSchema = Joi.object({
    email: Joi.string().email({ tlds: false }).required().label("Email"),
    password: Joi.string().min(6).required().label("Password")
});