/**
 * Canonical sexual orientation options for profile setup.
 */

export const SEXUAL_ORIENTATIONS = [
  "Heterosexual",
  "Homosexual",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Queer",
  "Questioning",
  "Other",
] as const;

export type SexualOrientation = typeof SEXUAL_ORIENTATIONS[number];
