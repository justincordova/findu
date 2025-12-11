const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/chats`;

async function handleResponse(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const ChatsAPI = {
  /**
   * Get all conversations for current user
   */
  getConversations: async (token: string) => {
    const res = await fetch(`${API_BASE}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },

  /**
   * Get messages for a specific match
   */
  getMessages: async (
    token: string, 
    matchId: string,
    limit: number = 50,
    before?: string
  ) => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    
    const res = await fetch(
      `${API_BASE}/${matchId}/messages?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return handleResponse(res);
  },

  /**
   * Send a message
   */
  sendMessage: async (
    token: string,
    matchId: string,
    message: string,
    message_type: 'TEXT' | 'IMAGE' | 'GIF' = 'TEXT',
    media_url?: string
  ) => {
    const res = await fetch(
      `${API_BASE}/${matchId}/messages`, // 👈 Changed path
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, message_type, media_url }),
      }
    );
    return handleResponse(res);
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (token: string, matchId: string) => {
    const res = await fetch(
      `${API_BASE}/${matchId}/read`, // 👈 Changed path
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return handleResponse(res);
  },

  /**
   * Delete a message
   */
  deleteMessage: async (token: string, messageId: string) => {
    const res = await fetch(`${API_BASE}/messages/${messageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },
};
