import prisma from "@/lib/prismaClient";
import logger from "@/config/logger";
import { Profile } from "@/types/Profile";
import {
  ProfileWithScore,
  CompatibilityWeights,
  IntentCompatibilityMatrix
} from "@/types/Discover";
import { differenceInYears, subYears, addDays } from 'date-fns';
import { getInterestCategory } from "@/constants/interests";
import { genderPreferencesToIdentities } from "@/utils/genderMapping";

// Algorithm weights - adjust based on testing/feedback
// Updated: 35% interests, 30% intent, 15% orientation, 10% major, 10% age
const COMPATIBILITY_WEIGHTS: CompatibilityWeights = {
  sharedInterests: 0.35,        // 35% - shared hobbies/interests
  intentCompatibility: 0.30,    // 30% - relationship goals alignment
  orientationCompatibility: 0.15, // 15% - sexual orientation match
  majorCompatibility: 0.10,     // 10% - same major/academic context
  ageCompatibility: 0.10,       // 10% - age alignment
};

/**
 * Utility: Calculate age from birthdate with date-fns precision.
 */
export const calculateAge = (birthdate: Date): number => {
  return differenceInYears(new Date(), birthdate);
};

/**
 * Utility: Get birthdate range for age filtering using date-fns for precision.
 */
const getBirthdateRangeForAge = (minAge: number, maxAge: number) => {
  const today = new Date();
  
  // For max age: person must be born after this date to be younger than maxAge + 1
  // Someone born exactly maxAge years ago is still maxAge until their next birthday
  const maxBirthdate = subYears(today, maxAge + 1);
  const adjustedMaxBirthdate = addDays(maxBirthdate, 1);
  
  // For min age: person must be born on or before this date to be at least minAge
  const minBirthdate = subYears(today, minAge);
  
  return { 
    minBirthdate,           // Latest birth date for minimum age
    maxBirthdate: adjustedMaxBirthdate  // Earliest birth date for maximum age
  };
};

/**
 * Utility: Get shared interests between two arrays.
 */
export const getSharedInterests = (interests1: string[], interests2: string[]): string[] => {
  if (!interests1?.length || !interests2?.length) return [];
  return interests1.filter(interest => interests2.includes(interest));
};

/**
 * Utility: Check if candidate age is within user's preference range.
 */
export const isWithinAgePreference = (
  userAge: number, 
  candidateAge: number, 
  minAge: number, 
  maxAge: number
): boolean => {
  return candidateAge >= minAge && candidateAge <= maxAge;
};


/**
 * Calculate shared interests score based on exact matches and category matches.
 * Exact matches score 1.0 point each.
 * Category matches (when exact match doesn't exist) score 0.5 points.
 * Query-time matching: interests are never normalized; matching logic applied during discovery.
 * Case-insensitive exact matching with category fallback for niche interests.
 *
 * Formula: sharedPoints / max(3, min(len(interests1), len(interests2)))
 * - Minimum denominator of 3 prevents penalizing users with diverse interests
 * - Uses minimum to avoid penalizing breadth; max ensures fair baseline
 */
export const calculateSharedInterestsScore = (interests1: string[], interests2: string[]): number => {
  if (!interests1?.length || !interests2?.length) return 0;

  let sharedPoints = 0;
  const interests2Lower = interests2.map(i => i.toLowerCase());

  // For each interest in interests1, try to find exact match or category match in interests2
  for (const interest1 of interests1) {
    const interest1Lower = interest1.toLowerCase();

    // Try exact match (case-insensitive)
    if (interests2Lower.includes(interest1Lower)) {
      sharedPoints += 1.0;
      continue;
    }

    // Try category match for interests not found exactly
    const category1 = getInterestCategory(interest1);
    const category2Of2 = interests2.find(i => getInterestCategory(i) === category1);

    if (category1 && category2Of2) {
      sharedPoints += 0.5;
    }
  }

  // Normalization: use minimum with floor of 3
  const denominator = Math.max(3, Math.min(interests1.length, interests2.length));
  return sharedPoints / denominator;
};

