import { Profile } from "./Profile";

export interface ProfileWithScore extends Profile {
  compatibilityScore: number;
  likedByUser?: boolean; // Whether this user already liked the current user
}

export interface CompatibilityWeights {
  sharedInterests: number;
  intentCompatibility: number;
  orientationCompatibility: number;
  majorCompatibility: number;
  ageCompatibility: number;
}

export interface DiscoverFilters {
  excludedUserIds: string[];
  ageRange: {
    min: number;
    max: number;
  };
  genderPreferences: string[];
  university: string;
}

export interface IntentCompatibilityMatrix {
  [key: string]: {
    [key: string]: number;
  };
}