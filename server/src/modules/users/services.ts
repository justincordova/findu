import prisma from "@/lib/prismaClient";
import logger from "@/config/logger";

export interface UserResult {
  success: boolean;
  error?: string;
}

export const UserService = {
  /**
   * Marks a user's profile setup as complete.
   *
   * @param userId - The ID of the user.
   * @returns The result of the update attempt.
   */
  markProfileSetupComplete: async (userId: string): Promise<UserResult> => {
    try {
      // Update the user's profile_setup field to true in public.users
      await prisma.public_users.update({
        where: { id: userId },
        data: { profile_setup: true },
      });

      logger.info("PROFILE_SETUP_MARKED_COMPLETE", { userId });
      return { success: true };
    } catch (error) {
      logger.error("MARK_PROFILE_SETUP_COMPLETE_ERROR", { error, userId });
      return { success: false, error: "Failed to mark profile setup complete" };
    }
  },
};
