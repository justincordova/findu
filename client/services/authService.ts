import { AuthAPI } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { saveSecureItem, getSecureItem, deleteSecureItem } from "@/storage/secure";
import logger from "@/config/logger";

const ENABLE_AUTH = process.env.EXPO_PUBLIC_ENABLE_AUTH === "true";
const ACCESS_TOKEN_EXPIRY = parseInt(process.env.EXPO_PUBLIC_ACCESS_TOKEN_EXPIRY || "3600"); // seconds
const AUTO_REFRESH_THRESHOLD = parseInt(process.env.EXPO_PUBLIC_AUTO_REFRESH_THRESHOLD || "300"); // seconds
const AUTO_REFRESH_ENABLED = process.env.EXPO_PUBLIC_AUTO_REFRESH_ENABLED === "true";

// ------------------- Helpers -------------------

async function storeToken(token: string, refreshToken?: string) {
  const expiryTime = Date.now() + ACCESS_TOKEN_EXPIRY * 1000;
  await saveSecureItem("accessToken", token);
  await saveSecureItem("accessTokenExpiry", expiryTime.toString());
  if (refreshToken) await saveSecureItem("refreshToken", refreshToken);
}

async function tokenNeedsRefresh() {
  if (!AUTO_REFRESH_ENABLED) return false;
  const expiryStr = await getSecureItem("accessTokenExpiry");
  if (!expiryStr) return false;
  const expiry = parseInt(expiryStr);
  const secondsLeft = (expiry - Date.now()) / 1000;
  return secondsLeft < AUTO_REFRESH_THRESHOLD;
}

export async function autoRefreshIfNeeded() {
  if (!(ENABLE_AUTH && AUTO_REFRESH_ENABLED)) return;

  const refreshToken = await getSecureItem("refreshToken");
  if (!refreshToken) return;

  if (await tokenNeedsRefresh()) {
    logger.info("AuthService: auto-refreshing access token");
    await refreshSession(refreshToken);
  }
}

// ------------------- Auth Methods -------------------

export async function login(email: string, password: string) {
  const { setUserId, setToken, setLoggedIn, setLoading } = useAuthStore.getState();
  setLoading(true);

  try {
    if (!ENABLE_AUTH) {
      setLoggedIn(true);
      return { success: true };
    }

    const res = await AuthAPI.login(email, password);

    if (res?.success && res.session?.access_token && res.user?.id) {
      const token = res.session.access_token;
      await storeToken(token, res.session.refresh_token);

      setUserId(res.user.id);
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

export async function signup(email: string, password: string) {
  const { setLoading } = useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.signup(email, password);

    if (!res?.success) {
      logger.warn("AuthService: signup failed", { error: res?.error });
      return { success: false, error: res?.error || "Signup failed" };
    }

    logger.info("AuthService: signup success", { email });
    return { success: true };
  } catch (err) {
    logger.error("AuthService: signup error", { err });
    return { success: false, error: "Signup failed" };
  } finally {
    setLoading(false);
  }
}

export async function verifyOTP(email: string, otp: string) {
  const { setLoading } = useAuthStore.getState();
  setLoading(true);

  try {
    const res = await AuthAPI.verifyOTP(email, otp);

    if (!res?.success || !res.user?.id) {
      logger.warn("AuthService: verifyOTP failed", { error: res?.error });
      return { success: false, error: res?.error || "OTP verification failed" };
    }

    logger.info("AuthService: OTP verified successfully", { userId: res.user.id });
    return { success: true, userId: res.user.id };
  } catch (err) {
    logger.error("AuthService: verifyOTP error", { err });
    return { success: false, error: "OTP verification failed" };
  } finally {
    setLoading(false);
  }
}


export async function logout() {
  const { token, reset, setLoading } = useAuthStore.getState();
  setLoading(true);

  try {
    if (ENABLE_AUTH && token) {
      await AuthAPI.logout(token);
    }

    await deleteSecureItem("accessToken");
    await deleteSecureItem("accessTokenExpiry");
    await deleteSecureItem("refreshToken");
    // Reset clears isloggedin, userId, token
    reset();

    logger.info("AuthService: logout success");
  } catch (err) {
    logger.error("AuthService: logout error", { err });
  } finally {
    setLoading(false);
  }
}

export async function restoreSession() {
  const { setUserId, setToken, setLoggedIn, setLoading, reset } = useAuthStore.getState();
  setLoading(true);

  try {
    const token = await getSecureItem("accessToken");
    if (!token) {
      logger.info("AuthService: no token found");
      return;
    }

    if (!ENABLE_AUTH) {
      setToken(token);
      setLoggedIn(true);
      logger.info("AuthService: ENABLE_AUTH=false, restored session");
      return;
    }

    const res = await AuthAPI.getCurrentUser(token);
    if (res?.success && res.user?.id) {
      setUserId(res.user.id);
      setToken(token);
      setLoggedIn(true);
      logger.info("AuthService: session restored", { userId: res.user.id });
    } else {
      await deleteSecureItem("accessToken");
      await deleteSecureItem("accessTokenExpiry");
      await deleteSecureItem("refreshToken");
      reset();
      logger.warn("AuthService: invalid/expired token; cleared");
    }
  } catch (err) {
    logger.error("AuthService: restore session error", { err });
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
      const token = res.session.access_token;
      await storeToken(token, res.session.refresh_token);
      setToken(token);
      setLoggedIn(true);
      logger.info("AuthService: session refreshed");
    } else {
      logger.warn("AuthService: refresh failed", { error: res?.error });
    }
  } catch (err) {
    logger.error("AuthService: refresh error", { err });
  } finally {
    setLoading(false);
  }
}
