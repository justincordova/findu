import { Prisma } from "@prisma/client";
import prisma from "@/lib/prismaClient";
import { Match, MatchWithProfile } from "@/types/Match";

type PrismaTx = Prisma.TransactionClient;

/**
 * Creates a new match between two users, or returns the existing one.
 *
 * @param user1Id - First user's ID
 * @param user2Id - Second user's ID
 * @param tx - Optional Prisma transaction client
 * @returns Minimal match info: matchId, user1Id, user2Id, matchedAt
 * @throws Error if users are invalid
 */
export const createMatch = async (user1Id: string, user2Id: string, tx?: PrismaTx): Promise<Match> => {
  const prismaClient = tx || prisma;

  if (!user1Id || !user2Id || user1Id === user2Id) {
    throw new Error('Valid user IDs required and users cannot match themselves');
  }

  // Check if match already exists to prevent duplicates
  const existingMatch = await prismaClient.matches.findFirst({
    where: {
      OR: [
        { user1: user1Id, user2: user2Id },
        { user1: user2Id, user2: user1Id },
      ],
    },
  });

  if (existingMatch) {
    return {
      ...existingMatch,
      matched_at: existingMatch.matched_at!,
    };
  }

  const match = await prismaClient.matches.create({
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
 * Returns all matches for a given user with the other user's profile.
 *
 * @param userId - The ID of the user whose matches to retrieve
 * @returns Array of matches with other user's profile info
 */
export const getMatchesForUser = async (userId: string): Promise<MatchWithProfile[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const matches = await prisma.matches.findMany({
    where: {
      OR: [{ user1: userId }, { user2: userId }],
    },
    include: {
      users_matches_user1Tousers: {
        include: {
          profiles: {
            select: { name: true, avatar_url: true }
          }
        }
      },
      users_matches_user2Tousers: {
        include: {
          profiles: {
            select: { name: true, avatar_url: true }
          }
        }
      }
    },
    orderBy: { matched_at: 'desc' },
  });

  return matches.map(match => {
    const isUser1 = match.user1 === userId;
    const otherUser = isUser1 ? match.users_matches_user2Tousers : match.users_matches_user1Tousers;
    const otherProfile = otherUser?.profiles;

    return {
      id: match.id,
      user1: match.user1,
      user2: match.user2,
      matched_at: match.matched_at!,
      otherUser: {
        id: isUser1 ? match.user2 : match.user1,
        name: otherProfile?.name || "Unknown User",
        avatar_url: otherProfile?.avatar_url || "",
      }
    };
  });
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

/**
 * Get a match by its ID.
 * 
 * @param matchId - The ID of the match
 * @returns Match info or null if not found
 */
export const getMatchById = async (matchId: string): Promise<Match | null> => {
  if (!matchId) return null;

  const match = await prisma.matches.findUnique({
    where: { id: matchId },
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