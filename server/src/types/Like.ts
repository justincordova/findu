export interface Like {
  id: string;
  from_user: string;        // user who sent the like
  to_user: string;          // user who received the like
  created_at: string;
  is_superlike?: boolean;
  active: boolean;          // whether the like is active (false = unliked)
}
