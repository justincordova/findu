import { body } from "express-validator";

export const validateLike = [
  body("from_user").isUUID().withMessage("from_user must be a valid UUID"),
  body("to_user").isUUID().withMessage("to_user must be a valid UUID"),
  body("is_superlike").optional().isBoolean().withMessage("is_superlike must be boolean"),
];