/**
 * 8x8 Intent Compatibility Matrix
 * Allows cross-intent matching: Dating + Study Buddy = 0.5 (can match, but different intents)
 * Same intent = 1.0; compatible = 0.8; different = 0.5; incompatible = 0.2
 * User autonomy: users decide if they want to like someone with different intent
 */
const INTENT_MATRIX: IntentCompatibilityMatrix = {
  'Dating': {
    'Dating': 1.0,
    'Casual Dating': 0.8,
    'Serious Relationship': 0.8,
    'Friendship': 0.5,
    'Study Buddy': 0.5,
    'Hookup': 0.6,
    'Networking': 0.2,
    'Unsure': 0.6
  },
  'Casual Dating': {
    'Dating': 0.8,
    'Casual Dating': 1.0,
    'Serious Relationship': 0.5,
    'Friendship': 0.5,
    'Study Buddy': 0.4,
    'Hookup': 0.8,
    'Networking': 0.2,
    'Unsure': 0.7
  },
  'Serious Relationship': {
    'Dating': 0.8,
    'Casual Dating': 0.5,
    'Serious Relationship': 1.0,
    'Friendship': 0.4,
    'Study Buddy': 0.3,
    'Hookup': 0.2,
    'Networking': 0.2,
    'Unsure': 0.6
  },
  'Friendship': {
    'Dating': 0.5,
    'Casual Dating': 0.5,
    'Serious Relationship': 0.4,
    'Friendship': 1.0,
    'Study Buddy': 0.8,
    'Hookup': 0.3,
    'Networking': 0.6,
    'Unsure': 0.5
  },
  'Study Buddy': {
    'Dating': 0.5,
    'Casual Dating': 0.4,
    'Serious Relationship': 0.3,
    'Friendship': 0.8,
    'Study Buddy': 1.0,
    'Hookup': 0.2,
    'Networking': 0.7,
    'Unsure': 0.5
  },
  'Hookup': {
    'Dating': 0.6,
    'Casual Dating': 0.8,
    'Serious Relationship': 0.2,
    'Friendship': 0.3,
    'Study Buddy': 0.2,
    'Hookup': 1.0,
    'Networking': 0.2,
    'Unsure': 0.5
  },
  'Networking': {
    'Dating': 0.2,
    'Casual Dating': 0.2,
    'Serious Relationship': 0.2,
    'Friendship': 0.6,
    'Study Buddy': 0.7,
    'Hookup': 0.2,
    'Networking': 1.0,
    'Unsure': 0.4
  },
  'Unsure': {
    'Dating': 0.6,
    'Casual Dating': 0.7,
    'Serious Relationship': 0.6,
    'Friendship': 0.5,
    'Study Buddy': 0.5,
    'Hookup': 0.5,
    'Networking': 0.4,
    'Unsure': 0.7
  }
};

/**
 * Calculate intent compatibility (relationship goals).
 * Uses 8x8 matrix allowing cross-intent matching.
 */
export const calculateIntentCompatibilityScore = (intent1: string, intent2: string): number => {
  if (!intent1 || !intent2) return 0.5; // Neutral score if intent missing

  return INTENT_MATRIX[intent1]?.[intent2] ?? 0.5;
};

/**
 * Calculate sexual orientation compatibility with improved gender preference logic.
 */
