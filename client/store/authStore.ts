import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "@/services/authService";

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
  },

  updateSession: async (session) => {
    await authService.setSession(session);
    set({
      session,
      user: session?.user || null,
      isLoggedIn: !!session,
      isLoading: false,
    });
  },

  logout: async () => {
    await authService.signOut();
    set({
      user: null,
      session: null,
      isLoggedIn: false,
      isLoading: false,
    });
  },

  initialize: async () => {
    try {
      set({ isLoading: true });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error("Auth initialization timeout")),
          10000
        ); // 10 second timeout
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
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({ isLoading: false });
    }
  },

  checkAuthStatus: async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated) {
        // Clear state if not authenticated
        set({
          user: null,
          session: null,
          isLoggedIn: false,
        });
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  },
}));
