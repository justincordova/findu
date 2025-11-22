// uploadService.ts
import { storageApi } from "@/api/storage";
import { useProfileSetupStore } from "@/store/profileStore";
import logger from "@/config/logger";
import { getImageType } from "@/utils/profile/image";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Compress image using Expo ImageManipulator
 */
async function compressImage(uri: string): Promise<Blob> {
  logger.info("[upload] compressImage input:", uri);

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Fetch returns a proper Blob for RN
  const response = await fetch(result.uri);
  const blob = await response.blob();

  logger.info("[upload] compressImage blob size:", blob.size);
  return blob;
}

/**
 * Upload a file using signed URL and return the full public URL
 */
async function uploadViaSignedUrl(
  userId: string,
  fileName: string,
  fileData: Blob,
  mode: "setup" | "update"
): Promise<string> {
  logger.info("[upload] uploadViaSignedUrl start", {
    userId,
    fileName,
    size: fileData.size,
    mode,
  });

  // Request signed URL from backend
  const { uploadUrl, path } = await storageApi.getUploadUrl(userId, fileName, mode);

  // Use fetch PUT for mobile (React Native)
  const res = await fetch(uploadUrl, {
    method: "PUT",
    body: fileData,
    headers: { "Content-Type": fileData.type },
  });

  if (!res.ok) {
    throw new Error(`[upload] Failed to upload file: ${res.status}`);
  }

  logger.info("[upload] File uploaded successfully", { uploadUrl });

  // Construct public URL (make sure bucket name is correct & public)
  const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/${path}`;
  return publicUrl;
}

/**
 * Upload avatar
 */
export async function uploadAvatar(
  userId: string,
  avatarUri: string | undefined,
  mode: "setup" | "update"
): Promise<string> {
  if (!avatarUri || avatarUri.startsWith("https://")) return avatarUri ?? "";

  const ext = getImageType(avatarUri);
  const avatarName = `avatar.${ext}`; // Fixed filename
  const avatarBlob = await compressImage(avatarUri);

  const publicUrl = await uploadViaSignedUrl(userId, avatarName, avatarBlob, mode);

  useProfileSetupStore.getState().setField("avatar_url", publicUrl);
  logger.info("[upload] Avatar uploaded", { userId, url: publicUrl, mode });

  return publicUrl;
}

/**
 * Upload multiple photos
 */
export async function uploadPhotos(
  userId: string,
  photoUris: string[],
  mode: "setup" | "update"
): Promise<string[]> {
  const uploadedPhotos = await Promise.all(
    photoUris.map(async (uri, i) => {
      if (uri.startsWith("https://")) return uri;

      const ext = getImageType(uri);
      const photoName = `photo_${i}.${ext}`; // Fixed filename
      const photoBlob = await compressImage(uri);

      const publicUrl = await uploadViaSignedUrl(userId, photoName, photoBlob, mode);
      logger.info("[upload] Photo uploaded", { userId, url: publicUrl, mode });

      return publicUrl;
    })
  );

  useProfileSetupStore.getState().setField("photos", uploadedPhotos);
  return uploadedPhotos;
}

/**
 * Upload a single photo and update it in the store
 */
export async function updatePhoto(
  userId: string,
  photoUri: string,
  photoIndex: number
): Promise<string> {
  if (photoUri.startsWith("https://")) return photoUri;

  const ext = getImageType(photoUri);
  const photoName = `photo_${photoIndex}.${ext}`; // Fixed filename
  const photoBlob = await compressImage(photoUri);

  const publicUrl = await uploadViaSignedUrl(userId, photoName, photoBlob, "update");
  logger.info("[upload] Photo updated", { userId, url: publicUrl, index: photoIndex });

  // Update the specific photo in the store
  const currentPhotos = useProfileSetupStore.getState().data.photos ?? [];
  const updatedPhotos = [...currentPhotos];
  updatedPhotos[photoIndex] = publicUrl;
  useProfileSetupStore.getState().setField("photos", updatedPhotos);

  return publicUrl;
}
