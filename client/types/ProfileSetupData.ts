export interface ProfileSetupData {
  // Basic Info
  name: string;
  avatar_url: string;
  age: number;
  birthdate: string;
  gender: "Male" | "Female" | "Non-binary" | "Other";
  pronouns: string;
  bio: string;

  // Academic Info
  university: string;
  university_year: "Freshman" | "Sophomore" | "Junior" | "Senior" | "Graduate";
  major: string;
  grad_year: number;

  // Preferences / Interests
  interests: string[];
  intent: string; // matches "Looking for"
  genderPreference: "Men" | "Women" | "Non-binary" | "All" | "Other"; // replaced looking_for_gender
  sexualOrientation: "Straight" | "Gay" | "Lesbian" | "Bisexual" | "Questioning" | "Other"; // added
  min_age: number;
  max_age: number;

  // Photos (URLs of up to 6 photos)
  photos: string[];

  // Social Links (optional)
  spotify_url?: string;
  instagram_url?: string;
}
