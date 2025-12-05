import { create } from "zustand";
import logger from "@/config/logger";
import { ConstantsAPI, Constants } from "@/api/constants";

interface ConstantsState {
  constants: Constants | null;
  isLoading: boolean;
  error: string | null;
  fetchConstants: () => Promise<void>;
  reset: () => void;
}

export const useConstantsStore = create<ConstantsState>((set, get) => {
  const logAndSet = (partial: Partial<ConstantsState>) => {
    const nextState = { ...get(), ...partial };
    logger.debug("ConstantsStore: update", {
      hasConstants: nextState.constants !== null,
      isLoading: nextState.isLoading,
      error: nextState.error,
    });
    set(partial);
  };

  return {
    constants: null,
    isLoading: false,
    error: null,

    fetchConstants: async () => {
      logAndSet({ isLoading: true, error: null });
      try {
        const constants = await ConstantsAPI.getAll();
        logAndSet({ constants, isLoading: false });
      } catch (error: any) {
        const errorMessage = "Failed to load constants";
        logger.error("ConstantsStore: fetch failed", error);
        logAndSet({ error: errorMessage, isLoading: false });
      }
    },

    reset: () =>
      logAndSet({ constants: null, isLoading: false, error: null }),
  };
});
