export interface Match {
  id: string;
  user1: string;
  user2: string;
  matched_at: Date;
}

export interface MatchWithProfile extends Match {
  otherUser: {
    id: string;
    name: string;
    avatar_url: string;
  };
}