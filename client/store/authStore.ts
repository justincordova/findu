import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "@/services/authService";
import _log from "@/utils/logger";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User, session: Session) => Promise<void>;
  updateSession: (session: Session | null) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoggedIn: false,
  isLoading: true,

  login: async (user, session) => {
    await authService.setSession(session);
    set({
      user,
      session,
      isLoggedIn: true,
      isLoading: false,
    });
    _log.info("User logged in:", { user, session });
  },

  updateSession: async (session) => {
    await authService.setSession(session);
    set({
      session,
      user: session?.user || null,
      isLoggedIn: !!session,
      isLoading: false,
    });
    _log.info("Session updated:", { session });
  },

  logout: async () => {
    await authService.signOut();
    set({
      user: null,
      session: null,
      isLoggedIn: false,
      isLoading: false,
    });
    _log.info("User logged out");
  },

  initialize: async () => {
    try {
      set({ isLoading: true });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Auth initialization timeout")),
          10000
        );
      });

      const initPromise = authService.initializeAuth();
      const { user, session } = await Promise.race([
        initPromise,
        timeoutPromise,
      ]);

      set({
        user,
        session,
        isLoggedIn: !!session,
        isLoading: false,
      });
      _log.info("Auth initialized", { user, session });
    } catch (error) {
      _log.error("Error initializing auth:", error);
      set({ isLoading: false });
    }
  },

  checkAuthStatus: async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        set({
          user: null,
          session: null,
          isLoggedIn: false,
        });
        _log.info("User not authenticated, state cleared");
      } else {
        _log.info("User is authenticated");
      }
    } catch (error) {
      _log.error("Error checking auth status:", error);
    }
  },
}));
