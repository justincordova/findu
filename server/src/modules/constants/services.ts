import logger from "@/config/logger";
import { GENDER_PREFERENCES } from "@/constants/genderPreferences";
import { INTENTS } from "@/constants/intents";
import { INTERESTS } from "@/constants/interests";
import { LIFESTYLE_OPTIONS } from "@/constants/lifestyleOptions";
import { MAJORS } from "@/constants/majors";
import { PRONOUNS } from "@/constants/pronouns";
import { SEXUAL_ORIENTATIONS } from "@/constants/sexualOrientations";

/**
 * Get all profile setup constants.
 * Used by frontend for populating dropdowns and selection UI.
 * Includes basic preferences (intents, majors, pronouns, etc.) and lifestyle options.
 * No database access required - purely returns constant arrays.
 */
export const getAllConstants = () => {
  logger.info("CONSTANTS_FETCHED");

  return {
    intents: INTENTS,
    majors: MAJORS,
    genderPreferences: GENDER_PREFERENCES,
    sexualOrientations: SEXUAL_ORIENTATIONS,
    pronouns: PRONOUNS,
    interests: INTERESTS,
    lifestyleOptions: LIFESTYLE_OPTIONS,
  };
};
