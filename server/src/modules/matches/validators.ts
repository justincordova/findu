import { body, param } from "express-validator";

export const validateCreateMatch = [
  body("user1Id").isUUID().withMessage("user1Id must be a valid UUID"),
  body("user2Id").isUUID().withMessage("user2Id must be a valid UUID"),
];

export const validateMatchId = [
  param("id").isUUID().withMessage("Match ID must be a valid UUID"),
];

export const validateCheckMatch = [
  param("user1Id").isUUID().withMessage("user1Id must be a valid UUID"),
  param("user2Id").isUUID().withMessage("user2Id must be a valid UUID"),
];
