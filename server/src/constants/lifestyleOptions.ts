/**
 * Lifestyle preference options for user profiles.
 * Used for validation, frontend dropdowns, and seeding.
 * All fields are optional - users can skip or partially fill.
 */

export const DRINKING = [
  "Not for me",
  "Sober",
  "Sober curious",
  "On occasion",
  "Socially",
  "On weekends",
  "Most nights",
] as const;

export const SMOKING = [
  "Non-smoker",
  "Smokes when drinking",
  "Social smoker",
  "Smoker",
  "Trying to quit",
] as const;

export const CANNABIS = ["Never", "Socially", "Occasionally", "Yes"] as const;

export const SLEEP_HABITS = [
  "Early bird",
  "Night owl",
  "Irregular / random",
  "Depends on workload",
] as const;

export const PETS = [
  "Dog",
  "Cat",
  "Reptile",
  "Amphibian",
  "Bird",
  "Fish",
  "Hamster",
  "Rabbit",
  "Turtle",
  "Don't have but love pets",
  "Allergic",
  "Don't like pets",
  "Want a pet",
] as const;

export const DIETARY_PREFERENCES = [
  "Omnivore",
  "Carnivore",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Kosher",
  "Halal",
  "Other",
] as const;

export const STUDY_STYLE = [
  "Quiet environments",
  "With background noise",
  "In groups",
  "Solo",
  "Last-minute crammer",
  "Consistent planner",
  "I don't study",
] as const;

export const CLEANLINESS = [
  "Very clean",
  "Pretty tidy",
  "Average",
  "A bit messy",
  "Chaotic but functional",
] as const;

export const CAFFEINE = [
  "No caffeine",
  "Occasional caffeine",
  "Daily coffee/tea",
  "I run on caffeine",
] as const;

export const LIVING_SITUATION = [
  "On-campus dorm",
  "Off-campus apartment",
  "Greek life housing",
  "With roommates",
  "Living alone",
  "Commuter student",
  "With family",
] as const;

export const FITNESS = [
  "Not into fitness",
  "Trying to get into it",
  "Casual gym-goer",
  "Active lifestyle",
  "Gym regular",
  "Athlete",
] as const;

/**
 * Grouped lifestyle options object for API exposure
 */
export const LIFESTYLE_OPTIONS = {
  drinking: DRINKING,
  smoking: SMOKING,
  cannabis: CANNABIS,
  sleepHabits: SLEEP_HABITS,
  pets: PETS,
  dietaryPreferences: DIETARY_PREFERENCES,
  studyStyle: STUDY_STYLE,
  cleanliness: CLEANLINESS,
  caffeine: CAFFEINE,
  livingSituation: LIVING_SITUATION,
  fitness: FITNESS,
} as const;

// TypeScript types
export type DrinkingOption = (typeof DRINKING)[number];
export type SmokingOption = (typeof SMOKING)[number];
export type CannabisOption = (typeof CANNABIS)[number];
export type SleepHabitsOption = (typeof SLEEP_HABITS)[number];
export type PetsOption = (typeof PETS)[number];
export type DietaryPreferencesOption = (typeof DIETARY_PREFERENCES)[number];
export type StudyStyleOption = (typeof STUDY_STYLE)[number];
export type CleanlinessOption = (typeof CLEANLINESS)[number];
export type CaffeineOption = (typeof CAFFEINE)[number];
export type LivingSituationOption = (typeof LIVING_SITUATION)[number];
export type FitnessOption = (typeof FITNESS)[number];
