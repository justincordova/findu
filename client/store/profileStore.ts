import { create } from "zustand";
import logger from "../config/logger";
import { Profile } from "@/types/Profile";

interface ProfileSetupState {
  data: Partial<Profile> | null;
  setField: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  reset: () => void;
}

export const useProfileSetupStore = create<ProfileSetupState>((set) => ({
  data: null,

  setField: <K extends keyof Profile>(key: K, value: Profile[K]) => {
    set((state) => {
      const currentData = state.data || {};
      const newData = { ...currentData, [key]: value };
      
      logger.debug(`Store updated: "${key}" =`, value);
      logger.debug("Current state:", newData);

      return { data: newData };
    });
  },

  reset: () => {
    logger.info("Store reset");
    set({ data: null });
  },
}));
