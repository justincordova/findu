import prisma from "@/lib/prismaClient";

/**
 * Creates a block record.
 * The DB trigger 'on_block_cleanup' will automatically handle
 * deleting mutual likes and matches.
 *
 * @param blockerId - ID of the user blocking
 * @param blockedId - ID of the user being blocked
 * @returns The created block record
 */
export const createBlock = async (blockerId: string, blockedId: string) => {
  if (blockerId === blockedId) {
    throw new Error("Cannot block yourself");
  }

  // Check if already blocked
  const existingBlock = await prisma.blocks.findUnique({
    where: {
      blocker_id_blocked_id: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
    },
  });

  if (existingBlock) {
    return existingBlock;
  }

  return prisma.blocks.create({
    data: {
      blocker_id: blockerId,
      blocked_id: blockedId,
    },
  });
};

/**
 * Removes a block (unblock).
 *
 * @param blockerId - ID of the user unblocking
 * @param blockedId - ID of the user being unblocked
 */
export const unblockUser = async (blockerId: string, blockedId: string) => {
  return prisma.blocks.delete({
    where: {
      blocker_id_blocked_id: {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
    },
  });
};

/**
 * Get list of users blocked by a specific user.
 *
 * @param userId - ID of the user
 * @returns List of blocked users with their profiles
 */
export const getBlockedUsers = async (userId: string) => {
  return prisma.blocks.findMany({
    where: {
      blocker_id: userId,
    },
    include: {
      users_blocks_blocked_idTousers: {
        include: {
          profiles: {
            select: {
              name: true,
              avatar_url: true,
            },
          },
        },
      },
    },
  });
};
