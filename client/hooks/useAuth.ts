import { useAuthStore } from "@/store/authStore";
import * as AuthService from "@/services/authService";

export function useAuth() {
  const { user, token, isLoggedIn, isLoading } = useAuthStore();

  return {
    user,
    token,
    isLoggedIn,
    isLoading,

    login: AuthService.login,
    logout: AuthService.logout,
    restoreSession: AuthService.restoreSession,
    refreshSession: AuthService.refreshSession,
    signup: AuthService.signup,
    verifyOTP: AuthService.verifyOTP,
  };
}
