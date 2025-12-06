import { create } from "zustand";
import logger from "@/config/logger";
import { ConstantsAPI, Constants } from "@/api/constants";

/**
 * State shape for profile constants store
 * Manages dropdown values for profile setup (intents, majors, preferences, etc.)
 */
interface ConstantsState {
  constants: Constants | null;
  isLoading: boolean;
  error: string | null;
  fetchConstants: () => Promise<void>;
  reset: () => void;
}

/**
 * Constants state management store
 * Fetches and caches profile constant values from backend
 * Used for profile setup dropdown selections
 */
export const useConstantsStore = create<ConstantsState>((set, get) => {
  /**
   * Helper function that logs state changes and updates store
   * @param {Partial<ConstantsState>} partial - Partial state to merge
   */
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
    // State properties
    constants: null,
    isLoading: false,
    error: null,

    /**
     * Fetch all profile constants from backend
     * Sets loading state and clears previous errors
     * @returns {Promise<void>}
     */
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

    // Action: Reset all constants state
    reset: () =>
      logAndSet({ constants: null, isLoading: false, error: null }),
  };
});
