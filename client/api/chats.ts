import { handleResponse } from "./utils";
import { useAuthStore } from "@/store/authStore";
import { ChatMessage } from "@/types/chat";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/chats`;

/**
 * Send a message to a match
 * @param {string} token - Authentication token
 * @param {string} matchId - ID of the match
 * @param {string} message - Message text
 * @param {string} [mediaUrl] - Optional media URL
 * @param {string} [messageType] - Message type (TEXT, IMAGE, VIDEO)
 * @returns {Promise<ChatMessage>}
 */
async function sendMessage(
  token: string,
  matchId: string,
  message: string,
  mediaUrl?: string,
  messageType?: "TEXT" | "IMAGE" | "VIDEO"
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      match_id: matchId,
      message,
      media_url: mediaUrl,
      message_type: messageType || "TEXT",
    }),
  });
  return handleResponse<ChatMessage>(res, "sendMessage");
}

/**
 * Fetch chat history with pagination
 * @param {string} token - Authentication token
 * @param {string} matchId - ID of the match
 * @param {number} [limit] - Number of messages to fetch (default: 50)
 * @param {string} [cursor] - Pagination cursor for older messages
 * @returns {Promise<ChatMessage[]>}
 */
async function getChatHistory(
  token: string,
  matchId: string,
  limit?: number,
  cursor?: string
): Promise<ChatMessage[]> {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (cursor) params.append("cursor", cursor);

  const queryString = params.toString();
  const url = `${API_BASE}/${matchId}/history${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<ChatMessage[]>(res, "getChatHistory");
}

/**
 * Get the latest message in a match (for unread indicator)
 * Returns null if no messages or error occurs
 * @param {string} token - Authentication token
 * @param {string} matchId - ID of the match
 * @returns {Promise<ChatMessage | null>}
 */
async function getLatestMessage(
  token: string,
  matchId: string
): Promise<ChatMessage | null> {
  try {
    const res = await fetch(`${API_BASE}/${matchId}/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<ChatMessage>(res, "getLatestMessage");
  } catch (err) {
    return null;
  }
}

/**
 * Mark all messages in a match as read
 * @param {string} token - Authentication token
 * @param {string} matchId - ID of the match
 * @returns {Promise<{ updated: number }>}
 */
async function markMessagesAsRead(
  token: string,
  matchId: string
): Promise<{ updated: number }> {
  const res = await fetch(`${API_BASE}/${matchId}/read`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ updated: number }>(res, "markMessagesAsRead");
}

/**
 * Delete a message (only sender can delete)
 * @param {string} token - Authentication token
 * @param {string} messageId - ID of the message to delete
 * @returns {Promise<{ id: string }>}
 */
async function deleteMessage(
  token: string,
  messageId: string
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse<{ id: string }>(res, "deleteMessage");
}

/**
 * Edit a message (only sender can edit)
 * @param {string} token - Authentication token
 * @param {string} messageId - ID of the message to edit
 * @param {string} newMessage - New message text
 * @returns {Promise<ChatMessage>}
 */
async function editMessage(
  token: string,
  messageId: string,
  newMessage: string
): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE}/${messageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: newMessage }),
  });
  return handleResponse<ChatMessage>(res, "editMessage");
}

/**
 * Upload media file to a match
 * @param {string} token - Authentication token
 * @param {string} matchId - ID of the match
 * @param {File} file - File to upload
 * @returns {Promise<{ media_url: string }>}
 */
async function uploadMedia(
  token: string,
  matchId: string,
  file: File
): Promise<{ media_url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/${matchId}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse<{ media_url: string }>(res, "uploadMedia");
}

/**
 * ChatsAPI - Object containing all chat API methods
 * Provides interface for consuming chat API with automatic token injection
 */
export const ChatsAPI = {
  /**
   * Send a message to a match
   * @param {string} matchId - ID of the match
   * @param {string} message - Message text
   * @param {string} [mediaUrl] - Optional media URL
   * @param {string} [messageType] - Message type (TEXT, IMAGE, VIDEO)
   * @returns {Promise<ChatMessage>}
   */
  sendMessage: async (
    matchId: string,
    message: string,
    mediaUrl?: string,
    messageType?: "TEXT" | "IMAGE" | "VIDEO"
  ): Promise<ChatMessage> => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("No authentication token available");
    return sendMessage(token, matchId, message, mediaUrl, messageType);
  },

  /**
   * Fetch chat history with pagination
   * @param {string} matchId - ID of the match
   * @param {number} [limit] - Number of messages to fetch (default: 50)
   * @param {string} [cursor] - Pagination cursor for older messages
   * @returns {Promise<ChatMessage[]>}
   */
  getChatHistory: async (
    matchId: string,
    limit?: number,
    cursor?: string
  ): Promise<ChatMessage[]> => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("No authentication token available");
    return getChatHistory(token, matchId, limit, cursor);
  },

  /**
   * Get the latest message in a match (for unread indicator)
   * Returns null if no messages or error occurs
   * @param {string} matchId - ID of the match
   * @returns {Promise<ChatMessage | null>}
   */
  getLatestMessage: async (matchId: string): Promise<ChatMessage | null> => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("No authentication token available");
    return getLatestMessage(token, matchId);
  },

  /**
   * Mark all messages in a match as read
   * @param {string} matchId - ID of the match
   * @returns {Promise<{ updated: number }>}
   */
  markMessagesAsRead: async (matchId: string): Promise<{ updated: number }> => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("No authentication token available");
    return markMessagesAsRead(token, matchId);
  },

  /**
   * Delete a message (only sender can delete)
   * @param {string} messageId - ID of the message to delete
   * @returns {Promise<{ id: string }>}
   */
  deleteMessage: async (messageId: string): Promise<{ id: string }> => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("No authentication token available");
    return deleteMessage(token, messageId);
  },

  /**
   * Edit a message (only sender can edit)
   * @param {string} messageId - ID of the message to edit
   * @param {string} newMessage - New message text
   * @returns {Promise<ChatMessage>}
   */
  editMessage: async (
    messageId: string,
    newMessage: string
  ): Promise<ChatMessage> => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("No authentication token available");
    return editMessage(token, messageId, newMessage);
  },

  /**
   * Upload media file to a match
   * @param {string} matchId - ID of the match
   * @param {File} file - File to upload
   * @returns {Promise<{ media_url: string }>}
   */
  uploadMedia: async (
    matchId: string,
    file: File
  ): Promise<{ media_url: string }> => {
    const { token } = useAuthStore.getState();
    if (!token) throw new Error("No authentication token available");
    return uploadMedia(token, matchId, file);
  },
};
