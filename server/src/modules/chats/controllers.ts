import { Request, Response } from 'express';
import * as ChatsService from './services';
import logger from '@/config/logger';

/**
 * Get all conversations (matches with their latest messages)
 */
export async function getConversations(req: Request, res: Response) {
  const userId = (req as any).user.id;

  try {
    const conversations = await ChatsService.getConversations(userId);
    res.json({ conversations });
  } catch (error) {
    logger.error('Failed to fetch conversations', { userId, error });
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

/**
 * Get messages for a specific match
 */
export async function getMessages(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { matchId } = req.params;
  const { limit = 50, before } = req.query;

  try {
    const conversation = await ChatsService.getMessages(
      userId,
      matchId,
      Number(limit),
      before as string | undefined
    );

    res.json({ conversation });
  } catch (error) {
    logger.error('Failed to fetch messages', { userId, matchId, error });
    
    // Handle specific errors
    if (error instanceof Error && error.message.includes('not authorized')) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

/**
 * Send a message
 */
export async function sendMessage(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { matchId } = req.params;
  const { message, message_type = 'TEXT', media_url } = req.body;

  // Input validation
  if (!message?.trim() && message_type === 'TEXT') {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const chat = await ChatsService.sendMessage(
      userId,
      matchId,
      message.trim(),
      message_type,
      media_url
    );

    res.json({ message: chat });
  } catch (error) {
    logger.error('Failed to send message', { userId, matchId, error });
    
    // Handle specific errors
    if (error instanceof Error && error.message.includes('not authorized')) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { matchId } = req.params;

  try {
    await ChatsService.markAsRead(userId, matchId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to mark as read', { userId, matchId, error });
    
    if (error instanceof Error && error.message.includes('not authorized')) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.status(500).json({ error: 'Failed to mark as read' });
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { messageId } = req.params;

  try {
    await ChatsService.deleteMessage(userId, messageId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete message', { userId, messageId, error });
    
    if (error instanceof Error) {
      if (error.message.includes('not authorized')) {
        return res.status(403).json({ error: 'Not authorized to delete this message' });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: 'Message not found' });
      }
    }
    
    res.status(500).json({ error: 'Failed to delete message' });
  }
}