import { supabaseAdmin } from "@/lib/supabaseAdmin";
import logger from "@/config/logger";

/**
 * Generates a signed Supabase Storage upload URL for a user.
 *
 * The generated URL allows the client to upload a file directly to the
 * `profiles` bucket under the user's folder with a timestamped filename.
 *
 * @param userId - The ID of the user uploading the file.
 * @param filename - The original name of the file to be uploaded.
 * @returns A promise that resolves to an object containing either:
 * - `uploadUrl` and `path` if successful, or
 * - `error` if the operation fails.
 */
export const generateSignedUploadUrl = async (
  userId: string,
  filename: string
): Promise<{ uploadUrl: string; path: string } | { error: string }> => {
  try {
    logger.info("[generateSignedUploadUrl] Start", { userId, filename });

    const objectPath = `${userId}/${Date.now()}-${filename}`;
    logger.info("[generateSignedUploadUrl] Object path", { objectPath });

    const { data, error } = await supabaseAdmin.storage
      .from("profiles")
      .createSignedUploadUrl(objectPath);

    if (error) {
      logger.error("[generateSignedUploadUrl] Supabase error", { error });
      return { error: error.message };
    }

    logger.info("[generateSignedUploadUrl] Signed URL created", {
      uploadUrl: data.signedUrl,
      path: objectPath,
    });

    return {
      uploadUrl: data.signedUrl,
      path: objectPath,
    };
  } catch (err: any) {
    logger.error("[generateSignedUploadUrl] Exception", { error: err });
    return { error: err.message || "Unknown error creating upload URL" };
  }
};
