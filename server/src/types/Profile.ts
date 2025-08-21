export interface Profile {
  user_id: string;
  name: string;
  avatar_url: string;
  age: number;
  birthdate: Date;
  gender: string;
  pronouns: string;
  bio: string;
  university: string;
  university_year: number;
  major: string;
  grad_year: number;
  interests: string[];
  intent: string;
  gender_preference: string[];
  sexual_orientation: string;
  min_age: number;
  max_age: number;
  spotify_url?: string;
  instagram_url?: string;
  photos: string[];
  readonly created_at: Date;
  readonly updated_at: Date;
}
