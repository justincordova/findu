/**
 * Lifestyle data interface for user profiles.
 * All fields are optional - users can partially fill or skip entirely.
 * Field names use snake_case to match Prisma/DB conventions.
 */
export interface Lifestyle {
  drinking?: string;
  smoking?: string;
  cannabis?: string;
  sleep_habits?: string;
  pets?: string[];
  dietary_preferences?: string[];
  study_style?: string;
  cleanliness?: string;
  caffeine?: string;
  living_situation?: string;
  fitness?: string;
}