export const calculateOrientationCompatibilityScore = (
  orientation1: string, 
  orientation2: string, 
  gender1: string, 
  gender2: string,
  genderPreference1: string[],
  genderPreference2: string[]
): number => {
  if (!orientation1 || !orientation2) return 0.5; // Neutral if missing

  // Check if each user's gender is in the other's preference list
  const gender1InPrefs = genderPreference2.includes(gender1);
  const gender2InPrefs = genderPreference1.includes(gender2);
  
  // If either gender preference doesn't match, compatibility is very low
  if (!gender1InPrefs || !gender2InPrefs) return 0.1;

  // High compatibility orientations
  const highCompatibilityPairs = [
    ['straight', 'straight'],
    ['gay', 'gay'],
    ['lesbian', 'lesbian'],
    ['bisexual', 'bisexual'],
    ['pansexual', 'pansexual'],
    ['queer', 'queer']
  ];

  // Cross-compatible orientations
  const crossCompatible = [
    'bisexual', 'pansexual', 'queer'
  ];

  const orientations = [orientation1, orientation2].sort();
  
  // Perfect matches
  if (highCompatibilityPairs.some(pair => 
    pair[0] === orientations[0] && pair[1] === orientations[1]
  )) {
    return 1.0;
  }

  // Cross-compatible orientations (bi/pan/queer with others)
  if (crossCompatible.includes(orientation1) || crossCompatible.includes(orientation2)) {
    return 0.9;
  }

  // Straight + gay/lesbian of opposite gender
  if ((orientation1 === 'straight' && (orientation2 === 'gay' || orientation2 === 'lesbian')) ||
      (orientation2 === 'straight' && (orientation1 === 'gay' || orientation1 === 'lesbian'))) {
    return gender1 !== gender2 ? 0.8 : 0.1;
  }

  return 0.5; // Default neutral score
};

/**
 * Calculate age compatibility score based on age difference.
 * Stepped formula: 0-2 year diff = 1.0, 3-5 years = 0.8, 6+ years = 0.6 + soft penalty
 * This is NOT a hard filter; it's a soft preference that decreases score gradually.
 *
 * @param age1 - First user's age in years
 * @param age2 - Second user's age in years
 * @returns Compatibility score (0-1)
 */
export const calculateAgeScore = (age1: number, age2: number): number => {
  const ageDiff = Math.abs(age1 - age2);

  if (ageDiff <= 2) return 1.0;
  if (ageDiff <= 5) return 0.8;

  // For differences > 5 years: 0.6 baseline with small penalty per additional year
  // At 10 year diff: 0.6 - (5 * 0.02) = 0.5
  // At 15 year diff: 0.6 - (10 * 0.02) = 0.4
  return Math.max(0.6, 1.0 - (ageDiff - 5) * 0.02);
};

/**
 * Calculate major compatibility score (binary: same major or not).
 * Reflects shared academic context (classes, labs, study groups).
 *
 * @param major1 - First user's major
 * @param major2 - Second user's major
 * @returns 1.0 if same major, 0.0 otherwise
 */
export const calculateMajorCompatibilityScore = (major1?: string, major2?: string): number => {
  if (!major1 || !major2) return 0;
  return major1.toLowerCase() === major2.toLowerCase() ? 1.0 : 0.0;
};

/**
 * Calculates compatibility score between two users based on multiple factors.
 * Weights: 35% interests, 30% intent, 15% orientation, 10% major, 10% age
 *
 * @param userProfile - Current user's profile
 * @param candidateProfile - Potential match's profile
 * @returns Compatibility score (0-100)
 */
