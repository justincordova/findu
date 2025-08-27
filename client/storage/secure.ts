// storage/secure.ts
import * as SecureStore from "expo-secure-store";
import logger from "@/config/logger";

const TOKEN_KEY = "auth_token";
const ENABLE_PERSISTENCE = process.env.EXPO_PUBLIC_ENABLE_PERSISTENCE !== "false";

export async function saveAuthToken(token: string) {
  if (!ENABLE_PERSISTENCE) {
    logger.info("SecureStore: persistence disabled; skipping save");
    return;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    logger.debug("SecureStore: saved token");
  } catch (e) {
    logger.error("SecureStore: save failed", { e });
    throw e;
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (!ENABLE_PERSISTENCE) {
    logger.info("SecureStore: persistence disabled; returning null");
    return null;
  }
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    logger.debug("SecureStore: read token", { exists: !!token });
    return token;
  } catch (e) {
    logger.error("SecureStore: read failed", { e });
    return null;
  }
}

export async function clearAuthToken() {
  if (!ENABLE_PERSISTENCE) {
    logger.info("SecureStore: persistence disabled; skipping clear");
    return;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    logger.debug("SecureStore: cleared token");
  } catch (e) {
    logger.error("SecureStore: clear failed", { e });
  }
}
