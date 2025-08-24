import { Profile } from "@/types/Profile";
import logger from "@/config/logger";
import { supabase } from "@/providers/supabase";

/**
 * Sanitize data to remove undefined values
 */
const sanitizeData = <T extends object>(data: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
};

/**
 * Create a new profile
 */
export const createProfile = async (profileData: Profile) => {
  try {
    const profile = await supabase
      .from("profiles")
      .insert({
        ...profileData,
        updated_at: new Date(),
      })
      .select()
      .single();

    logger.info("PROFILE_CREATED", { userId: profileData.user_id });
    return profile.data;
  } catch (error) {
    logger.error("CREATE_PROFILE_ERROR", { error, profileData });
    throw error;
  }
};

/**
 * Partially update an existing profile
 */
export const updateProfile = async (
  userId: string,
  profileData: Partial<Profile>
) => {
  try {
    const sanitized = sanitizeData(profileData);

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!existing) {
      logger.warn("PROFILE_NOT_FOUND_FOR_UPDATE", { userId });
      return null;
    }

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        ...sanitized,
        updated_at: new Date(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    logger.info("PROFILE_UPDATED", { userId });
    return updatedProfile;
  } catch (error) {
    logger.error("UPDATE_PROFILE_ERROR", { error, userId, profileData });
    throw error;
  }
};

/**
 * Get a profile by user ID
 */
export const getProfileByUserId = async (userId: string) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    if (!profile) {
      logger.warn("PROFILE_NOT_FOUND", { userId });
    } else {
      logger.info("PROFILE_FETCHED", { userId });
    }

    return profile;
  } catch (error) {
    logger.error("GET_PROFILE_ERROR", { error, userId });
    throw error;
  }
};

/**
 * Delete a profile by user ID
 */
export const deleteProfile = async (userId: string) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (error) throw error;

    logger.info("PROFILE_DELETED", { userId });
  } catch (error) {
    logger.error("DELETE_PROFILE_ERROR", { error, userId });
    throw error;
  }
};
