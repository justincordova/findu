export interface Profile {
  user_id: string;
  name: string;
  avatar_url: string;
  birthdate: string;
  gender: string;
  pronouns: string;
  bio: string;
  university_id: string;
  campus_id: string | null;
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

// For display purposes of uni name
export interface ProfileSetupData extends Partial<Profile> {
  university_name?: string;
  campus_name?: string;
}