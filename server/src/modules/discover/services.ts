import prisma from "@/lib/prismaClient";
import { Profile } from "@/types/Profile";
import { 
  ProfileWithScore, 
  CompatibilityWeights, 
  IntentCompatibilityMatrix 
} from "@/types/Discover";
import { differenceInYears, subYears, addDays } from 'date-fns';

// Algorithm weights - adjust based on testing/feedback
const COMPATIBILITY_WEIGHTS: CompatibilityWeights = {
  sharedInterests: 0.6,        // 60% - shared hobbies/interests
  intentCompatibility: 0.25,   // 25% - relationship goals alignment
  orientationCompatibility: 0.15, // 15% - sexual orientation match
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
 * Utility: Shuffle array for randomization.
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Calculate shared interests score based on overlap.
 */
export const calculateSharedInterestsScore = (interests1: string[], interests2: string[]): number => {
  if (!interests1?.length || !interests2?.length) return 0;

  const sharedCount = getSharedInterests(interests1, interests2).length;
  const totalUniqueInterests = new Set([...interests1, ...interests2]).size;
  
  // Jaccard similarity coefficient
  return sharedCount / totalUniqueInterests;
};

/**
 * Calculate intent compatibility (relationship goals).
 */
export const calculateIntentCompatibilityScore = (intent1: string, intent2: string): number => {
  if (!intent1 || !intent2) return 0.3; // Neutral score if intent missing

  // Define intent compatibility matrix
  const intentCompatibility: IntentCompatibilityMatrix = {
    'serious_relationship': {
      'serious_relationship': 1.0,
      'casual_dating': 0.3,
      'friendship': 0.1,
      'study_buddy': 0.2,
      'hookups': 0.1,
      'unsure': 0.5
    },
    'casual_dating': {
      'serious_relationship': 0.3,
      'casual_dating': 1.0,
      'friendship': 0.4,
      'study_buddy': 0.3,
      'hookups': 0.6,
      'unsure': 0.7
    },
    'friendship': {
      'serious_relationship': 0.1,
      'casual_dating': 0.4,
      'friendship': 1.0,
      'study_buddy': 0.8,
      'hookups': 0.2,
      'unsure': 0.5
    },
    'study_buddy': {
      'serious_relationship': 0.2,
      'casual_dating': 0.3,
      'friendship': 0.8,
      'study_buddy': 1.0,
      'hookups': 0.1,
      'unsure': 0.4
    },
    'hookups': {
      'serious_relationship': 0.1,
      'casual_dating': 0.6,
      'friendship': 0.2,
      'study_buddy': 0.1,
      'hookups': 1.0,
      'unsure': 0.4
    },
    'unsure': {
      'serious_relationship': 0.5,
      'casual_dating': 0.7,
      'friendship': 0.5,
      'study_buddy': 0.4,
      'hookups': 0.4,
      'unsure': 0.6
    }
  };

  return intentCompatibility[intent1]?.[intent2] ?? 0.5;
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
 * Calculates compatibility score between two users based on multiple factors.
 *
 * @param userProfile - Current user's profile
 * @param candidateProfile - Potential match's profile
 * @returns Compatibility score (0-100)
 */
export const calculateCompatibilityScore = (userProfile: Profile, candidateProfile: Profile): number => {
  let totalScore = 0;

  // 1. Shared Interests Score (60% weight)
  const sharedInterestsScore = calculateSharedInterestsScore(
    userProfile.interests, 
    candidateProfile.interests
  );
  totalScore += sharedInterestsScore * COMPATIBILITY_WEIGHTS.sharedInterests;

  // 2. Intent Compatibility Score (25% weight)
  const intentScore = calculateIntentCompatibilityScore(
    userProfile.intent, 
    candidateProfile.intent
  );
  totalScore += intentScore * COMPATIBILITY_WEIGHTS.intentCompatibility;

  // 3. Sexual Orientation Compatibility (15% weight) - now includes gender preferences
  const orientationScore = calculateOrientationCompatibilityScore(
    userProfile.sexual_orientation,
    candidateProfile.sexual_orientation,
    userProfile.gender,
    candidateProfile.gender,
    userProfile.gender_preference,
    candidateProfile.gender_preference
  );
  totalScore += orientationScore * COMPATIBILITY_WEIGHTS.orientationCompatibility;

  return Math.round(totalScore * 100); // Convert to 0-100 scale
};

/**
 * Rank candidates with randomization within score tiers to avoid monotony.
 */
export const rankCandidatesWithRandomization = (candidates: ProfileWithScore[]): ProfileWithScore[] => {
  // Group by score tiers (0-20, 21-40, 41-60, 61-80, 81-100)
  const scoreTiers = {
    tier5: candidates.filter(c => c.compatibilityScore >= 81), // 81-100
    tier4: candidates.filter(c => c.compatibilityScore >= 61 && c.compatibilityScore <= 80), // 61-80
    tier3: candidates.filter(c => c.compatibilityScore >= 41 && c.compatibilityScore <= 60), // 41-60
    tier2: candidates.filter(c => c.compatibilityScore >= 21 && c.compatibilityScore <= 40), // 21-40
    tier1: candidates.filter(c => c.compatibilityScore <= 20), // 0-20
  };

  // Shuffle within each tier and combine
  const shuffledTiers = [
    ...shuffleArray(scoreTiers.tier5),
    ...shuffleArray(scoreTiers.tier4),
    ...shuffleArray(scoreTiers.tier3),
    ...shuffleArray(scoreTiers.tier2),
    ...shuffleArray(scoreTiers.tier1),
  ];

  return shuffledTiers;
};

/**
 * Gets all eligible candidates for a user based on hard filters.
 * Hard filters: same university, age range, gender preference, not already liked/matched/blocked.
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

  // Get precise birthdate range for age filtering using date-fns
  const { minBirthdate, maxBirthdate } = getBirthdateRangeForAge(userProfile.min_age, userProfile.max_age);

  return prisma.profiles.findMany({
    where: {
      // Hard filters - ALL must match
      user_id: { notIn: excludedUserIds },
      university: userProfile.university, // SAME EXACT UNIVERSITY ONLY - enforced strictly
      gender: { in: userProfile.gender_preference }, // Must match gender preference
      birthdate: {
        gte: maxBirthdate, // Born after this date (older than min_age)
        lte: minBirthdate, // Born before this date (younger than max_age)
      },
      // Ensure candidate's age preference includes current user
      min_age: { lte: userAge },
      max_age: { gte: userAge },
      // Ensure candidate's gender preference includes current user AND is not empty
      gender_preference: { 
        has: userProfile.gender,
        isEmpty: false // Ensure array is not empty
      },
      // Ensure candidate has interests (protect against null/empty)
      interests: {
        isEmpty: false
      }
    },
    // Get a larger pool to score and rank
    take: 200,
  });
};

/**
 * Main discovery feed - returns potential matches for a user.
 * Uses compatibility scoring with randomization within score tiers.
 *
 * @param userId - ID of the user requesting matches
 * @param limit - Number of profiles to return (default: 10)
 * @param offset - For pagination (default: 0)
 * @returns Array of potential match profiles with compatibility scores
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

  // Get eligible candidates
  const candidates = await getEligibleCandidates(userId, currentUser);

  // Calculate compatibility scores for each candidate
  const scoredCandidates = candidates.map(candidate => ({
    ...candidate,
    compatibilityScore: calculateCompatibilityScore(currentUser, candidate)
  }));

  // Sort by compatibility score (highest first) with randomization within tiers
  const rankedCandidates = rankCandidatesWithRandomization(scoredCandidates);

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