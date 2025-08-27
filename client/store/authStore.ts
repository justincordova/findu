import { create } from "zustand";
import logger from "@/config/logger";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Log all current state plus updates
  const logAndSet = (partial: Partial<AuthState>) => {
    const nextState = { ...get(), ...partial };

    // Sanitize token
    const sanitized = {
      ...nextState,
      token: nextState.token ? "[REDACTED]" : null,
    };

    logger.debug("AuthStore: update", sanitized);
    set(partial);
  };

  return {
    user: null,
    token: null,
    isLoading: false,
    isLoggedIn: false,

    setUser: (user) => logAndSet({ user }),
    setToken: (token) => logAndSet({ token }),
    setLoading: (isLoading) => logAndSet({ isLoading }),
    setLoggedIn: (isLoggedIn) => logAndSet({ isLoggedIn }),
    reset: () => logAndSet({ user: null, token: null, isLoggedIn: false }),
  };
});
