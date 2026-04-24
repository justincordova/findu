import * as fs from "node:fs/promises";
import * as path from "node:path";
import { supabase } from "@/lib/supabaseStorage";

const CHAT_BUCKET = "chat-media";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const FALLBACK_MIME = "application/octet-stream";

/**
 * Upload media file to Supabase storage in match-specific folder.
 * Path: chat-media/match/{matchId}/{timestamp}-{filename}
 *
 * The filename is reduced to its basename to prevent path traversal
 * inside the storage bucket. The content type is taken from the value
 * the caller has already validated (e.g. multer's detected mimetype)
 * rather than sniffing the extension here.
 */
export async function uploadChatMedia(
  matchId: string,
  filePath: string,
  fileName: string,
  mimeType: string = FALLBACK_MIME,
): Promise<string> {
  try {
    // Strip any directory components from the user-supplied filename
    const safeName = path.basename(fileName);

    // Validate file exists and size (also serves as existence check)
    let fileSize: number;
    try {
      const stats = await fs.stat(filePath);
      fileSize = stats.size;
    } catch {
      throw new Error("File not found");
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      );
    }

    // Read file asynchronously to avoid blocking the event loop
    const fileBuffer = await fs.readFile(filePath);

    // Generate unique path
    const timestamp = Date.now();
    const storagePath = `match/${matchId}/${timestamp}-${safeName}`;

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType || FALLBACK_MIME,
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
      `Failed to upload chat media: ${err instanceof Error ? err.message : "Unknown error"}`,
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
      `Failed to delete chat media: ${err instanceof Error ? err.message : "Unknown error"}`,
    );
  }
}
