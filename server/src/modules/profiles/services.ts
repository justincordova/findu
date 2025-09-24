import { Profile } from "@/types/Profile";
import logger from "@/config/logger";
import prisma from "@/lib/prismaClient";

const sanitizeData = <T extends object>(data: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
};

/**
 * Creates a new profile for a user.
 *
 * @param profileData - The profile data to create.
 * @returns The newly created profile.
 * @throws If the database operation fails.
 */
export const createProfile = async (profileData: Profile): Promise<Profile> => {
  try {
    const profile = await prisma.profiles.create({
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

/**
 * Updates an existing profile for a user.
 *
 * @param userId - The ID of the user whose profile to update.
 * @param profileData - The profile fields to update.
 * @returns The updated profile, or `null` if no profile exists for the given user.
 * @throws If the database operation fails.
 */
export const updateProfile = async (
  userId: string,
  profileData: Partial<Profile> = {}
): Promise<Profile | null> => {
  try {
    const sanitized = sanitizeData(profileData);

    if (sanitized.birthdate)
      sanitized.birthdate = new Date(sanitized.birthdate);

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

/**
 * Fetches a profile by user ID.
 *
 * @param userId - The ID of the user whose profile to fetch.
 * @returns The profile, or `null` if not found.
 * @throws If the database operation fails.
 */
export const getProfileByUserId = async (
  userId: string
): Promise<Profile | null> => {
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

/**
 * Deletes a profile by user ID.
 *
 * @param userId - The ID of the user whose profile to delete.
 * @returns A promise that resolves when the profile is deleted.
 * @throws If the database operation fails.
 */
export const deleteProfile = async (userId: string): Promise<void> => {
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


/**
 * Given a user email, resolve the university and campuses.
 *
 * @param email - The user's email address
 * @returns An object with university and campuses, or null if not found
 */
export const resolveUniversityAndCampuses = async (email: string) => {
  try {
    const domain = email.split("@")[1].toLowerCase();

    // Use findFirst since domain alone is not unique in Prisma types
    const uniDomain = await prisma.university_domains.findFirst({
      where: { domain },
      include: {
        universities: {
          include: { campuses: true }
        }
      }
    });

    if (!uniDomain?.universities) return null;

    const university = {
      id: uniDomain.universities.id,
      name: uniDomain.universities.name,
      slug: uniDomain.universities.slug
    };

    const campuses = uniDomain.universities.campuses.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug
    }));

    return { university, campuses };
  } catch (error) {
    console.error("Error resolving university:", error);
    throw error;
  }
};
