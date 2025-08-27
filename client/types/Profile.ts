export interface Profile {
  user_id: string;
  name: string;
  avatar_url: string;
  birthdate: string;
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
  photos: string[];
}
