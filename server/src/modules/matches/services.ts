import prisma from "@/lib/prismaClient";

/**
 * Creates a new match between two users.
 *
 * @param user1 - First user's ID.
 * @param user2 - Second user's ID.
 * @returns The created match with profiles included.
 */
export const createMatch = async (user1: string, user2: string) => {
  return prisma.matches.create({
    data: {
      user1,
      user2,
      matched_at: new Date(),
    },
    include: {
      users_matches_user1Tousers: { include: { profiles: true } },
      users_matches_user2Tousers: { include: { profiles: true } },
    },
  });
};

/**
 * Retrieves all matches for a given user, including related profiles and chats.
 *
 * @param userId - The ID of the user whose matches should be retrieved.
 * @returns List of matches sorted by most recent.
 */
export const getMatches = async (userId: string) => {
  return prisma.matches.findMany({
    where: {
      OR: [{ user1: userId }, { user2: userId }],
    },
    include: {
      users_matches_user1Tousers: { include: { profiles: true } },
      users_matches_user2Tousers: { include: { profiles: true } },
      chats: true,
    },
    orderBy: { matched_at: "desc" },
  });
};

/**
 * Retrieves a single match by ID, including user profiles and chats.
 *
 * @param matchId - The ID of the match to retrieve.
 * @returns The match or null if not found.
 */
export const getMatchById = async (matchId: string) => {
  return prisma.matches.findUnique({
    where: { id: matchId },
    include: {
      users_matches_user1Tousers: { include: { profiles: true } },
      users_matches_user2Tousers: { include: { profiles: true } },
      chats: true,
    },
  });
};

/**
 * Deletes a match by ID.
 *
 * @param matchId - The ID of the match to delete.
 * @returns The deleted match record.
 */
export const deleteMatch = async (matchId: string) => {
  return prisma.matches.delete({
    where: { id: matchId },
  });
};
