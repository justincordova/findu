import { body, param } from "express-validator";

export const validateCreateProfile = [
  body("name").isString().withMessage("Name is required"),
  body("birthdate").isISO8601().withMessage("Birthdate must be a valid date"),
  body("age").isInt({ min: 0 }).optional(),
  body("avatar_url").isURL().optional(),
  body("bio").isString().optional(),
  body("gender").isString().optional(),
  body("pronouns").isString().optional(),
  body("university").isString().optional(),
  body("university_year").isInt().optional(),
  body("major").isString().optional(),
];

export const validateUpdateProfile = [
  param("userId").isString().withMessage("Invalid user ID"),
  body("name").isString().optional(),
  body("birthdate").isISO8601().optional(),
  body("age").isInt({ min: 0 }).optional(),
  body("avatar_url").isURL().optional(),
  body("bio").isString().optional(),
  body("gender").isString().optional(),
  body("pronouns").isString().optional(),
  body("university").isString().optional(),
  body("university_year").isInt().optional(),
  body("major").isString().optional(),
];

export const validateDomainMap = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("If provided, email must be valid"),
];
