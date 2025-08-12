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

const app = express();

// Built-in Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Third-party Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL, // preferred explicit origin
  "http://localhost:8081", // Expo web (local)
  "http://127.0.0.1:8081",
  "http://localhost:3000", // fallback
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser clients

    // Allow explicit list
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow LAN Expo web on port 8081 (e.g., http://192.168.x.x:8081)
    const lanExpoRegex = /^http:\/\/(\d{1,3}\.){3}\d{1,3}:8081$/;
    if (lanExpoRegex.test(origin)) return callback(null, true);

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
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
      next(new Error("Test error"));
    }
  );
}

// Error handling middleware
app.use(notFoundHandler);
app.use(handleValidationErrors);
app.use(errorHandler);

export default app;
