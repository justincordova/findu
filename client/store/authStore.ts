import { create } from "zustand";
import { User } from "../types/User";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  refreshTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
  login: (user, accessToken, refreshToken) =>
    set({
      user,
      isLoggedIn: true,
      accessToken,
      refreshToken,
    }),
  refreshTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
    }),
  logout: () =>
    set({
      user: null,
      isLoggedIn: false,
      accessToken: null,
      refreshToken: null,
    }),
}));
