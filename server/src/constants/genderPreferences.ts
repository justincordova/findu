/**
 * Canonical gender preference options for profile setup.
 */

export const GENDER_PREFERENCES = [
  "Men",
  "Women",
  "Non-binary",
  "Trans Men",
  "Trans Women",
  "Other",
  "All",
] as const;

export type GenderPreference = (typeof GENDER_PREFERENCES)[number];
