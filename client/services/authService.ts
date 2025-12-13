import { AuthAPI } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import {
  saveSecureItem,
  getSecureItem,
  deleteSecureItem,
} from "@/storage/secure";
import logger from "@/config/logger";

const ACCESS_TOKEN_KEY = "accessToken";

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
 * @returns {Promise<{success: boolean; error?: string}>} Signout result
 */
export async function signOut() {
  const { token, reset, setLoading } = useAuthStore.getState();
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

    // Reset auth store state
    reset();

    logger.info("Logout successful");
    return { success: true };
  } catch (err) {
    logger.error("AuthService: signout error", { err });
    // Still clear local state even if API call fails
    await deleteSecureItem(ACCESS_TOKEN_KEY);
    reset();
    return { success: false, error: "Signout failed" };
  } finally {
    setLoading(false);
  }
}

/**
 * Restore user session from secure storage and validate token
 * Called on app startup to check if user is still authenticated
 * @returns {Promise<void>}
 */
export async function restoreSession() {
  const { setUserId, setEmail, setToken, setLoggedIn, setLoading, reset } =
    useAuthStore.getState();
  setLoading(true);

  try {
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
  }
}
