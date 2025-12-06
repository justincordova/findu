import { create } from "zustand";
import logger from "@/config/logger";
import { AuthState } from "@/types/Auth";

/**
 * Authentication state management store
 * Handles user login state, token, and session management
 * Redacts token from logs for security
 */
export const useAuthStore = create<AuthState>((set, get) => {
  /**
   * Helper function that logs state changes and updates store
   * Sanitizes token before logging for security
   * @param {Partial<AuthState>} partial - Partial state to merge
   */
  const logAndSet = (partial: Partial<AuthState>) => {
    const nextState = { ...get(), ...partial };
    const sanitized = { ...nextState, token: nextState.token ? "[REDACTED]" : null };
    logger.debug("AuthStore: update", sanitized);
    set(partial);
  };

  return {
    // State properties
    userId: null,
    email: null,
    token: null,
    isLoading: false,
    isLoggedIn: false,

    // Action: Set current user ID
    setUserId: (id: string) => logAndSet({ userId: id }),

    // Action: Set current user email
    setEmail: (email: string | null) => logAndSet({ email }),

    // Action: Set authentication token (redacted in logs)
    setToken: (token: string | null) => logAndSet({ token }),

    // Action: Set loading state during auth operations
    setLoading: (isLoading: boolean) => logAndSet({ isLoading }),

    // Action: Set login status
    setLoggedIn: (isLoggedIn: boolean) => logAndSet({ isLoggedIn }),

    // Action: Reset all auth state (logout)
    reset: () => logAndSet({ userId: null, email: null, token: null, isLoggedIn: false }),
  };
});
