import type { NextFunction, Request, Response } from "express";
import logger from "@/config/logger";
import { AuthService } from "@/modules/auth/services"; // updated import

const enableAuth = process.env.ENABLE_AUTH === "true";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!enableAuth) {
    // Auth disabled → attach mock user for dev/test convenience
    req.user = {
      id: "dev-user",
      email: "dev@example.com",
      role: "developer",
    };

    logger.debug("AUTH_DISABLED", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn("AUTH_FAILED", {
      reason: "missing_or_invalid_header",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const user = await AuthService.verifySession(token); // updated usage
    if (!user) {
      logger.warn("AUTH_FAILED", {
        reason: "invalid_or_expired_session",
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.status(401).json({ error: "Invalid or expired session." });
    }

    // Attach user to request
    req.user = user;

    logger.info("AUTH_SUCCESS", {
      userId: user.id,
      email: user.email,
      ip: req.ip,
    });

    next();
  } catch (error) {
    logger.error("AUTH_ERROR", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
    return res.status(401).json({ error: "Authentication failed." });
  }
}
