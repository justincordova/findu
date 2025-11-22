import { body } from "express-validator";

const emailValidation = body("email")
  .isEmail()
  .withMessage("Invalid email format")
  .matches(/^[\w.+-]+@[\w-]+\.edu$/i)
  .withMessage("Email must be a .edu address");

const passwordValidation = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters")
  .matches(/[A-Z]/)
  .withMessage("Must contain an uppercase letter")
  .matches(/[a-z]/)
  .withMessage("Must contain a lowercase letter")
  .matches(/[0-9]/)
  .withMessage("Must contain a number")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("Must contain a special character");

const otpValidation = body("otp")
  .isString()
  .isLength({ min: 6, max: 6 })
  .withMessage("OTP must be exactly 6 digits")
  .matches(/^\d{6}$/)
  .withMessage("OTP must contain only digits");

// For requesting an OTP
export const validateEmail = [
  emailValidation,
];

// For signing up with email, password, and OTP
export const validateSignup = [
  emailValidation,
  passwordValidation,
  otpValidation,
];

// For signing in
export const validateLogin = [
  emailValidation,
  body("password").notEmpty().withMessage("Password is required"),
];