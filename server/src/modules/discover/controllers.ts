import { Request, Response } from "express";
import * as DiscoverService from "./services";

/**
 * GET /discover
 * Returns a list of potential matches for the logged-in user based on preferences.
 */
export const getDiscoverableUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId; // auth middleware sets req.user
    const { minAge, maxAge, gender, interests, limit, cursor } = req.query;

    const users = await DiscoverService.discoverUsers(userId, {
      minAge: minAge ? Number(minAge) : undefined,
      maxAge: maxAge ? Number(maxAge) : undefined,
      gender: gender as string,
      interests: interests ? (interests as string).split(",") : undefined,
      limit: limit ? Number(limit) : undefined,
      cursor: cursor as string | undefined,
    });

    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * GET /discover/:userId
 * Returns a single user profile by ID.
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await DiscoverService.getProfileByUserId(userId);

    if (!profile) return res.status(404).json({ message: "User not found" });
    return res.json(profile);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
