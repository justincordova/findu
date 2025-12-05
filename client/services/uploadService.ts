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

  useProfileSetupStore.getState().setProfileField("avatar_url", publicUrl);
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
  // Get existing photos from the store
  const existingPhotos = mode === "update" 
    ? (useProfileSetupStore.getState().data.photos ?? [])
    : [];
  
  const startIndex = existingPhotos.length;
  
  const uploadedPhotos = await Promise.all(
    photoUris.map(async (uri, i) => {
      if (uri.startsWith("https://")) return uri;

      const ext = getImageType(uri);
      const photoName = `photo_${startIndex + i}.${ext}`; // Use correct index to append
      const photoBlob = await compressImage(uri);

      const publicUrl = await uploadViaSignedUrl(userId, photoName, photoBlob, mode);
      logger.info("[upload] Photo uploaded", { userId, url: publicUrl, mode });

      return publicUrl;
    })
  );

  // Combine existing and new photos
  const allPhotos = [...existingPhotos, ...uploadedPhotos];
  useProfileSetupStore.getState().setProfileField("photos", allPhotos);
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
  if (photoUri.startsWith("https://")) {
    logger.info("[upload] Photo already has public URL, skipping upload", {
      userId,
      photoIndex,
      url: photoUri
    });
    return photoUri;
  }

  logger.info("[upload] Starting photo update", {
    userId,
    photoIndex,
    uri: photoUri
  });

  try {
    const ext = getImageType(photoUri);
    const photoName = `photo_${photoIndex}.${ext}`; // Fixed filename

    logger.info("[upload] Compressing photo", {
      userId,
      photoIndex,
      targetFilename: photoName
    });

    const photoBlob = await compressImage(photoUri);

    logger.info("[upload] Requesting signed URL for photo update", {
      userId,
      photoIndex,
      fileName: photoName,
      compressedSize: photoBlob.size
    });

    const publicUrl = await uploadViaSignedUrl(userId, photoName, photoBlob, "update");

    logger.info("[upload] Photo updated successfully", {
      userId,
      photoIndex,
      url: publicUrl,
      fileName: photoName
    });

    return publicUrl;
  } catch (error: any) {
    logger.error("[upload] Failed to update photo", {
      userId,
      photoIndex,
      error: error?.message || String(error)
    });
    throw error;
  }
}
