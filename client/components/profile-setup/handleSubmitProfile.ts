import { supabase } from "@/lib/supabaseClient";
import { useProfileSetupStore } from "@/store/profileSetupStore";
import { profileApi } from "@/api/profileSetup";
import logger from "@/config/logger";
import { validateProfile } from "../../utils/profile/validation";
import { uploadAvatar, uploadPhotos } from "../../utils/profile/upload";
import { Profile } from "@/types/Profile";

export async function handleSubmitProfile() {
  logger.info("Starting profile submission...");

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  if (!session?.access_token) throw new Error("User not authenticated");

  const userId = session.user.id;
  const profileData = useProfileSetupStore.getState().data;
  if (!profileData) throw new Error("Profile data is empty");

  logger.info("User authenticated, profile data retrieved.", { userId });

  try {
    const photoUris = profileData.photos ?? [];

    const [avatarUrl, uploadedPhotos] = await Promise.all([
      uploadAvatar(userId, profileData.avatar_url),
      uploadPhotos(userId, photoUris),
    ]);

    logger.info(`Uploaded avatar and ${uploadedPhotos.length} photos`, {
      userId,
    });

    const finalProfile: Profile = {
      user_id: userId,
      name: profileData.name ?? "",
      birthdate: profileData.birthdate ?? "",
      gender: profileData.gender ?? "",
      pronouns: profileData.pronouns ?? "",
      bio: profileData.bio ?? "",
      university: profileData.university ?? "",
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
      photos: uploadedPhotos ?? []
    };

    validateProfile(finalProfile);
    await profileApi.create(finalProfile);

    logger.info("Profile submitted successfully", { userId });
    useProfileSetupStore.getState().reset();
  } catch (err: any) {
    logger.error("Failed to submit profile", err);
    throw err;
  }
}
