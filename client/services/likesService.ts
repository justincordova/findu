import { LikesAPI } from "@/api/likes";
import logger from "@/config/logger";
import { useAuthStore } from "@/store/authStore";

/**
 * Send a like or superlike to another user
 * Checks if action creates a mutual match and logs match events
 * @param {string} toUserId - ID of user to like
 * @param {boolean} isSuperlike - Whether this is a superlike action (default: false)
 * @returns {Promise<{success: boolean; match?: boolean; error?: string}>} Like result with match status
 */
export async function sendLike(
  toUserId: string,
  isSuperlike: boolean = false,
): Promise<{ success: boolean; match?: boolean; error?: string }> {
  const { token } = useAuthStore.getState();
  if (!token) {
    logger.warn("Not authenticated for like action");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const res = await LikesAPI.createLike(token, toUserId, isSuperlike);
    logger.info("Like sent", { toUserId, isSuperlike, match: !!res.matched });
    return { success: true, match: res.matched };
  } catch (err) {
    logger.error("Failed to send like", { err });
    return { success: false, error: "Failed to send like" };
  }
}
