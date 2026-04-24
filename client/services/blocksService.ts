import { BlocksAPI } from "@/api/blocks";
import logger from "@/config/logger";
import { useAuthStore } from "@/store/authStore";

/**
 * Block a user
 * Prevents the blocked user from appearing in discover feed and removes existing matches
 * @param {string} blockedUserId - ID of user to block
 * @returns {Promise<{success: boolean; error?: string}>} Block result
 */
export async function blockUser(
  blockedUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const { token } = useAuthStore.getState();
  if (!token) {
    logger.warn("Not authenticated for block action");
    return { success: false, error: "Not authenticated" };
  }

  try {
    await BlocksAPI.blockUser(token, blockedUserId);
    logger.info("User blocked", { blockedUserId });
    return { success: true };
  } catch (err) {
    logger.error("Failed to block user", { err });
    return { success: false, error: "Failed to block user" };
  }
}

/**
 * Unblock a user
 * Allows the unblocked user to appear in discover feed again
 * @param {string} blockedUserId - ID of user to unblock
 * @returns {Promise<{success: boolean; error?: string}>} Unblock result
 */
export async function unblockUser(
  blockedUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const { token } = useAuthStore.getState();
  if (!token) {
    logger.warn("Not authenticated for unblock action");
    return { success: false, error: "Not authenticated" };
  }

  try {
    await BlocksAPI.unblockUser(token, blockedUserId);
    logger.info("User unblocked", { blockedUserId });
    return { success: true };
  } catch (err) {
    logger.error("Failed to unblock user", { err });
    return { success: false, error: "Failed to unblock user" };
  }
}
