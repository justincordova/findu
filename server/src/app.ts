import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import corsOptions from '@/middleware/security/corsOptions';
import helmet from "helmet";
import compression from "compression";
import limiter from '@/middleware/security/rateLimiter';
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

// Custom Middleware
import { notFoundHandler } from "@/middleware/error/notFoundHandler";
import { errorHandler } from "@/middleware/error/errorHandler";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import logger from "@/config/logger";

// Route Imports
import authRoutes from "@/modules/auth/routes";

const app = express();

// Built-in Express Middleware
// Parse JSON bodies with a limit of 10mb
app.use(express.json({ limit: "10mb" }));
// Parse URL-encoded bodies with a limit of 10mb
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Third-party Security Middleware
// Enable CORS with custom options (whitelist origins, allow credentials)
app.use(cors(corsOptions));
// Set secure HTTP headers
app.use(helmet());
// Enable GZIP compression for responses
app.use(compression());

// Logging Middleware
// HTTP request logging via Morgan, piped to Winston logger
// "combined" format gives Apache-style logs, suitable for production
app.use(
  morgan("combined", {
    stream: { write: (message: string) => logger.http(message.trim()) },
  })
);

// Rate Limiting Middleware
// Protects your API from abuse and brute-force attacks
app.use(limiter);

// Application Routes
// Auth-related routes
app.use("/api/auth", authRoutes);
// Swagger UI for API documentation/testing
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup({}));

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
// - notFoundHandler: catches 404 routes
// - handleValidationErrors: handles express-validator errors
// - errorHandler: handles all other uncaught errors
app.use(notFoundHandler);
app.use(handleValidationErrors);
app.use(errorHandler);

export default app;
