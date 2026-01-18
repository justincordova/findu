export interface Like {
  from_user: string;
  to_user: string;
  is_superlike?: boolean;
}
export interface CreateLikeResult {
  like: any; 
  matched: boolean;
  matchId: string | null;
}