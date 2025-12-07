/**
 * Canonical sexual orientation options for profile setup.
 */
export const SEXUAL_ORIENTATIONS = [
  "Straight",
  "Gay",
  "Lesbian",
  "Bisexual",
  "Pansexual",
  "Asexual",
  "Demisexual",
  "Queer",
  "Questioning",
  "Prefer not to say",
  "Other",
] as const;


export type SexualOrientation = typeof SEXUAL_ORIENTATIONS[number];
