import { create } from "zustand";
import logger from "@/config/logger";
import { getMatches } from "@/services/matchesService";

export interface MatchItem {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string;
  };
  matched_at: string;
}

interface MatchesState {
  matches: MatchItem[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  pollingIntervalId: ReturnType<typeof setInterval> | null;

  // Actions
  fetchMatches: () => Promise<void>;
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
  removeMatch: (matchId: string) => void;
  reset: () => void;
}

const POLLING_INTERVAL_MS = 30000; // 30 seconds - silent polling

export const useMatchesStore = create<MatchesState>((set, get) => {
  const logAndSet = (partial: Partial<MatchesState>) => {
    const nextState = { ...get(), ...partial };
    logger.debug("MatchesStore: update", {
      matchCount: nextState.matches.length,
      isLoading: nextState.isLoading,
      error: nextState.error,
    });
    set(partial);
  };

  return {
    // State
    matches: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    pollingIntervalId: null,

    // Fetch matches from server
    fetchMatches: async () => {
      const state = get();

      // If already loading, don't start another request
      if (state.isLoading) return;

      logAndSet({ isLoading: true, error: null });

      try {
        const res = await getMatches();
        if (res.success && res.data) {
          logAndSet({
            matches: res.data,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } else {
          logAndSet({
            error: res.error || "Failed to load matches",
            isLoading: false,
          });
          logger.error("MatchesStore: fetch failed", res.error);
        }
      } catch (error) {
        logAndSet({
          error: error instanceof Error ? error.message : "Unknown error",
          isLoading: false,
        });
        logger.error("MatchesStore: fetch error", error);
      }
    },

    // Start silent polling for new matches
    startPolling: (intervalMs = POLLING_INTERVAL_MS) => {
      const state = get();

      // Clear any existing polling interval
      if (state.pollingIntervalId) {
        clearInterval(state.pollingIntervalId);
      }

      // Fetch immediately
      get().fetchMatches();

      // Set up polling interval
      const intervalId = setInterval(() => {
        // Silently poll - only update state, no alerts or UI changes
        get().fetchMatches();
      }, intervalMs);

      logAndSet({ pollingIntervalId: intervalId });
      logger.debug("MatchesStore: polling started", { intervalMs });
    },

    // Stop polling
    stopPolling: () => {
      const state = get();
      if (state.pollingIntervalId) {
        clearInterval(state.pollingIntervalId);
        logAndSet({ pollingIntervalId: null });
        logger.debug("MatchesStore: polling stopped");
      }
    },

    // Remove match from local state (after unmatch/block)
    removeMatch: (matchId: string) => {
      const state = get();
      const updatedMatches = state.matches.filter((m) => m.id !== matchId);
      logAndSet({ matches: updatedMatches });
    },

    // Reset all state
    reset: () => {
      const state = get();
      if (state.pollingIntervalId) {
        clearInterval(state.pollingIntervalId);
      }
      logAndSet({
        matches: [],
        isLoading: false,
        error: null,
        lastFetched: null,
        pollingIntervalId: null,
      });
    },
  };
});
