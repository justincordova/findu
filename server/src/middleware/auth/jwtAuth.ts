import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/modules/auth/service";
import logger from "@/config/logger";

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export async function authenticateJWT(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn("JWT_AUTH_FAILED", {
      reason: "missing_or_malformed_token",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res
      .status(401)
      .json({ error: "Authorization token missing or malformed" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = await verifyAccessToken(token);

  if (!decoded) {
    logger.warn("JWT_AUTH_FAILED", {
      reason: "invalid_or_expired_token",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
}
