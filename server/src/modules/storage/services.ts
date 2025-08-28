import { supabaseAdmin } from "@/lib/supabaseAdmin";
import logger from "@/config/logger";

export const generateSignedUploadUrl = async (userId: string, filename: string) => {
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
