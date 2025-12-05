/**
 * Canonical gender preference options for profile setup.
 */

export const GENDER_PREFERENCES = [
  "Men",
  "Women",
  "Non-binary",
  "All",
  "Other",
] as const;

export type GenderPreference = typeof GENDER_PREFERENCES[number];
