import prisma from "@/lib/prismaClient";
import { Match } from "@/types/Match";

/**
 * Creates a new match between two users.
 *
 * @param user1Id - First user's ID
 * @param user2Id - Second user's ID
 * @returns Minimal match info: matchId, user1Id, user2Id, matchedAt
 * @throws Error if match already exists or users are invalid
 */
export const createMatch = async (user1Id: string, user2Id: string): Promise<Match> => {
  if (!user1Id || !user2Id || user1Id === user2Id) {
    throw new Error('Valid user IDs required and users cannot match themselves');
  }

  // Check if match already exists to prevent duplicates
  const existingMatch = await prisma.matches.findFirst({
    where: {
      OR: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id },
      ],
    },
  });

  if (existingMatch) {
    throw new Error('Match already exists between these users');
  }

  const match = await prisma.matches.create({
    data: {
      user1: user1Id,
      user2: user2Id,
      matched_at: new Date(),
    },
    select: {
      id: true,
      user1: true,
      user2: true,
      matched_at: true,
    },
  });

  return {
    ...match,
    matched_at: match.matched_at!,
  };
};

/**
 * Returns all matches for a given user.
 * Only returns user IDs + match metadata.
 *
 * @param userId - The ID of the user whose matches to retrieve
 * @returns Array of match info with just user IDs and metadata
 */
export const getMatchesForUser = async (userId: string): Promise<Match[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const matches = await prisma.matches.findMany({
    where: {
      OR: [{ user1: userId }, { user2: userId }],
    },
    select: {
      id: true,
      user1: true,
      user2: true,
      matched_at: true,
    },
    orderBy: { matched_at: 'desc' },
  });

  return matches.map(match => ({
    ...match,
    matched_at: match.matched_at!,
  }));
};

/**
 * Quick check if two users are already matched.
 *
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 * @returns Boolean indicating if users are matched
 */
export const areUsersMatched = async (user1Id: string, user2Id: string): Promise<boolean> => {
  if (!user1Id || !user2Id || user1Id === user2Id) {
    return false;
  }

  const match = await prisma.matches.findFirst({
    where: {
      OR: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id },
      ],
    },
  });

  return !!match;
};

/**
 * Removes a match record from the DB.
 *
 * @param matchId - The ID of the match to delete
 * @returns void
 */
export const deleteMatch = async (matchId: string): Promise<void> => {
  if (!matchId) {
    throw new Error('Match ID is required');
  }

  await prisma.matches.delete({
    where: { id: matchId },
  });
};

/**
 * Returns match info if two users are mutually matched.
 * Useful for admin or debugging.
 *
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 * @returns Match info or null if not matched
 */
export const getMutualMatch = async (user1Id: string, user2Id: string): Promise<Match | null> => {
  if (!user1Id || !user2Id || user1Id === user2Id) {
    return null;
  }

  const match = await prisma.matches.findFirst({
    where: {
      OR: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id },
      ],
    },
    select: {
      id: true,
      user1: true,
      user2: true,
      matched_at: true,
    },
  });

  if (!match) return null;

  return {
    ...match,
    matched_at: match.matched_at!,
  };
};