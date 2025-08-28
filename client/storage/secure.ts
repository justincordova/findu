import * as SecureStore from "expo-secure-store";
import logger from "@/config/logger";

const ENABLE_PERSISTENCE = process.env.EXPO_PUBLIC_ENABLE_PERSISTENCE !== "false";

//Save a value under a given key
export async function saveSecureItem(key: string, value: string) {
  if (!ENABLE_PERSISTENCE) {
    logger.info(`SecureStore: persistence disabled; skipping save for ${key}`);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
    logger.debug(`SecureStore: saved key ${key}`);
  } catch (e) {
    logger.error(`SecureStore: save failed for ${key}`, { e });
    throw e;
  }
}

//Retrieve a value by key
export async function getSecureItem(key: string): Promise<string | null> {
  if (!ENABLE_PERSISTENCE) {
    logger.info(`SecureStore: persistence disabled; returning null for ${key}`);
    return null;
  }
  try {
    const value = await SecureStore.getItemAsync(key);
    logger.debug(`SecureStore: read key ${key}`, { exists: !!value });
    return value;
  } catch (e) {
    logger.error(`SecureStore: read failed for ${key}`, { e });
    return null;
  }
}

//Delete a value by key
export async function deleteSecureItem(key: string) {
  if (!ENABLE_PERSISTENCE) {
    logger.info(`SecureStore: persistence disabled; skipping delete for ${key}`);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
    logger.debug(`SecureStore: deleted key ${key}`);
  } catch (e) {
    logger.error(`SecureStore: delete failed for ${key}`, { e });
  }
}