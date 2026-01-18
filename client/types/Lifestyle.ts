/**
 * Lifestyle data interface for user profiles.
 * All fields optional - users can partially fill or skip entirely.
 * Field names use snake_case to match backend conventions.
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
