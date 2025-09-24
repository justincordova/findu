import { create } from "zustand";
import logger from "@/config/logger";
import { AuthState } from "@/types/Auth";

export const useAuthStore = create<AuthState>((set, get) => {
  const logAndSet = (partial: Partial<AuthState>) => {
    const nextState = { ...get(), ...partial };
    const sanitized = { ...nextState, token: nextState.token ? "[REDACTED]" : null };
    logger.debug("AuthStore: update", sanitized);
    set(partial);
  };

  return {
    userId: null,
    email: null, 
    token: null,
    isLoading: false,
    isLoggedIn: false,

    setUserId: (id: string) => logAndSet({ userId: id }),
    setEmail: (email: string | null) => logAndSet({ email }),
    setToken: (token: string | null) => logAndSet({ token }),
    setLoading: (isLoading: boolean) => logAndSet({ isLoading }),
    setLoggedIn: (isLoggedIn: boolean) => logAndSet({ isLoggedIn }),
    reset: () => logAndSet({ userId: null, email: null, token: null, isLoggedIn: false }),
  };
});
