import prisma from "@/lib/prismaClient";
import logger from '@/config/logger';

/**
 * Get all conversations (matches with messages) for a user
 */
export async function getConversations(userId: string) {
  // Find all matches for this user
  const matches = await prisma.matches.findMany({
    where: {
      OR: [{ user1: userId }, { user2: userId }]
    },
    include: {
      // Get last message for each match
      chats: {
        orderBy: { sent_at: 'desc' },
        take: 1,
      },
      // Get other user's profile
      users_matches_user1Tousers: {
        select: {
          id: true,
          profiles: {
            select: {
              name: true,
              avatar_url: true,
            }
          }
        }
      },
      users_matches_user2Tousers: {
        select: {
          id: true,
          profiles: {
            select: {
              name: true,
              avatar_url: true,
            }
          }
        }
      }
    }
  });

  // Transform to conversation format
  const conversations = await Promise.all(
    matches.map(async (match) => {
      const otherUser = match.user1 === userId 
        ? match.users_matches_user2Tousers 
        : match.users_matches_user1Tousers;
      
      const lastMessage = match.chats[0];
      
      // Count unread messages from other user
      const unreadCount = await prisma.chats.count({
        where: {
          match_id: match.id,
          sender_id: { not: userId },
          is_read: false,
        }
      });

      return {
        id: match.id,
        matchId: match.id,
        otherUser: {
          id: otherUser.id,
          name: otherUser.profiles?.name || 'Unknown',
          avatar_url: otherUser.profiles?.avatar_url || '',
        },
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.message,
          senderId: lastMessage.sender_id,
          sentAt: lastMessage.sent_at,
          isRead: lastMessage.is_read,
        } : null,
        unreadCount,
        updatedAt: lastMessage?.sent_at || match.matched_at,
      };
    })
  );

  // Sort by most recent message
  conversations.sort((a, b) => 
    new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
  );

  return conversations;
}

/**
 * Get messages for a specific match
 * @throws {Error} if user is not part of match
 */
export async function getMessages(
  userId: string,
  matchId: string,
  limit: number = 50,
  before?: string
) {
  // Verify user is part of this match
  const match = await prisma.matches.findFirst({
    where: {
      id: matchId,
      OR: [{ user1: userId }, { user2: userId }]
    },
    include: {
      users_matches_user1Tousers: {
        select: {
          id: true,
          profiles: {
            select: {
              name: true,
              avatar_url: true,
            }
          }
        }
      },
      users_matches_user2Tousers: {
        select: {
          id: true,
          profiles: {
            select: {
              name: true,
              avatar_url: true,
            }
          }
        }
      }
    }
  });

  if (!match) {
    throw new Error('Match not found or user not authorized');
  }

  // Fetch messages with cursor-based pagination
  const messages = await prisma.chats.findMany({
    where: {
      match_id: matchId,
      ...(before && {
        sent_at: { lt: new Date(before) }
      })
    },
    orderBy: { sent_at: 'desc' },
    take: limit,
  });

  const otherUser = match.user1 === userId 
    ? match.users_matches_user2Tousers 
    : match.users_matches_user1Tousers;

  return {
    id: matchId,
    matchId: match.id,
    otherUser: {
      id: otherUser.id,
      name: otherUser.profiles?.name || 'Unknown',
      avatar_url: otherUser.profiles?.avatar_url || '',
    },
    messages: messages.reverse(), // Return oldest first
  };
}

/**
 * Send a message in a match
 * @throws {Error} if user is not part of match
 */
export async function sendMessage(
  userId: string,
  matchId: string,
  message: string,
  message_type: string = 'TEXT',
  media_url?: string
) {
  // Verify user is part of this match
  const match = await prisma.matches.findFirst({
    where: {
      id: matchId,
      OR: [{ user1: userId }, { user2: userId }]
    }
  });

  if (!match) {
    throw new Error('Match not found or user not authorized');
  }

  // Create message
  const chat = await prisma.chats.create({
    data: {
      match_id: matchId,
      sender_id: userId,
      message,
      message_type,
      media_url,
      is_read: false,
    }
  });

  logger.info('Message sent', { 
    matchId, 
    messageId: chat.id, 
    senderId: userId,
    type: message_type
  });

  // TODO: Send push notification to other user
  // await sendPushNotification(recipientId, message);

  return chat;
}

/**
 * Mark all messages in a match as read
 */
export async function markAsRead(userId: string, matchId: string) {
  // Verify user is part of this match
  const match = await prisma.matches.findFirst({
    where: {
      id: matchId,
      OR: [{ user1: userId }, { user2: userId }]
    }
  });

  if (!match) {
    throw new Error('Match not found or user not authorized');
  }

  // Update all unread messages from other user
  const result = await prisma.chats.updateMany({
    where: {
      match_id: matchId,
      sender_id: { not: userId },
      is_read: false
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });

  logger.info('Messages marked as read', { 
    matchId, 
    userId, 
    count: result.count 
  });

  return result;
}

/**
 * Delete a message (only if sent by user)
 * @throws {Error} if message not found or user not authorized
 */
export async function deleteMessage(userId: string, messageId: string) {
  const message = await prisma.chats.findUnique({
    where: { id: messageId }
  });

  if (!message) {
    throw new Error('Message not found');
  }

  if (message.sender_id !== userId) {
    throw new Error('Not authorized to delete this message');
  }

  await prisma.chats.delete({
    where: { id: messageId }
  });

  logger.info('Message deleted', { messageId, userId });
}

/**
 * Get unread message count for a user (across all matches)
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const matches = await prisma.matches.findMany({
    where: {
      OR: [{ user1: userId }, { user2: userId }]
    },
    select: { id: true }
  });

  const matchIds = matches.map(m => m.id);

  const count = await prisma.chats.count({
    where: {
      match_id: { in: matchIds },
      sender_id: { not: userId },
      is_read: false
    }
  });

  return count;
}

/**
 * Check if user has permission to access a match
 */
export async function verifyMatchAccess(
  userId: string, 
  matchId: string
): Promise<boolean> {
  const match = await prisma.matches.findFirst({
    where: {
      id: matchId,
      OR: [{ user1: userId }, { user2: userId }]
    }
  });

  return !!match;
}