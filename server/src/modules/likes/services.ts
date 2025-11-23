import prisma from "@/lib/prismaClient";
import { Like, CreateLikeResult } from "@/types/Like";
import * as MatchesService from "../matches/services";

// Configuration constants
const DAILY_SUPERLIKE_LIMIT = 5; // Adjust based on your business logic

/**
 * Creates a like or superlike from one user to another.
 * Handles automatic matching, validation, and prevents race conditions.
 *
 * @param data - Like object containing from_user, to_user, and optional is_superlike
 * @returns Object with like data, match status, and match ID if applicable
 * @throws Error for validation failures or business rule violations
 */
export const createLike = async (data: Like): Promise<CreateLikeResult> => {
  // Input validation
  if (data.from_user === data.to_user) {
    throw new Error('Users cannot like themselves');
  }

  if (!data.from_user || !data.to_user) {
    throw new Error('Both from_user and to_user are required');
  }

  // Pre-transaction validation to avoid unnecessary DB load
  const [fromProfile, toProfile] = await Promise.all([
    prisma.profiles.findUnique({
      where: { user_id: data.from_user },
      select: { university_id: true, user_id: true }
    }),
    prisma.profiles.findUnique({
      where: { user_id: data.to_user },
      select: { university_id: true, user_id: true }
    }),
  ]);

  if (!fromProfile || !toProfile) {
    throw new Error('User profiles not found');
  }

  // Enforce campus-only matching
  if (fromProfile.university_id !== toProfile.university_id) {
    throw new Error('Users must be from the same university');
  }

  // Check for blocks
  const blocked = await prisma.blocks.findFirst({
    where: {
      OR: [
        { blocker_id: data.from_user, blocked_id: data.to_user },
        { blocker_id: data.to_user, blocked_id: data.from_user },
      ],
    },
  });

  if (blocked) {
    throw new Error('Cannot like blocked user');
  }

  return prisma.$transaction(async (tx) => {
    // Check for existing like to prevent duplicates
    const existingLike = await tx.likes.findFirst({
      where: {
        from_user: data.from_user,
        to_user: data.to_user,
      },
    });

    if (existingLike) {
      throw new Error('Like already exists');
    }

    // Validate superlike limits
    if (data.is_superlike) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const superlikesToday = await tx.likes.count({
        where: {
          from_user: data.from_user,
          is_superlike: true,
          created_at: { gte: today },
        },
      });

      if (superlikesToday >= DAILY_SUPERLIKE_LIMIT) {
        throw new Error(`Daily superlike limit of ${DAILY_SUPERLIKE_LIMIT} reached`);
      }
    }

    // Create the like
    const like = await tx.likes.create({ data });

    // Check for reciprocal like
    const reciprocal = await tx.likes.findFirst({
      where: {
        from_user: data.to_user,
        to_user: data.from_user,
      },
    });

    let matchId: string | null = null;

    // If reciprocal exists, create a match
    if (reciprocal) {
      const match = await MatchesService.createMatch(data.from_user, data.to_user, tx);
      matchId = match.id;
    }

    return {
      like,
      matched: !!reciprocal && !!matchId,
      matchId,
    };
  });
};

/**
 * Retrieves all likes sent by a specific user with profile information.
 *
 * @param userId - ID of the user whose sent likes to retrieve
 * @param limit - Maximum number of likes to return (for pagination)
 * @param offset - Number of likes to skip (for pagination)
 * @returns Array of likes with recipient profile data
 */
export const getSentLikes = async (userId: string, limit: number = 50, offset: number = 0) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return prisma.likes.findMany({
    where: { from_user: userId },
    include: {
      users_likes_to_userTousers: {
        include: {
          profiles: {
            select: {
              name: true,
              avatar_url: true,
              university_id: true,
              bio: true,
              birthdate: true, // For age calculation
            }
          }
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
  });
};

/**
 * Retrieves all likes received by a specific user with sender profile information.
 * Useful for showing "who liked you" features.
 *
 * @param userId - ID of the user whose received likes to retrieve
 * @param limit - Maximum number of likes to return (for pagination)
 * @param offset - Number of likes to skip (for pagination)
 * @returns Array of likes with sender profile data
 */
export const getReceivedLikes = async (userId: string, limit: number = 50, offset: number = 0) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return prisma.likes.findMany({
    where: { to_user: userId },
    include: {
      users_likes_from_userTousers: {
        include: {
          profiles: {
            select: {
              name: true,
              avatar_url: true,
              university_id: true,
              bio: true,
              birthdate: true, // For age calculation
            }
          }
        }
      }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
  });
};

/**
 * Get count of received likes (useful for "X people liked you" counters).
 *
 * @param userId - ID of the user
 * @returns Count of received likes
 */
export const getReceivedLikesCount = async (userId: string): Promise<number> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return prisma.likes.count({
    where: { to_user: userId },
  });
};

/**
 * Get count of today's superlikes for rate limiting.
 *
 * @param userId - ID of the user
 * @returns Count of superlikes sent today
 */
export const getTodaysSuperlikeCount = async (userId: string): Promise<number> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.likes.count({
    where: {
      from_user: userId,
      is_superlike: true,
      created_at: { gte: today },
    },
  });
};

/**
 * Check if user can send a superlike (hasn't reached daily limit).
 *
 * @param userId - ID of the user
 * @returns Boolean indicating if user can send superlike
 */
export const canSendSuperlike = async (userId: string): Promise<boolean> => {
  const count = await getTodaysSuperlikeCount(userId);
  return count < DAILY_SUPERLIKE_LIMIT;
};

/**
 * Check if two users have liked each other (are matched).
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
 * Remove a like (unlike functionality).
 * Note: This doesn't remove matches - you might want separate logic for unmatching.
 *
 * @param likeId - ID of the like to remove
 * @param userId - ID of the user removing the like (for authorization)
 * @returns The deleted like record
 */
export const removeLike = async (likeId: string, userId: string) => {
  if (!likeId || !userId) {
    throw new Error('Like ID and User ID are required');
  }

  // Verify the like belongs to the user
  const like = await prisma.likes.findFirst({
    where: {
      id: likeId,
      from_user: userId,
    },
  });

  if (!like) {
    throw new Error('Like not found or unauthorized');
  }

  return prisma.likes.delete({
    where: { id: likeId },
  });
};

/**
 * Get mutual likes between two users (for debugging/admin purposes).
 *
 * @param user1Id - First user ID
 * @param user2Id - Second user ID
 * @returns Object with both likes if they exist
 */
export const getMutualLikes = async (user1Id: string, user2Id: string) => {
  const [like1, like2] = await Promise.all([
    prisma.likes.findFirst({
      where: { from_user: user1Id, to_user: user2Id },
    }),
    prisma.likes.findFirst({
      where: { from_user: user2Id, to_user: user1Id },
    }),
  ]);

  return {
    user1ToUser2: like1,
    user2ToUser1: like2,
    areMutual: !!like1 && !!like2,
  };
};
