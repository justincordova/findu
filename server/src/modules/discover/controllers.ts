import { Request, Response } from "express";
import * as DiscoverService from "./services";
import prisma from "@/lib/prismaClient";

/**
 * Get discovery feed for a user - potential matches with compatibility scores
 * GET /discover?limit=10&offset=0
 */
export const getDiscoverFeed = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const profiles = await DiscoverService.getDiscoverProfiles(userId, limit, offset);
    
    return res.status(200).json({
      profiles,
      count: profiles.length,
      limit,
      offset,
      hasMore: profiles.length === limit, // Simple check - could be improved with total count
    });
  } catch (err: any) {
    if (err.message.includes("User ID is required") ||
        err.message.includes("User profile not found") ||
        err.message.includes("User must have at least one gender preference set")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get eligible candidates for a user (for debugging/admin purposes)
 * GET /discover/candidates
 */
export const getEligibleCandidates = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    // First get user profile
    const userProfile = await prisma.profiles.findUnique({
      where: { user_id: userId }
    });

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const candidates = await DiscoverService.getEligibleCandidates(userId, userProfile);
    
    return res.status(200).json({
      candidates,
      count: candidates.length,
    });
  } catch (err: any) {
    if (err.message.includes("User ID is required") ||
        err.message.includes("User must have at least one gender preference set")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Calculate compatibility score between two users
 * POST /discover/compatibility
 * Body: { candidateId: string }
 */
export const calculateCompatibility = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { candidateId } = req.body;

  if (!candidateId) {
    return res.status(400).json({ 
      message: "candidateId is required" 
    });
  }

  if (userId === candidateId) {
    return res.status(400).json({ 
      message: "Cannot calculate compatibility with yourself" 
    });
  }

  try {
    // Get both user profiles
    const [userProfile, candidateProfile] = await Promise.all([
      prisma.profiles.findUnique({ where: { user_id: userId } }),
      prisma.profiles.findUnique({ where: { user_id: candidateId } })
    ]);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    if (!candidateProfile) {
      return res.status(404).json({ message: "Candidate profile not found" });
    }

    // Calculate compatibility using existing service function
    const compatibilityScore = DiscoverService.calculateCompatibilityScore(userProfile, candidateProfile);
    
    // Get detailed breakdown
    const sharedInterests = DiscoverService.getSharedInterests(userProfile.interests, candidateProfile.interests);
    const sharedInterestsScore = DiscoverService.calculateSharedInterestsScore(userProfile.interests, candidateProfile.interests);
    const intentScore = DiscoverService.calculateIntentCompatibilityScore(userProfile.intent, candidateProfile.intent);
    const orientationScore = DiscoverService.calculateOrientationCompatibilityScore(
      userProfile.sexual_orientation,
      candidateProfile.sexual_orientation,
      userProfile.gender,
      candidateProfile.gender,
      userProfile.gender_preference,
      candidateProfile.gender_preference
    );

    return res.status(200).json({
      compatibilityScore,
      breakdown: {
        sharedInterestsScore: Math.round(sharedInterestsScore * 100),
        intentCompatibilityScore: Math.round(intentScore * 100),
        orientationCompatibilityScore: Math.round(orientationScore * 100),
      },
      sharedInterests,
      details: {
        userAge: DiscoverService.calculateAge(userProfile.birthdate),
        candidateAge: DiscoverService.calculateAge(candidateProfile.birthdate),
        ageCompatible: DiscoverService.isWithinAgePreference(
          DiscoverService.calculateAge(userProfile.birthdate),
          DiscoverService.calculateAge(candidateProfile.birthdate),
          userProfile.min_age,
          userProfile.max_age
        ),
      }
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Refresh/reset discovery feed for a user
 * POST /discover/refresh
 */
export const refreshDiscoverFeed = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    await DiscoverService.refreshDiscoverFeed(userId);
    
    return res.status(200).json({ 
      message: "Discovery feed refreshed successfully" 
    });
  } catch (err: any) {
    if (err.message.includes("User ID is required") ||
        err.message.includes("User not found")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};