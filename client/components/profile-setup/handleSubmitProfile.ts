import { useProfileSetupStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { profileApi } from "@/api/profile";
import logger from "@/config/logger";
import { validateProfile } from "@/utils/profile/validation";
import { uploadAvatar, uploadPhotos } from "@/services/uploadService";
import { Profile } from "@/types/Profile";

/**
 * Submit profile for the currently authenticated user
 */
export async function handleSubmitProfile(userId?: string) {
  try {
    const authState = useAuthStore.getState();
    logger.debug("Checking auth state");

    const currentUserId = userId ?? authState.userId;
    if (!currentUserId) {
      logger.error("[handleSubmitProfile] No userId found in store or argument", {
        userId,
        authState,
      });
      throw new Error("User not authenticated");
    }

    const profileData = useProfileSetupStore.getState().data;
    if (!profileData) {
      logger.error("[handleSubmitProfile] Profile data empty", { authState });
      throw new Error("Profile data is empty");
    }

    logger.info("Profile submission started", { userId: currentUserId });

    // Upload avatar & photos in "setup" mode
    const [avatarUrl, uploadedPhotos] = await Promise.all([
      uploadAvatar(currentUserId, profileData.avatar_url, "setup"),
      uploadPhotos(currentUserId, profileData.photos ?? [], "setup"),
    ]);

    logger.debug("Upload completed");

    // Build final profile object
    const finalProfile: Profile = {
      user_id: currentUserId,
      name: profileData.name ?? "",
      birthdate: profileData.birthdate ?? "",
      gender: profileData.gender ?? "",
      pronouns: profileData.pronouns ?? "",
      bio: profileData.bio ?? "",
      university_id: profileData.university_id ?? "",
      campus_id: profileData.campus_id ?? null,
      university_year: profileData.university_year ?? 0,
      major: profileData.major ?? "",
      grad_year: Number(profileData.grad_year) || 0,
      interests: profileData.interests ?? [],
      intent: profileData.intent ?? "",
      gender_preference: profileData.gender_preference ?? [],
      sexual_orientation: profileData.sexual_orientation ?? "",
      min_age: Number(profileData.min_age) || 0,
      max_age: Number(profileData.max_age) || 0,
      avatar_url: avatarUrl ?? "",
      photos: uploadedPhotos ?? [],
      lifestyle: profileData.lifestyle ?? undefined,
    };

    // Validate before submission
    validateProfile(finalProfile);
    logger.debug("Validation passed");

    // Submit via API
    await profileApi.create(finalProfile);
    logger.info("Profile submitted successfully", { userId: currentUserId });

    // Reset local store
    useProfileSetupStore.getState().reset();
  } catch (err: any) {
    logger.error("[handleSubmitProfile] Failed to submit profile", { error: err });
    throw err;
  }
}
