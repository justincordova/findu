import type { Request, Response } from "express";
import logger from "@/config/logger";
import * as uploadsService from "./services";

/**
 * Generate a signed upload URL for a user's personal folder.
 *
 * The user id is always derived from the authenticated session — any
 * `userId` in the request body is ignored to prevent users from writing
 * into another user's storage folder.
 *
 * @param req - Express request object containing `filename`, `mimeType`, `fileSize`, and `mode` in body
 * @param res - Express response object used to return the upload URL or an error
 */
export const generateUploadUrlController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    const { filename, mode } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Validate required fields
    if (!filename || !mode) {
      return res.status(400).json({ error: "Missing filename or mode" });
    }

    // Validate mode
    if (mode !== "setup" && mode !== "update") {
      return res
        .status(400)
        .json({ error: "Invalid mode. Must be 'setup' or 'update'." });
    }

    // Call service to generate signed upload URL
    const result = await uploadsService.generateSignedUploadUrl(
      userId,
      filename,
      mode,
    );

    // Type guard to check for error in union type
    if ("error" in result) {
      return res.status(400).json({ error: result.error });
    }

    // Return successful upload URL
    return res.json({
      uploadUrl: result.uploadUrl,
      path: result.path,
    });
  } catch (error) {
    logger.error("Error generating signed upload URL", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
};
