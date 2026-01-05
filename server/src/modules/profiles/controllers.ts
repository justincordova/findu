  import { Request, Response } from "express";
  import logger from "@/config/logger";
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
      logger.error("Error creating profile", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to create profile" });
    }
  };

  /**
   * Partially update an existing profile
   */
  export const updateProfileController = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const authenticatedUserId = (req as any).user?.id;

      // Authorization check: user can only update their own profile
      if (authenticatedUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized: Cannot update another user's profile" });
      }

      const profileData = req.body;
      const updatedProfile = await profileService.updateProfile(userId, profileData);
      if (!updatedProfile) return res.status(404).json({ error: "Profile not found" });
      res.json(updatedProfile);
    } catch (error) {
      logger.error("Error updating profile", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to update profile" });
    }
  };

  /**
   * Get a profile by user ID
   * Note: Returns own profile or public profile view (future: add visibility controls)
   */
  export const getProfileController = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const profile = await profileService.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      res.json(profile);
    } catch (error) {
      logger.error("Error fetching profile", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  };

  /**
   * Delete a profile by user ID
   */
  export const deleteProfileController = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const authenticatedUserId = (req as any).user?.id;

      // Authorization check: user can only delete their own profile
      if (authenticatedUserId !== userId) {
        return res.status(403).json({ error: "Unauthorized: Cannot delete another user's profile" });
      }

      await profileService.deleteProfile(userId);
      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting profile", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("Error fetching profile", { error: error instanceof Error ? error.message : String(error) });
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
      logger.error("Error mapping domain", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "Failed to map domain" });
    }
  };
