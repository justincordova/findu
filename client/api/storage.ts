import axios from "axios";
import logger from "@/config/logger";
import { useAuthStore } from "@/store/authStore";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/storage`;

/**
 * Get authorization headers with current auth token
 * @returns {{Authorization?: string}} Headers object with Bearer token (if available)
 */
const getAuthHeaders = () => {
  const { token } = useAuthStore.getState();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const storageApi = {
  /**
   * Request a signed upload URL from backend for Supabase direct upload
   * Signed URLs allow direct uploads to storage without backend proxying.
   * The uploading user is derived from the auth token server-side.
   * @param {string} filename - Name of the file to upload
   * @param {"setup" | "update"} mode - Upload mode (setup during profile creation, update for existing)
   * @returns {Promise<{uploadUrl: string; path: string}>} Signed URL and storage path
   */
  getUploadUrl: async (filename: string, mode: "setup" | "update") => {
    const headers = getAuthHeaders();
    logger.debug("Requesting signed URL", { filename });

    const { data } = await axios.post(
      `${API_BASE}/url`,
      { filename, mode },
      { headers },
    );

    logger.debug("Signed URL received", {
      filename,
      path: data.path,
    });

    return data;
  },

  /**
   * Upload a file to Supabase using a pre-signed URL
   * Direct upload bypasses backend for better performance
   * @param {string} uploadUrl - Pre-signed URL from getUploadUrl
   * @param {Blob | File} file - File blob or File object to upload
   * @returns {Promise<void>}
   * @throws {Error} If upload fails
   */
  uploadFile: async (uploadUrl: string, file: Blob | File) => {
    logger.debug("Uploading file", {
      size: file.size,
      type: file.type,
    });

    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });

    logger.info("File uploaded", { uploadUrl });
  },
};
