import { DiscoverAPI } from "@/api/discover";
import { useAuthStore } from "@/store/authStore";
import logger from "@/config/logger";

export async function getDiscoverFeed(limit: number = 10, offset: number = 0) {
  const { token } = useAuthStore.getState();
  if (!token) {
    logger.warn("DiscoverService: No token found");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const data = await DiscoverAPI.getFeed(token, limit, offset);
    return { success: true, data };
  } catch (err) {
    logger.error("DiscoverService: getFeed error", { err });
    return { success: false, error: "Failed to fetch discover feed" };
  }
}