export const calculateCompatibilityScore = (userProfile: Profile, candidateProfile: Profile): number => {
  let totalScore = 0;

  // 1. Shared Interests Score (35% weight)
  const sharedInterestsScore = calculateSharedInterestsScore(
    userProfile.interests,
    candidateProfile.interests
  );
  totalScore += sharedInterestsScore * COMPATIBILITY_WEIGHTS.sharedInterests;

  // 2. Intent Compatibility Score (30% weight)
  const intentScore = calculateIntentCompatibilityScore(
    userProfile.intent,
    candidateProfile.intent
  );
  totalScore += intentScore * COMPATIBILITY_WEIGHTS.intentCompatibility;

  // 3. Sexual Orientation Compatibility (15% weight) - includes gender preferences
  const orientationScore = calculateOrientationCompatibilityScore(
    userProfile.sexual_orientation,
    candidateProfile.sexual_orientation,
    userProfile.gender,
    candidateProfile.gender,
    userProfile.gender_preference,
    candidateProfile.gender_preference
  );
  totalScore += orientationScore * COMPATIBILITY_WEIGHTS.orientationCompatibility;

  // 4. Major Compatibility (10% weight) - binary: same major or not
  const majorScore = calculateMajorCompatibilityScore(
    userProfile.major,
    candidateProfile.major
  );
  totalScore += majorScore * COMPATIBILITY_WEIGHTS.majorCompatibility;

  // 5. Age Compatibility (10% weight) - soft preference, not hard filter
  const userAge = calculateAge(userProfile.birthdate);
  const candidateAge = calculateAge(candidateProfile.birthdate);
  const ageScore = calculateAgeScore(userAge, candidateAge);
  totalScore += ageScore * COMPATIBILITY_WEIGHTS.ageCompatibility;

  return Math.round(totalScore * 100); // Convert to 0-100 scale
};


/**
 * Gets all eligible candidates for a user based on hard filters.
 * Hard filters: same university_id, campus_id, age range, gender preference, not already liked/matched/blocked.
 *
 * @param userId - Current user ID
 * @param userProfile - Current user's profile
 * @returns Array of eligible candidate profiles
 */
export const getEligibleCandidates = async (userId: string, userProfile: Profile): Promise<Profile[]> => {
  const userAge = calculateAge(userProfile.birthdate);
  
  // Edge case protection: ensure gender preferences aren't empty
  if (!userProfile.gender_preference?.length) {
    throw new Error('User must have at least one gender preference set');
  }

  // Get users this person has already interacted with
  const [existingLikes, existingMatches, blockedUsers] = await Promise.all([
    prisma.likes.findMany({
      where: { from_user: userId },
      select: { to_user: true }
    }),
    prisma.matches.findMany({
      where: { OR: [{ user1: userId }, { user2: userId }] },
      select: { user1: true, user2: true }
    }),
    prisma.blocks.findMany({
      where: { OR: [{ blocker_id: userId }, { blocked_id: userId }] },
      select: { blocker_id: true, blocked_id: true }
    })
  ]);

  // Create exclusion lists
  const likedUserIds = existingLikes.map(like => like.to_user);
  const matchedUserIds = existingMatches.flatMap(match => [match.user1, match.user2]);
  const blockedUserIds = blockedUsers.flatMap(block => [block.blocker_id, block.blocked_id]);
  
  const excludedUserIds = [...new Set([
    userId, // Don't show self
    ...likedUserIds,
    ...matchedUserIds,
    ...blockedUserIds
  ])].filter((id): id is string => Boolean(id));

  logger.info(`Discover: Exclusion list size: ${excludedUserIds.length}`, { 
    liked: likedUserIds.length, 
    matched: matchedUserIds.length, 
    blocked: blockedUserIds.length 
  });

  // Get precise birthdate range for age filtering using date-fns
  const { minBirthdate, maxBirthdate } = getBirthdateRangeForAge(userProfile.min_age, userProfile.max_age);

  const where: any = {
    // Hard filters - ALL must match
    user_id: { notIn: excludedUserIds },
    university_id: userProfile.university_id, // SAME EXACT UNIVERSITY ONLY - enforced strictly
    campus_id: userProfile.campus_id, // SAME CAMPUS if specified
    birthdate: {
      gte: maxBirthdate, // Born after this date (older than min_age)
      lte: minBirthdate, // Born before this date (younger than max_age)
    },
    // Ensure candidate's age preference includes current user
    min_age: { lte: userAge },
    max_age: { gte: userAge },
  }

  if (!userProfile.gender_preference.includes('All')) {
    const genderIdentities = genderPreferencesToIdentities(userProfile.gender_preference);
    where.gender = { in: genderIdentities };
  }

  logger.info(`Discover: Querying profiles with filters`, { 
    universityId: userProfile.university_id,
    ageRange: `${userProfile.min_age}-${userProfile.max_age}`,
    userAge,
    genderPref: userProfile.gender_preference
  });

  const profiles = await prisma.profiles.findMany({
    where,
    // Get a larger pool to score and rank
    take: 200,
    orderBy: {
      created_at: 'desc',
    },
  });

  logger.info(`Discover: Found ${profiles.length} raw candidates after DB query`);

  // Filter out profiles with empty interests or gender_preference after the query
  const finalProfiles = profiles.filter(profile => 
    profile.interests && profile.interests.length > 0 &&
    profile.gender_preference && profile.gender_preference.length > 0
  );

  logger.info(`Discover: Returning ${finalProfiles.length} candidates after validation`);

  return finalProfiles;
};

