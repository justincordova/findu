import { Request, Response } from "express";
import * as matchesService from "./services";

/**
 * Get all matches of the authenticated user
 */
export const getMatchesController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // auth middleware sets req.user
    const matches = await matchesService.getMatchesForUser(userId);
    res.json(matches);
  } catch (error: any) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
};

/**
 * Get a single match by ID
 */
export const getMatchByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const match = await matchesService.getMatchById(id);

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Authorization check: User must be part of the match
    if (match.user1 !== userId && match.user2 !== userId) {
      return res.status(403).json({ error: "Not authorized to view this match" });
    }

    res.json(match);
  } catch (error: any) {
    console.error("Error fetching match:", error);
    res.status(500).json({ error: "Failed to fetch match" });
  }
};

/**
 * Create a new match (manual creation — normally triggered via LikesService)
 */
export const createMatchController = async (req: Request, res: Response) => {
  try {
    const { user1, user2 } = req.body;

    if (!user1 || !user2) {
      return res.status(400).json({ error: "user1 and user2 are required" });
    }

    const match = await matchesService.createMatch(user1, user2);
    res.status(201).json(match);
  } catch (error: any) {
    console.error("Error creating match:", error);
    if (error.message.includes("already exists")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create match" });
  }
};

/**
 * Delete a match by ID
 */
export const deleteMatchController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await matchesService.deleteMatch(id);
    res.json({ message: "Match deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting match:", error);
    res.status(500).json({ error: "Failed to delete match" });
  }
};

/**
 * Check if two users are matched
 */
export const areUsersMatchedController = async (req: Request, res: Response) => {
  try {
    const { user1Id, user2Id } = req.params;

    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: "user1Id and user2Id are required" });
    }

    const matched = await matchesService.areUsersMatched(user1Id, user2Id);
    res.json({ matched });
  } catch (error: any) {
    console.error("Error checking match:", error);
    res.status(500).json({ error: "Failed to check match" });
  }
};
