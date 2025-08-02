export interface Chat {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

export interface ChatList {
  match_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  other_user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface CreateMessageRequest {
  message: string;
}

export interface UnreadCountResponse {
  total_unread: number;
}

export interface MatchUnreadCountResponse {
  unread_count: number;
}
