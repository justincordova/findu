export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  message_type?: 'TEXT' | 'IMAGE' | 'GIF' | 'VOICE';
  media_url?: string;
  is_read: boolean;
  read_at?: Date;
  sent_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string; // match_id
  matchId: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    sentAt: Date;
    isRead: boolean;
  };
  unreadCount: number;
  updatedAt: Date;
}

export interface ConversationDetail {
  id: string;
  matchId: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url: string;
  };
  messages: Message[];
}