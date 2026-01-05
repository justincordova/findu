export interface CreateMessageInput {
  match_id: string;
  sender_id: string;
  message: string;
  media_url?: string;
  message_type?: "TEXT" | "IMAGE" | "VIDEO";
}

export interface UpdateMessageInput {
  message?: string;
  is_read?: boolean;
}

export interface ChatHistoryQuery {
  match_id: string;
  limit?: number;
  cursor?: string;
}

export interface MessageResponse {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  media_url: string | null;
  message_type: string;
}
