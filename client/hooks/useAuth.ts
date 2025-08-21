import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { AUTH_CONFIG } from "../config/auth";
import _log from "../utils/logger";

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
      _log.info("useAuth: Initializing auth...");
      initialize().catch((error) => {
        _log.error("useAuth: Failed to initialize auth:", error);
      });
    }
  }, [initialize]);

  // Set up app state change listener for security
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      _log.debug(`useAuth: AppState changed from ${appState.current} to ${nextAppState}`);
      
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        _log.debug("useAuth: App came to foreground, checking auth status...");
        checkAuthStatus();
      } else if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        if (AUTH_CONFIG.SECURITY.CLEAR_ON_BACKGROUND) {
          _log.debug("useAuth: App went to background, sensitive data may be cleared");
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
    if (!session || !AUTH_CONFIG.AUTO_REFRESH.ENABLED) return;

    const setupRefreshTimer = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

      const timeUntilRefresh = Math.max(
        0,
        (session.expires_at || 0) -
          Math.floor(Date.now() / 1000) -
          AUTH_CONFIG.AUTO_REFRESH.THRESHOLD
      );

      if (timeUntilRefresh > 0) {
        refreshTimerRef.current = setTimeout(async () => {
          try {
            _log.debug("useAuth: Refreshing session...");
            const refreshedSession = await authService.refreshSession();
            if (refreshedSession) {
              _log.info("useAuth: Session refreshed successfully");
              updateSession(refreshedSession);
            } else {
              _log.warn("useAuth: Session refresh failed, logging out...");
              logout();
            }
          } catch (error) {
            _log.error("useAuth: Token refresh failed:", error);
            logout();
          }
        }, timeUntilRefresh * 1000);
      }
    };

    setupRefreshTimer();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [session, updateSession, logout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Debug logging for auth state
  useEffect(() => {
    _log.debug("useAuth: State updated", {
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
