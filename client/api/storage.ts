// storageApi.ts
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import logger from "@/config/logger";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/storage`;

const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return { Authorization: token ? `Bearer ${token}` : "" };
};

export const storageApi = {
  /**
   * Request a signed upload URL from backend
   * @param userId string - ID of the user uploading the file
   * @param filename string - name of the file to upload
   * @param mode "setup" | "update" - determines server-side file handling
   */
  getUploadUrl: async (userId: string, filename: string, mode: "setup" | "update") => {
    const headers = getAuthHeaders();
    logger.info("[storageApi] Requesting signed URL", { userId, filename, mode });

    const response = await axios.post(
      `${API_BASE}/url`,
      { userId, filename, mode },
      { headers }
    );

    logger.info("[storageApi] Signed URL received", {
      userId,
      filename,
      path: response.data.path,
    });

    return response.data; // { uploadUrl, path }
  },

  /**
   * Upload a file to Supabase using signed URL
   */
  uploadFile: async (uploadUrl: string, file: Blob | File) => {
    logger.info("[storageApi] Uploading file via signed URL", {
      uploadUrl,
      size: file.size,
      type: file.type,
    });

    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });

    logger.info("[storageApi] File uploaded successfully", { uploadUrl });
  },
};

