import { Request, Response } from "express";
import * as LikesService from "./services";
import prisma from "@/lib/prismaClient";

/**
 * Create a like or superlike from one user to another
 * POST /likes
 */
export const createLike = async (req: Request, res: Response) => {
  try {
    const like = await LikesService.createLike(req.body);

    // Check if a match was created for this like
    const match = await prisma.matches.findFirst({
      where: {
        OR: [
          { user1: req.body.from_user, user2: req.body.to_user },
          { user1: req.body.to_user, user2: req.body.from_user },
        ],
      },
    });

    return res.status(201).json({
      like,
      matchCreated: !!match,
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      // Unique constraint failed (user already liked this target)
      return res.status(400).json({ message: "You already liked this user." });
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
    return res.json(likes);
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
    return res.json(likes);
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
  try {
    await LikesService.deleteLike(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
