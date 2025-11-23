import { body, query } from "express-validator";

/**
 * Validate compatibility calculation request
 */
export const validateCompatibilityRequest = [
  body("userId")
    .isString()
    .notEmpty()
    .withMessage("User ID is required and must be a non-empty string"),
  body("candidateId")
    .isString()
    .notEmpty()
    .withMessage("Candidate ID is required and must be a non-empty string"),
  body("userId")
    .custom((value, { req }) => {
      if (value === req.body.candidateId) {
        throw new Error("Cannot calculate compatibility with yourself");
      }
      return true;
    }),
];

/**
 * Validate discovery feed query parameters
 */
export const validateDiscoveryQuery = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be a number between 1 and 50"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Offset must be a number 0 or greater"),
  // Remove userId validation from query/param as it comes from auth token
];

/**
 * Validate age preferences update request
 */
export const validateAgePreferences = [
  body("min_age")
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage("Minimum age must be between 18 and 100"),
  body("max_age")
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage("Maximum age must be between 18 and 100"),
  body("min_age")
    .optional()
    .custom((value, { req }) => {
      if (req.body.max_age && value > req.body.max_age) {
        throw new Error("Minimum age cannot be greater than maximum age");
      }
      if (req.body.max_age && (req.body.max_age - value) < 1) {
        throw new Error("Age range must be at least 1 year");
      }
      if (req.body.max_age && (req.body.max_age - value) > 50) {
        throw new Error("Age range cannot exceed 50 years");
      }
      return true;
    }),
];

/**
 * Validate gender preferences update request
 */
export const validateGenderPreferences = [
  body("gender_preference")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Gender preferences must be a non-empty array"),
  body("gender_preference.*")
    .optional()
    .isIn(['male', 'female', 'non-binary', 'other'])
    .withMessage("Invalid gender preference. Valid options: male, female, non-binary, other"),
];

/**
 * Validate discovery preferences update (combines age and gender validation)
 */
export const validateDiscoveryPreferences = [
  ...validateAgePreferences,
  ...validateGenderPreferences,
  body()
    .custom((value) => {
      const hasAgePrefs = value.min_age !== undefined || value.max_age !== undefined;
      const hasGenderPrefs = value.gender_preference !== undefined;
      
      if (!hasAgePrefs && !hasGenderPrefs) {
        throw new Error("At least one preference field (age or gender) must be provided");
      }
      
      // If one age field is provided, both must be provided
      if ((value.min_age !== undefined || value.max_age !== undefined) && 
          (value.min_age === undefined || value.max_age === undefined)) {
        throw new Error("Both min_age and max_age must be provided together");
      }
      
      return true;
    }),
];

/**
 * Validate refresh feed request
 */
export const validateRefreshFeed = [
  // No validation needed as userId comes from auth token
];