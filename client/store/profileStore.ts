import { create } from "zustand";
import logger from "../config/logger";
import { ProfileSetupData } from "@/types/Profile";

// For display purposes of uni name
interface ProfileSetupState {
  data: Partial<Profile> & { university_name?: string; campus_name?: string } | null;
  setField: <K extends keyof (Profile & { university_name?: string; campus_name?: string })>(
    key: K,
    value: (Profile & { university_name?: string; campus_name?: string })[K]
  ) => void;
  reset: () => void;
}
export const useProfileSetupStore = create<ProfileSetupState>((set) => ({
  data: null,

  setField: <K extends keyof ProfileSetupData>(key: K, value: ProfileSetupData[K]) => {
    set((state) => {
      const currentData = state.data || {};
      const newData = { ...currentData, [key]: value };

      logger.debug(`Store updated: "${key}" = ${String(value)}`);
      logger.debug(`Current state keys: ${Object.keys(newData).join(", ")}`);

      return { data: newData };
    });
  },

  reset: () => {
    logger.info("Store reset");
    set({ data: null });
  },
}));
