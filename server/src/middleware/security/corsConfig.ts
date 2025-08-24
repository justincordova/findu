import corsLib from "cors";
import logger from "@/config/logger";
import { RequestHandler } from "express";

/**
 * List of allowed origins per environment
 */
const getAllowedOrigins = (): string[] => {
  const prodFrontend = process.env.FRONTEND_URL;
  if (process.env.NODE_ENV === "development") {
    return [
      prodFrontend,
      "http://localhost:8081",      // Expo web (local)
      "http://127.0.0.1:8081",      // LAN Expo
      "http://localhost:3000",      // React dev server
    ].filter(Boolean) as string[];
  }

  // Production: only include real frontend
  return [prodFrontend].filter(Boolean) as string[];
};

/**
 * Helper to detect LAN Expo URLs on port 8081
 */
const isLanExpoOrigin = (origin: string) =>
  /^http:\/\/(\d{1,3}\.){3}\d{1,3}:8081$/.test(origin);

/**
 * CORS Middleware Config
 */
const cors: RequestHandler =
  process.env.NODE_ENV !== "development"
    ? corsLib({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true); // Non-browser requests

          const allowedOrigins = getAllowedOrigins();
          if (allowedOrigins.includes(origin)) return callback(null, true);
          if (isLanExpoOrigin(origin)) return callback(null, true);

          // Log blocked CORS requests in production
          logger.warn("Blocked CORS request", { origin });
          callback(new Error(`Not allowed by CORS: ${origin}`));
        },
        credentials: true,
      })
    : corsLib({
        origin: true,       // Allow all in development
        credentials: true,
      });

export default cors;
