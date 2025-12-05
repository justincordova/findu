import { Request, Response } from "express";
import * as constantsService from "./services";

/**
 * Get all profile setup constants
 * Public endpoint - no authentication required
 */
export const getConstantsController = async (req: Request, res: Response) => {
  try {
    const constants = constantsService.getAllConstants();
    res.json(constants);
  } catch (error: any) {
    console.error("Error fetching constants:", error);
    res.status(500).json({ error: "Failed to fetch constants" });
  }
};
