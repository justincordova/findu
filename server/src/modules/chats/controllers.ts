import type { NextFunction, Request, Response } from "express";
import prisma from "@/lib/prismaClient";
import {
  createMessage,
  deleteMessage,
  editMessage,
  getChatHistory,
  getLatestMessage,
  markMessagesAsRead,
} from "./services";
import { uploadChatMedia } from "./storage";

/**
 * POST /api/chats/send
 * Create a new message
 */
export async function sendMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user?.id;
    const { match_id, message, media_url, message_type } = req.body;

    const result = await createMessage({
      match_id,
      sender_id: userId,
      message,
      media_url,
      message_type,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chats/:match_id/history
 * Fetch chat history with pagination
 */
export async function getChatHistoryHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { match_id } = req.params;
    const { limit, cursor } = req.query;

    const messages = await getChatHistory({
      match_id,
      limit: limit ? parseInt(limit as string, 10) : 50,
      cursor: cursor as string | undefined,
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/chats/:match_id/latest
 * Get latest message in a match (for unread indicator)
 */
export async function getLatestMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { match_id } = req.params;

    const message = await getLatestMessage(match_id);

    if (!message) {
      return res.status(404).json({ error: "No messages found" });
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/chats/:match_id/read
 * Mark all messages in a match as read
 */
export async function markAsRead(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user?.id;
    const { match_id } = req.params;

    const count = await markMessagesAsRead(match_id, userId);

    res.json({ updated: count });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/chats/:message_id
 * Edit a message
 */
export async function editMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user?.id;
    const { message_id } = req.params;
    const { message } = req.body;

    const result = await editMessage(message_id, userId, { message });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/chats/:message_id
 * Hard delete a message
 */
export async function deleteMessageHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user?.id;
    const { message_id } = req.params;

    const result = await deleteMessage(message_id, userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/chats/:match_id/upload
 * Upload media file for chat
 * Expects multipart form with "file" field
 */
export async function uploadMedia(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = (req as any).user?.id;
    const { match_id } = req.params;
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Verify user is in match
    const match = await prisma.matches.findUnique({
      where: { id: match_id },
    });

    if (!match || (match.user1 !== userId && match.user2 !== userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const publicUrl = await uploadChatMedia(
      match_id,
      file.path,
      file.originalname,
      file.mimetype,
    );

    res.json({ media_url: publicUrl });
  } catch (error) {
    next(error);
  }
}
