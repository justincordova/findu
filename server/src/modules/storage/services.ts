import { supabaseAdmin } from "@/lib/supabaseAdmin";
import logger from "@/config/logger";

/**
 * Delete all files for a user from the "profiles" bucket.
 * Typically used during profile setup or account reset.
 *
 * @param userId - ID of the user whose files should be deleted.
 */
const deleteAllUserFiles = async (userId: string): Promise<void> => {
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
    // Optional: re-throw or handle silently depending on business logic
  }
};

/**
 * Delete a single file for a user from the "profiles" bucket.
 * Typically used when replacing an existing file (e.g., avatar update).
 *
 * @param userId - ID of the user.
 * @param filename - Name of the file to delete.
 */
const deleteSingleUserFile = async (userId: string, filename: string): Promise<void> => {
  try {
    const path = `${userId}/${filename}`;
    logger.info("[deleteSingleUserFile] Deleting file", { path });

    const { error } = await supabaseAdmin.storage.from("profiles").remove([path]);
    if (error) {
      logger.warn("[deleteSingleUserFile] Could not delete file (may not exist)", { path, error });
    }
  } catch (err: any) {
    logger.error("[deleteSingleUserFile] Exception", { error: err });
  }
};

/**
 * Generates a signed Supabase Storage upload URL for a user.
 *
 * This function supports two modes:
 * - `setup`: Deletes all existing files for the user before generating a new signed URL.
 * - `update`: Deletes only the specific file being replaced before generating a new signed URL.
 *
 * @param userId - ID of the user uploading the file.
 * @param filename - The fixed name of the file (e.g., "avatar.jpg").
 * @param mode - Upload mode: `"setup"` or `"update"`.
 * @returns A promise that resolves to an object containing:
 *   - `uploadUrl`: The signed URL to upload the file.
 *   - `path`: The full object path in Supabase storage.
 *   Or, in case of an error:
 *   - `error`: Error message describing the failure.
 */
export const generateSignedUploadUrl = async (
  userId: string,
  filename: string,
  mode: "setup" | "update"
): Promise<{ uploadUrl: string; path: string } | { error: string }> => {
  try {
    logger.info("[generateSignedUploadUrl] Start", { userId, filename, mode });

    if (mode === "setup") {
      // Destructive action: delete all existing files
      await deleteAllUserFiles(userId);
    } else if (mode === "update") {
      // Delete only the specific file being replaced
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

    return { uploadUrl: data.signedUrl, path: objectPath };
  } catch (err: any) {
    logger.error("[generateSignedUploadUrl] Exception", { error: err });
    return { error: err.message || "Unknown error creating upload URL" };
  }
};
