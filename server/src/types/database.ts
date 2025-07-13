// Database Types for FindU Dating App

export interface User {
  id: string;
  email: string;
  username: string;
  f_name: string;
  l_name: string;
  avatar_url: string | null;
  campus: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  user_id: string;
  bio: string;
  age: number;
  birthdate: string;
  gender: string;
  pronouns: string | null;
  major: string | null;
  grad_year: number | null;
  interests: string[] | null;
  intent: string | null;
  looking_for_gender: string[] | null;
  min_age: number | null;
  max_age: number | null;
  spotify_url: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  from_user: string;
  to_user: string;
  created_at: string;
}

export interface Match {
  id: string;
  user1: string;
  user2: string;
  matched_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  message: string;
  sent_at: string;
  created_at: string;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Tip {
  id: string;
  user_id: string | null;
  amount: number;
  created_at: string;
}