/**
 * Get users who have already liked the current user.
 * Used for TIER 1 priority ranking in discovery feed.
 *
 * @param userId - Current user ID
 * @returns Array of user IDs who liked this user
 */
export const getMutualLikedUsers = async (userId: string): Promise<string[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const likers = await prisma.likes.findMany({
    where: { to_user: userId },
    select: { from_user: true }
  });

  return likers
    .map(liker => liker.from_user)
    .filter((id): id is string => Boolean(id));
};

/**
 * Main discovery feed - returns potential matches for a user.
 * TIER 1 (Priority): Users who already liked this user appear first
 * TIER 2+: Remaining candidates ranked by compatibility score
 *
 * @param userId - ID of the user requesting matches
 * @param limit - Number of profiles to return (default: 10)
 * @param offset - For pagination (default: 0)
 * @returns Array of potential match profiles with compatibility scores and likedByUser flag
 */
export const getDiscoverProfiles = async (
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<ProfileWithScore[]> => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Get current user's profile and preferences
  const currentUser = await prisma.profiles.findUnique({
    where: { user_id: userId },
  });

  if (!currentUser) {
    throw new Error('User profile not found');
  }

  // TIER 1: Get users who already liked this user (priority candidates)
  const mutualLikedUserIds = await getMutualLikedUsers(userId);

  // Get eligible candidates
  const candidates = await getEligibleCandidates(userId, currentUser);

  // Calculate compatibility scores and mark mutual likes
  const scoredCandidates = candidates.map(candidate => ({
    ...candidate,
    compatibilityScore: calculateCompatibilityScore(currentUser, candidate),
    likedByUser: mutualLikedUserIds.includes(candidate.user_id)
  }));

  // Sort with TIER 1 (mutual likes) first, then by compatibility score
  // Priority: likedByUser (true first), then compatibilityScore (highest first), then stable sort by user_id
  const rankedCandidates = scoredCandidates.sort((a, b) => {
    // TIER 1: Mutual likes come first
    if (a.likedByUser !== b.likedByUser) {
      return a.likedByUser ? -1 : 1; // true comes before false
    }

    // TIER 2+: Sort by compatibility score (highest first)
    if (b.compatibilityScore !== a.compatibilityScore) {
      return b.compatibilityScore - a.compatibilityScore;
    }

    // Stable sort by user_id for deterministic ordering
    return a.user_id.localeCompare(b.user_id);
  });

  logger.info(`Discover: Ranked ${rankedCandidates.length} candidates`, {
    totalCandidates: rankedCandidates.length,
    mutualLikes: mutualLikedUserIds.length,
    offset,
    limit
  });

  // Apply pagination
  return rankedCandidates.slice(offset, offset + limit);
};

/**
 * Refresh discover feed - can be used to reset user's discovery queue.
 * This is a placeholder for future caching/optimization.
 */
export const refreshDiscoverFeed = async (userId: string): Promise<void> => {
  // Future: Clear cached discovery results for this user
  // For now, just validate user exists
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const userExists = await prisma.profiles.findUnique({
    where: { user_id: userId },
    select: { user_id: true }
  });

  if (!userExists) {
    throw new Error('User not found');
  }
};