import { Request, Response } from "express";
import * as matchesService from "./services";

/**
 * Get all matches of the authenticated user
 */
export const getMatchesController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const matches = await matchesService.getMatches(userId);
    res.json(matches);
  } catch (error) {
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
    const match = await matchesService.getMatchById(id);

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json(match);
  } catch (error) {
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
  } catch (error) {
    console.error("Error creating match:", error);
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
  } catch (error) {
    console.error("Error deleting match:", error);
    res.status(500).json({ error: "Failed to delete match" });
  }
};
