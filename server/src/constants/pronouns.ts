/**
 * Canonical pronoun options for profile setup.
 */

export const PRONOUNS = [
  "he/him",
  "she/her",
  "they/them",
  "ze/zir",
  "xe/xem",
  "prefer not to say",
  "other",
] as const;

export type Pronoun = typeof PRONOUNS[number];
