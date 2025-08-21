import { create } from "zustand";
import { ProfileSetupData } from "../types/ProfileSetupData";
import _log from "../utils/logger";

interface ProfileSetupState {
  data: Partial<ProfileSetupData>;
  setField: <K extends keyof ProfileSetupData>(key: K, value: ProfileSetupData[K]) => void;
  reset: () => void;
}

export const useProfileSetupStore = create<ProfileSetupState>((set) => ({
  data: {},
  setField: <K extends keyof ProfileSetupData>(key: K, value: ProfileSetupData[K]) =>
    set((state) => {
      const newData = { ...state.data, [key]: value };

      // Log-friendly version (avoid printing huge arrays like photos)
      const logData = {
        ...newData,
        photos: newData.photos ? `[${newData.photos.length} photos]` : undefined,
      };

      _log.debug(`✅ Store updated: "${key}" =`, value);
      _log.debug("📦 Current state:", logData);

      return { data: newData };
    }),
  reset: () => {
    _log.info("🗑 Store reset");
    return { data: {} };
  },
}));
