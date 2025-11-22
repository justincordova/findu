import { AuthAPI } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import {
  saveSecureItem,
  getSecureItem,
  deleteSecureItem,
} from "@/storage/secure";
import logger from "@/config/logger";

<<<<<<< HEAD
const ENABLE_AUTH = process.env.EXPO_PUBLIC_ENABLE_AUTH === "true";
const ACCESS_TOKEN_EXPIRY = parseInt(
  process.env.EXPO_PUBLIC_ACCESS_TOKEN_EXPIRY || "3600"
); // seconds
const AUTO_REFRESH_THRESHOLD = parseInt(
  process.env.EXPO_PUBLIC_AUTO_REFRESH_THRESHOLD || "300"
); // seconds
const AUTO_REFRESH_ENABLED =
  process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED === "true";
=======
const ACCESS_TOKEN_KEY = "accessToken";
>>>>>>> 22dc5cfc6311268736584268451cfa92ab4d02b7

export async function login(email: string, password: string) {
  const { setUserId, setEmail, setToken, setLoggedIn, setLoading } =
    useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.signin(email, password);

<<<<<<< HEAD
    const res = await AuthAPI.login(email, password);

    if (res?.success && res.session?.access_token && res.user?.id) {
      const { access_token: token, refresh_token } = res.session;
      await storeToken(token, refresh_token);
=======
    if (res?.success && res.token && res.user?.id) {
      const token = res.token;
      await saveSecureItem(ACCESS_TOKEN_KEY, token);
>>>>>>> 22dc5cfc6311268736584268451cfa92ab4d02b7

      setUserId(res.user.id);
      setEmail(res.user.email || email);
      setToken(token);
      setLoggedIn(true);

      logger.info("AuthService: login success", { userId: res.user.id });
      return { success: true };
    }

    logger.warn("AuthService: login failed", { error: res?.error });
    return { success: false, error: res?.error || "Login failed" };
  } catch (err) {
    logger.error("AuthService: login error", { err });
    return { success: false, error: "Login failed" };
  } finally {
    setLoading(false);
  }
}

export async function sendOtp(email: string) {
  const { setLoading, setEmail } = useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.sendOtp(email);

    if (!res?.success) {
      logger.warn("AuthService: sendOtp failed", { error: res?.error });
      return { success: false, error: res?.error || "Failed to send OTP" };
    }

    setEmail(email);
    logger.info("AuthService: sendOtp success", { email });
    return { success: true };
  } catch (err) {
    logger.error("AuthService: sendOtp error", { err });
    return { success: false, error: "Failed to send OTP" };
  } finally {
    setLoading(false);
  }
}

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
      const token = res.token;
      await saveSecureItem(ACCESS_TOKEN_KEY, token);

      setUserId(res.user.id);
      setEmail(res.user.email || email);
      setToken(token);
      setLoggedIn(true);

      logger.info("AuthService: signup success", { userId: res.user.id });
      return { success: true };
    }

    logger.warn("AuthService: signup failed", { error: res?.error });
    return { success: false, error: res?.error || "Signup failed" };
  } catch (err) {
    logger.error("AuthService: signup error", { err });
    return { success: false, error: "Signup failed" };
  } finally {
    setLoading(false);
  }
}

<<<<<<< HEAD
export async function verifyOTP(email: string, otp: string) {
  const { setLoading, setEmail } = useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.verifyOTP(email, otp);

    if (!res?.success || !res.user?.id) {
      logger.warn("AuthService: verifyOTP failed", { error: res?.error });
      return { success: false, error: res?.error || "OTP verification failed" };
    }

    setEmail(res.user.email || email);
    logger.info("AuthService: OTP verified successfully", {
      userId: res.user.id,
    });
    return { success: true, userId: res.user.id };
  } catch (err) {
    logger.error("AuthService: verifyOTP error", { err });
    return { success: false, error: "OTP verification failed" };
  } finally {
    setLoading(false);
  }
}

export async function logout() {
=======
export async function signOut() {
>>>>>>> 22dc5cfc6311268736584268451cfa92ab4d02b7
  const { token, reset, setLoading } = useAuthStore.getState();
  setLoading(true);

  try {
    // Call the backend signout endpoint if we have a token
    if (token) {
      try {
        await AuthAPI.signout(token);
        logger.info("AuthService: signout API call successful");
      } catch (err) {
        // Log but don't fail - the session might already be invalid
        logger.warn("AuthService: signout API call failed", { err });
      }
    }

    // Clear secure storage
    await deleteSecureItem(ACCESS_TOKEN_KEY);

    // Reset auth store state
    reset();

    logger.info("AuthService: signout success");
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

export async function restoreSession() {
  const { setUserId, setEmail, setToken, setLoggedIn, setLoading, reset } =
    useAuthStore.getState();
  setLoading(true);

  try {
    const token = await getSecureItem(ACCESS_TOKEN_KEY);
    if (!token) {
      logger.info("AuthService: no token found");
      reset();
      return;
    }

    const res = await AuthAPI.getMe(token);

    // The session object from better-auth is nested.
    const user = res?.user; // Access user directly

    if (user?.id) {
      setUserId(user.id);
      setEmail(user.email || null);
      setToken(token); // Use the existing token, as getMe doesn't return a new one directly
      setLoggedIn(true);
      logger.info("AuthService: session restored", { userId: user.id });
    } else {
      await deleteSecureItem(ACCESS_TOKEN_KEY);
      reset();
      logger.warn("AuthService: invalid/expired token; cleared");
    }
  } catch (err) {
    logger.error("AuthService: restore session error", { err });
<<<<<<< HEAD
  } finally {
    setLoading(false);
  }
}

export async function refreshSession(refreshToken: string) {
  const { setToken, setLoggedIn, setLoading } = useAuthStore.getState();
  if (!ENABLE_AUTH) return;

  setLoading(true);
  try {
    const res = await AuthAPI.refreshSession(refreshToken);
    if (res?.success && res.session?.access_token) {
      const { access_token: token, refresh_token } = res.session;
      await storeToken(token, refresh_token);
      setToken(token);
      setLoggedIn(true);
      logger.info("AuthService: session refreshed");
    } else {
      logger.warn("AuthService: refresh failed", { error: res?.error });
    }
  } catch (err) {
    logger.error("AuthService: refresh error", { err });
=======
    reset();
>>>>>>> 22dc5cfc6311268736584268451cfa92ab4d02b7
  } finally {
    setLoading(false);
  }
}
