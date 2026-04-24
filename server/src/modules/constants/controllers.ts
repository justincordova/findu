import type { Request, Response } from "express";
import logger from "@/config/logger";
import * as constantsService from "./services";

/**
 * Get all profile setup constants
 * Public endpoint - no authentication required
 */
export const getConstantsController = async (_req: Request, res: Response) => {
  try {
    const constants = constantsService.getAllConstants();
    res.json(constants);
  } catch (error: any) {
    logger.error("Error fetching constants", { error: error.message });
    res.status(500).json({ error: "Failed to fetch constants" });
  }
};
