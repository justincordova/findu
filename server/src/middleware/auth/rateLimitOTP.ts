import { Request, Response, NextFunction } from "express";
import { redis } from "@/lib/redis";
import logger from "@/config/logger";

// Rate limiting configuration for OTP requests
const OTP_RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const OTP_RATE_LIMIT_MAX_ATTEMPTS = 3; // Max 3 OTP requests per minute per email
const OTP_RATE_LIMIT_KEY_PREFIX = "otp_rate_limit:";

/**
 * Rate limiting middleware for OTP requests
 * Prevents abuse by limiting OTP requests per email address
 */
export async function rateLimitOTP(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email } = req.body;

    if (!email) {
      return next(); // Let validation handle missing email
    }

    const rateLimitKey = `${OTP_RATE_LIMIT_KEY_PREFIX}${email.toLowerCase()}`;

    // Check current attempt count
    const currentAttempts = await redis.get(rateLimitKey);
    const attempts = currentAttempts ? parseInt(currentAttempts, 10) : 0;

    if (attempts >= OTP_RATE_LIMIT_MAX_ATTEMPTS) {
      logger.warn("OTP_RATE_LIMIT_EXCEEDED", {
        email,
        ip: req.ip,
        attempts,
      });

      return res.status(429).json({
        success: false,
        message: `Too many OTP requests. Please wait before requesting another OTP.`,
      });
    }

    // Increment attempt count
    await redis.incr(rateLimitKey);
    await redis.expire(rateLimitKey, OTP_RATE_LIMIT_WINDOW);

    logger.debug("OTP_RATE_LIMIT_CHECK", {
      email,
      attempts: attempts + 1,
      maxAttempts: OTP_RATE_LIMIT_MAX_ATTEMPTS,
    });

    next();
  } catch (error) {
    logger.error("OTP_RATE_LIMIT_ERROR", { error });
    // On error, allow the request to proceed (fail open)
    next();
  }
}


