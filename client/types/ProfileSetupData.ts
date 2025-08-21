export interface ProfileSetupData {
  name: string;
  avatar_url: string;
  age: string | number;              // <-- allow string for placeholder
  birthdate: string;
  gender: "Male" | "Female" | "Non-binary" | "Other" | ""; // <-- "" as placeholder
  pronouns: string;
  bio: string;
  university: string;
  university_year: "Freshman" | "Sophomore" | "Junior" | "Senior" | "Graduate" | "";
  major: string;
  grad_year: string | number;
  interests: string[];
  intent: "dating" | "friendship" | "networking" | "casual";
  genderPreference: "Non-binary" | "Other" | "Men" | "Women" | "All" | "";
  sexualOrientation: "Other" | "Straight" | "Gay" | "Lesbian" | "Bisexual" | "Questioning" | "";
  min_age: string | number;
  max_age: string | number;
  photos: string[];
  spotify_url?: string;
  instagram_url?: string;
}
