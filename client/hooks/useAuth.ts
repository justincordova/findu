import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import * as AuthService from "@/services/authService";

export function useAuth() {
  const { userId, email, token, isLoggedIn, isLoading } = useAuthStore();

  // On mount, restore session
  useEffect(() => {
    async function initAuth() {
      await AuthService.restoreSession();
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
    signOut: AuthService.signOut,
    restoreSession: AuthService.restoreSession,
    sendOtp: AuthService.sendOtp,
    verifyAndSignup: AuthService.verifyAndSignup,
  };
}