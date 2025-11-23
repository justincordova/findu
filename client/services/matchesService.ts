import { MatchesAPI } from "@/api/matches";
import { useAuthStore } from "@/store/authStore";
import logger from "@/config/logger";

export async function getMatches() {
  const { token } = useAuthStore.getState();
  if (!token) {
    logger.warn("MatchesService: No token found");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const data = await MatchesAPI.getMatches(token);
    return { success: true, data };
  } catch (err) {
    logger.error("MatchesService: getMatches error", { err });
    return { success: false, error: "Failed to fetch matches" };
  }
}
