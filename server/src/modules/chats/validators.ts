import { body, param, query } from "express-validator";

export const validateCreateMessage = [
  body("match_id").isString().notEmpty().withMessage("match_id is required"),
  body("message")
    .isString()
    .notEmpty()
    .withMessage("message is required and must be a string"),
  body("media_url")
    .optional()
    .isString()
    .withMessage("media_url must be a string"),
  body("message_type")
    .optional()
    .isIn(["TEXT", "IMAGE", "VIDEO"])
    .withMessage("message_type must be TEXT, IMAGE, or VIDEO"),
];

export const validateGetHistory = [
  param("match_id").isString().notEmpty().withMessage("match_id is required"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be 1-100"),
  query("cursor").optional().isString().withMessage("cursor must be a string"),
];

export const validateDeleteMessage = [
  param("message_id")
    .isString()
    .notEmpty()
    .withMessage("message_id is required"),
];

export const validateEditMessage = [
  param("message_id")
    .isString()
    .notEmpty()
    .withMessage("message_id is required"),
  body("message").isString().notEmpty().withMessage("message is required"),
];

export const validateMarkRead = [
  param("match_id").isString().notEmpty().withMessage("match_id is required"),
];
