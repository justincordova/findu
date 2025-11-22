import { AuthAPI } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import {
  saveSecureItem,
  getSecureItem,
  deleteSecureItem,
} from "@/storage/secure";
import logger from "@/config/logger";

const ACCESS_TOKEN_KEY = "accessToken";

export async function login(email: string, password: string) {
  const { setUserId, setEmail, setToken, setLoggedIn, setLoading } =
    useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.signin(email, password);

    if (res?.success && res.token && res.user?.id) {
      const token = res.token;
      await saveSecureItem(ACCESS_TOKEN_KEY, token);

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

export async function signOut() {
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
    reset();
  } finally {
    setLoading(false);
  }
}
