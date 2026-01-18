import { supabase } from "@/lib/supabaseStorage";
import * as fs from "fs";
import * as path from "path";

const CHAT_BUCKET = "chat-media";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Get MIME type from filename
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Upload media file to Supabase storage in match-specific folder
 * Path: chat-media/match/{matchId}/{timestamp}-{filename}
 */
export async function uploadChatMedia(
  matchId: string,
  filePath: string,
  fileName: string
): Promise<string> {
  try {
    // Validate file exists and size
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }

    const fileSize = fs.statSync(filePath).size;
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Generate unique path
    const timestamp = Date.now();
    const storagePath = `match/${matchId}/${timestamp}-${fileName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: getMimeType(fileName),
        cacheControl: "3600",
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(CHAT_BUCKET)
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (err) {
    throw new Error(
      `Failed to upload chat media: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

/**
 * Delete media file from Supabase storage
 */
export async function deleteChatMedia(fileUrl: string): Promise<void> {
  try {
    // Extract path from public URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/");
    const filePath = pathParts.slice(-3).join("/"); // match/matchId/filename

    const { error } = await supabase.storage
      .from(CHAT_BUCKET)
      .remove([filePath]);

    if (error) {
      throw new Error(`Storage delete failed: ${error.message}`);
    }
  } catch (err) {
    throw new Error(
      `Failed to delete chat media: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}
