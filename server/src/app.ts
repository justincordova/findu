import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import cors from "@/middleware/security/corsConfig";
import helmet from "@/middleware/security/helmetConfig";
import compression from "@/middleware/security/compressionConfig";
import limiter from "@/middleware/security/rateLimiterConfig";
import morgan from "@/middleware/security/morganConfig";

// Custom Middleware
import { notFoundHandler } from "@/middleware/error/notFoundHandler";
import { errorHandler } from "@/middleware/error/errorHandler";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import logger from "@/config/logger";

// Route Imports
import authRoutes from "@/modules/auth/routes";
import storageRoutes from "@/modules/storage/routes";
import profileRoutes from "@/modules/profiles/routes";
import likesRoutes from "@/modules/profiles/routes";
import matchesRoutes from "@/modules/matches/routes";
import discoverRoutes from "@/modules/discover/routes";

const app = express();

// Built-in Express Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Third-party Security Middleware

const isDev = process.env.NODE_ENV === "development";

if (!isDev) {
  app.use(cors);
  app.use(helmet);
  app.use(compression);
  app.use(morgan);
  app.use(limiter);
} else {
  // In dev, replace with no-op middleware to avoid hanging tests
  const noop: RequestHandler = (_req, _res, next) => next();
  app.use(noop); // cors
  app.use(noop); // helmet
  app.use(noop); // compression
  app.use(noop); // morgan
  app.use(noop); // limiter
}

// Auth routes. This handles custom OTP flow and falls back to the Better Auth
// handler for built-in routes like /session, /signout, etc.
app.use("/api/auth", authRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/discover", discoverRoutes);

// Health Check Route
// Simple endpoint to verify server status
app.get("/health", (_req: Request, res: Response) => {
  logger.http("Health check requested");
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Development-only Error Test
// Allows testing the global error handler
if (process.env.NODE_ENV !== "production") {
  app.get(
    "/error-test",
    (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error("Test error"));
    }
  );
}

// Custom Error Handling Middleware
app.use(notFoundHandler);
app.use(handleValidationErrors);
app.use(errorHandler);

export default app;
