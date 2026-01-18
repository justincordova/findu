import { handleResponse } from "./utils";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/constants`;

/**
 * Profile constant values available for user selection
 */
export interface Constants {
  intents: string[];
  majors: string[];
  genderPreferences: string[];
  sexualOrientations: string[];
  pronouns: string[];
  interests: Record<string, string[]>;
  lifestyleOptions?: {
    drinking: readonly string[];
    smoking: readonly string[];
    cannabis: readonly string[];
    sleepHabits: readonly string[];
    pets: readonly string[];
    dietaryPreferences: readonly string[];
    studyStyle: readonly string[];
    cleanliness: readonly string[];
    caffeine: readonly string[];
    livingSituation: readonly string[];
    fitness: readonly string[];
  };
}

export const ConstantsAPI = {
  /**
   * Fetch all profile constant values from backend
   * Cached on client side and used for profile setup dropdowns
   * @returns {Promise<Constants>} Object containing all available constants
   */
  getAll: async (): Promise<Constants> => {
    const res = await fetch(`${API_BASE}`);
    return handleResponse(res);
  },
};
