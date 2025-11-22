import { supabaseAdmin } from "@/lib/supabaseAdmin";
import logger from "@/config/logger";

// Delete all files for a user, typically during profile setup.
const deleteAllUserFiles = async (userId: string) => {
  try {
    const { data: files, error } = await supabaseAdmin.storage.from("profiles").list(userId);
    if (error) {
      logger.error("[deleteAllUserFiles] Error listing files", { userId, error });
      throw new Error(error.message);
    }
    if (files && files.length > 0) {
      const paths = files.map(f => `${userId}/${f.name}`);
      logger.info("[deleteAllUserFiles] Deleting files", { userId, paths });
      const { error: removeError } = await supabaseAdmin.storage.from("profiles").remove(paths);
      if (removeError) {
        logger.error("[deleteAllUserFiles] Error removing files", { userId, removeError });
        throw new Error(removeError.message);
      }
    }
  } catch (err: any) {
    logger.error("[deleteAllUserFiles] Exception", { error: err });
    // Decide if you want to re-throw or handle it silently
  }
};

// Delete a single file for a user, typically during a profile update.
const deleteSingleUserFile = async (userId: string, filename: string) => {
  try {
    const path = `${userId}/${filename}`;
    logger.info("[deleteSingleUserFile] Deleting file", { path });
    const { error } = await supabaseAdmin.storage.from("profiles").remove([path]);
    if (error) {
      // It might not be an error if the file doesn't exist, so we can log it and continue
      logger.warn("[deleteSingleUserFile] Could not delete file (it may not exist)", { path, error });
    }
  } catch (err: any) {
    logger.error("[deleteSingleUserFile] Exception", { error: err });
  }
};


/**
 * Generates a signed Supabase Storage upload URL for a user.
 *
 * This function supports two modes:
 * - `setup`: Deletes all existing files for the user before creating a new signed URL.
 * - `update`: Deletes only the specific file being replaced before creating a new signed URL.
 *
 * @param userId - The ID of the user uploading the file.
 * @param filename - The fixed name of the file (e.g., 'avatar.jpg').
 * @param mode - The upload mode: 'setup' or 'update'.
 * @returns A promise that resolves to an object with `uploadUrl` and `path`, or an `error`.
 */
export const generateSignedUploadUrl = async (
  userId: string,
  filename: string,
  mode: "setup" | "update"
): Promise<{ uploadUrl: string; path: string } | { error: string }> => {
  try {
    logger.info("[generateSignedUploadUrl] Start", { userId, filename, mode });

    if (mode === "setup") {
      // This is a destructive action, so we wait for it to complete.
      await deleteAllUserFiles(userId);
    } else if (mode === "update") {
      // This can happen in the background, but for consistency, we'll wait.
      await deleteSingleUserFile(userId, filename);
    }

    const objectPath = `${userId}/${filename}`;
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
