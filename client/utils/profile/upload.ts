import { supabase } from "@/lib/supabaseClient";
import { useProfileSetupStore } from "@/store/profileSetupStore";
import logger from "@/config/logger";
import { getImageType } from "./image";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Compress image using Expo ImageManipulator
 */
async function compressImage(uri: string): Promise<Uint8Array> {
  logger.info("[upload] compressImage: input uri", uri);

  // Resize & compress
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1920 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  logger.info("[upload] compressImage: result uri", result.uri);

  // Convert to Uint8Array
  const response = await fetch(result.uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  logger.info("[upload] compressImage: blob size", uint8Array.byteLength);

  return uint8Array;
}

/**
 * Upload a file to Supabase bucket under a user folder and return public URL
 */
async function uploadToUserFolder(
  bucket: string,
  userId: string,
  fileName: string,
  fileData: Uint8Array,
  mimeType: string = "image/jpeg"
): Promise<string> {
  const path = `${userId}/${fileName}`;

  logger.info("[upload] uploadToUserFolder: uploading", {
    bucket,
    path,
    fileName,
    byteLength: fileData.byteLength,
  });

  const { error } = await supabase.storage.from(bucket).upload(path, fileData, {
    upsert: true,
    contentType: mimeType,
  });

  if (error) {
    logger.error(`[upload] uploadToUserFolder: failed`, error);
    throw error;
  }

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  logger.info("[upload] uploadToUserFolder: publicUrl", publicUrl);
  return publicUrl!;
}

/**
 * Upload avatar to user folder
 */
export async function uploadAvatar(userId: string, avatarUri?: string): Promise<string> {
  if (!avatarUri || avatarUri.startsWith("https://")) return avatarUri ?? "";

  const ext = getImageType(avatarUri);
  const avatarName = `avatar-${Date.now()}.${ext}`;
  const avatarData = await compressImage(avatarUri);

  const publicUrl = await uploadToUserFolder("profiles", userId, avatarName, avatarData, `image/${ext}`);

  useProfileSetupStore.getState().setField("avatar_url", publicUrl);
  logger.info("[upload] Avatar uploaded", { userId, url: publicUrl });

  return publicUrl;
}

/**
 * Upload multiple photos in parallel to user folder
 */
export async function uploadPhotos(userId: string, photoUris: string[]): Promise<string[]> {
  const uploadedPhotos = await Promise.all(
    photoUris.map(async (uri, i) => {
      if (uri.startsWith("https://")) return uri;

      const ext = getImageType(uri);
      const photoName = `photo-${i}-${Date.now()}.${ext}`;
      const photoData = await compressImage(uri);

      const publicUrl = await uploadToUserFolder(
        "profiles",
        userId,
        photoName,
        photoData,
        `image/${ext}`
      );

      logger.info("[upload] Photo uploaded", { userId, url: publicUrl });
      return publicUrl;
    })
  );

  useProfileSetupStore.getState().setField("photos", uploadedPhotos);
  return uploadedPhotos;
}
