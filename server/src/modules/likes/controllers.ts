import { Request, Response } from "express";
import * as LikesService from "./services";
import logger from "@/config/logger";

/**
 * Create a like or superlike from one user to another
 * POST /likes
 */
export const createLike = async (req: Request, res: Response) => {
  try {
    const result = await LikesService.createLike(req.body);

    logger.info("Like created successfully", { 
      fromUser: req.body.from_user, 
      toUser: req.body.to_user, 
      isSuperlike: req.body.is_superlike,
      matched: result.matched 
    });

    return res.status(201).json({
      like: result.like,
      matched: result.matched,
      matchId: result.matchId,
    });
  } catch (err: any) {
    if (err.message.includes("Users cannot like themselves") ||
        err.message.includes("Both from_user and to_user are required") ||
        err.message.includes("User profiles not found") ||
        err.message.includes("Users must be from the same university") ||
        err.message.includes("Cannot like blocked user") ||
        err.message.includes("Like already exists") ||
        err.message.includes("Daily superlike limit")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get all likes sent by a specific user
 * GET /likes/sent/:userId
 */
export const getSentLikes = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const likes = await LikesService.getSentLikes(userId);
    return res.status(200).json(likes);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Get all likes received by a specific user
 * GET /likes/received/:userId
 */
export const getReceivedLikes = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const likes = await LikesService.getReceivedLikes(userId);
    return res.status(200).json(likes);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a like by its ID
 * DELETE /likes/:id
 */
export const deleteLike = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.body.userId; // ensure front-end passes userId for auth
  try {
    await LikesService.removeLike(id, userId);
    return res.status(204).send();
  } catch (err: any) {
    if (err.message === "Like not found or unauthorized") {
      return res.status(403).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};
