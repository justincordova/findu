import { create } from "zustand";
import logger from "@/config/logger";
import { ChatState, ChatMessage, ChatConversation } from "@/types/chat";

/**
 * Default conversation state template
 * Used when initializing new conversations
 */
const defaultConversation: ChatConversation = {
  match_id: "",
  messages: [],
  isLoading: false,
  error: null,
  hasMore: true,
  cursor: null,
  userTyping: false,
  otherUserOnline: false,
};

/**
 * Chat state management store
 * Manages conversations, messages, and real-time chat state
 * Stores multiple conversations indexed by match_id for efficient access
 */
export const useChatStore = create<ChatState>((set) => ({
  // State properties
  conversations: {},
  currentMatchId: null,

  /**
   * Set the current active match/conversation
   * Initializes conversation state if it doesn't exist
   * @param {string} matchId - The match ID to set as current
   */
  setCurrentMatch: (matchId: string) => {
    set((state) => {
      if (!state.conversations[matchId]) {
        state.conversations[matchId] = {
          ...defaultConversation,
          match_id: matchId,
        };
      }
      logger.debug(`Chat: set current match to ${matchId}`);
      return { currentMatchId: matchId };
    });
  },

  /**
   * Add a message to a conversation
   * Appends message to the end of the messages array (prevents duplicates)
   * @param {string} matchId - The match ID for the conversation
   * @param {ChatMessage} message - The message to add
   */
  addMessage: (matchId: string, message: ChatMessage) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      // Prevent duplicates - check if message with this ID already exists
      const messageExists = conversation.messages.some((msg) => msg.id === message.id);
      if (messageExists) {
        logger.debug(`Chat: message ${message.id} already exists, skipping duplicate`);
        return state;
      }

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: [...conversation.messages, message],
          },
        },
      };
    });
  },

  /**
   * Delete a message from a conversation (hard delete)
   * Removes message from the messages array
   * @param {string} matchId - The match ID for the conversation
   * @param {string} messageId - The message ID to delete
   */
  deleteMessage: (matchId: string, messageId: string) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      logger.debug(`Chat: delete message ${messageId} from ${matchId}`);

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: conversation.messages.filter((msg) => msg.id !== messageId),
          },
        },
      };
    });
  },

  /**
   * Edit a message in a conversation
   * Updates message text and sets edited_at timestamp
   * @param {string} matchId - The match ID for the conversation
   * @param {string} messageId - The message ID to edit
   * @param {string} newText - The new message text
   */
  editMessage: (matchId: string, messageId: string, newText: string) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      logger.debug(`Chat: edit message ${messageId} in ${matchId}`);

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: conversation.messages.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    message: newText,
                    edited_at: new Date().toISOString(),
                  }
                : msg
            ),
          },
        },
      };
    });
  },

  /**
   * Set all messages for a conversation
   * Replaces the entire messages array (used for loading chat history)
   * @param {string} matchId - The match ID for the conversation
   * @param {ChatMessage[]} messages - The messages to set
   */
  setMessages: (matchId: string, messages: ChatMessage[]) => {
    set((state) => {
      logger.debug(`Chat: set ${messages.length} messages for ${matchId}`);

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...(state.conversations[matchId] || defaultConversation),
            match_id: matchId,
            messages,
          },
        },
      };
    });
  },

  /**
   * Set loading state for a conversation
   * Used when fetching messages or performing async operations
   * @param {string} matchId - The match ID for the conversation
   * @param {boolean} loading - Whether the conversation is loading
   */
  setLoading: (matchId: string, loading: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          isLoading: loading,
        },
      },
    }));
  },

  /**
   * Set error state for a conversation
   * @param {string} matchId - The match ID for the conversation
   * @param {string | null} error - The error message or null to clear
   */
  setError: (matchId: string, error: string | null) => {
    set((state) => {
      if (error) {
        logger.error(`Chat: error in ${matchId}: ${error}`);
      }
      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...(state.conversations[matchId] || defaultConversation),
            match_id: matchId,
            error,
          },
        },
      };
    });
  },

  /**
   * Set whether there are more messages to load
   * Used for pagination to determine if we've reached the end of history
   * @param {string} matchId - The match ID for the conversation
   * @param {boolean} hasMore - Whether more messages exist
   */
  setHasMore: (matchId: string, hasMore: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          hasMore,
        },
      },
    }));
  },

  /**
   * Set pagination cursor for loading older messages
   * @param {string} matchId - The match ID for the conversation
   * @param {string | null} cursor - The cursor token for pagination
   */
  setCursor: (matchId: string, cursor: string | null) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          cursor,
        },
      },
    }));
  },

  /**
   * Set typing indicator for the current user
   * @param {string} matchId - The match ID for the conversation
   * @param {boolean} typing - Whether the current user is typing
   */
  setUserTyping: (matchId: string, typing: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          userTyping: typing,
        },
      },
    }));
  },

  /**
   * Set online status for the other user in the conversation
   * @param {string} matchId - The match ID for the conversation
   * @param {boolean} online - Whether the other user is online
   */
  setOtherUserOnline: (matchId: string, online: boolean) => {
    set((state) => ({
      conversations: {
        ...state.conversations,
        [matchId]: {
          ...(state.conversations[matchId] || defaultConversation),
          match_id: matchId,
          otherUserOnline: online,
        },
      },
    }));
  },

  /**
   * Mark all messages in a conversation as read
   * Updates is_read and read_at for unread messages
   * @param {string} matchId - The match ID for the conversation
   */
  markAsRead: (matchId: string) => {
    set((state) => {
      const conversation = state.conversations[matchId];
      if (!conversation) return state;

      logger.debug(`Chat: mark all messages as read in ${matchId}`);

      return {
        conversations: {
          ...state.conversations,
          [matchId]: {
            ...conversation,
            messages: conversation.messages.map((msg) =>
              msg.is_read ? msg : { ...msg, is_read: true, read_at: new Date().toISOString() }
            ),
          },
        },
      };
    });
  },

  /**
   * Reset all chat state
   * Clears all conversations and resets current match
   */
  reset: () => {
    logger.info("Chat store reset");
    set({ conversations: {}, currentMatchId: null });
  },
}));
