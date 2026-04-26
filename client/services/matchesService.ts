import { MatchesAPI } from "@/api/matches";
import logger from "@/config/logger";
import { useAuthStore } from "@/store/authStore";

/**
 * Fetch all mutual matches for current user
 * Returns list of users who have mutual likes with the authenticated user
 * @returns {Promise<{success: boolean; data?: any; error?: string}>} Matches result with user list
 */
export async function getMatches(): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  const { token } = useAuthStore.getState();

  if (!token) {
    logger.warn("Not authenticated for matches");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const data = await MatchesAPI.getMatches(token);

    logger.info("Matches fetched", {
      count: data?.matches?.length ?? 0,
    });

    return { success: true, data };
  } catch (err) {
    logger.error("Failed to fetch matches", { err });
    return { success: false, error: "Failed to fetch matches" };
  }
}
