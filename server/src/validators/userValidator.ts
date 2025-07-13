import { body } from 'express-validator';

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
