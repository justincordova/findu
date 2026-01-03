import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "@/config/logger";
import { ConstantsAPI, Constants } from "@/api/constants";
import { FALLBACK_CONSTANTS } from "@/constants/fallbackConstants";

const CONSTANTS_CACHE_KEY = "findu_constants_cache";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * State shape for profile constants store
 * Manages dropdown values for profile setup (intents, majors, preferences, etc.)
 */
interface ConstantsState {
  constants: Constants | null;
  isLoading: boolean;
  error: string | null;
  fetchConstants: () => Promise<void>;
  loadCachedConstants: () => Promise<void>;
  reset: () => void;
}

/**
 * Constants state management store
 * Fetches and caches profile constant values from backend
 * Falls back to cached or fallback constants when server is unavailable
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

  /**
   * Save constants to AsyncStorage cache
   * @param {Constants} constants - Constants to cache
   */
  const saveToCache = async (constants: Constants) => {
    try {
      await AsyncStorage.setItem(CONSTANTS_CACHE_KEY, JSON.stringify(constants));
      logger.debug("ConstantsStore: saved to cache");
    } catch (error) {
      logger.error("ConstantsStore: cache write failed", error);
    }
  };

  /**
   * Validate that cached Constants have required structure
   * @param {unknown} data - Data to validate
   * @returns {boolean} True if data is valid Constants shape
   */
  const validateConstantsStructure = (data: unknown): data is Constants => {
    if (!data || typeof data !== "object") return false;
    const obj = data as Record<string, unknown>;
    // Check for required top-level properties (all should be arrays)
    return (
      Array.isArray(obj.intents) &&
      Array.isArray(obj.majors) &&
      Array.isArray(obj.genderPreferences) &&
      Array.isArray(obj.sexualOrientations) &&
      Array.isArray(obj.pronouns) &&
      Array.isArray(obj.lifestyleOptions)
    );
  };

  /**
   * Load constants from AsyncStorage cache
   * @returns {Promise<Constants | null>} Cached constants or null
   */
  const loadFromCache = async (): Promise<Constants | null> => {
    try {
      const cached = await AsyncStorage.getItem(CONSTANTS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Validate structure to ensure cache is compatible with current app version
        if (validateConstantsStructure(parsed)) {
          logger.debug("ConstantsStore: loaded from cache");
          return parsed;
        }
        logger.warn("ConstantsStore: cached data has invalid structure, discarding");
      }
    } catch (error) {
      logger.error("ConstantsStore: cache read failed", error);
    }
    return null;
  };

  /**
   * Retry fetch with exponential backoff
   * @param {number} attempt - Current attempt number (1-indexed)
   * @returns {Promise<Constants>} Fetched constants
   */
  const fetchWithRetry = async (attempt: number = 1): Promise<Constants> => {
    try {
      return await ConstantsAPI.getAll();
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        logger.debug(`ConstantsStore: retry ${attempt}/${MAX_RETRIES} after ${delay}ms`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  };

  return {
    // State properties
    constants: null,
    isLoading: false,
    error: null,

    /**
     * Load cached constants from AsyncStorage
     * Used during app startup to quickly show cached data
     * @returns {Promise<void>}
     */
    loadCachedConstants: async () => {
      try {
        const cached = await loadFromCache();
        if (cached) {
          logAndSet({ constants: cached });
        }
      } catch (error) {
        logger.error("ConstantsStore: loadCachedConstants failed", error);
      }
    },

    /**
     * Fetch constants with retry logic and caching
     * Falls back to cached constants if server fetch fails
     * Falls back to fallback constants as last resort
     * @returns {Promise<void>}
     */
    fetchConstants: async () => {
      logAndSet({ isLoading: true, error: null });
      try {
        const constants = await fetchWithRetry();
        await saveToCache(constants);
        logAndSet({ constants, isLoading: false });
      } catch (error: any) {
        logger.error("ConstantsStore: fetch failed after retries", error);

        // Try to use cached constants
        const cached = await loadFromCache();
        if (cached) {
          logger.info("ConstantsStore: using cached constants");
          logAndSet({ constants: cached, isLoading: false });
          return;
        }

        // Fall back to hardcoded constants
        logger.info("ConstantsStore: using fallback constants");
        logAndSet({ constants: FALLBACK_CONSTANTS, isLoading: false });
      }
    },

    // Action: Reset all constants state
    reset: () =>
      logAndSet({ constants: null, isLoading: false, error: null }),
  };
});
