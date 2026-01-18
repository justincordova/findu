import { body } from "express-validator";

export const validateBlock = [
  body("blockedId")
    .notEmpty()
    .withMessage("blockedId is required")
    .isString()
    .withMessage("blockedId must be a string"),
];
