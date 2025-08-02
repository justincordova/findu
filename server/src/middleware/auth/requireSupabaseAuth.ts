import { Request, Response, NextFunction } from "express";
import { verifySession } from "@/modules/auth/service";
import logger from "@/config/logger";

export async function requireSupabaseAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("SUPABASE_AUTH_FAILED", {
      reason: "missing_or_invalid_header",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header." });
  }
  const token = authHeader.replace("Bearer ", "");
  const user = await verifySession(token);
  if (!user) {
    logger.warn("SUPABASE_AUTH_FAILED", {
      reason: "invalid_or_expired_session",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(401).json({ error: "Invalid or expired session." });
  }
  (req as any).user = user;
  next();
}
