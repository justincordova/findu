// Core/Framework Imports
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

// Middleware & Security (add more config later in middleware folder)
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

// Swagger Documentation
import swaggerUi from "swagger-ui-express";

// Custom Middleware
import { notFoundHandler } from "@/middleware/error/notFoundHandler";
import { errorHandler } from "@/middleware/error/errorHandler";

// Route Imports
import authRoutes from "@/modules/auth/routes";
import userRoutes from "@/modules/users/routes";

const app = express();

// Built-in Middleware
app.use(express.json());

// Third-party Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});
app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

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

app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // global error handler

export default app;
