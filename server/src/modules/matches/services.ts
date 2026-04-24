import type { Prisma } from "@/generated/prisma/client";
import logger from "@/config/logger";
import prisma from "@/lib/prismaClient";
import { redis } from "@/lib/redis";
import type { Match, MatchWithProfile } from "@/types/Match";

type PrismaTx = Prisma.TransactionClient;

/**
 * Invalidate discover feed cache for a user
 * Called when matches are created/deleted to ensure fresh results
 * Uses SCAN to iterate through all matching keys and delete them
 * @param userId - User ID whose cache should be invalidated
 */
const invalidateDiscoverCache = async (userId: string): Promise<void> => {
  try {
    const pattern = `discover:${userId}:*`;
    let cursor = "0";
    let totalDeleted = 0;

    // Iterate through all batches using SCAN cursor
    do {
      const result = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = result[0]; // Next cursor
      const keys = result[1]; // Keys in this batch

      if (keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== "0");

    if (totalDeleted > 0) {
      logger.debug("CACHE_INVALIDATED", { userId, keysDeleted: totalDeleted });
    }
  } catch (error) {
    // Log but don't throw - cache invalidation failure shouldn't break the operation
    logger.error("CACHE_INVALIDATION_FAILED", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Creates a new match between two users, or returns the existing one.
 *
 * @param user1Id - First user's ID
 * @param user2Id - Second user's ID
 * @param tx - Optional Prisma transaction client
 * @returns Minimal match info: matchId, user1Id, user2Id, matchedAt
 * @throws Error if users are invalid
 */
export const createMatch = async (
  user1Id: string,
  user2Id: string,
  tx?: PrismaTx,
): Promise<Match> => {
  const prismaClient = tx || prisma;

  if (!user1Id || !user2Id || user1Id === user2Id) {
    throw new Error(
      "Valid user IDs required and users cannot match themselves",
    );
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
      matched_at: existingMatch.matched_at as Date,
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
    matched_at: match.matched_at as Date,
  };
};

/**
 * Returns all matches for a given user with the other user's profile.
 *
 * @param userId - The ID of the user whose matches to retrieve
 * @returns Array of matches with other user's profile info
 */
export const getMatchesForUser = async (
  userId: string,
): Promise<MatchWithProfile[]> => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const matches = await prisma.matches.findMany({
    where: {
      OR: [{ user1: userId }, { user2: userId }],
    },
    include: {
      users_matches_user1Tousers: {
        include: {
          profiles: {
            select: { name: true, avatar_url: true },
          },
        },
      },
      users_matches_user2Tousers: {
        include: {
          profiles: {
            select: { name: true, avatar_url: true },
          },
        },
      },
    },
    orderBy: { matched_at: "desc" },
  });

  return matches.map((match) => {
    const isUser1 = match.user1 === userId;
    const otherUser = isUser1
      ? match.users_matches_user2Tousers
      : match.users_matches_user1Tousers;
    const otherProfile = otherUser?.profiles;

    return {
      id: match.id,
      user1: match.user1,
      user2: match.user2,
      matched_at: match.matched_at as Date,
      otherUser: {
        id: isUser1 ? match.user2 : match.user1,
        name: otherProfile?.name || "Unknown User",
        avatar_url: otherProfile?.avatar_url || "",
      },
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
export const areUsersMatched = async (
  user1Id: string,
  user2Id: string,
): Promise<boolean> => {
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
    throw new Error("Match ID is required");
  }

  // Fetch the match to get both user IDs before deletion
  const match = await prisma.matches.findUnique({
    where: { id: matchId },
    select: { user1: true, user2: true },
  });

  if (!match) {
    throw new Error("Match not found");
  }

  await prisma.matches.delete({
    where: { id: matchId },
  });

  // Invalidate discover cache for both users
  await Promise.all([
    invalidateDiscoverCache(match.user1),
    invalidateDiscoverCache(match.user2),
  ]);
};

/**
 * Returns match info if two users are mutually matched.
 * Useful for admin or debugging.
 *
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 * @returns Match info or null if not matched
 */
export const getMutualMatch = async (
  user1Id: string,
  user2Id: string,
): Promise<Match | null> => {
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
    matched_at: match.matched_at as Date,
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
    matched_at: match.matched_at as Date,
  };
};
