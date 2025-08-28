import { body } from "express-validator";

export const validateGenerateUploadUrl = [
  body("filename")
    .isString()
    .notEmpty()
    .withMessage("Filename is required"),
];
