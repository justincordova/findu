import { create } from "zustand";
import logger from "../config/logger";
import { Profile } from "@/types/Profile";

// For display purposes of uni name
interface ProfileSetupState {
  data: Partial<Profile> & { university_name?: string; campus_name?: string } | null;
  setProfileField: <K extends keyof (Profile & { university_name?: string; campus_name?: string })>(
    key: K,
    value: (Profile & { university_name?: string; campus_name?: string })[K]
  ) => void;
  setProfileData: (data: Partial<Profile & { university_name?: string; campus_name?: string }>) => void;
  reset: () => void;
}

export const useProfileSetupStore = create<ProfileSetupState>((set) => ({
  data: null,

  setProfileField: (key, value) => {
    set((state) => {
      const currentData = state.data || {};
      const newData = { ...currentData, [key]: value };
      logger.debug(`Store field updated: "${String(key)}" = ${String(value)}`);
      return { data: newData };
    });
  },

  setProfileData: (data) => {
    set((state) => {
      const newData = { ...(state.data || {}), ...data };
      logger.debug("Profile data updated in bulk.");
      logger.debug(`Current state keys: ${Object.keys(newData).join(", ")}`);
      return { data: newData };
    });
  },

  reset: () => {
    logger.info("Store reset");
    set({ data: null });
  },
}));
