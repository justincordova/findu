import { Request, Response } from "express";
import * as profileService from "./services";

/**
 * Create a new profile
 */
export const createProfileController = async (req: Request, res: Response) => {
  try {
    const profileData = req.body;
    const profile = await profileService.createProfile(profileData);
    res.status(201).json(profile);
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ error: "Failed to create profile" });
  }
};

/**
 * Partially update an existing profile
 */
export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const profileData = req.body;
    const updatedProfile = await profileService.updateProfile(userId, profileData);
    if (!updatedProfile) return res.status(404).json({ error: "Profile not found" });
    res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

/**
 * Get a profile by user ID
 */
export const getProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const profile = await profileService.getProfileByUserId(userId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

/**
 * Delete a profile by user ID
 */
export const deleteProfileController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    await profileService.deleteProfile(userId);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Failed to delete profile" });
  }
};


/**
 * Get profile of the authenticated user
 */
export const getMyProfileController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const profile = await profileService.getProfileByUserId(userId);

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};
/**
 * Map email domain to university and campuses
 */

export const domainMapController = async (req: Request, res: Response) => {
  try {
    const email = (req as any).user?.email || req.body.email;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const result = await profileService.resolveUniversityAndCampuses(email);

    if (!result) return res.status(404).json({ error: "No university found for this email domain" });

    res.json(result);
  } catch (error) {
    console.error("Error mapping domain:", error);
    res.status(500).json({ error: "Failed to map domain" });
  }
};
