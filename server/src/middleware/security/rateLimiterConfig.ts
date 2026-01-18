import rateLimit from "express-rate-limit";
import logger from "@/config/logger";
import { RequestHandler } from "express";

/**
 * Rate Limiting Middleware
 *
 * - Limits requests to prevent abuse.
 * - Safe for development, test, and production.
 */
const limiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
  handler: (req, res) => {
    logger.warn("RATE_LIMIT_EXCEEDED", {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });

    res.status(429).json({
      status: "error",
      error: "Too many requests",
      message: "You have exceeded the request limit. Please try again later.",
    });
  },
});

export default limiter;
