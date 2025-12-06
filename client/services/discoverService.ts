import { DiscoverAPI } from "@/api/discover";
import { useAuthStore } from "@/store/authStore";
import logger from "@/config/logger";

/**
 * Fetch discover feed with paginated profiles
 * Returns profiles ranked by compatibility score based on user preferences
 * @param {number} limit - Number of profiles to fetch (default: 10)
 * @param {number} offset - Number of profiles to skip for pagination (default: 0)
 * @returns {Promise<{success: boolean; data?: any; error?: string}>} Feed result with profile data or error
 */
export async function getDiscoverFeed(
  limit: number = 10,
  offset: number = 0
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { token } = useAuthStore.getState();
  if (!token) {
    logger.warn("Not authenticated for discover feed");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const data = await DiscoverAPI.getFeed(token, limit, offset);
    logger.info("Discover feed fetched", { limit, offset, count: data?.profiles?.length });
    return { success: true, data };
  } catch (err) {
    logger.error("Failed to fetch discover feed", { err });
    return { success: false, error: "Failed to fetch discover feed" };
  }
}
