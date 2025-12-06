import { storageApi } from "@/api/storage";
import { useProfileSetupStore } from "@/store/profileStore";
import logger from "@/config/logger";
import { getImageType } from "@/utils/profile/image";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Compress image using Expo ImageManipulator
 * @param {string} uri - Local image URI to compress
 * @returns {Promise<Blob>} Compressed image blob
 */
async function compressImage(uri: string): Promise<Blob> {
  logger.debug("Compressing image", { uri });

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Fetch returns a proper Blob for RN
  const response = await fetch(result.uri);
  const blob = await response.blob();

  logger.debug("Image compressed", { size: blob.size });
  return blob;
}

/**
 * Upload a file using signed URL and return the full public URL
 * @param {string} userId - User ID for upload path
 * @param {string} fileName - Name of file to upload
 * @param {Blob} fileData - File blob to upload
 * @param {"setup" | "update"} mode - Upload mode (setup during profile creation, update for existing profile)
 * @returns {Promise<string>} Public URL of uploaded file
 * @throws {Error} If upload fails
 */
async function uploadViaSignedUrl(
  userId: string,
  fileName: string,
  fileData: Blob,
  mode: "setup" | "update"
): Promise<string> {
  logger.debug("Uploading via signed URL", {
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

  logger.info("File uploaded", { uploadUrl });

  // Construct public URL (make sure bucket name is correct & public)
  const publicUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/${path}`;
  return publicUrl;
}

/**
 * Upload user avatar image
 * Skips upload if already a URL, otherwise compresses and uploads to Supabase
 * @param {string} userId - User ID for upload path
 * @param {string | undefined} avatarUri - Local URI or HTTPS URL of avatar
 * @param {"setup" | "update"} mode - Upload mode
 * @returns {Promise<string>} Public URL of uploaded avatar
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
  logger.info("Avatar uploaded", { userId, url: publicUrl });

  return publicUrl;
}

/**
 * Upload multiple profile photos
 * Compresses and uploads photos in parallel, preserves existing photos on update
 * @param {string} userId - User ID for upload path
 * @param {string[]} photoUris - Array of local URIs or HTTPS URLs
 * @param {"setup" | "update"} mode - Upload mode
 * @returns {Promise<string[]>} Array of public URLs for uploaded photos
 */
export async function uploadPhotos(
  userId: string,
  photoUris: string[],
  mode: "setup" | "update"
): Promise<string[]> {
  // Get existing photos from the store
  const existingPhotos = mode === "update"
    ? (useProfileSetupStore.getState().data?.photos ?? [])
    : [];

  const startIndex = existingPhotos.length;

  const uploadedPhotos = await Promise.all(
    photoUris.map(async (uri, i) => {
      if (uri.startsWith("https://")) return uri;

      const ext = getImageType(uri);
      const photoName = `photo_${startIndex + i}.${ext}`; // Use correct index to append
      const photoBlob = await compressImage(uri);

      const publicUrl = await uploadViaSignedUrl(userId, photoName, photoBlob, mode);
      logger.info("Photo uploaded", { userId, url: publicUrl });

      return publicUrl;
    })
  );

  // Combine existing and new photos
  const allPhotos = [...existingPhotos, ...uploadedPhotos];
  useProfileSetupStore.getState().setProfileField("photos", allPhotos);
  return uploadedPhotos;
}

/**
 * Upload a single photo to replace an existing one at given index
 * @param {string} userId - User ID for upload path
 * @param {string} photoUri - Local URI or HTTPS URL of photo
 * @param {number} photoIndex - Index position in photos array
 * @returns {Promise<string>} Public URL of uploaded photo
 * @throws {Error} If photo compression or upload fails
 */
export async function updatePhoto(
  userId: string,
  photoUri: string,
  photoIndex: number
): Promise<string> {
  if (photoUri.startsWith("https://")) {
    logger.debug("Photo already uploaded, skipping", {
      photoIndex,
      url: photoUri
    });
    return photoUri;
  }

  logger.debug("Starting photo update", {
    photoIndex,
    uri: photoUri
  });

  try {
    const ext = getImageType(photoUri);
    const photoName = `photo_${photoIndex}.${ext}`; // Fixed filename

    logger.debug("Compressing photo", {
      photoIndex,
      targetFilename: photoName
    });

    const photoBlob = await compressImage(photoUri);

    logger.debug("Requesting signed URL", {
      photoIndex,
      fileName: photoName,
      compressedSize: photoBlob.size
    });

    const publicUrl = await uploadViaSignedUrl(userId, photoName, photoBlob, "update");

    logger.info("Photo updated", {
      photoIndex,
      url: publicUrl
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
