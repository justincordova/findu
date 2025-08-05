import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { authService } from "../services/authService";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  login: (user: User, session: Session) => void;
  updateSession: (session: Session | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoggedIn: false,
  login: (user, session) => {
    authService.setSession(session);
    set({
      user,
      session,
      isLoggedIn: true,
    });
  },
  updateSession: (session) => {
    authService.setSession(session);
    set({
      session,
      user: session?.user || null,
      isLoggedIn: !!session,
    });
  },
  logout: async () => {
    await authService.signOut();
    set({
      user: null,
      session: null,
      isLoggedIn: false,
    });
  },
}));
