import { ChatsAPI } from '@/api/chats';
import { useAuthStore } from '@/store/authStore';
import logger from '@/config/logger';

/**
 * Get all conversations for current user
 */
export async function getConversations() {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    logger.warn('Not authenticated for conversations');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const data = await ChatsAPI.getConversations(token);
    
    logger.info('Conversations fetched', { 
      count: data?.conversations?.length || 0
    });
    
    return { success: true, data };
  } catch (err) {
    logger.error('Failed to fetch conversations', { err });
    return { 
      success: false, 
      error: 'Failed to fetch conversations' 
    };
  }
}

/**
 * Get messages for a specific match
 */
export async function getMessages(
  matchId: string,
  limit: number = 50,
  before?: string
) {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    logger.warn('Not authenticated for messages');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const data = await ChatsAPI.getMessages(token, matchId, limit, before);
    
    logger.info('Messages fetched', { 
      matchId,
      messageCount: data?.conversation?.messages?.length || 0 
    });
    
    return { success: true, data };
  } catch (err) {
    logger.error('Failed to fetch messages', { matchId, err });
    return { 
      success: false, 
      error: 'Failed to fetch messages' 
    };
  }
}

/**
 * Send a message
 */
export async function sendMessage(
  matchId: string,
  message: string,
  type: 'TEXT' | 'IMAGE' | 'GIF' = 'TEXT',
  media_url?: string
) {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    logger.warn('Not authenticated to send message');
    return { success: false, error: 'Not authenticated' };
  }

  if (!message.trim() && type === 'TEXT') {
    logger.warn('Attempted to send empty message');
    return { success: false, error: 'Message cannot be empty' };
  }

  try {
    const data = await ChatsAPI.sendMessage(
      token,
      matchId,
      message,
      type,
      media_url
    );
    
    logger.info('Message sent', { 
      matchId, 
      messageId: data?.message?.id,
      type 
    });
    
    return { success: true, data };
  } catch (err) {
    logger.error('Failed to send message', { matchId, err });
    return { 
      success: false, 
      error: 'Failed to send message' 
    };
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(matchId: string) {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await ChatsAPI.markAsRead(token, matchId);
    logger.info('Messages marked as read', { matchId });
    return { success: true };
  } catch (err) {
    logger.error('Failed to mark as read', { matchId, err });
    return { 
      success: false, 
      error: 'Failed to mark as read' 
    };
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string) {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await ChatsAPI.deleteMessage(token, messageId);
    logger.info('Message deleted', { messageId });
    return { success: true };
  } catch (err) {
    logger.error('Failed to delete message', { messageId, err });
    return { 
      success: false, 
      error: 'Failed to delete message' 
    };
  }
}

/**
 * Load more messages (pagination)
 */
export async function loadMoreMessages(
  matchId: string,
  beforeDate: Date,
  limit: number = 50
) {
  const { token } = useAuthStore.getState();
  
  if (!token) {
    return { success: false, error: 'Not authenticated', hasMore: false };
  }

  try {
    const data = await ChatsAPI.getMessages(
      token, 
      matchId, 
      limit, 
      beforeDate.toISOString()
    );
    
    const messages = data?.conversation?.messages || [];
    const hasMore = messages.length === limit;
    
    logger.info('More messages loaded', { 
      matchId, 
      count: messages.length,
      hasMore
    });
    
    return { success: true, data, hasMore };
  } catch (err) {
    logger.error('Failed to load more messages', { matchId, err });
    return { 
      success: false, 
      error: 'Failed to load more messages',
      hasMore: false
    };
  }
}