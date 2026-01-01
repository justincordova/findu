import { createContext, useContext } from "react";

/**
 * Profile data interface
 * Represents the user's complete profile
 */
export interface Profile {
  user_id: string;
  name: string;
  birthdate: string;
  avatar_url: string;
  bio: string;
  gender: string;
  pronouns: string;
  intent: string;
  sexual_orientation: string;
  min_age: number;
  max_age: number;
  gender_preference: string[];
  interests: string[];
  major: string;
  university_year: number;
  grad_year: number;
  university_name: string;
  photos: string[];
  [key: string]: any;
}

/**
 * ProfileContext value type
 * Provides profile data and refetch function to all components
 */
export interface ProfileContextValue {
  profile: Profile | null;
  refetch: () => Promise<void>;
  isEditable?: boolean;
}

/**
 * Profile context for sharing profile data across components
 * without prop drilling
 *
 * Usage:
 * ```tsx
 * <ProfileContext.Provider value={{ profile, refetch }}>
 *   <Component />
 * </ProfileContext.Provider>
 * ```
 */
export const ProfileContext = createContext<ProfileContextValue | null>(null);

/**
 * Hook to access profile context
 * Must be used within ProfileContext.Provider
 *
 * @returns ProfileContextValue containing profile data and refetch function
 * @throws Error if used outside of ProfileContext.Provider
 *
 * Usage:
 * ```tsx
 * const { profile, refetch } = useProfile();
 * ```
 */
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileContext.Provider");
  }
  return context;
}
