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