import prisma from "@/lib/prismaClient";

interface DiscoverPreferences {
  minAge?: number;
  maxAge?: number;
  gender?: string;
  interests?: string[]; // optional array of interest tags
  limit?: number;
  cursor?: string; // for cursor-based pagination
}

/**
 * Retrieves potential matches for a user based on preferences.
 * Excludes users already liked, matched with, or blocked.
 *
 * @param userId - The ID of the current user
 * @param preferences - Filtering options (age, gender, interests, pagination)
 * @returns Array of potential users with profiles
 */
export const discoverUsers = async (
  userId: string,
  preferences: DiscoverPreferences = {}
) => {
  const { minAge, maxAge, gender, interests, limit = 20, cursor } = preferences;

  // Step 1: Find users already liked or matched
  const liked = await prisma.likes.findMany({
    where: { from_user: userId },
    select: { to_user: true },
  });

  const likedBy = await prisma.likes.findMany({
    where: { to_user: userId },
    select: { from_user: true },
  });

  const matched = await prisma.matches.findMany({
    where: {
      OR: [{ user1: userId }, { user2: userId }],
    },
    select: { user1: true, user2: true },
  });

  const blocked = await prisma.blocks.findMany({
    where: { blocker_id: userId },
    select: { blocked_id: true },
  });

  // Filter out any null values before adding to the Set
  const excludedIds = new Set<string>([
    userId,
    ...liked.map((l) => l.to_user).filter((id): id is string => id !== null),
    ...likedBy.map((l) => l.from_user).filter((id): id is string => id !== null),
    ...matched.flatMap((m) => [m.user1, m.user2]).filter((id): id is string => id !== null),
    ...blocked.map((b) => b.blocked_id).filter((id): id is string => id !== null),
  ]);

  // Step 2: Build filters
  const filters: any = {
    user_id: { notIn: Array.from(excludedIds) },
  };

  if (gender) filters.gender = gender;
  if (minAge !== undefined) filters.min_age = { lte: minAge };
  if (maxAge !== undefined) filters.max_age = { gte: maxAge };
  if (interests && interests.length > 0)
    filters.interests = { hasSome: interests };

  // Step 3: Pagination cursor
  const cursorOption = cursor
    ? { cursor: { user_id: cursor }, skip: 1 }
    : undefined;

  // Step 4: Fetch profiles
  const profiles = await prisma.profiles.findMany({
    where: filters,
    take: limit,
    orderBy: { created_at: "desc" },
    ...cursorOption,
    include: { users: true }, // include user info
  });

  return profiles;
};

/**
 * Retrieves a single profile by user ID.
 *
 * @param userId - The ID of the user
 * @returns Profile with user data or null
 */
export const getProfileByUserId = async (userId: string) => {
  return prisma.profiles.findUnique({
    where: { user_id: userId },
    include: { users: true },
  });
};
