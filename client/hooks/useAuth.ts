import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { AUTH_CONFIG } from "../config/auth";

export const useAuth = () => {
  const {
    user,
    session,
    isLoggedIn,
    isLoading,
    login,
    updateSession,
    logout,
    initialize,
    checkAuthStatus,
  } = useAuthStore();

  const appState = useRef(AppState.currentState);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // Initialize auth state on mount (only once)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      console.log("useAuth: Initializing auth...");
      initialize().catch((error) => {
        console.error("useAuth: Failed to initialize auth:", error);
        // Set loading to false even if initialization fails
        // This prevents infinite loading states
      });
    }
  }, [initialize]);

  // Set up app state change listener for security
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground, check auth status
        checkAuthStatus();
      } else if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // App went to background
        if (AUTH_CONFIG.SECURITY.CLEAR_ON_BACKGROUND) {
          // Clear sensitive data when app goes to background
          // This is optional and depends on your security requirements
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [checkAuthStatus]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!session || !AUTH_CONFIG.AUTO_REFRESH.ENABLED) {
      return;
    }

    const setupRefreshTimer = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const timeUntilRefresh = Math.max(
        0,
        (session.expires_at || 0) -
          Math.floor(Date.now() / 1000) -
          AUTH_CONFIG.AUTO_REFRESH.THRESHOLD
      );

      if (timeUntilRefresh > 0) {
        refreshTimerRef.current = setTimeout(async () => {
          try {
            // Attempt to refresh the token
            const refreshedSession = await authService.refreshSession();
            if (refreshedSession) {
              updateSession(refreshedSession);
            } else {
              // Token refresh failed, logout user
              logout();
            }
          } catch (error) {
            console.error("Token refresh failed:", error);
            logout();
          }
        }, timeUntilRefresh * 1000);
      }
    };

    setupRefreshTimer();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [session, updateSession, logout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Debug logging
  useEffect(() => {
    console.log("useAuth: State updated:", {
      isLoggedIn,
      isLoading,
      hasUser: !!user,
      hasSession: !!session,
    });
  }, [isLoggedIn, isLoading, user, session]);

  return {
    user,
    session,
    isLoggedIn,
    isLoading,
    login,
    updateSession,
    logout,
    checkAuthStatus,
  };
};
