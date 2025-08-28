import { Request, Response } from "express";
import * as uploadsService from "./services";

/**
 * Generate a signed upload URL for a user's personal folder
 */
export const generateUploadUrlController = async (req: Request, res: Response) => {
  try {
    const { userId, filename } = req.body; // read from body
    if (!userId || !filename) {
      return res.status(400).json({ error: "Missing userId or filename" });
    }

    const result = await uploadsService.generateSignedUploadUrl(userId, filename);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      uploadUrl: result.uploadUrl,
      path: result.path,
    });
  } catch (error) {
    console.error("Error generating signed upload URL:", error);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
};

