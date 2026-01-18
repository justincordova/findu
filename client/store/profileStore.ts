import { create } from "zustand";
import logger from "../config/logger";
import { Profile } from "@/types/Profile";

/**
 * State shape for profile setup store
 * Extends Profile with display fields for university/campus names
 * Manages profile form data and available campus options during setup
 */
interface ProfileSetupState {
  data: Partial<Profile> & { university_name?: string; campus_name?: string } | null;
  campuses: { label: string; value: string }[];
  setProfileField: <K extends keyof (Profile & { university_name?: string; campus_name?: string })>(
    key: K,
    value: (Profile & { university_name?: string; campus_name?: string })[K]
  ) => void;
  setProfileData: (data: Partial<Profile & { university_name?: string; campus_name?: string }>) => void;
  setCampuses: (campuses: { label: string; value: string }[]) => void;
  reset: () => void;
}

/**
 * Profile setup state management store
 * Manages multi-step profile creation form state
 * Stores partial profile data, campus selections, and display names
 */
export const useProfileSetupStore = create<ProfileSetupState>((set) => ({
  // State properties
  data: null,
  campuses: [],

  /**
   * Update a single profile field by key
   * Logs field changes for debugging
   * @template K - Profile field key type
   * @param {K} key - Field key to update
   * @param {any} value - New field value
   */
  setProfileField: (key, value) => {
    set((state) => {
      const currentData = state.data || {};
      const newData = { ...currentData, [key]: value };
      logger.debug(`Store field updated: "${String(key)}" = ${String(value)}`);
      return { data: newData };
    });
  },

  /**
   * Merge multiple profile fields at once
   * Used when setting multiple fields simultaneously during profile setup
   * @param {Partial<Profile>} data - Partial profile data to merge
   */
  setProfileData: (data) => {
    set((state) => {
      const newData = { ...(state.data || {}), ...data };
      logger.debug("Profile data updated in bulk.");
      logger.debug(`Current state keys: ${Object.keys(newData).join(", ")}`);
      return { data: newData };
    });
  },

  /**
   * Set available campus options for dropdown selection
   * @param {{label: string; value: string}[]} campuses - Campus options with label and value
   */
  setCampuses: (campuses) => {
    set({ campuses });
  },

  /**
   * Reset all profile setup state
   * Called when starting new profile creation or canceling setup
   */
  reset: () => {
    logger.info("Store reset");
    set({ data: null, campuses: [] });
  },
}));
