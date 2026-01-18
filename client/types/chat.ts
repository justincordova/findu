export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  edited_at: string | null;
  media_url: string | null;
  message_type: "TEXT" | "IMAGE" | "VIDEO";
}

export interface ChatConversation {
  match_id: string;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  userTyping: boolean;
  otherUserOnline: boolean;
}

export interface ChatState {
  conversations: Record<string, ChatConversation>;
  currentMatchId: string | null;

  // Actions
  setCurrentMatch: (matchId: string) => void;
  addMessage: (matchId: string, message: ChatMessage) => void;
  deleteMessage: (matchId: string, messageId: string) => void;
  editMessage: (matchId: string, messageId: string, newText: string) => void;
  setMessages: (matchId: string, messages: ChatMessage[]) => void;
  setLoading: (matchId: string, loading: boolean) => void;
  setError: (matchId: string, error: string | null) => void;
  setHasMore: (matchId: string, hasMore: boolean) => void;
  setCursor: (matchId: string, cursor: string | null) => void;
  setUserTyping: (matchId: string, typing: boolean) => void;
  setOtherUserOnline: (matchId: string, online: boolean) => void;
  markAsRead: (matchId: string) => void;
  reset: () => void;
}
