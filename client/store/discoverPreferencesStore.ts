import { create } from "zustand";
import logger from "@/config/logger";

/**
 * Discover Preferences Store
 *
 * Tracks user's hard filter preferences (age range, gender preference) to detect changes.
 * Used by discover page to determine when to refetch profiles after preference updates.
 *
 * Purpose: Detect when user changes age_range or gender_preferences on profile page,
 * so discover page can force refetch on next tab focus to show profiles matching new filters.
 *
 * This prevents showing outdated/mismatched profiles and prevents abuse (changing preferences
 * repeatedly to see more people), while allowing genuine preference updates.
 */

interface DiscoverPreferencesState {
  // Last known hard filter values from profile
  lastKnownMinAge: number | null;
  lastKnownMaxAge: number | null;
  lastKnownGenderPreference: string[] | null;

  /**
   * Initialize hard filter baselines from current profile data
   * Called on app startup and after successful discover feed refetch
   * @param minAge - Current minimum age preference
   * @param maxAge - Current maximum age preference
   * @param genderPreference - Current gender preferences
   */
  initializeHardFilters: (
    minAge: number,
    maxAge: number,
    genderPreference: string[]
  ) => void;

  /**
   * Update hard filter baselines after refetch
   * Called after discover feed successfully refetches to sync new preferences
   * @param minAge - Updated minimum age preference
   * @param maxAge - Updated maximum age preference
   * @param genderPreference - Updated gender preferences
   */
  updateHardFilters: (
    minAge: number,
    maxAge: number,
    genderPreference: string[]
  ) => void;

  /**
   * Check if hard filters have changed since last known values
   * Compares current profile data against stored baselines
   * @param minAge - Current minimum age preference from profile
   * @param maxAge - Current maximum age preference from profile
   * @param genderPreference - Current gender preferences from profile
   * @returns true if any hard filter has changed
   */
  hardFiltersChanged: (
    minAge: number,
    maxAge: number,
    genderPreference: string[]
  ) => boolean;
}

/**
 * Helper: Compare gender preference arrays for equality
 * Order-independent comparison (e.g., ["Male", "Female"] === ["Female", "Male"])
 */
const genderPrefsEqual = (prefs1: string[] | null, prefs2: string[]): boolean => {
  if (!prefs1) return false;
  if (prefs1.length !== prefs2.length) return false;

  const sorted1 = [...prefs1].sort();
  const sorted2 = [...prefs2].sort();
  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
};

export const useDiscoverPreferencesStore = create<DiscoverPreferencesState>((set, get) => ({
  lastKnownMinAge: null,
  lastKnownMaxAge: null,
  lastKnownGenderPreference: null,

  initializeHardFilters: (minAge, maxAge, genderPreference) => {
    logger.debug("[discoverPreferences] Initializing hard filters", {
      minAge,
      maxAge,
      genderPreference,
    });

    set({
      lastKnownMinAge: minAge,
      lastKnownMaxAge: maxAge,
      lastKnownGenderPreference: genderPreference,
    });
  },

  updateHardFilters: (minAge, maxAge, genderPreference) => {
    const state = get();

    const changed =
      state.lastKnownMinAge !== minAge ||
      state.lastKnownMaxAge !== maxAge ||
      !genderPrefsEqual(state.lastKnownGenderPreference, genderPreference);

    if (changed) {
      logger.debug("[discoverPreferences] Filters updated", {
        previousMinAge: state.lastKnownMinAge,
        previousMaxAge: state.lastKnownMaxAge,
        previousGenderPreference: state.lastKnownGenderPreference,
        newMinAge: minAge,
        newMaxAge: maxAge,
        newGenderPreference: genderPreference,
      });
    } else {
      logger.debug("[discoverPreferences] Filters unchanged");
    }

    set({
      lastKnownMinAge: minAge,
      lastKnownMaxAge: maxAge,
      lastKnownGenderPreference: genderPreference,
    });
  },

  hardFiltersChanged: (minAge, maxAge, genderPreference) => {
    const state = get();

    const minAgeChanged = state.lastKnownMinAge !== minAge;
    const maxAgeChanged = state.lastKnownMaxAge !== maxAge;
    const genderPrefChanged = !genderPrefsEqual(
      state.lastKnownGenderPreference,
      genderPreference
    );

    const hasChanged = minAgeChanged || maxAgeChanged || genderPrefChanged;

    if (hasChanged) {
      logger.debug("[discoverPreferences] Hard filter change detected", {
        minAgeChanged,
        maxAgeChanged,
        genderPrefChanged,
        previousMinAge: state.lastKnownMinAge,
        previousMaxAge: state.lastKnownMaxAge,
        previousGenderPreference: state.lastKnownGenderPreference,
        currentMinAge: minAge,
        currentMaxAge: maxAge,
        currentGenderPreference: genderPreference,
      });
    }

    return hasChanged;
  },
}));
