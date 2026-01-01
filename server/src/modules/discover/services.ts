import prisma from "@/lib/prismaClient";
import logger from "@/config/logger";
import { Profile } from "@/types/Profile";
import { Lifestyle } from "@/types/Lifestyle";
import {
  ProfileWithScore,
  CompatibilityWeights,
  IntentCompatibilityMatrix
} from "@/types/Discover";
import { differenceInYears, subYears, addDays } from 'date-fns';
import { getInterestCategory } from "@/constants/interests";
import { genderPreferencesToIdentities } from "@/utils/genderMapping";
import type { JsonValue } from "@prisma/client/runtime/library";

// Algorithm weights - adjust based on testing/feedback
// Updated: 30% interests, 25% intent, 15% orientation, 10% major, 10% age, 10% lifestyle
const COMPATIBILITY_WEIGHTS: CompatibilityWeights = {
  sharedInterests: 0.30,        // 30% - shared hobbies/interests (reduced from 35%)
  intentCompatibility: 0.25,    // 25% - relationship goals alignment (reduced from 30%)
  orientationCompatibility: 0.15, // 15% - sexual orientation match
  majorCompatibility: 0.10,     // 10% - same major/academic context
  ageCompatibility: 0.10,       // 10% - age alignment
  lifestyleCompatibility: 0.10, // 10% - lifestyle compatibility (NEW)
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
 * Calculate lifestyle compatibility score based on field matches.
 * Matching strategy:
 * - Single-value fields (9): exact match = 1.0, no match = 0
 * - Array fields (2): weighted by overlap percentage (e.g., 50% overlap = 0.5)
 * Normalizes to 0-1 score across all 11 fields.
 *
 * Returns 0 if either user has no lifestyle data (optional field, no penalty).
 *
 * @param lifestyle1 - First user's lifestyle data
 * @param lifestyle2 - Second user's lifestyle data
 * @returns Compatibility score between 0-1
 */
export const calculateLifestyleCompatibilityScore = (
  lifestyle1?: JsonValue,
  lifestyle2?: JsonValue
): number => {
  // Cast JsonValue to Lifestyle (or null if not an object)
  const parsed1 = typeof lifestyle1 === 'object' && lifestyle1 !== null ? (lifestyle1 as Lifestyle) : null;
  const parsed2 = typeof lifestyle2 === 'object' && lifestyle2 !== null ? (lifestyle2 as Lifestyle) : null;

  if (!parsed1 || !parsed2) return 0;

  let totalMatchScore = 0;
  const totalFields = 11;

  // Single-value fields (9 fields): exact match = 1.0, no match = 0
  const singleValueFields: (keyof Lifestyle)[] = [
    'drinking', 'smoking', 'cannabis', 'sleep_habits',
    'study_style', 'cleanliness', 'caffeine', 'living_situation', 'fitness'
  ];

  for (const field of singleValueFields) {
    const value1 = parsed1[field];
    const value2 = parsed2[field];
    if (value1 && value2 && value1 === value2) {
      totalMatchScore += 1;
    }
  }

  // Array fields (2 fields: pets, dietary_preferences)
  // Weight by overlap percentage for more nuanced scoring
  const arrayFields: ('pets' | 'dietary_preferences')[] = ['pets', 'dietary_preferences'];

  for (const field of arrayFields) {
    const arr1 = parsed1[field];
    const arr2 = parsed2[field];
    if (Array.isArray(arr1) && Array.isArray(arr2) && arr1.length && arr2.length) {
      // Calculate overlap: items that appear in both arrays
      const overlappingItems = arr1.filter((item: string) => arr2.includes(item)).length;
      // Weight by the maximum array length to account for different number of selections
      const maxLength = Math.max(arr1.length, arr2.length);
      totalMatchScore += overlappingItems / maxLength;
    }
  }

  return totalMatchScore / totalFields;
};

/**
 * Calculates overall compatibility score between two users based on 6 weighted factors.
 *
 * ALGORITHM OVERVIEW:
 * - Weighted average of 6 compatibility metrics (each 0-1, then multiplied by weight)
 * - Final score normalized to 0-100 scale
 * - Allows cross-intent matching (different relationship goals still possible)
 * - No single factor causes automatic disqualification; all dimensions contribute
 *
 * WEIGHT BREAKDOWN (must sum to 100%):
 * 1. Shared Interests (30%) - Most important: hobbies, passions, categories
 * 2. Intent Compatibility (25%) - Relationship goals (dating, hookup, friendship, etc.)
 * 3. Sexual Orientation (15%) - Orientation match + bidirectional gender preferences
 * 4. Major/Academic (10%) - Same field of study (shared classes, study groups)
 * 5. Age Compatibility (10%) - Soft preference (not hard filter)
 * 6. Lifestyle (10%) - Living habits, values, preferences
 *
 * DESIGN NOTES:
 * - Interests weighted heavily (30%): strongest signal of compatibility
 * - Intent allows cross-matching: Dating + Friendship = 0.5 (not 0.0)
 * - Gender preference is BIDIRECTIONAL: both must find each other's gender acceptable
 * - Age is SOFT: differences penalize score gradually, not eliminated at query time
 * - Lifestyle includes: smoking, drinking, drugs, religion, relationship type, living situation
 *
 * RATIONALE FOR WEIGHTS:
 * - Interests drive conversation, activities, connection depth
 * - Intent alignment prevents miscommunication about relationship type
 * - Orientation + gender pref ensures both parties are interested
 * - Major creates natural connection points (classes, study partners)
 * - Age handled gently: some age gaps are acceptable, depends on individual
 * - Lifestyle covers values: shared preferences prevent conflicts
 *
 * @param userProfile - Current user's profile
 * @param candidateProfile - Potential match's profile
 * @returns Compatibility score (0-100), where 100 = perfect match, 0 = no compatibility
 */
export const calculateCompatibilityScore = (userProfile: Profile, candidateProfile: Profile): number => {
  let totalScore = 0;

  // 1. Shared Interests Score (30% weight)
  // Exact matches: 1.0 point each
  // Category matches (no exact match): 0.5 points
  // Formula: sharedPoints / max(3, min(user_interests, candidate_interests))
  const sharedInterestsScore = calculateSharedInterestsScore(
    userProfile.interests,
    candidateProfile.interests
  );
  totalScore += sharedInterestsScore * COMPATIBILITY_WEIGHTS.sharedInterests;

  // 2. Intent Compatibility Score (25% weight)
  // Uses 8x8 matrix mapping relationship intent compatibility
  // Same intent: 1.0
  // Compatible (e.g., Dating + Casual Dating): 0.8
  // Different but possible (e.g., Dating + Friendship): 0.5
  // Incompatible (e.g., Serious Relationship + Hookup): 0.2
  const intentScore = calculateIntentCompatibilityScore(
    userProfile.intent,
    candidateProfile.intent
  );
  totalScore += intentScore * COMPATIBILITY_WEIGHTS.intentCompatibility;

  // 3. Sexual Orientation Compatibility (15% weight)
  // Includes two checks:
  // - Orientation match (gay+gay > bisexual+gay, etc.)
  // - BIDIRECTIONAL gender preferences: both must find each other's gender acceptable
  // Returns 0.1 if either has wrong gender preference (low but not 0)
  const orientationScore = calculateOrientationCompatibilityScore(
    userProfile.sexual_orientation,
    candidateProfile.sexual_orientation,
    userProfile.gender,
    candidateProfile.gender,
    userProfile.gender_preference,
    candidateProfile.gender_preference
  );
  totalScore += orientationScore * COMPATIBILITY_WEIGHTS.orientationCompatibility;

  // 4. Major Compatibility (10% weight)
  // Binary: 1.0 if same major, 0.0 otherwise
  // Reflects shared academic context: classes, labs, study groups
  const majorScore = calculateMajorCompatibilityScore(
    userProfile.major,
    candidateProfile.major
  );
  totalScore += majorScore * COMPATIBILITY_WEIGHTS.majorCompatibility;

  // 5. Age Compatibility (10% weight)
  // SOFT preference (not hard filter), handled at scoring level
  // Formula: 0-2 years = 1.0, 3-5 = 0.8, 6+ = 0.6 - (ageDiff - 5) * 0.02
  // Minimum floor of 0.0 prevents negative scores
  const userAge = calculateAge(userProfile.birthdate);
  const candidateAge = calculateAge(candidateProfile.birthdate);
  const ageScore = calculateAgeScore(userAge, candidateAge);
  totalScore += ageScore * COMPATIBILITY_WEIGHTS.ageCompatibility;

  // 6. Lifestyle Compatibility (10% weight)
  // Covers 9 single-value fields (binary yes/no) + 2 array fields (multiple selections)
  // Fields: smoking, drinking, drugs, religion, relationship type, living situation, etc.
  // Score: % of matching fields
  const lifestyleScore = calculateLifestyleCompatibilityScore(
    userProfile.lifestyle,
    candidateProfile.lifestyle
  );
  totalScore += lifestyleScore * COMPATIBILITY_WEIGHTS.lifestyleCompatibility;

  logger.debug("COMPATIBILITY_SCORE_CALCULATED", {
    candidateId: candidateProfile.user_id,
    sharedInterestsScore,
    intentScore,
    orientationScore,
    majorScore,
    ageScore,
    lifestyleScore,
    totalScore
  });

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
 * Main discovery feed - returns ranked potential matches for a user.
 *
 * RANKING ALGORITHM (Two-Tier System):
 * =====================================
 * TIER 1 (High Priority): Users who already liked the current user
 *   - Appears first regardless of compatibility score
 *   - Reduces friction: mutual interest already established
 *   - Likelihood of match: much higher
 *
 * TIER 2+ (Standard Ranking): All other eligible candidates
 *   - Ranked by compatibility score (highest first)
 *   - Score already accounts for interests, intent, orientation, age, etc.
 *   - Within same tier, higher compatibility always ranks first
 *
 * HARD FILTERS (Applied before ranking):
 * ====================================
 * - Same university_id and campus_id (strict enforcement)
 * - Age range match (candidate's age must be in user's preferences)
 * - Gender preference match (user only sees their preferred genders)
 * - Not already liked, matched, or blocked
 * - Must have at least one interest and gender preference set
 *
 * FLOW:
 * 1. Fetch user profile and preferences
 * 2. Get users who already liked this user (TIER 1 candidates)
 * 3. Get all eligible candidates (hard filters applied via DB)
 * 4. Calculate compatibility scores for each candidate
 * 5. Sort: TIER 1 first, then by score (descending)
 * 6. Apply pagination (limit/offset)
 * 7. Return ranked list
 *
 * @param userId - ID of the user requesting matches
 * @param limit - Number of profiles to return per page (default: 10, recommended: 10-20)
 * @param offset - Pagination offset (default: 0). Use: page * limit
 * @returns Array of potential match profiles with compatibility scores and likedByUser flag
 * @throws Error if user profile not found
 *
 * EXAMPLE:
 * // Get first 10 discover profiles
 * const profiles = await getDiscoverProfiles(userId);
 *
 * // Get next 10 (page 2)
 * const moreProfiles = await getDiscoverProfiles(userId, 10, 10);
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

  // Separate mutual likes from other candidates for efficient scoring
  // Score mutual likes first, then other candidates
  const mutualLikeCandidates = candidates.filter(c => mutualLikedUserIds.includes(c.user_id));
  const otherCandidates = candidates.filter(c => !mutualLikedUserIds.includes(c.user_id));

  // Score mutual likes with compatibility scores
  const scoredMutualLikes = mutualLikeCandidates.map(candidate => ({
    ...candidate,
    compatibilityScore: calculateCompatibilityScore(currentUser, candidate),
    likedByUser: true
  }));

  // Score other candidates with compatibility scores
  const scoredOthers = otherCandidates.map(candidate => ({
    ...candidate,
    compatibilityScore: calculateCompatibilityScore(currentUser, candidate),
    likedByUser: false
  }));

  // Combine with mutual likes first, then sort others by score
  const rankedCandidates = [
    ...scoredMutualLikes.sort((a, b) => b.compatibilityScore - a.compatibilityScore || a.user_id.localeCompare(b.user_id)),
    ...scoredOthers.sort((a, b) => b.compatibilityScore - a.compatibilityScore || a.user_id.localeCompare(b.user_id))
  ];

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