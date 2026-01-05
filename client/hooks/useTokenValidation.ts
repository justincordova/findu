import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import * as AuthService from "@/services/authService";
import logger from "@/config/logger";

/**
 * Hook for validating token on protected screens
 * Validates the current token on mount and redirects to auth if invalid
 * Prevents access to protected screens with expired or missing tokens
 *
 * Usage: Call this hook in any protected screen/layout to ensure token validity
 */
export function useTokenValidation(): void {
  const router = useRouter();
  const { token, isLoggedIn } = useAuthStore();
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    async function validateToken() {
      // Only validate once per component mount to prevent infinite loops
      if (hasValidatedRef.current) {
        return;
      }
      hasValidatedRef.current = true;

      // If not logged in, let navigation handle the redirect
      if (!isLoggedIn || !token) {
        logger.debug("Token validation: user not logged in");
        return;
      }

      // Validate token by fetching user session
      try {
        const { AuthAPI } = await import("@/api/auth");
        const res = await AuthAPI.getMe(token);

        if (!res?.user?.id) {
          logger.warn("Token validation failed: invalid session");
          // Token is invalid, clear it and redirect to auth
          await AuthService.signOut();
          router.replace("/auth");
        } else {
          logger.debug("Token validation: valid session");
        }
      } catch (error) {
        logger.error("Token validation error", { error });
        // On error, try to refresh token once
        const refreshed = await AuthService.refreshToken();
        if (!refreshed) {
          // Refresh failed, logout and redirect
          await AuthService.signOut();
          router.replace("/auth");
        }
      }
    }

    validateToken();
  }, [token, isLoggedIn, router]);
}
