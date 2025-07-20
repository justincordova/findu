import { create } from "zustand";
import { User } from "../types/User"


interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  token: null,
  login: (user, token) => set({ user, isLoggedIn: true, token }),
  logout: () => set({ user: null, isLoggedIn: false, token: null }),
}));
