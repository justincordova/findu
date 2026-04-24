import { body, param } from "express-validator";
import {
  CAFFEINE,
  CANNABIS,
  CLEANLINESS,
  DIETARY_PREFERENCES,
  DRINKING,
  FITNESS,
  LIVING_SITUATION,
  PETS,
  SLEEP_HABITS,
  SMOKING,
  STUDY_STYLE,
} from "@/constants/lifestyleOptions";

export const validateCreateProfile = [
  body("name").isString().withMessage("Name is required"),
  body("birthdate").isISO8601().withMessage("Birthdate must be a valid date"),
  body("age").isInt({ min: 0 }).optional(),
  body("avatar_url").isURL().optional(),
  body("bio").isString().optional(),
  body("gender").isString().optional(),
  body("pronouns").isString().optional(),
  body("university").isString().optional(),
  body("university_id").isUUID().optional(),
  body("campus_id").isUUID().optional({ nullable: true }),
  body("university_year").isInt().optional(),
  body("major").isString().optional(),
  body("grad_year").isInt({ min: 1900, max: 2100 }).optional(),
  body("intent").isString().optional(),
  body("interests").isArray().optional().withMessage("Interests must be an array"),
  body("interests.*").isString().withMessage("Each interest must be a string"),
  body("gender_preference")
    .isArray()
    .optional()
    .withMessage("gender_preference must be an array"),
  body("gender_preference.*")
    .isString()
    .withMessage("Each gender_preference entry must be a string"),
  body("sexual_orientation").isString().optional(),
  body("min_age").isInt({ min: 18, max: 120 }).optional(),
  body("max_age").isInt({ min: 18, max: 120 }).optional(),
  body("photos").isArray().optional().withMessage("Photos must be an array"),
  body("photos.*").isURL().withMessage("Each photo must be a URL"),
  body("spotify_url").isURL().optional(),
  body("instagram_url").isURL().optional(),
  // Lifestyle validations (all optional)
  body("lifestyle")
    .optional()
    .isObject()
    .withMessage("Lifestyle must be an object"),
  body("lifestyle.drinking")
    .optional()
    .isIn(DRINKING)
    .withMessage("Invalid drinking option"),
  body("lifestyle.smoking")
    .optional()
    .isIn(SMOKING)
    .withMessage("Invalid smoking option"),
  body("lifestyle.cannabis")
    .optional()
    .isIn(CANNABIS)
    .withMessage("Invalid cannabis option"),
  body("lifestyle.sleep_habits")
    .optional()
    .isIn(SLEEP_HABITS)
    .withMessage("Invalid sleep habits"),
  body("lifestyle.pets")
    .optional()
    .isArray()
    .withMessage("Pets must be an array"),
  body("lifestyle.pets.*")
    .optional()
    .isIn(PETS)
    .withMessage("Invalid pet option"),
  body("lifestyle.dietary_preferences")
    .optional()
    .isArray()
    .withMessage("Dietary prefs must be array"),
  body("lifestyle.dietary_preferences.*")
    .optional()
    .isIn(DIETARY_PREFERENCES)
    .withMessage("Invalid dietary pref"),
  body("lifestyle.study_style")
    .optional()
    .isIn(STUDY_STYLE)
    .withMessage("Invalid study style"),
  body("lifestyle.cleanliness")
    .optional()
    .isIn(CLEANLINESS)
    .withMessage("Invalid cleanliness"),
  body("lifestyle.caffeine")
    .optional()
    .isIn(CAFFEINE)
    .withMessage("Invalid caffeine option"),
  body("lifestyle.living_situation")
    .optional()
    .isIn(LIVING_SITUATION)
    .withMessage("Invalid living situation"),
  body("lifestyle.fitness")
    .optional()
    .isIn(FITNESS)
    .withMessage("Invalid fitness option"),
];

export const validateUpdateProfile = [
  param("userId").isString().withMessage("Invalid user ID"),
  body("name").isString().optional(),
  body("birthdate").isISO8601().optional(),
  body("age").isInt({ min: 0 }).optional(),
  body("avatar_url").isURL().optional(),
  body("bio").isString().optional(),
  body("gender").isString().optional(),
  body("pronouns").isString().optional(),
  body("university").isString().optional(),
  body("university_id").isUUID().optional(),
  body("campus_id").isUUID().optional({ nullable: true }),
  body("university_year").isInt().optional(),
  body("major").isString().optional(),
  body("grad_year").isInt({ min: 1900, max: 2100 }).optional(),
  body("intent").isString().optional(),
  body("interests").isArray().optional().withMessage("Interests must be an array"),
  body("interests.*").isString().withMessage("Each interest must be a string"),
  body("gender_preference")
    .isArray()
    .optional()
    .withMessage("gender_preference must be an array"),
  body("gender_preference.*")
    .isString()
    .withMessage("Each gender_preference entry must be a string"),
  body("sexual_orientation").isString().optional(),
  body("min_age").isInt({ min: 18, max: 120 }).optional(),
  body("max_age").isInt({ min: 18, max: 120 }).optional(),
  body("photos").isArray().optional().withMessage("Photos must be an array"),
  body("photos.*").isURL().withMessage("Each photo must be a URL"),
  body("spotify_url").isURL().optional(),
  body("instagram_url").isURL().optional(),
  // Lifestyle validations (all optional)
  body("lifestyle")
    .optional()
    .isObject()
    .withMessage("Lifestyle must be an object"),
  body("lifestyle.drinking")
    .optional()
    .isIn(DRINKING)
    .withMessage("Invalid drinking option"),
  body("lifestyle.smoking")
    .optional()
    .isIn(SMOKING)
    .withMessage("Invalid smoking option"),
  body("lifestyle.cannabis")
    .optional()
    .isIn(CANNABIS)
    .withMessage("Invalid cannabis option"),
  body("lifestyle.sleep_habits")
    .optional()
    .isIn(SLEEP_HABITS)
    .withMessage("Invalid sleep habits"),
  body("lifestyle.pets")
    .optional()
    .isArray()
    .withMessage("Pets must be an array"),
  body("lifestyle.pets.*")
    .optional()
    .isIn(PETS)
    .withMessage("Invalid pet option"),
  body("lifestyle.dietary_preferences")
    .optional()
    .isArray()
    .withMessage("Dietary prefs must be array"),
  body("lifestyle.dietary_preferences.*")
    .optional()
    .isIn(DIETARY_PREFERENCES)
    .withMessage("Invalid dietary pref"),
  body("lifestyle.study_style")
    .optional()
    .isIn(STUDY_STYLE)
    .withMessage("Invalid study style"),
  body("lifestyle.cleanliness")
    .optional()
    .isIn(CLEANLINESS)
    .withMessage("Invalid cleanliness"),
  body("lifestyle.caffeine")
    .optional()
    .isIn(CAFFEINE)
    .withMessage("Invalid caffeine option"),
  body("lifestyle.living_situation")
    .optional()
    .isIn(LIVING_SITUATION)
    .withMessage("Invalid living situation"),
  body("lifestyle.fitness")
    .optional()
    .isIn(FITNESS)
    .withMessage("Invalid fitness option"),
];

export const validateDomainMap = [
  body("email")
    .optional()
    .isEmail()
    .withMessage("If provided, email must be valid"),
];
