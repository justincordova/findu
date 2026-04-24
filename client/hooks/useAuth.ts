import { useEffect } from "react";
import * as AuthService from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

interface UseAuthReturn {
  userId: string | null;
  email: string | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: typeof AuthService.login;
  signOut: typeof AuthService.signOut;
  restoreSession: typeof AuthService.restoreSession;
  sendOtp: typeof AuthService.sendOtp;
  verifyAndSignup: typeof AuthService.verifyAndSignup;
}

/**
 * Hook for managing user authentication and session state
 * Automatically restores session from secure storage on app startup
 * Provides access to auth state and all authentication methods
 */
export function useAuth(): UseAuthReturn {
  const { userId, email, token, isLoggedIn, isLoading } = useAuthStore();

  // On mount, restore session from secure storage
  useEffect(() => {
    async function initAuth() {
      await AuthService.restoreSession();
    }
    initAuth();
  }, []);

  return {
    // State
    userId,
    email,
    token,
    isLoggedIn,
    isLoading,

    // Methods
    login: AuthService.login,
    signOut: AuthService.signOut,
    restoreSession: AuthService.restoreSession,
    sendOtp: AuthService.sendOtp,
    verifyAndSignup: AuthService.verifyAndSignup,
  };
}
