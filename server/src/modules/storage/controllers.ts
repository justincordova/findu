import type { Request, Response } from "express";
import logger from "@/config/logger";
import * as uploadsService from "./services";

/**
 * Generate a signed upload URL for a user's personal folder
 *
 * @param req - Express request object containing `userId`, `filename`, `mimeType`, `fileSize`, and `mode` in body
 * @param res - Express response object used to return the upload URL or an error
 */
export const generateUploadUrlController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { userId, filename, mode } = req.body;

    // Validate required fields
    if (!userId || !filename || !mode) {
      return res
        .status(400)
        .json({ error: "Missing userId, filename, or mode" });
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
