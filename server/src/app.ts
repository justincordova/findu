import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

// Custom Middleware
import { notFoundHandler } from "@/middleware/error/notFoundHandler";
import { errorHandler } from "@/middleware/error/errorHandler";
import { handleValidationErrors } from "@/middleware/error/handleValidationErrors";
import logger from "@/config/logger";

// Route Imports
import authRoutes from "@/modules/auth/routes";
// import userRoutes from "@/modules/users/routes"; // Temporarily disabled during Supabase Auth migration

const app = express();

// Built-in Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Third-party Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes); // Temporarily disabled during Supabase Auth migration

// Swagger UI Route - Simple setup for testing routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup({}));

// Health Check Route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Used for testing the errorHandler
if (process.env.NODE_ENV !== "production") {
  app.get(
    "/error-test",
    (_req: Request, _res: Response, next: NextFunction) => {
      next(new Error("Test error")); // This will invoke your errorHandler
    }
  );
}

// Error handling middleware
app.use(notFoundHandler);
app.use(handleValidationErrors);
app.use(errorHandler);

export default app;
