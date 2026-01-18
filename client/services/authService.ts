import { AuthAPI } from "@/api/auth";
import { setTokenRefreshCallback, getErrorMessage } from "@/api/utils";
import { useAuthStore } from "@/store/authStore";
import { useMatchesStore } from "@/store/matchesStore";
import { useDiscoverPreferencesStore } from "@/store/discoverPreferencesStore";
import { useProfileStore } from "@/store/profileStore";
import {
  saveSecureItem,
  getSecureItem,
  deleteSecureItem,
} from "@/storage/secure";
import logger from "@/config/logger";

const ACCESS_TOKEN_KEY = "accessToken";

// Track session restoration state to prevent race conditions
// When true, indicates that restoreSession is already in progress
let isRestoringSession = false;
let restorationPromise: Promise<void> | null = null;

/**
 * Reset all user-specific stores atomically
 * Called when user logs out to clear all cached user data
 */
function resetAllUserStores() {
  useAuthStore.getState().reset();
  useMatchesStore.getState().stopPolling();
  useDiscoverPreferencesStore.getState().reset();
  useProfileStore.getState().reset();
  logger.debug("All user stores reset");
}

/**
 * Authenticate user with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<{success: boolean; error?: string}>} Login result
 */
export async function login(email: string, password: string) {
  const { setUserId, setEmail, setToken, setLoggedIn, setLoading } =
    useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.signin(email, password);

    if (res?.success && res.token && res.user?.id) {
      const { token, user } = res;
      await saveSecureItem(ACCESS_TOKEN_KEY, token);

      setUserId(user.id);
      setEmail(user.email || email);
      setToken(token);
      setLoggedIn(true);

      logger.info("Login successful", { userId: user.id });
      return { success: true };
    }

    logger.debug("Login failed", { error: res?.error });
    return { success: false, error: res?.error || "Login failed" };
  } catch (err) {
    logger.error("AuthService: login error", { err });
    return { success: false, error: "Login failed" };
  } finally {
    setLoading(false);
  }
}

/**
 * Send OTP to user email for passwordless signup flow
 * @param {string} email - User email address
 * @returns {Promise<{success: boolean; error?: string}>} OTP send result
 */
export async function sendOtp(email: string) {
  const { setLoading, setEmail } = useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.sendOtp(email);

    if (!res?.success) {
      logger.debug("Send OTP failed", { error: res?.error });
      return { success: false, error: res?.error || "Failed to send OTP" };
    }

    setEmail(email);
    logger.info("OTP sent", { email });
    return { success: true };
  } catch (err) {
    logger.error("AuthService: sendOtp error", { err });
    return { success: false, error: "Failed to send OTP" };
  } finally {
    setLoading(false);
  }
}

/**
 * Verify OTP and create new user account
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {string} otp - One-time password
 * @returns {Promise<{success: boolean; error?: string}>} Signup result
 */
export async function verifyAndSignup(
  email: string,
  password: string,
  otp: string
) {
  const { setUserId, setEmail, setToken, setLoggedIn, setLoading } =
    useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.signup(email, password, otp);

    if (res?.success && res.token && res.user?.id) {
      const { token, user } = res;
      await saveSecureItem(ACCESS_TOKEN_KEY, token);

      setUserId(user.id);
      setEmail(user.email || email);
      setToken(token);
      setLoggedIn(true);

      logger.info("Signup successful", { userId: user.id });
      return { success: true };
    }

    logger.debug("Signup failed", { error: res?.error });
    return { success: false, error: res?.error || "Signup failed" };
  } catch (err) {
    logger.error("AuthService: signup error", { err });
    return { success: false, error: "Signup failed" };
  } finally {
    setLoading(false);
  }
}

/**
 * Sign out current user and clear local auth state
 * Calls backend logout if token exists, but clears state regardless
 * Resets all user-specific stores (matches, discover, profile)
 * @returns {Promise<{success: boolean; error?: string}>} Signout result
 */
export async function signOut() {
  const { token, setLoading } = useAuthStore.getState();
  setLoading(true);

  try {
    // Call the backend signout endpoint if we have a token
    if (token) {
      try {
        await AuthAPI.signout(token);
        logger.debug("Signout API call successful");
      } catch (err) {
        // Log but don't fail - the session might already be invalid
        logger.debug("Signout API call failed", { err });
      }
    }

    // Clear secure storage
    await deleteSecureItem(ACCESS_TOKEN_KEY);

    // Reset all user-specific stores atomically
    resetAllUserStores();

    logger.info("Logout successful");
    return { success: true };
  } catch (err) {
    logger.error("AuthService: signout error", { err });
    // Still clear local state even if API call fails
    await deleteSecureItem(ACCESS_TOKEN_KEY);
    resetAllUserStores();
    return { success: false, error: "Signout failed" };
  } finally {
    setLoading(false);
  }
}

/**
 * Refresh the current access token using the refresh endpoint
 * Called when a 401 response is detected on an API call
 * Updates secure storage and auth store with the new token
 * @returns {Promise<boolean>} True if refresh succeeded, false otherwise
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const currentToken = await getSecureItem(ACCESS_TOKEN_KEY);
    if (!currentToken) {
      logger.warn("No token available to refresh");
      return false;
    }

    const res = await AuthAPI.refreshSession(currentToken);

    if (res?.success && res.token && res.user?.id) {
      const { token, user } = res;
      await saveSecureItem(ACCESS_TOKEN_KEY, token);

      const { setToken } = useAuthStore.getState();
      setToken(token);

      logger.info("Token refreshed successfully", { userId: user.id });
      return true;
    }

    logger.warn("Token refresh failed", { error: res?.error });
    return false;
  } catch (err) {
    logger.error("AuthService: token refresh error", { error: getErrorMessage(err) });
    return false;
  }
}

/**
 * Restore user session from secure storage and validate token
 * Called on app startup to check if user is still authenticated
 * Also initializes the token refresh callback for automatic 401 handling
 * Prevents race conditions by deduplicating concurrent calls
 * @returns {Promise<void>}
 */
export async function restoreSession() {
  // If restoration is already in progress, return the existing promise
  if (isRestoringSession && restorationPromise) {
    logger.debug("Session restoration already in progress, returning existing promise");
    return restorationPromise;
  }

  // Create the restoration promise
  restorationPromise = (async () => {
    isRestoringSession = true;
    const { setUserId, setEmail, setToken, setLoggedIn, setLoading, reset } =
      useAuthStore.getState();
    setLoading(true);

    try {
      // Set up the token refresh callback for 401 interceptor
      setTokenRefreshCallback(refreshToken);

      const token = await getSecureItem(ACCESS_TOKEN_KEY);
      if (!token) {
        logger.debug("No token found");
        reset();
        return;
      }

      const res = await AuthAPI.getMe(token);
      const user = res?.user;

      if (user?.id) {
        setUserId(user.id);
        setEmail(user.email || null);
        setToken(token);
        setLoggedIn(true);
        logger.info("Session restored", { userId: user.id });
      } else {
        await deleteSecureItem(ACCESS_TOKEN_KEY);
        reset();
        logger.warn("Invalid or expired token cleared");
      }
    } catch (err) {
      logger.error("AuthService: restore session error", { err });
      reset();
    } finally {
      setLoading(false);
      isRestoringSession = false;
      restorationPromise = null;
    }
  })();

  return restorationPromise;
}
