import { LikesAPI } from "@/api/likes";
import { useAuthStore } from "@/store/authStore";
import logger from "@/config/logger";

export async function sendLike(toUserId: string, isSuperlike: boolean = false) {
  const { token, userId } = useAuthStore.getState();
  if (!token || !userId) {
    logger.warn("LikesService: No token or userId found");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const res = await LikesAPI.createLike(token, userId, toUserId, isSuperlike);
    logger.info("LikesService: like sent", { toUserId, isSuperlike, match: !!res.matched });
    return { success: true, match: res.matched };
  } catch (err) {
    logger.error("LikesService: sendLike error", { err });
    return { success: false, error: "Failed to send like" };
  }
}
