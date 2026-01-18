import { Request, Response, NextFunction } from "express";
import * as BlocksService from "./services";

export const createBlock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { blockedId } = req.body;
    const blockerId = (req as any).user?.id; // Assuming auth middleware populates req.user

    if (!blockerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!blockedId) {
      return res.status(400).json({ message: "blockedId is required" });
    }

    const block = await BlocksService.createBlock(blockerId, blockedId);
    res.status(201).json(block);
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { blockedId } = req.params;
    const blockerId = (req as any).user?.id;

    if (!blockerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!blockedId) {
      return res.status(400).json({ message: "blockedId is required" });
    }

    await BlocksService.unblockUser(blockerId, blockedId);
    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    next(error);
  }
};

export const getBlockedUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const blockedUsers = await BlocksService.getBlockedUsers(userId);
    res.status(200).json(blockedUsers);
  } catch (error) {
    next(error);
  }
};
