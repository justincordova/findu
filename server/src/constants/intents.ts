/**
 * Canonical intents for profile setup and discovery algorithm.
 * These are the 8 intents used in the intent compatibility matrix.
 */

export const INTENTS = [
  "Dating",
  "Casual Dating",
  "Serious Relationship",
  "Friendship",
  "Study Buddy",
  "Hookup",
  "Networking",
  "Unsure",
] as const;

export type Intent = (typeof INTENTS)[number];
