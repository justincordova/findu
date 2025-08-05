export interface Like {
  id: string;
  from_user: string; // user who sent the like
  to_user: string; // user who received the like
  is_superlike: boolean;
  created_at: string;
  updated_at: string;
}
