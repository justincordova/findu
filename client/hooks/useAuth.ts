import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import * as AuthService from "@/services/authService";

export function useAuth() {
  const { userId, email, token, isLoggedIn, isLoading } = useAuthStore();

  // On mount, restore session and auto-refresh if needed
  useEffect(() => {
    async function initAuth() {
      await AuthService.restoreSession();
      await AuthService.autoRefreshIfNeeded();
    }
    initAuth();
  }, []);

  return {
    userId,
    email,
    token,
    isLoggedIn,
    isLoading,

    login: AuthService.login,
    logout: AuthService.logout,
    restoreSession: AuthService.restoreSession,
    refreshSession: AuthService.refreshSession,
    signup: AuthService.signup,
    verifyOTP: AuthService.verifyOTP,
    autoRefreshIfNeeded: AuthService.autoRefreshIfNeeded,
  };
}
