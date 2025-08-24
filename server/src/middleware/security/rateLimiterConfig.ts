import rateLimit from "express-rate-limit";
import logger from "@/config/logger";
import { RequestHandler } from "express";

/**
 * Rate Limiting Middleware
 * 
 * Protects your API from abuse and brute-force attacks.
 * - Only enabled when NODE_ENV !== "development".
 * - In development, it becomes a no-op middleware for convenience.
 */
let limiter: RequestHandler;

if (process.env.NODE_ENV !== "development") {
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // Limit each IP to 100 requests per window
    message: "Too many requests from this IP, please try again later.",

    /**
     * Custom handler called when a client exceeds the rate limit.
     * Logs the event with your Winston logger for monitoring.
     */
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

    /**
     * Optional: Skip rate limiting for certain trusted IPs (like internal services)
     */
    // skip: (req) => trustedIps.includes(req.ip),
  });
} else {
  /**
   * Development Mode
   * 
   * Disable rate limiting entirely to avoid throttling local requests.
   * Provides a no-op middleware that just calls next().
   */
  limiter = (_req, _res, next) => next();
}

// Apply rate limiting middleware globally
export default limiter;
