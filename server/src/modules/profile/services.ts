import { Profile } from "@/types/Profile";
import logger from "@/config/logger";
import prisma from "@/providers/prisma"; // default import

const sanitizeData = <T extends object>(data: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
};

export const createProfile = async (profileData: Profile) => {
  try {
    const profile = await prisma.profiles.create({ // plural "profiles"
      data: {
        ...profileData,
        updated_at: new Date(),
      },
    });

    logger.info("PROFILE_CREATED", { userId: profileData.user_id });
    return profile;
  } catch (error) {
    logger.error("CREATE_PROFILE_ERROR", { error, profileData });
    throw error;
  }
};

export const updateProfile = async (
  userId: string,
  profileData: Partial<Profile> = {}
) => {
  try {
    const sanitized = sanitizeData(profileData);

    // Convert birthdate to Date if present
    if (sanitized.birthdate) sanitized.birthdate = new Date(sanitized.birthdate);

    const existingProfile = await prisma.profiles.findUnique({
      where: { user_id: userId },
    });

    if (!existingProfile) {
      logger.warn("PROFILE_NOT_FOUND_FOR_UPDATE", { userId });
      return null;
    }

    const updatedProfile = await prisma.profiles.update({
      where: { user_id: userId },
      data: { ...sanitized, updated_at: new Date() },
    });

    logger.info("PROFILE_UPDATED", { userId, data: sanitized });
    return updatedProfile;
  } catch (error) {
    logger.error("UPDATE_PROFILE_ERROR", { error, userId, profileData });
    throw error;
  }
};



export const getProfileByUserId = async (userId: string) => {
  try {
    const profile = await prisma.profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) logger.warn("PROFILE_NOT_FOUND", { userId });
    else logger.info("PROFILE_FETCHED", { userId });

    return profile;
  } catch (error) {
    logger.error("GET_PROFILE_ERROR", { error, userId });
    throw error;
  }
};

export const deleteProfile = async (userId: string) => {
  try {
    await prisma.profiles.delete({
      where: { user_id: userId },
    });

    logger.info("PROFILE_DELETED", { userId });
  } catch (error) {
    logger.error("DELETE_PROFILE_ERROR", { error, userId });
    throw error;
  }
};
