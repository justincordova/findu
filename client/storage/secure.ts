import * as SecureStore from "expo-secure-store";
import logger from "@/config/logger";

const ENABLE_PERSISTENCE = process.env.EXPO_PUBLIC_ENABLE_PERSISTENCE !== "false";

/**
 * Save a secure item (e.g., authentication token)
 * Uses device native secure storage; respects persistence configuration
 * @param {string} key - Storage key
 * @param {string} value - Value to store
 * @returns {Promise<void>}
 * @throws {Error} If SecureStore operation fails
 */
export async function saveSecureItem(key: string, value: string): Promise<void> {
  if (!ENABLE_PERSISTENCE) {
    logger.debug("SecureStore persistence disabled; skipping save", { key });
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
    logger.debug("Saving to SecureStore", { key });
  } catch (e) {
    logger.error(`SecureStore: save failed for ${key}`, { e });
    throw e;
  }
}

/**
 * Retrieve a secure item from device native storage
 * Returns null if not found or if persistence is disabled
 * @param {string} key - Storage key
 * @returns {Promise<string | null>} Stored value or null if not found
 */
export async function getSecureItem(key: string): Promise<string | null> {
  if (!ENABLE_PERSISTENCE) {
    logger.debug("SecureStore persistence disabled; skipping get", { key });
    return null;
  }
  try {
    const value = await SecureStore.getItemAsync(key);
    logger.debug("Retrieving from SecureStore", { key, exists: !!value });
    return value;
  } catch (e) {
    logger.error(`SecureStore: read failed for ${key}`, { e });
    return null;
  }
}

/**
 * Delete a secure item from device native storage
 * Silently fails if key doesn't exist or persistence is disabled
 * @param {string} key - Storage key to delete
 * @returns {Promise<void>}
 */
export async function deleteSecureItem(key: string): Promise<void> {
  if (!ENABLE_PERSISTENCE) {
    logger.debug("SecureStore persistence disabled; skipping delete", { key });
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
    logger.debug("Deleted from SecureStore", { key });
  } catch (e) {
    logger.error(`SecureStore: delete failed for ${key}`, { e });
  }
}