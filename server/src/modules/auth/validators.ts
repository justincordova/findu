import { body } from "express-validator";

// For initial signup request (email + password)
export const validateSignupRequest = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .matches(/^[\w.+-]+@[\w-]+\.edu$/i)
    .withMessage("Email must be a .edu address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Must contain a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Must contain a special character"),
];

// For email verification (token only)
export const validateEmailVerification = [
  body("token")
    .isString()
    .notEmpty()
    .withMessage("Verification token is required"),
];

// For login
export const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .matches(/^[\w.+-]+@[\w-]+\.edu$/i)
    .withMessage("Email must be a .edu address"),
  body("password").notEmpty().withMessage("Password is required"),
];

// For password reset request (email only)
export const validatePasswordResetRequest = [
  body("email")
    .isEmail()
    .withMessage("Invalid email format")
    .matches(/^[\w.+-]+@[\w-]+\.edu$/i)
    .withMessage("Email must be a .edu address"),
];

// For password reset (token + new password)
export const validatePasswordReset = [
  body("token").isString().notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Must contain an uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Must contain a lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Must contain a number")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Must contain a special character"),
];
