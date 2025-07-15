// validators/userValidator.ts
import { body, param } from 'express-validator';

export const createUserValidator = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .matches(/^[\w.+-]+@[\w-]+\.edu$/i)
    .withMessage('Email must be a .edu address'),

  body('username')
    .notEmpty().withMessage('Username is required'),

  body('f_name')
    .notEmpty().withMessage('First name is required'),

  body('l_name')
    .notEmpty().withMessage('Last name is required'),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Must contain a special character'),
];

export const idParamValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

export const updateUserValidator = [
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format')
    .matches(/^[\w.+-]+@[\w-]+\.edu$/i)
    .withMessage('Email must be a .edu address'),

  body('username')
    .optional()
    .notEmpty().withMessage('Username cannot be empty'),

  body('f_name')
    .optional()
    .notEmpty().withMessage('First name cannot be empty'),

  body('l_name')
    .optional()
    .notEmpty().withMessage('Last name cannot be empty'),

  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('Must contain a special character'),
];
