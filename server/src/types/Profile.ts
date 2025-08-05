export interface Profile {
  user_id: string;
  f_name: string | null;
  l_name: string | null;
  avatar_url: string | null;
  university: string;
  bio: string | null;
  age: number | null;
  birthdate: string | null; // DATE type in DB
  gender: string | null;
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
